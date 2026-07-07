import "server-only";
import { toEnglishDigits } from "@/lib/bangla";
import {
  emptyDraft,
  FIELD_LABELS,
  type ExtractionDraft,
  type ExtractionResult,
} from "./fields";

/**
 * OCR client hook (Phase 3.1–3.5). Calls the Python FastAPI service
 * (`PYTHON_SERVICE_URL`/ocr) which runs Tesseract ben+eng and returns cleaned
 * text + confidence. We then field-map the Bengali labels → schema keys here.
 *
 * The Python service is a deferred sub-phase; until it's running this hook
 * fails fast (short timeout / connection refused) so the orchestrator falls
 * back to AI vision. That keeps the OCR-first ordering intact without blocking
 * the end-to-end flow on the extra deployable.
 */

const OCR_TIMEOUT_MS = 4000;

export function isOcrConfigured(): boolean {
  return Boolean(process.env.PYTHON_SERVICE_URL);
}

interface OcrServiceResponse {
  text: string;
  confidence: number; // 0..1
}

/** Result of an OCR attempt: either a mapped draft, or a reason it was skipped. */
export type OcrAttempt =
  | { ok: true; result: ExtractionResult }
  | { ok: false; reason: "unconfigured" | "unreachable" | "empty" };

export async function extractWithOcr(
  buffer: Buffer,
  contentType: string,
): Promise<OcrAttempt> {
  const base = process.env.PYTHON_SERVICE_URL;
  if (!base) return { ok: false, reason: "unconfigured" };

  let data: OcrServiceResponse;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OCR_TIMEOUT_MS);
    const res = await fetch(`${base.replace(/\/$/, "")}/ocr`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        image: buffer.toString("base64"),
        contentType,
        lang: "ben+eng",
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!res.ok) return { ok: false, reason: "unreachable" };
    data = (await res.json()) as OcrServiceResponse;
  } catch {
    // Connection refused / timeout / DNS — service not running yet.
    return { ok: false, reason: "unreachable" };
  }

  const text = (data.text ?? "").trim();
  if (!text) return { ok: false, reason: "empty" };

  const draft = mapOcrTextToDraft(text);
  return {
    ok: true,
    result: {
      draft,
      method: "ocr",
      confidence: data.confidence ?? 0.5,
      rawText: text,
    },
  };
}

/**
 * Field-mapper (Phase 3.5): scan OCR text line-by-line for known Bengali labels
 * and capture the value after the label separator. Conservative — only fills
 * fields it can match; the inspector completes the rest on the review screen.
 */
export function mapOcrTextToDraft(text: string): ExtractionDraft {
  const draft = emptyDraft();
  const lines = text.split(/\r?\n/);

  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    const value = findLabeledValue(lines, label);
    if (!value) continue;
    if (key === "status") {
      draft.status = /নবায়ন/.test(value) ? "renewed" : "new";
    } else {
      // All non-status draft fields are plain strings.
      (draft as Record<Exclude<keyof ExtractionDraft, "status">, string>)[
        key as Exclude<keyof ExtractionDraft, "status">
      ] = toEnglishDigits(value).trim();
    }
  }

  // If licenseNo wasn't label-matched, try to spot a TRAD/…/…/YYYY token.
  if (!draft.licenseNo) {
    const m = toEnglishDigits(text).match(/TRAD\/[A-Z]+\/\d+\/\d{4}/i);
    if (m) draft.licenseNo = m[0].toUpperCase();
  }

  return draft;
}

/** Find `label : value` (or `label value`) on any line and return the value. */
function findLabeledValue(lines: string[], label: string): string | null {
  for (const line of lines) {
    const idx = line.indexOf(label);
    if (idx === -1) continue;
    const after = line.slice(idx + label.length);
    // Strip a leading separator (:, ঃ, -, =) then take the rest of the line.
    const value = after.replace(/^\s*[:ঃ\-=–]?\s*/, "").trim();
    if (value) return value;
  }
  return null;
}
