import { NextResponse } from "next/server";
import { withTenant, AuthError, authErrorStatus } from "@/lib/auth";
import { uploadBuffer } from "@/lib/cloudinary";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
]);

export async function POST(req: Request) {
  let tenantId: string;
  try {
    ({ tenantId } = await withTenant());
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
    return NextResponse.json(
      { error: "শুধু ছবি (JPG/PNG/WEBP) বা PDF আপলোড করা যাবে" },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "ফাইল ১৫MB এর বেশি" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sourceType = file.type === "application/pdf" ? "pdf" : "photo";

  try {
    const result = await uploadBuffer(buffer, {
      tenantId,
      subfolder: "licenses",
      filename: file.name,
    });
    return NextResponse.json({
      ok: true,
      sourceType,
      url: result.url,
      publicId: result.publicId,
      resourceType: result.resourceType,
      bytes: result.bytes,
    });
  } catch {
    return NextResponse.json({ error: "আপলোড ব্যর্থ হয়েছে" }, { status: 502 });
  }
}
