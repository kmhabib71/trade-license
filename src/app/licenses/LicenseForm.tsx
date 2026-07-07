"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LicenseFormValues } from "@/lib/licenseFormValues";

/**
 * Reusable license form for manual **create** (Phase 6.2) and **edit** (6.3).
 * Mirrors the review-screen field groups. On submit → POST (create) or PUT
 * (edit) → redirect to the detail page. The value shape + `emptyFormValues`
 * live in `@/lib/licenseFormValues` so server pages can import them too.
 */

type TextKey = Exclude<keyof LicenseFormValues, "status" | "paymentStatus">;

const GROUPS: { title: string; fields: [TextKey, string][] }[] = [
  {
    title: "প্রতিষ্ঠান ও মালিক",
    fields: [
      ["businessName", "ব্যবসা প্রতিষ্ঠানের নাম *"],
      ["ownerName", "মালিকের নাম"],
      ["fatherOrHusbandName", "পিতা / স্বামীর নাম"],
      ["motherName", "মাতার নাম"],
      ["businessNature", "ব্যবসার প্রকৃতি"],
      ["businessType", "ব্যবসার ধরণ"],
    ],
  },
  {
    title: "ঠিকানা ও পরিচয়",
    fields: [
      ["address", "প্রতিষ্ঠানের ঠিকানা"],
      ["ward", "ওয়ার্ড"],
      ["market", "মার্কেট"],
      ["area", "এলাকা"],
      ["zone", "জোন"],
      ["nidPassportBirth", "এনআইডি / পাসপোর্ট / জন্মনিবন্ধন"],
      ["binNo", "বিন নম্বর"],
      ["tinNo", "টিন নম্বর"],
      ["phone", "মোবাইল / ফোন"],
      ["email", "ইমেইল"],
    ],
  },
  {
    title: "লাইসেন্স তথ্য",
    fields: [
      ["licenseNo", "ট্রেড লাইসেন্স নম্বর *"],
      ["oldLicenseNo", "পুরাতন লাইসেন্স নম্বর"],
      ["fiscalYear", "অর্থ বছর (যেমন 2026-2027)"],
      ["businessStartDate", "ব্যবসা শুরুর তারিখ (dd/mm/yyyy)"],
      ["issueDate", "ইস্যুর তারিখ (dd/mm/yyyy)"],
      ["expiryDate", "মেয়াদ উত্তীর্ণের তারিখ (dd/mm/yyyy)"],
    ],
  },
  {
    title: "ফি ও চার্জ (৳)",
    fields: [
      ["licenseFee", "লাইসেন্স / নবায়ন ফি"],
      ["signboardTax", "সাইনবোর্ড কর"],
      ["surcharge", "সারচার্জ"],
      ["vat", "ভ্যাট"],
      ["incomeTax", "আয়কর / উৎসে কর"],
      ["bookFee", "বই ফি"],
      ["formFee", "ফর্ম ফি"],
      ["arrears", "বকেয়া"],
      ["correctionFee", "সংশোধনী ফি"],
      ["total", "সর্বমোট"],
      ["amountPaid", "পরিশোধিত"],
      ["amountDue", "বকেয়া পরিমাণ"],
    ],
  },
];

interface Props {
  mode: "create" | "edit";
  initial: LicenseFormValues;
  /** For edit: the record id (PUT target). */
  id?: string;
  /** licenseImageUrl to carry through on create (from an upload), if any. */
  licenseImageUrl?: string;
}

export default function LicenseForm({ mode, initial, id, licenseImageUrl }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<LicenseFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof LicenseFormValues>(key: K, v: LicenseFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function submit() {
    setError(null);
    if (!values.businessName.trim() || !values.licenseNo.trim()) {
      setError("প্রতিষ্ঠানের নাম ও লাইসেন্স নম্বর আবশ্যক");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...values,
        ...(licenseImageUrl ? { licenseImageUrl } : {}),
        ...(mode === "edit" ? {} : { verified: true }),
      };
      const url = mode === "edit" ? `/api/licenses/${id}` : "/api/licenses";
      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "সংরক্ষণ ব্যর্থ হয়েছে");
        return;
      }
      const targetId = mode === "edit" ? id : data.id;
      router.push(`/licenses/${targetId}`);
      router.refresh();
    } catch {
      setError("সার্ভারে সংযোগ করা যায়নি");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {GROUPS.map((group) => (
        <fieldset
          key={group.title}
          className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
        >
          <legend className="px-2 text-sm font-semibold text-brand">
            {group.title}
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.fields.map(([key, label]) => (
              <label key={key} className="block text-sm">
                <span className="mb-1 block text-slate-600 dark:text-slate-400">
                  {label}
                </span>
                <input
                  value={values[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                />
              </label>
            ))}
            {group.title === "লাইসেন্স তথ্য" && (
              <label className="block text-sm">
                <span className="mb-1 block text-slate-600 dark:text-slate-400">
                  অবস্থা
                </span>
                <select
                  value={values.status}
                  onChange={(e) =>
                    set("status", e.target.value as "new" | "renewed")
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="new">নতুন</option>
                  <option value="renewed">নবায়নকৃত</option>
                </select>
              </label>
            )}
            {group.title === "ফি ও চার্জ (৳)" && (
              <label className="block text-sm">
                <span className="mb-1 block text-slate-600 dark:text-slate-400">
                  পেমেন্ট অবস্থা
                </span>
                <select
                  value={values.paymentStatus}
                  onChange={(e) =>
                    set("paymentStatus", e.target.value as "paid" | "due")
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="due">ডিউ</option>
                  <option value="paid">পেইড</option>
                </select>
              </label>
            )}
          </div>
        </fieldset>
      ))}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <button
          onClick={() => router.back()}
          disabled={saving}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          বাতিল
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="rounded-lg bg-brand px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving
            ? "সংরক্ষণ হচ্ছে…"
            : mode === "edit"
              ? "আপডেট করুন"
              : "সংরক্ষণ করুন"}
        </button>
      </div>

    </div>
  );
}
