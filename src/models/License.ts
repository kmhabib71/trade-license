import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import {
  LICENSE_STATUS,
  PAYMENT_STATUS,
  SOURCE_TYPE,
  EXTRACTION_METHOD,
  SMS_CHANNEL,
} from "@/lib/types";

const AddressSchema = new Schema(
  {
    holding: String,
    road: String,
    village: String, // গ্রাম / মহল্লা
    postcode: String,
    thana: String,
    district: String,
    division: String,
  },
  { _id: false },
);

const SmsLogSchema = new Schema(
  {
    channel: { type: String, enum: SMS_CHANNEL, default: "sms" },
    to: String,
    body: String,
    invoiceRef: String,
    status: String, // queued | sent | failed
    sentAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const LicenseSchema = new Schema(
  {
    // ── Tenancy (required on every record) ──
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    // ── Identity & business (§1–§9) ──
    businessName: { type: String, required: true, trim: true }, // ব্যবসা প্রতিষ্ঠানের নাম
    ownerName: { type: String, trim: true }, // মালিকের নাম
    fatherOrHusbandName: String,
    motherName: String,
    businessNature: String, // ব্যবসার প্রকৃতি
    businessType: String, // ব্যবসার ধরণ
    address: String, // প্রতিষ্ঠানের ঠিকানা
    ward: { type: String, trim: true },
    market: String,
    area: { type: String, trim: true },
    zone: String,
    nidPassportBirth: String,
    binNo: String,
    tinNo: String,
    phone: { type: String, trim: true },
    email: String,
    presentAddress: AddressSchema,
    permanentAddress: AddressSchema,

    // ── License numbering ──
    licenseNo: { type: String, required: true, trim: true }, // TRAD/CHTG/006515/2024
    oldLicenseNo: { type: String, trim: true }, // পুরাতন ট্রেড লাইসেন্স নং
    referenceYear: { type: Number }, // রেফারেন্স বছর
    fiscalYear: { type: String, trim: true }, // অর্থ বছর 2026-2027
    status: { type: String, enum: LICENSE_STATUS, default: "new" }, // নতুন | নবায়নকৃত
    businessStartDate: Date,
    issueDate: Date,
    issueTime: String,
    expiryDate: Date,

    // ── Fees / ledger (§12 + journal) ──
    licenseFee: { type: Number, default: 0 }, // লাইসেন্স/নবায়ন ফি
    signboardTax: { type: Number, default: 0 }, // সাইনবোর্ড কর
    surcharge: { type: Number, default: 0 }, // সারচার্জ
    vat: { type: Number, default: 0 }, // ভ্যাট
    incomeTax: { type: Number, default: 0 }, // আয়কর / উৎসে কর
    bookFee: { type: Number, default: 0 }, // বই ফি
    formFee: { type: Number, default: 0 }, // ফর্ম ফি
    arrears: { type: Number, default: 0 }, // বকেয়া
    correctionFee: { type: Number, default: 0 }, // সংশোধনী ফি
    total: { type: Number, default: 0 }, // সর্বমোট

    // ── Payment ──
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS,
      default: "due",
      index: true,
    },
    amountPaid: { type: Number, default: 0 },
    amountDue: { type: Number, default: 0 },
    paymentDate: Date,

    // ── Renewal / archive chain (§1a) — personKey scoped within tenant ──
    personKey: { type: String, index: true },
    isActive: { type: Boolean, default: true, index: true },
    archived: { type: Boolean, default: false, index: true },
    archivedAt: Date,
    supersededBy: { type: Schema.Types.ObjectId, ref: "License" },
    previousLicenseId: { type: Schema.Types.ObjectId, ref: "License" },

    // ── Media & meta ──
    licenseImageUrl: String, // Cloudinary — full uploaded license
    ownerPhotoUrl: String, // Cloudinary — cropped owner photo
    sourceType: { type: String, enum: SOURCE_TYPE },
    extractionMethod: { type: String, enum: EXTRACTION_METHOD },
    extractionConfidence: Number,
    rawExtractedText: String,
    verified: { type: Boolean, default: false },

    smsHistory: { type: [SmsLogSchema], default: [] },
  },
  { timestamps: true },
);

// ── Tenant-scoped indexes (all list/search queries filter by tenantId first) ──
LicenseSchema.index({ tenantId: 1, licenseNo: 1 }, { unique: true });
LicenseSchema.index({ tenantId: 1, paymentStatus: 1 });
LicenseSchema.index({ tenantId: 1, fiscalYear: 1 });
LicenseSchema.index({ tenantId: 1, personKey: 1 });
LicenseSchema.index({ tenantId: 1, isActive: 1, archived: 1 });
// Text search across name/business/license fields
LicenseSchema.index({ businessName: "text", ownerName: "text", licenseNo: "text" });

export type LicenseDoc = InferSchemaType<typeof LicenseSchema>;

export const License: Model<LicenseDoc> =
  (models.License as Model<LicenseDoc>) ??
  model<LicenseDoc>("License", LicenseSchema);
