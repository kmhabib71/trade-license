/**
 * Canonical "extraction draft" shape — the structured record that every
 * extractor (AI vision, PDF-text, OCR field-mapper) must produce. It mirrors
 * the License model (§1) but every field is optional: extraction is best-effort
 * and the inspector confirms/edits on the review screen before saving.
 *
 * All numeric/date fields are strings here (as they appear on the license);
 * they are coerced by `licenseInputSchema` on save.
 */
import { z } from "zod";

/** The Bengali labels an OCR text-mapper keys off. Also documents, for the AI
 *  prompt, exactly which license field maps to which schema key. */
export const FIELD_LABELS: Record<string, string> = {
  businessName: "ব্যবসা প্রতিষ্ঠানের নাম",
  ownerName: "মালিকের নাম",
  fatherOrHusbandName: "পিতা / স্বামীর নাম",
  motherName: "মাতার নাম",
  businessNature: "ব্যবসার প্রকৃতি",
  businessType: "ব্যবসার ধরণ",
  address: "প্রতিষ্ঠানের ঠিকানা",
  ward: "ওয়ার্ড",
  market: "মার্কেট",
  area: "এলাকা",
  zone: "জোন",
  nidPassportBirth: "এনআইডি / পাসপোর্ট / জন্মনিবন্ধন",
  binNo: "বিন নম্বর",
  tinNo: "টিন নম্বর",
  phone: "মোবাইল / ফোন",
  email: "ইমেইল",
  licenseNo: "ট্রেড লাইসেন্স নম্বর",
  oldLicenseNo: "পুরাতন ট্রেড লাইসেন্স নম্বর",
  fiscalYear: "অর্থ বছর",
  status: "নতুন / নবায়নকৃত",
  businessStartDate: "ব্যবসা শুরুর তারিখ",
  issueDate: "ইস্যুর তারিখ",
  expiryDate: "মেয়াদ উত্তীর্ণের তারিখ",
  licenseFee: "লাইসেন্স / নবায়ন ফি",
  signboardTax: "সাইনবোর্ড কর",
  surcharge: "সারচার্জ",
  vat: "ভ্যাট",
  incomeTax: "আয়কর / উৎসে কর",
  bookFee: "বই ফি",
  formFee: "ফর্ম ফি",
  arrears: "বকেয়া",
  correctionFee: "সংশোধনী ফি",
  total: "সর্বমোট",
};

/**
 * Zod schema the AI model must fill. Kept flat + all-strings so the model has
 * an easy target and structured-outputs validation is lenient. Empty string =
 * "not found on the license".
 */
export const extractionDraftSchema = z.object({
  businessName: z.string(),
  ownerName: z.string(),
  fatherOrHusbandName: z.string(),
  motherName: z.string(),
  businessNature: z.string(),
  businessType: z.string(),
  address: z.string(),
  ward: z.string(),
  market: z.string(),
  area: z.string(),
  zone: z.string(),
  nidPassportBirth: z.string(),
  binNo: z.string(),
  tinNo: z.string(),
  phone: z.string(),
  email: z.string(),
  licenseNo: z.string(),
  oldLicenseNo: z.string(),
  fiscalYear: z.string(),
  status: z.enum(["new", "renewed", ""]),
  businessStartDate: z.string(),
  issueDate: z.string(),
  expiryDate: z.string(),
  licenseFee: z.string(),
  signboardTax: z.string(),
  surcharge: z.string(),
  vat: z.string(),
  incomeTax: z.string(),
  bookFee: z.string(),
  formFee: z.string(),
  arrears: z.string(),
  correctionFee: z.string(),
  total: z.string(),
});

export type ExtractionDraft = z.infer<typeof extractionDraftSchema>;

/** All keys blank — the base every extractor starts from. */
export function emptyDraft(): ExtractionDraft {
  return {
    businessName: "", ownerName: "", fatherOrHusbandName: "", motherName: "",
    businessNature: "", businessType: "", address: "", ward: "", market: "",
    area: "", zone: "", nidPassportBirth: "", binNo: "", tinNo: "", phone: "",
    email: "", licenseNo: "", oldLicenseNo: "", fiscalYear: "", status: "",
    businessStartDate: "", issueDate: "", expiryDate: "", licenseFee: "",
    signboardTax: "", surcharge: "", vat: "", incomeTax: "", bookFee: "",
    formFee: "", arrears: "", correctionFee: "", total: "",
  };
}

export const EXTRACTION_METHODS = ["pdf-text", "ocr", "ai", "manual"] as const;
export type DraftMethod = (typeof EXTRACTION_METHODS)[number];

/** What `/api/extract` returns and the review screen consumes. */
export interface ExtractionResult {
  draft: ExtractionDraft;
  method: DraftMethod;
  confidence: number; // 0..1
  rawText: string; // OCR/PDF text or AI raw JSON — stored for audit
  notes?: string; // e.g. "OCR unavailable, used AI"
}
