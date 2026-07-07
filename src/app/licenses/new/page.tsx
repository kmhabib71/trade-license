import { redirect } from "next/navigation";
import { getSession, hasActiveSubscription } from "@/lib/auth";
import LicenseForm from "../LicenseForm";
import { emptyFormValues } from "@/lib/licenseFormValues";

/** Phase 6.2 — manual create. Blank form; on save → auto-archive-aware POST. */
export default async function NewLicensePage() {
  const session = await getSession();
  if (!session || session.role !== "inspector" || !session.tenantId) {
    redirect("/login");
  }
  if (!(await hasActiveSubscription(session.tenantId))) {
    redirect("/billing");
  }

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
      <div className="mb-6">
        <a href="/licenses" className="text-sm text-brand hover:underline">
          ← তালিকায় ফিরুন
        </a>
        <h1 className="mt-2 text-2xl font-bold">নতুন লাইসেন্স যোগ করুন</h1>
        <p className="text-sm text-slate-500">ম্যানুয়ালি তথ্য পূরণ করুন</p>
      </div>
      <LicenseForm mode="create" initial={emptyFormValues()} />
    </div>
  );
}
