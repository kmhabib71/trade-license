import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Tenant } from "@/models/Tenant";
import { User } from "@/models/User";
import { Subscription } from "@/models/Subscription";
import LogoutButton from "@/components/LogoutButton";
import { toBanglaDigits } from "@/lib/bangla";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "super_admin") redirect("/login");

  await dbConnect();
  const [tenants, users, activeSubs] = await Promise.all([
    Tenant.countDocuments(),
    User.countDocuments({ role: "inspector" }),
    Subscription.countDocuments({ status: "active" }),
  ]);

  const stats = [
    { label: "টেন্যান্ট", value: tenants },
    { label: "ইন্সপেক্টর", value: users },
    { label: "সক্রিয় সাবস্ক্রিপশন", value: activeSubs },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">অ্যাডমিন প্যানেল</h1>
          <p className="text-sm text-slate-500">প্ল্যাটফর্ম ব্যবস্থাপনা</p>
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
        পরবর্তী ধাপ (Phase 7.5): টেন্যান্ট অনবোর্ডিং, ইউজার ও সাবস্ক্রিপশন
        ব্যবস্থাপনা, ৳{toBanglaDigits(500)} পেমেন্ট রেকর্ড।
      </p>
    </div>
  );
}
