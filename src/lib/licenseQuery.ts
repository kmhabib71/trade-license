import type { LicenseFilter } from "@/lib/validation";
import { toEnglishDigits } from "@/lib/bangla";

/** Loose Mongo filter shape — Mongoose's `find()` accepts this. Avoids coupling
 *  to a specific Mongoose type-export name across versions. */
export type LicenseQuery = Record<string, unknown>;

/**
 * Translate a validated `LicenseFilter` into a Mongo query, always scoped to the
 * given tenant. Shared by the list endpoint (Phase 4) and the filter bar
 * (Phase 5). Only the filters relevant to the current phase are wired; the rest
 * of the schema fields are honored here so Phase 5 is just UI.
 */
export function buildLicenseQuery(
  tenantId: string,
  f: LicenseFilter,
): LicenseQuery {
  const q: LicenseQuery = { tenantId };

  // Active vs archived: default shows only active (non-archived) records.
  if (!f.showArchived) q.archived = false;

  // Free-text search across name / business / license no.
  if (f.q?.trim()) {
    const rx = new RegExp(escapeRegex(f.q.trim()), "i");
    const rxNum = new RegExp(escapeRegex(toEnglishDigits(f.q.trim())), "i");
    q.$or = [
      { businessName: rx },
      { ownerName: rx },
      { licenseNo: rxNum },
      { oldLicenseNo: rxNum },
    ];
  }

  if (f.licenseNo?.trim())
    q.licenseNo = new RegExp(escapeRegex(toEnglishDigits(f.licenseNo.trim())), "i");
  if (f.oldLicenseNo?.trim())
    q.oldLicenseNo = new RegExp(escapeRegex(toEnglishDigits(f.oldLicenseNo.trim())), "i");
  if (f.status) q.status = f.status;
  if (f.paymentStatus) q.paymentStatus = f.paymentStatus;
  if (f.fiscalYear?.trim()) q.fiscalYear = f.fiscalYear.trim();
  if (typeof f.referenceYear === "number") q.referenceYear = f.referenceYear;
  if (f.ward?.trim()) q.ward = new RegExp(escapeRegex(f.ward.trim()), "i");
  if (f.area?.trim()) q.area = new RegExp(escapeRegex(f.area.trim()), "i");

  // Issue-date range.
  if (f.dateFrom || f.dateTo) {
    const range: { $gte?: Date; $lte?: Date } = {};
    if (f.dateFrom) range.$gte = f.dateFrom;
    if (f.dateTo) range.$lte = f.dateTo;
    q.issueDate = range;
  }

  // Amount-due range.
  if (typeof f.dueMin === "number" || typeof f.dueMax === "number") {
    const range: { $gte?: number; $lte?: number } = {};
    if (typeof f.dueMin === "number") range.$gte = f.dueMin;
    if (typeof f.dueMax === "number") range.$lte = f.dueMax;
    q.amountDue = range;
  }

  // Extraction method / verified (source quality).
  if (f.extractionMethod) q.extractionMethod = f.extractionMethod;
  if (f.verified === "yes") q.verified = true;
  else if (f.verified === "no") q.verified = { $ne: true };

  // Has owner photo.
  if (f.hasPhoto === "yes") {
    q.ownerPhotoUrl = { $nin: [null, ""] };
  } else if (f.hasPhoto === "no") {
    q.$and = [
      {
        $or: [
          { ownerPhotoUrl: null },
          { ownerPhotoUrl: "" },
          { ownerPhotoUrl: { $exists: false } },
        ],
      },
    ];
  }

  return q;
}

/** Whitelist sort keys → Mongo sort object, to avoid arbitrary field injection. */
const SORTABLE = new Set([
  "createdAt",
  "issueDate",
  "businessName",
  "licenseNo",
  "amountDue",
  "total",
  "fiscalYear",
]);

export function parseSort(sort: string): Record<string, 1 | -1> {
  const desc = sort.startsWith("-");
  const key = desc ? sort.slice(1) : sort;
  if (!SORTABLE.has(key)) return { createdAt: -1 };
  return { [key]: desc ? -1 : 1 };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
