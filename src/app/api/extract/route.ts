import { NextResponse } from "next/server";
import { withTenant, AuthError, authErrorStatus } from "@/lib/auth";
import { extract, ExtractionError } from "@/lib/extraction/orchestrator";

/**
 * POST /api/extract  (Phase 3.7)
 * multipart/form-data: { file }  — the same license the user is uploading.
 *
 * Extraction runs on the uploaded bytes directly (not on the Cloudinary URL):
 * Cloudinary blocks public delivery of PDFs/raw files by default, so a
 * URL round-trip would 401. The client sends the file here in parallel with
 * the Cloudinary upload; this route just runs the OCR-first → AI orchestrator
 * and returns a draft for the review screen. Auth + tenant scoped; nothing is
 * persisted here.
 */

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
]);

export async function POST(req: Request) {
  try {
    await withTenant(); // auth + tenant gate
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.code }, { status: authErrorStatus(e.code) });
    }
    throw e;
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "কোনো ফাইল পাওয়া যায়নি" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "অসমর্থিত ফাইল টাইপ" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "ফাইল খুব বড়" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await extract(buffer, file.type);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof ExtractionError) {
      const status = e.code === "NO_METHOD_AVAILABLE" ? 503 : 502;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    return NextResponse.json(
      { error: "তথ্য এক্সট্রাক্ট করা যায়নি" },
      { status: 500 },
    );
  }
}
