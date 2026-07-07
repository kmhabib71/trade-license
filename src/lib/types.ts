/** Shared enums/constants used across models, Zod schemas, and UI. */

export const USER_ROLES = ["super_admin", "inspector"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUS = ["active", "disabled"] as const;
export type UserStatus = (typeof USER_STATUS)[number];

export const TENANT_STATUS = ["active", "suspended", "trial"] as const;
export type TenantStatus = (typeof TENANT_STATUS)[number];

export const SUBSCRIPTION_STATUS = [
  "trialing",
  "active",
  "past_due",
  "canceled",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[number];

export const PAYMENT_METHODS = ["bkash", "nagad", "manual", "gateway"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** License-level enums */
export const LICENSE_STATUS = ["new", "renewed"] as const; // নতুন | নবায়নকৃত
export type LicenseStatus = (typeof LICENSE_STATUS)[number];

export const PAYMENT_STATUS = ["paid", "due"] as const; // পেইড | ডিউ
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export const SOURCE_TYPE = ["pdf", "photo"] as const;
export type SourceType = (typeof SOURCE_TYPE)[number];

export const EXTRACTION_METHOD = ["pdf-text", "ocr", "ai", "manual"] as const;
export type ExtractionMethod = (typeof EXTRACTION_METHOD)[number];

export const SMS_CHANNEL = ["sms", "whatsapp"] as const;
export type SmsChannel = (typeof SMS_CHANNEL)[number];
