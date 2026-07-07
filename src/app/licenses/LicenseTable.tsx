"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toBanglaDigits } from "@/lib/bangla";

export interface LicenseRow {
  id: string;
  businessName: string;
  ownerName: string;
  licenseNo: string;
  oldLicenseNo: string;
  referenceYear: number | null;
  fiscalYear: string;
  status: "new" | "renewed";
  paymentStatus: "paid" | "due";
  amountDue: number;
  total: number;
  ownerPhotoUrl: string;
}

interface ListResponse {
  ok: true;
  rows: LicenseRow[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface Props {
  initial: ListResponse;
}

export default function LicenseTable({ initial }: Props) {
  const router = useRouter();
  const [data, setData] = useState<ListResponse>(initial);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (search: string, pageNum: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      params.set("page", String(pageNum));
      const res = await fetch(`/api/licenses?${params}`);
      if (res.ok) setData((await res.json()) as ListResponse);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search.
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load(q, 1);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function goPage(p: number) {
    setPage(p);
    load(q, p);
  }

  const startSerial = (data.page - 1) * data.limit;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="নাম / প্রতিষ্ঠান / লাইসেন্স নম্বর খুঁজুন…"
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-900"
        />
        <span className="text-sm text-slate-500">
          মোট {toBanglaDigits(data.total)} টি
        </span>
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        )}
      </div>

      {data.rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
          কোনো লাইসেন্স পাওয়া যায়নি।{" "}
          <a href="/upload" className="text-brand underline">
            একটি আপলোড করুন
          </a>
        </p>
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 md:block dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-900">
                <tr>
                  <th className="px-3 py-2">ক্রমিক</th>
                  <th className="px-3 py-2">ট্রেড লাইসেন্স নং</th>
                  <th className="px-3 py-2">নাম</th>
                  <th className="px-3 py-2">পুরাতন নং</th>
                  <th className="px-3 py-2">রেফ. বছর</th>
                  <th className="px-3 py-2">অর্থ বছর</th>
                  <th className="px-3 py-2">ছবি</th>
                  <th className="px-3 py-2">পেইড / ডিউ</th>
                  <th className="px-3 py-2">প্রিন্ট</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r, i) => (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/licenses/${r.id}`)}
                    className="cursor-pointer border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                  >
                    <td className="px-3 py-2 text-slate-500">
                      {toBanglaDigits(startSerial + i + 1)}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {toBanglaDigits(r.licenseNo)}
                    </td>
                    <td className="px-3 py-2">
                      <div>{r.businessName}</div>
                      <div className="text-xs text-slate-500">{r.ownerName}</div>
                    </td>
                    <td className="px-3 py-2">{toBanglaDigits(r.oldLicenseNo)}</td>
                    <td className="px-3 py-2">
                      {r.referenceYear ? toBanglaDigits(r.referenceYear) : "—"}
                    </td>
                    <td className="px-3 py-2">{toBanglaDigits(r.fiscalYear)}</td>
                    <td className="px-3 py-2">
                      {r.ownerPhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.ownerPhotoUrl}
                          alt=""
                          className="h-9 w-9 rounded object-cover"
                        />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <PaidBadge status={r.paymentStatus} amountDue={r.amountDue} />
                    </td>
                    <td className="px-3 py-2">
                      <a
                        href={`/licenses/${r.id}?print=1`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-brand hover:underline"
                      >
                        প্রিন্ট
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="space-y-3 md:hidden">
            {data.rows.map((r, i) => (
              <a
                key={r.id}
                href={`/licenses/${r.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start gap-3">
                  {r.ownerPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.ownerPhotoUrl}
                      alt=""
                      className="h-12 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-slate-100 text-xs text-slate-400 dark:bg-slate-800">
                      {toBanglaDigits(startSerial + i + 1)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.businessName}</p>
                    <p className="text-xs text-slate-500">{r.ownerName}</p>
                    <p className="mt-1 text-xs">{toBanglaDigits(r.licenseNo)}</p>
                  </div>
                  <PaidBadge status={r.paymentStatus} amountDue={r.amountDue} />
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>অর্থ বছর {toBanglaDigits(r.fiscalYear) || "—"}</span>
                  <span>রেফ. {r.referenceYear ? toBanglaDigits(r.referenceYear) : "—"}</span>
                </div>
              </a>
            ))}
          </div>

          {/* ── Pagination ── */}
          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => goPage(page - 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-slate-700"
              >
                পূর্ববর্তী
              </button>
              <span className="text-sm text-slate-500">
                পৃষ্ঠা {toBanglaDigits(data.page)} / {toBanglaDigits(data.pages)}
              </span>
              <button
                disabled={page >= data.pages || loading}
                onClick={() => goPage(page + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-slate-700"
              >
                পরবর্তী
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PaidBadge({
  status,
  amountDue,
}: {
  status: "paid" | "due";
  amountDue: number;
}) {
  if (status === "paid") {
    return (
      <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        পেইড
      </span>
    );
  }
  return (
    <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
      ডিউ {amountDue ? `৳${toBanglaDigits(amountDue)}` : ""}
    </span>
  );
}
