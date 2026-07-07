import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { SUBSCRIPTION_STATUS, PAYMENT_METHODS } from "@/lib/types";

const PaymentSchema = new Schema(
  {
    amount: { type: Number, required: true },
    method: { type: String, enum: PAYMENT_METHODS, default: "manual" },
    reference: { type: String, trim: true }, // bKash/Nagad txn id
    paidAt: { type: Date, default: Date.now },
    periodStart: { type: Date },
    periodEnd: { type: Date },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User" }, // super_admin
  },
  { _id: true },
);

/** Billing per tenant — ৳500/month. */
const SubscriptionSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      unique: true,
      index: true,
    },
    plan: { type: String, default: "monthly_500" },
    amount: { type: Number, default: 500 },
    currency: { type: String, default: "BDT" },
    status: {
      type: String,
      enum: SUBSCRIPTION_STATUS,
      default: "trialing",
      index: true,
    },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date, index: true },
    trialEndsAt: { type: Date },
    payments: { type: [PaymentSchema], default: [] },
  },
  { timestamps: true },
);

export type SubscriptionDoc = InferSchemaType<typeof SubscriptionSchema>;

export const Subscription: Model<SubscriptionDoc> =
  (models.Subscription as Model<SubscriptionDoc>) ??
  model<SubscriptionDoc>("Subscription", SubscriptionSchema);

/** Access rule: usable while active/trialing AND period not expired. */
export function isSubscriptionActive(sub: {
  status: string;
  currentPeriodEnd?: Date | null;
} | null): boolean {
  if (!sub) return false;
  const okStatus = sub.status === "active" || sub.status === "trialing";
  const notExpired =
    !sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) >= new Date();
  return okStatus && notExpired;
}
