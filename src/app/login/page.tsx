import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">লগইন</h1>
        <p className="mt-1 text-sm text-slate-500">ই-ট্রেড লাইসেন্স ট্র্যাকার</p>
        <Suspense fallback={<p className="mt-6 text-sm text-slate-400">লোড হচ্ছে…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
