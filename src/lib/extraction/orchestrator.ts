import "server-only";
import { extractWithOcr } from "./ocr";
import { extractWithAi, isAiConfigured } from "./ai";
import type { ExtractionResult } from "./fields";

/**
 * Extraction orchestrator (Phase 3.7). Implements the locked decision:
 * **OCR-first; if OCR is clean & parseable use it, else fall back to AI vision.**
 *
 * Order:
 *  1. OCR (Python Tesseract service) — the primary path for photos, once the
 *     service is running. If it's not configured/reachable or returns nothing,
 *     we move on.
 *  2. AI vision (Claude) — for photos when OCR is unavailable/insufficient, and
 *     for PDFs (Claude reads the PDF text layer directly via the document block,
 *     which covers the "pdf-text" case without a separate parser).
 *
 * Every path returns a best-effort draft; the inspector confirms/edits on the
 * review screen before saving (nothing is persisted here).
 */

export class ExtractionError extends Error {
  code: "NO_METHOD_AVAILABLE" | "AI_FAILED";
  constructor(code: "NO_METHOD_AVAILABLE" | "AI_FAILED", message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

export async function extract(
  buffer: Buffer,
  contentType: string,
): Promise<ExtractionResult> {
  const isPdf = contentType === "application/pdf";
  const notes: string[] = [];

  // 1) OCR-first (photos). PDFs skip straight to the AI/text-layer path.
  if (!isPdf) {
    const ocr = await extractWithOcr(buffer, contentType);
    if (ocr.ok && hasSignal(ocr.result)) {
      return ocr.result;
    }
    if (ocr.ok) {
      notes.push("OCR ran but extracted too few fields; used AI.");
    } else if (ocr.reason === "unconfigured" || ocr.reason === "unreachable") {
      notes.push("OCR service unavailable; used AI.");
    } else {
      notes.push("OCR returned no text; used AI.");
    }
  }

  // 2) AI vision / PDF text-layer fallback.
  if (!isAiConfigured()) {
    throw new ExtractionError(
      "NO_METHOD_AVAILABLE",
      isPdf
        ? "PDF থেকে তথ্য বের করতে AI প্রয়োজন, কিন্তু ANTHROPIC_API_KEY সেট করা নেই।"
        : "OCR সার্ভিস চালু নেই এবং AI কনফিগার করা নেই।",
    );
  }

  try {
    const result = await extractWithAi({ buffer, contentType });
    if (notes.length) result.notes = notes.join(" ");
    return result;
  } catch (e) {
    throw new ExtractionError(
      "AI_FAILED",
      e instanceof Error ? e.message : "AI extraction failed",
    );
  }
}

/**
 * An OCR draft is only "good enough" to skip AI if it captured the key
 * identifiers. Otherwise we prefer the AI pass (OCR-first still tried first).
 */
function hasSignal(result: ExtractionResult): boolean {
  const d = result.draft;
  const filled = Object.values(d).filter((v) => v && v.length > 0).length;
  // Require the license number plus a few more fields to trust OCR outright.
  return Boolean(d.licenseNo) && filled >= 4;
}
