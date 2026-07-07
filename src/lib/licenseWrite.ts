import "server-only";
import { License } from "@/models/License";
import { licenseInputSchema, type LicenseInput } from "@/lib/validation";
import {
  parseLicenseNo,
  parseFiscalYear,
  buildPersonKey,
  fiscalYearStart,
  parseBanglaDate,
} from "@/lib/bangla";

/** License date fields arrive as printed `dd/mm/yyyy` strings — normalize to
 *  ISO so Zod's date coercion accepts them. Blank/unparseable → dropped. */
const DATE_FIELDS = [
  "businessStartDate",
  "issueDate",
  "expiryDate",
  "paymentDate",
] as const;

function normalizeDates(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...input };
  for (const f of DATE_FIELDS) {
    const v = out[f];
    if (typeof v === "string" && v.trim()) {
      const iso = parseBanglaDate(v);
      if (iso) out[f] = iso;
      else delete out[f];
    } else if (v === "" || v == null) {
      delete out[f];
    }
  }
  return out;
}

/** Normalize dates then Zod-validate a license create/update payload. Shared by
 *  POST and PUT so both accept `dd/mm/yyyy` dates and enforce the same schema. */
export function parseLicensePayload(
  json: unknown,
):
  | { ok: true; data: LicenseInput }
  | { ok: false; issues: Record<string, string[] | undefined> } {
  const normalized =
    json && typeof json === "object"
      ? normalizeDates(json as Record<string, unknown>)
      : json;
  const parsed = licenseInputSchema.safeParse(normalized);
  if (!parsed.success) {
    return { ok: false, issues: parsed.error.flatten().fieldErrors };
  }
  return { ok: true, data: parsed.data };
}

/**
 * Shared license-write logic (Phase 6). Derives numbering metadata and applies
 * the **renewal auto-archive** rule (§1a):
 *
 *   When a new record's `personKey` matches an existing ACTIVE record with an
 *   OLDER fiscalYear → archive the old one (`archived=true, isActive=false,
 *   supersededBy=<new id>`) and link the new one (`previousLicenseId=<old id>`,
 *   `paymentStatus=due`). The newest year is the only active record.
 *
 * If the matched record has the SAME or a NEWER fiscalYear, we do NOT archive
 * (the new one is a back-entry / correction) — it's inserted as a normal record
 * but still shares the personKey chain.
 */

export interface CreateResult {
  id: string;
  archivedPreviousId?: string;
}

/** Values every write derives from the license numbers. */
export function deriveMeta(input: LicenseInput) {
  const { referenceYear } = parseLicenseNo(input.licenseNo);
  const fiscalYear = input.fiscalYear
    ? parseFiscalYear(input.fiscalYear) ?? input.fiscalYear
    : undefined;
  const personKey = buildPersonKey({
    licenseNo: input.licenseNo,
    oldLicenseNo: input.oldLicenseNo,
    nid: input.nidPassportBirth,
  });
  return {
    referenceYear: referenceYear ?? input.referenceYear,
    fiscalYear,
    personKey,
  };
}

/**
 * Create a license, applying the renewal auto-archive rule. Throws Mongo 11000
 * on a duplicate (tenantId, licenseNo) — the caller maps it to 409.
 */
export async function createLicense(
  tenantId: string,
  input: LicenseInput,
): Promise<CreateResult> {
  const meta = deriveMeta(input);

  // Find an active predecessor in the same person chain (older fiscal year).
  let previousLicenseId: string | undefined;
  let archivedPreviousId: string | undefined;

  if (meta.personKey && meta.fiscalYear) {
    const active = await License.find({
      tenantId,
      personKey: meta.personKey,
      isActive: true,
      archived: false,
    })
      .select("_id fiscalYear")
      .lean();

    const newStart = fiscalYearStart(meta.fiscalYear) ?? 0;
    const older = active
      .filter((a) => (fiscalYearStart(a.fiscalYear ?? "") ?? 0) < newStart)
      .sort(
        (a, b) =>
          (fiscalYearStart(b.fiscalYear ?? "") ?? 0) -
          (fiscalYearStart(a.fiscalYear ?? "") ?? 0),
      )[0];

    if (older) {
      previousLicenseId = String(older._id);
      archivedPreviousId = String(older._id);
    }
  }

  const doc = await License.create({
    ...input,
    tenantId,
    ...meta,
    isActive: true,
    archived: false,
    ...(previousLicenseId ? { previousLicenseId } : {}),
    // A renewed year defaults to due unless the inspector marked it paid.
    ...(archivedPreviousId && !input.paymentStatus
      ? { paymentStatus: "due" }
      : {}),
  });

  // Archive the superseded prior-year record.
  if (archivedPreviousId) {
    await License.updateOne(
      { _id: archivedPreviousId, tenantId },
      {
        $set: {
          archived: true,
          isActive: false,
          archivedAt: new Date(),
          supersededBy: doc._id,
        },
      },
    );
  }

  return { id: String(doc._id), archivedPreviousId };
}

/**
 * Update an existing license (edit). Re-derives numbering metadata from the
 * (possibly changed) license numbers. Does NOT re-run auto-archive — editing a
 * record's fields shouldn't reshuffle the chain; renewal happens on create.
 * Returns null if no record matched (wrong id / cross-tenant).
 */
export async function updateLicense(
  tenantId: string,
  id: string,
  input: LicenseInput,
): Promise<boolean> {
  const meta = deriveMeta(input);
  const res = await License.updateOne(
    { _id: id, tenantId },
    { $set: { ...input, ...meta } },
  );
  return res.matchedCount > 0;
}
