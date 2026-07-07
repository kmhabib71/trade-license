import { NextResponse } from "next/server";
import { withTenant, AuthError, authErrorStatus } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { License } from "@/models/License";
import { licenseInputSchema } from "@/lib/validation";
import {
  parseLicenseNo,
  parseFiscalYear,
  buildPersonKey,
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

function normalizeDates(input: Record<string, unknown>): Record<string, unknown> {
  const out = { ...input };
  for (const f of DATE_FIELDS) {
    const v = out[f];
    if (typeof v === "string" && v.trim()) {
      const iso = parseBanglaDate(v);
      if (iso) out[f] = iso;
      else delete out[f]; // unparseable → let it be optional/empty
    } else if (v === "" || v == null) {
      delete out[f];
    }
  }
  return out;
}

/**
 * POST /api/licenses  (Phase 3.8 save step)
 * Persists an inspector-confirmed license record. Derives referenceYear,
 * fiscalYear (normalized) and personKey from the license numbers. Tenant-scoped.
 *
 * Note: renewal auto-archive (§1a) lands in Phase 6.6; here we just set
 * personKey so the history chain can be built later.
 */
export async function POST(req: Request) {
  let tenantId: string;
  try {
    ({ tenantId } = await withTenant());
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.code }, { status: authErrorStatus(e.code) });
    }
    throw e;
  }

  const json = await req.json().catch(() => null);
  const normalized =
    json && typeof json === "object" ? normalizeDates(json as Record<string, unknown>) : json;
  const parsed = licenseInputSchema.safeParse(normalized);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "যাচাই ব্যর্থ", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const input = parsed.data;

  // Derive numbering metadata from the license numbers.
  const { referenceYear } = parseLicenseNo(input.licenseNo);
  const fiscalYear = input.fiscalYear
    ? parseFiscalYear(input.fiscalYear) ?? input.fiscalYear
    : undefined;
  const personKey = buildPersonKey({
    licenseNo: input.licenseNo,
    oldLicenseNo: input.oldLicenseNo,
    nid: input.nidPassportBirth,
  });

  await dbConnect();
  try {
    const doc = await License.create({
      ...input,
      tenantId,
      referenceYear: referenceYear ?? input.referenceYear,
      fiscalYear,
      personKey,
      isActive: true,
      archived: false,
    });
    return NextResponse.json({ ok: true, id: String(doc._id) }, { status: 201 });
  } catch (e: unknown) {
    // Duplicate (tenantId, licenseNo) unique index.
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: "এই লাইসেন্স নম্বর ইতিমধ্যে সংরক্ষিত আছে" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "সংরক্ষণ ব্যর্থ" }, { status: 500 });
  }
}
