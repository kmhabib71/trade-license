import { redirect } from "next/navigation";
import { getSession, hasActiveSubscription } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { License } from "@/models/License";
import { Tenant } from "@/models/Tenant";
import LogoutButton from "@/components/LogoutButton";
import { toBanglaDigits } from "@/lib/bangla";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "inspector" || !session.tenantId) {
    redirect("/login");
  }

  // Subscription gate
  if (!(await hasActiveSubscription(session.tenantId))) {
    redirect("/billing");
  }

  await dbConnect();
  const tenantId = session.tenantId;
  const [tenant, total, due] = await Promise.all([
    Tenant.findById(tenantId).lean(),
    License.countDocuments({ tenantId, archived: false }),
    License.countDocuments({ tenantId, archived: false, paymentStatus: "due" }),
  ]);

  const stats = [
    { label: "মোট লাইসেন্স", value: total },
    { label: "বকেয়া (ডিউ)", value: due },
    { label: "পরিশোধিত", value: total - due },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ড্যাশবোর্ড</h1>
          <p className="text-sm text-slate-500">
            {tenant?.name} · স্বাগতম, {session.name}
          </p>
        </div>
        <LogoutButton />
      </header>

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-2 text-3xl font-bold">{toBanglaDigits(s.value)}</p>
          </div>
        ))}
      </section>

      <p className="mt-8 text-sm text-slate-400">
        পরবর্তী ধাপ: আপলোড ও এক্সট্রাকশন (Phase 2–3), তারপর লিস্ট ভিউ ও ফিল্টার।
      </p>
    </div>
  );
}
