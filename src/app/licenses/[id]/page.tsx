import { redirect, notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { getSession, hasActiveSubscription } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { License } from "@/models/License";
import { toBanglaDigits } from "@/lib/bangla";

/**
 * Minimal license detail (Phase 4.4 target). Read-only view of all fields +
 * the license image, tenant-scoped. Full CRUD / edit / print-stylesheet and the
 * archive tab land in Phase 6.
 */
export default async function LicenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "inspector" || !session.tenantId) {
    redirect("/login");
  }
  if (!(await hasActiveSubscription(session.tenantId))) {
    redirect("/billing");
  }
  if (!isValidObjectId(id)) notFound();

  await dbConnect();
  const doc = await License.findOne({
    _id: id,
    tenantId: session.tenantId, // tenant scope — can't view another tenant's record
  }).lean();
  if (!doc) notFound();

  const rows: [string, string][] = [
    ["ব্যবসা প্রতিষ্ঠানের নাম", doc.businessName ?? ""],
    ["মালিকের নাম", doc.ownerName ?? ""],
    ["পিতা / স্বামীর নাম", doc.fatherOrHusbandName ?? ""],
    ["মাতার নাম", doc.motherName ?? ""],
    ["ব্যবসার প্রকৃতি", doc.businessNature ?? ""],
    ["ব্যবসার ধরণ", doc.businessType ?? ""],
    ["ঠিকানা", doc.address ?? ""],
    ["ওয়ার্ড", doc.ward ?? ""],
    ["এলাকা / মার্কেট", [doc.area, doc.market].filter(Boolean).join(" / ")],
    ["মোবাইল", doc.phone ?? ""],
    ["এনআইডি / জন্মনিবন্ধন", doc.nidPassportBirth ?? ""],
    ["ট্রেড লাইসেন্স নম্বর", doc.licenseNo ?? ""],
    ["পুরাতন লাইসেন্স নম্বর", doc.oldLicenseNo ?? ""],
    ["রেফারেন্স বছর", doc.referenceYear ? String(doc.referenceYear) : ""],
    ["অর্থ বছর", doc.fiscalYear ?? ""],
    ["অবস্থা", doc.status === "renewed" ? "নবায়নকৃত" : "নতুন"],
  ];

  const fees: [string, number | undefined][] = [
    ["লাইসেন্স / নবায়ন ফি", doc.licenseFee],
    ["সাইনবোর্ড কর", doc.signboardTax],
    ["সারচার্জ", doc.surcharge],
    ["ভ্যাট", doc.vat],
    ["আয়কর", doc.incomeTax],
    ["বই ফি", doc.bookFee],
    ["ফর্ম ফি", doc.formFee],
    ["বকেয়া", doc.arrears],
    ["সংশোধনী ফি", doc.correctionFee],
    ["সর্বমোট", doc.total],
  ];

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <a href="/licenses" className="text-sm text-brand hover:underline">
          ← তালিকায় ফিরুন
        </a>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            doc.paymentStatus === "paid"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {doc.paymentStatus === "paid" ? "পেইড" : "ডিউ"}
        </span>
      </div>

      <h1 className="text-2xl font-bold">{doc.businessName}</h1>
      <p className="text-sm text-slate-500">
        {toBanglaDigits(doc.licenseNo ?? "")}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 dark:border-slate-800">
            <h2 className="border-b border-slate-100 px-4 py-2 text-sm font-semibold text-brand dark:border-slate-800">
              তথ্য
            </h2>
            <dl className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
              {rows.map(([k, v]) => (
                <div key={k} className="flex gap-4 px-4 py-2">
                  <dt className="w-40 shrink-0 text-slate-500">{k}</dt>
                  <dd>{v ? toBanglaDigits(v) : "—"}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800">
            <h2 className="border-b border-slate-100 px-4 py-2 text-sm font-semibold text-brand dark:border-slate-800">
              ফি ও চার্জ (৳)
            </h2>
            <dl className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
              {fees.map(([k, v]) => (
                <div key={k} className="flex justify-between px-4 py-2">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className={k === "সর্বমোট" ? "font-semibold" : ""}>
                    ৳{toBanglaDigits(v ?? 0)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            আপলোডকৃত লাইসেন্স
          </p>
          {doc.licenseImageUrl ? (
            <a
              href={doc.licenseImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-slate-200 p-4 text-center text-sm text-brand hover:underline dark:border-slate-800"
            >
              মূল ফাইল দেখুন
            </a>
          ) : (
            <p className="text-sm text-slate-400">ছবি নেই</p>
          )}
          <p className="mt-4 text-xs text-slate-400">
            সম্পাদনা, মুছে ফেলা ও প্রিন্ট — Phase 6-এ যুক্ত হবে।
          </p>
        </div>
      </div>
    </div>
  );
}
