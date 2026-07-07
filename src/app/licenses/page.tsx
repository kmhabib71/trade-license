import { redirect } from "next/navigation";
import { getSession, hasActiveSubscription } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { License } from "@/models/License";
import { licenseFilterSchema } from "@/lib/validation";
import { buildLicenseQuery, parseSort } from "@/lib/licenseQuery";
import LogoutButton from "@/components/LogoutButton";
import LicenseTable, { type LicenseRow } from "./LicenseTable";

/** Phase 4 — the journal list. Server-gated; renders the first page server-side,
 *  the client table handles search + pagination from /api/licenses thereafter. */
export default async function LicensesPage() {
  const session = await getSession();
  if (!session || session.role !== "inspector" || !session.tenantId) {
    redirect("/login");
  }
  if (!(await hasActiveSubscription(session.tenantId))) {
    redirect("/billing");
  }

  await dbConnect();
  const f = licenseFilterSchema.parse({}); // defaults: page 1, limit 25, -createdAt
  const query = buildLicenseQuery(session.tenantId, f);
  const [docs, total] = await Promise.all([
    License.find(query)
      .select(
        "businessName ownerName licenseNo oldLicenseNo referenceYear fiscalYear " +
          "status paymentStatus amountDue total ownerPhotoUrl createdAt",
      )
      .sort(parseSort(f.sort))
      .limit(f.limit)
      .lean(),
    License.countDocuments(query),
  ]);

  const rows: LicenseRow[] = docs.map((r) => ({
    id: String(r._id),
    businessName: r.businessName ?? "",
    ownerName: r.ownerName ?? "",
    licenseNo: r.licenseNo ?? "",
    oldLicenseNo: r.oldLicenseNo ?? "",
    referenceYear: r.referenceYear ?? null,
    fiscalYear: r.fiscalYear ?? "",
    status: (r.status as "new" | "renewed") ?? "new",
    paymentStatus: (r.paymentStatus as "paid" | "due") ?? "due",
    amountDue: r.amountDue ?? 0,
    total: r.total ?? 0,
    ownerPhotoUrl: r.ownerPhotoUrl ?? "",
  }));

  const initial = {
    ok: true as const,
    rows,
    page: f.page,
    limit: f.limit,
    total,
    pages: Math.max(1, Math.ceil(total / f.limit)),
  };

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">লাইসেন্স তালিকা</h1>
          <p className="text-sm text-slate-500">রেজিস্টার জার্নাল</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/dashboard"
            className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            ড্যাশবোর্ড
          </a>
          <a
            href="/upload"
            className="rounded-lg bg-brand px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            + আপলোড
          </a>
          <LogoutButton />
        </div>
      </header>

      <section className="mt-8">
        <LicenseTable initial={initial} />
      </section>
    </div>
  );
}
