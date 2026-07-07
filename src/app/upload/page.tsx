import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, hasActiveSubscription } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import UploadClient from "./UploadClient";

export default async function UploadPage() {
  const session = await getSession();
  if (!session || session.role !== "inspector" || !session.tenantId) {
    redirect("/login");
  }
  if (!(await hasActiveSubscription(session.tenantId))) {
    redirect("/billing");
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">লাইসেন্স আপলোড</h1>
          <p className="text-sm text-slate-500">
            নতুন ট্রেড লাইসেন্সের ছবি বা PDF আপলোড করুন
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            ড্যাশবোর্ড
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="mt-8">
        <UploadClient />
      </div>
    </div>
  );
}
