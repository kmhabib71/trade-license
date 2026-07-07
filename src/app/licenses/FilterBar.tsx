"use client";

import { useState } from "react";

/**
 * Phase 5 — the filter bar (≥10 filters). URL is the single source of truth:
 * every change is pushed to the query string; `LicenseTable` reads the same
 * params to fetch. A quick "নাম/লাইসেন্স খুঁজুন" search stays outside the
 * collapsible panel; the rest live in an expandable "ফিল্টার" panel with an
 * active-count badge and a clear-all.
 */

export interface Filters {
  q?: string;
  licenseNo?: string;
  oldLicenseNo?: string;
  status?: string; // new | renewed
  paymentStatus?: string; // paid | due
  fiscalYear?: string;
  referenceYear?: string;
  ward?: string;
  area?: string;
  dateFrom?: string;
  dateTo?: string;
  dueMin?: string;
  dueMax?: string;
  hasPhoto?: string; // yes | no
  extractionMethod?: string; // pdf-text | ocr | ai | manual
  verified?: string; // yes | no
  showArchived?: string; // "1"
}

/** Keys that count toward the "active filters" badge (search `q` shown separately). */
const PANEL_KEYS: (keyof Filters)[] = [
  "licenseNo",
  "oldLicenseNo",
  "status",
  "paymentStatus",
  "fiscalYear",
  "referenceYear",
  "ward",
  "area",
  "dateFrom",
  "dateTo",
  "dueMin",
  "dueMax",
  "hasPhoto",
  "extractionMethod",
  "verified",
  "showArchived",
];

interface Props {
  value: Filters;
  onChange: (next: Filters) => void;
}

export default function FilterBar({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const activeCount = PANEL_KEYS.filter((k) => value[k]).length;

  function set(key: keyof Filters, v: string) {
    const next = { ...value };
    if (v) next[key] = v;
    else delete next[key];
    onChange(next);
  }

  function clearAll() {
    onChange({});
  }

  return (
    <div className="space-y-3">
      {/* Quick search + toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={value.q ?? ""}
          onChange={(e) => set("q", e.target.value)}
          placeholder="নাম / প্রতিষ্ঠান / লাইসেন্স নম্বর খুঁজুন…"
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-900"
        />
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          ফিল্টার
          {activeCount > 0 && (
            <span className="rounded-full bg-brand px-1.5 text-xs text-white">
              {activeCount}
            </span>
          )}
          <span className="text-slate-400">{open ? "▲" : "▼"}</span>
        </button>
        {(activeCount > 0 || value.q) && (
          <button
            onClick={clearAll}
            className="text-sm text-red-600 hover:underline dark:text-red-400"
          >
            সব মুছুন
          </button>
        )}
      </div>

      {/* Collapsible panel */}
      {open && (
        <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
          <Text label="ট্রেড লাইসেন্স নম্বর" v={value.licenseNo} onC={(x) => set("licenseNo", x)} />
          <Text label="পুরাতন লাইসেন্স নম্বর" v={value.oldLicenseNo} onC={(x) => set("oldLicenseNo", x)} />

          <Select
            label="নতুন / নবায়নকৃত"
            v={value.status}
            onC={(x) => set("status", x)}
            opts={[["", "সব"], ["new", "নতুন"], ["renewed", "নবায়নকৃত"]]}
          />
          <Select
            label="পেইড / ডিউ"
            v={value.paymentStatus}
            onC={(x) => set("paymentStatus", x)}
            opts={[["", "সব"], ["paid", "পেইড"], ["due", "ডিউ"]]}
          />

          <Text label="অর্থ বছর (যেমন 2026-2027)" v={value.fiscalYear} onC={(x) => set("fiscalYear", x)} />
          <Text label="রেফারেন্স বছর" type="number" v={value.referenceYear} onC={(x) => set("referenceYear", x)} />

          <Text label="ওয়ার্ড" v={value.ward} onC={(x) => set("ward", x)} />
          <Text label="এলাকা / মার্কেট" v={value.area} onC={(x) => set("area", x)} />

          {/* Issue-date range */}
          <div>
            <span className="mb-1 block text-xs text-slate-500">ইস্যু তারিখ (থেকে – পর্যন্ত)</span>
            <div className="flex gap-2">
              <input
                type="date"
                value={value.dateFrom ?? ""}
                onChange={(e) => set("dateFrom", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
              <input
                type="date"
                value={value.dateTo ?? ""}
                onChange={(e) => set("dateTo", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>

          {/* Amount-due range */}
          <div>
            <span className="mb-1 block text-xs text-slate-500">বকেয়া পরিমাণ (৳ সর্বনিম্ন – সর্বোচ্চ)</span>
            <div className="flex gap-2">
              <input
                type="number"
                value={value.dueMin ?? ""}
                onChange={(e) => set("dueMin", e.target.value)}
                placeholder="সর্বনিম্ন"
                className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
              <input
                type="number"
                value={value.dueMax ?? ""}
                onChange={(e) => set("dueMax", e.target.value)}
                placeholder="সর্বোচ্চ"
                className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>

          <Select
            label="ছবি আছে / নেই"
            v={value.hasPhoto}
            onC={(x) => set("hasPhoto", x)}
            opts={[["", "সব"], ["yes", "ছবি আছে"], ["no", "ছবি নেই"]]}
          />
          <Select
            label="এক্সট্রাকশন মেথড"
            v={value.extractionMethod}
            onC={(x) => set("extractionMethod", x)}
            opts={[["", "সব"], ["ai", "AI"], ["ocr", "OCR"], ["pdf-text", "PDF টেক্সট"], ["manual", "ম্যানুয়াল"]]}
          />
          <Select
            label="যাচাইকৃত"
            v={value.verified}
            onC={(x) => set("verified", x)}
            opts={[["", "সব"], ["yes", "যাচাইকৃত"], ["no", "অযাচাইকৃত"]]}
          />

          <label className="flex items-center gap-2 self-end text-sm">
            <input
              type="checkbox"
              checked={value.showArchived === "1"}
              onChange={(e) => set("showArchived", e.target.checked ? "1" : "")}
              className="h-4 w-4 rounded border-slate-300"
            />
            আর্কাইভ সহ দেখুন
          </label>
        </div>
      )}
    </div>
  );
}

function Text({
  label,
  v,
  onC,
  type = "text",
}: {
  label: string;
  v?: string;
  onC: (x: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-slate-500">{label}</span>
      <input
        type={type}
        value={v ?? ""}
        onChange={(e) => onC(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-900"
      />
    </label>
  );
}

function Select({
  label,
  v,
  onC,
  opts,
}: {
  label: string;
  v?: string;
  onC: (x: string) => void;
  opts: [string, string][];
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-slate-500">{label}</span>
      <select
        value={v ?? ""}
        onChange={(e) => onC(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-900"
      >
        {opts.map(([val, lbl]) => (
          <option key={val} value={val}>
            {lbl}
          </option>
        ))}
      </select>
    </label>
  );
}
