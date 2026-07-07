import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Subscription, isSubscriptionActive } from "@/models/Subscription";
import LogoutButton from "@/components/LogoutButton";
import { toBanglaDigits } from "@/lib/bangla";

function fmtDate(d?: Date | null): string {
  if (!d) return "—";
  return toBanglaDigits(new Date(d).toLocaleDateString("en-GB"));
}

export default async function BillingPage() {
  const session = await getSession();
  if (!session || session.role !== "inspector" || !session.tenantId) {
    redirect("/login");
  }

  await dbConnect();
  const sub = await Subscription.findOne({ tenantId: session.tenantId }).lean();
  const active = isSubscriptionActive(sub);

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">বিলিং ও সাবস্ক্রিপশন</h1>
        <LogoutButton />
      </header>

      <div
        className={`mt-6 rounded-2xl border p-6 ${
          active
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950"
            : "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950"
        }`}
      >
        <p className="text-sm font-medium">
          {active ? "✅ সক্রিয় সাবস্ক্রিপশন" : "⚠️ সাবস্ক্রিপশন নিষ্ক্রিয় / মেয়াদোত্তীর্ণ"}
        </p>
        {!active && (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            প্ল্যাটফর্ম ব্যবহার চালিয়ে যেতে মাসিক{" "}
            <strong>৳{toBanglaDigits(500)}</strong> পরিশোধ করুন। পেমেন্টের পর
            অ্যাডমিন আপনার অ্যাকাউন্ট সক্রিয় করবেন। আপনার সব ডেটা সংরক্ষিত আছে।
          </p>
        )}
      </div>

      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
          <dt className="text-slate-500">প্ল্যান</dt>
          <dd>মাসিক — ৳{toBanglaDigits(sub?.amount ?? 500)}</dd>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
          <dt className="text-slate-500">স্ট্যাটাস</dt>
          <dd>{sub?.status ?? "—"}</dd>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
          <dt className="text-slate-500">বর্তমান মেয়াদ শেষ</dt>
          <dd>{fmtDate(sub?.currentPeriodEnd)}</dd>
        </div>
      </dl>

      {active && (
        <a
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-brand px-4 py-2 font-medium text-white hover:opacity-90"
        >
          ড্যাশবোর্ডে ফিরে যান
        </a>
      )}
    </div>
  );
}
