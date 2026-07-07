"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Edit / Print / Delete action bar for the detail page (Phase 6.3–6.5).
 *  Delete asks for confirmation, then DELETEs and returns to the list. */
export default function DetailActions({
  id,
  businessName,
}: {
  id: string;
  businessName: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/licenses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "মুছে ফেলা ব্যর্থ");
        setDeleting(false);
        return;
      }
      router.push("/licenses");
      router.refresh();
    } catch {
      setError("সার্ভারে সংযোগ করা যায়নি");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <a
        href={`/licenses/${id}/edit`}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        সম্পাদনা
      </a>
      <button
        onClick={() => window.print()}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        প্রিন্ট
      </button>
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
        >
          মুছুন
        </button>
      ) : (
        <span className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-sm dark:bg-red-950">
          <span className="text-red-700 dark:text-red-300">নিশ্চিত?</span>
          <button
            onClick={doDelete}
            disabled={deleting}
            className="font-medium text-red-700 underline disabled:opacity-50 dark:text-red-300"
          >
            {deleting ? "মুছছে…" : "হ্যাঁ, মুছুন"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={deleting}
            className="text-slate-500"
          >
            না
          </button>
        </span>
      )}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
