import { toBanglaDigits } from "@/lib/bangla";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand">
        Phase {toBanglaDigits(0)} · স্ক্যাফোল্ড প্রস্তুত
      </span>
      <h1 className="text-3xl font-bold sm:text-4xl">
        ই-ট্রেড লাইসেন্স ট্র্যাকার
      </h1>
      <p className="text-balance text-slate-600 dark:text-slate-300">
        ট্রেড লাইসেন্স ইস্যু, ট্র্যাকিং, বকেয়া আদায় ও বাল্ক এসএমএস — ট্যাক্স
        ইন্সপেক্টরদের জন্য একটি মাল্টি-টেন্যান্ট SaaS প্ল্যাটফর্ম।
      </p>
      <p className="text-sm text-slate-400">
        পরবর্তী ধাপ: ডেটা লেয়ার (MongoDB) ও অথেন্টিকেশন। বিস্তারিত{" "}
        <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">
          PROJECT_PLAN.md
        </code>{" "}
        দেখুন।
      </p>
    </main>
  );
}
