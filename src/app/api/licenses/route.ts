import { NextResponse } from "next/server";
import { withTenant, AuthError, authErrorStatus } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { License } from "@/models/License";
import { licenseFilterSchema } from "@/lib/validation";
import { buildLicenseQuery, parseSort } from "@/lib/licenseQuery";
import { createLicense, parseLicensePayload } from "@/lib/licenseWrite";

/**
 * GET /api/licenses  (Phase 4.1)
 * List the tenant's licenses with filters + pagination + sort + search.
 * Returns the columns the list table needs plus paging metadata.
 */
export async function GET(req: Request) {
  let tenantId: string;
  try {
    ({ tenantId } = await withTenant());
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.code }, { status: authErrorStatus(e.code) });
    }
    throw e;
  }

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = licenseFilterSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "অবৈধ ফিল্টার", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const f = parsed.data;

  await dbConnect();
  const query = buildLicenseQuery(tenantId, f);
  const sort = parseSort(f.sort);
  const skip = (f.page - 1) * f.limit;

  const [rows, total] = await Promise.all([
    License.find(query)
      .select(
        "businessName ownerName licenseNo oldLicenseNo referenceYear fiscalYear " +
          "status paymentStatus amountDue total ownerPhotoUrl licenseImageUrl createdAt",
      )
      .sort(sort)
      .skip(skip)
      .limit(f.limit)
      .lean(),
    License.countDocuments(query),
  ]);

  return NextResponse.json({
    ok: true,
    rows: rows.map((r) => ({
      id: String(r._id),
      businessName: r.businessName ?? "",
      ownerName: r.ownerName ?? "",
      licenseNo: r.licenseNo ?? "",
      oldLicenseNo: r.oldLicenseNo ?? "",
      referenceYear: r.referenceYear ?? null,
      fiscalYear: r.fiscalYear ?? "",
      status: r.status ?? "new",
      paymentStatus: r.paymentStatus ?? "due",
      amountDue: r.amountDue ?? 0,
      total: r.total ?? 0,
      ownerPhotoUrl: r.ownerPhotoUrl ?? "",
    })),
    page: f.page,
    limit: f.limit,
    total,
    pages: Math.max(1, Math.ceil(total / f.limit)),
  });
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
  const parsed = parseLicensePayload(json);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "যাচাই ব্যর্থ", issues: parsed.issues },
      { status: 422 },
    );
  }
  const input = parsed.data;

  await dbConnect();
  try {
    // createLicense derives numbering meta and applies renewal auto-archive (§1a).
    const result = await createLicense(tenantId, input);
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
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
