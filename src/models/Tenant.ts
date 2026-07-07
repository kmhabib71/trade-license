import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { TENANT_STATUS } from "@/lib/types";

/** One per inspector account / organization. */
const TenantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User" },
    city: { type: String, trim: true }, // jurisdiction (e.g. চট্টগ্রাম)
    zone: { type: String, trim: true },
    smsSenderId: { type: String, trim: true },
    status: { type: String, enum: TENANT_STATUS, default: "trial", index: true },
  },
  { timestamps: true },
);

export type TenantDoc = InferSchemaType<typeof TenantSchema>;

export const Tenant: Model<TenantDoc> =
  (models.Tenant as Model<TenantDoc>) ?? model<TenantDoc>("Tenant", TenantSchema);
