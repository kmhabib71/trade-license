import { z } from "zod";
import {
  LICENSE_STATUS,
  PAYMENT_STATUS,
  SOURCE_TYPE,
  EXTRACTION_METHOD,
} from "@/lib/types";

const addressSchema = z
  .object({
    holding: z.string().optional(),
    road: z.string().optional(),
    village: z.string().optional(),
    postcode: z.string().optional(),
    thana: z.string().optional(),
    district: z.string().optional(),
    division: z.string().optional(),
  })
  .partial()
  .optional();

/** Create/update payload for a license (shared by API routes + the CRUD form). */
export const licenseInputSchema = z.object({
  businessName: z.string().min(1, "প্রতিষ্ঠানের নাম আবশ্যক"),
  ownerName: z.string().optional(),
  fatherOrHusbandName: z.string().optional(),
  motherName: z.string().optional(),
  businessNature: z.string().optional(),
  businessType: z.string().optional(),
  address: z.string().optional(),
  ward: z.string().optional(),
  market: z.string().optional(),
  area: z.string().optional(),
  zone: z.string().optional(),
  nidPassportBirth: z.string().optional(),
  binNo: z.string().optional(),
  tinNo: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().or(z.literal("")).optional(),
  presentAddress: addressSchema,
  permanentAddress: addressSchema,

  licenseNo: z.string().min(1, "লাইসেন্স নম্বর আবশ্যক"),
  oldLicenseNo: z.string().optional(),
  referenceYear: z.coerce.number().int().optional(),
  fiscalYear: z.string().optional(),
  status: z.enum(LICENSE_STATUS).default("new"),
  businessStartDate: z.coerce.date().optional(),
  issueDate: z.coerce.date().optional(),
  issueTime: z.string().optional(),
  expiryDate: z.coerce.date().optional(),

  licenseFee: z.coerce.number().default(0),
  signboardTax: z.coerce.number().default(0),
  surcharge: z.coerce.number().default(0),
  vat: z.coerce.number().default(0),
  incomeTax: z.coerce.number().default(0),
  bookFee: z.coerce.number().default(0),
  formFee: z.coerce.number().default(0),
  arrears: z.coerce.number().default(0),
  correctionFee: z.coerce.number().default(0),
  total: z.coerce.number().default(0),

  paymentStatus: z.enum(PAYMENT_STATUS).default("due"),
  amountPaid: z.coerce.number().default(0),
  amountDue: z.coerce.number().default(0),
  paymentDate: z.coerce.date().optional(),

  licenseImageUrl: z.string().url().optional().or(z.literal("")),
  ownerPhotoUrl: z.string().url().optional().or(z.literal("")),
  sourceType: z.enum(SOURCE_TYPE).optional(),
  extractionMethod: z.enum(EXTRACTION_METHOD).optional(),
  extractionConfidence: z.coerce.number().optional(),
  rawExtractedText: z.string().optional(),
  verified: z.coerce.boolean().optional(),
});

export type LicenseInput = z.infer<typeof licenseInputSchema>;

/** Query params for the list endpoint / filter bar. */
export const licenseFilterSchema = z.object({
  q: z.string().optional(), // name/business/license search
  licenseNo: z.string().optional(),
  oldLicenseNo: z.string().optional(),
  status: z.enum(LICENSE_STATUS).optional(),
  paymentStatus: z.enum(PAYMENT_STATUS).optional(),
  fiscalYear: z.string().optional(),
  referenceYear: z.coerce.number().optional(),
  ward: z.string().optional(),
  area: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  dueMin: z.coerce.number().optional(),
  dueMax: z.coerce.number().optional(),
  hasPhoto: z.enum(["yes", "no"]).optional(),
  showArchived: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(25),
  sort: z.string().default("-createdAt"),
});

export type LicenseFilter = z.infer<typeof licenseFilterSchema>;

/** Auth (Phase 1.5). */
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
