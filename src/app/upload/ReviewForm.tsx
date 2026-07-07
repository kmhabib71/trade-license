"use client";

import { useState } from "react";
import { toBanglaDigits } from "@/lib/bangla";
import type { ExtractionDraft, DraftMethod } from "@/lib/extraction/fields";

/** Bengali labels + grouping for the editable review form. */
const GROUPS: { title: string; fields: [keyof ExtractionDraft, string][] }[] = [
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
      ["fiscalYear", "অর্থ বছর"],
      ["businessStartDate", "ব্যবসা শুরুর তারিখ"],
      ["issueDate", "ইস্যুর তারিখ"],
      ["expiryDate", "মেয়াদ উত্তীর্ণের তারিখ"],
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
    ],
  },
];

const METHOD_LABELS: Record<DraftMethod, string> = {
  "pdf-text": "PDF টেক্সট",
  ocr: "OCR",
  ai: "AI",
  manual: "ম্যানুয়াল",
};

export interface ReviewFormProps {
  draft: ExtractionDraft;
  method: DraftMethod;
  confidence: number;
  notes?: string;
  licenseImageUrl: string;
  sourceType: "pdf" | "photo";
  previewImageUrl?: string | null;
  onCancel: () => void;
}

export default function ReviewForm(props: ReviewFormProps) {
  const [values, setValues] = useState<ExtractionDraft>(props.draft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  function set(key: keyof ExtractionDraft, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function save() {
    setError(null);
    if (!values.businessName.trim() || !values.licenseNo.trim()) {
      setError("প্রতিষ্ঠানের নাম ও লাইসেন্স নম্বর আবশ্যক");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...values,
        status: values.status || "new",
        licenseImageUrl: props.licenseImageUrl,
        sourceType: props.sourceType,
        extractionMethod: props.method,
        extractionConfidence: props.confidence,
        verified: true,
      };
      const res = await fetch("/api/licenses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "সংরক্ষণ ব্যর্থ হয়েছে");
        return;
      }
      setSavedId(data.id);
    } catch {
      setError("সার্ভারে সংযোগ করা যায়নি");
    } finally {
      setSaving(false);
    }
  }

  if (savedId) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950">
        <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
          ✅ লাইসেন্স সংরক্ষিত হয়েছে
        </p>
        <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
          {values.businessName} — {toBanglaDigits(values.licenseNo)}
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <a
            href="/dashboard"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            ড্যাশবোর্ড
          </a>
          <a
            href="/upload"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            আরেকটি আপলোড
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Extraction summary banner */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
        <span className="rounded-full bg-brand/10 px-3 py-1 font-medium text-brand">
          {METHOD_LABELS[props.method]} দিয়ে এক্সট্রাক্ট
        </span>
        <span className="text-slate-500">
          কনফিডেন্স: {toBanglaDigits(Math.round(props.confidence * 100))}%
        </span>
        {props.notes && (
          <span className="text-amber-600 dark:text-amber-400">{props.notes}</span>
        )}
        <span className="ms-auto text-slate-400">
          তথ্য যাচাই করুন ও প্রয়োজনে সম্পাদনা করুন
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Editable fields */}
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
                        set("status", e.target.value as ExtractionDraft["status"])
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                    >
                      <option value="new">নতুন</option>
                      <option value="renewed">নবায়নকৃত</option>
                    </select>
                  </label>
                )}
              </div>
            </fieldset>
          ))}
        </div>

        {/* License image preview */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            আপলোডকৃত লাইসেন্স
          </p>
          {props.sourceType === "photo" && props.previewImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={props.previewImageUrl}
              alt="license"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800"
            />
          ) : (
            <a
              href={props.licenseImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-40 items-center justify-center rounded-xl border border-slate-200 bg-red-50 text-sm font-semibold text-red-700 dark:border-slate-800 dark:bg-red-950 dark:text-red-300"
            >
              PDF দেখুন
            </a>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <button
          onClick={props.onCancel}
          disabled={saving}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          বাতিল
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-brand px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "সংরক্ষণ হচ্ছে…" : "নিশ্চিত করে সংরক্ষণ করুন"}
        </button>
      </div>
    </div>
  );
}
