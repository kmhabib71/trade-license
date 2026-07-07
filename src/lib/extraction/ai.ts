import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { toEnglishDigits } from "@/lib/bangla";
import {
  extractionDraftSchema,
  emptyDraft,
  FIELD_LABELS,
  type ExtractionDraft,
  type ExtractionResult,
} from "./fields";

/**
 * AI-vision fallback extractor (Phase 3.6). Sends the license photo (image) or
 * PDF (document text-layer) to Claude and asks for a structured JSON draft.
 *
 * Enabled only when ANTHROPIC_API_KEY is set; callers should check
 * `isAiConfigured()` first and degrade gracefully otherwise.
 */

const MODEL = "claude-opus-4-8";

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  return client;
}

const FIELD_GUIDE = Object.entries(FIELD_LABELS)
  .map(([key, label]) => `- ${key}: ${label}`)
  .join("\n");

const SYSTEM = `You extract structured data from Bangladeshi municipal trade licenses (ই-ট্রেড লাইসেন্স).
The input is a photo of a printed license or a PDF. Read all Bengali and English text carefully.

Return one JSON object. For each field, copy the value exactly as printed on the license.
Convert Bengali numerals to Western digits (০→0 … ৯→9) in every value.
If a field is not present on the license, return an empty string "" for it — never guess.

Field → license label mapping:
${FIELD_GUIDE}

Notes:
- licenseNo looks like TRAD/CHTG/006515/2024.
- status: "renewed" if the license says নবায়ন/নবায়নকৃত, otherwise "new" (নতুন). If unclear, "".
- fee fields (licenseFee, signboardTax, vat, total, …) are amounts in Taka — digits only, no ৳ sign or commas.
- Dates: keep the printed format (e.g. 01/07/2026).`;

/** Media types Claude vision accepts for the image path. */
const IMAGE_TYPES: Record<string, "image/jpeg" | "image/png" | "image/webp"> = {
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
};

export interface AiExtractInput {
  /** Raw file bytes. */
  buffer: Buffer;
  /** MIME type of the upload. */
  contentType: string;
}

/**
 * Run the AI extraction. Returns an ExtractionResult with method "ai".
 * Throws if the key is missing or the API/parse fails — the orchestrator
 * catches and reports a graceful error.
 */
export async function extractWithAi(
  input: AiExtractInput,
): Promise<ExtractionResult> {
  if (!isAiConfigured()) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  const base64 = input.buffer.toString("base64");
  const isPdf = input.contentType === "application/pdf";

  const mediaBlock = isPdf
    ? ({
        type: "document" as const,
        source: {
          type: "base64" as const,
          media_type: "application/pdf" as const,
          data: base64,
        },
      })
    : ({
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: IMAGE_TYPES[input.contentType] ?? "image/jpeg",
          data: base64,
        },
      });

  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          mediaBlock,
          {
            type: "text",
            text: "Extract this trade license into the JSON schema.",
          },
        ],
      },
    ],
    output_config: {
      format: zodOutputFormat(extractionDraftSchema),
    },
  });

  if (response.stop_reason === "refusal") {
    throw new Error("AI_REFUSED");
  }

  const parsed = response.parsed_output;
  if (!parsed) throw new Error("AI_PARSE_FAILED");

  // Normalize: Bengali digits → Western everywhere, trim.
  const draft = normalizeDraft(parsed);

  return {
    draft,
    method: "ai",
    confidence: 0.75, // AI-vision baseline; inspector verifies on review screen
    rawText: JSON.stringify(parsed),
  };
}

/** Coerce any stray Bengali digits and trim whitespace across all fields. */
function normalizeDraft(raw: ExtractionDraft): ExtractionDraft {
  const out = emptyDraft();
  for (const key of Object.keys(out) as (keyof ExtractionDraft)[]) {
    const v = raw[key];
    if (typeof v !== "string") continue;
    if (key === "status") {
      out.status = v === "renewed" || v === "new" ? v : "";
    } else {
      (out as Record<Exclude<keyof ExtractionDraft, "status">, string>)[
        key as Exclude<keyof ExtractionDraft, "status">
      ] = toEnglishDigits(v).trim();
    }
  }
  return out;
}
