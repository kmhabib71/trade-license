"use client";

import { useRef, useState } from "react";
import { toBanglaDigits } from "@/lib/bangla";

interface UploadOk {
  ok: true;
  sourceType: "pdf" | "photo";
  url: string;
  publicId: string;
  resourceType: string;
  bytes: number;
}

export default function UploadClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadOk | null>(null);

  function pick(f: File | null) {
    setError(null);
    setResult(null);
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f && f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  }

  async function upload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "আপলোড ব্যর্থ হয়েছে");
        return;
      }
      setResult(data as UploadOk);
    } catch {
      setError("সার্ভারে সংযোগ করা যায়নি");
    } finally {
      setUploading(false);
    }
  }

  const sizeKB = file ? toBanglaDigits(Math.round(file.size / 1024)) : "";

  return (
    <div className="space-y-6">
      {/* Dropzone / picker */}
      <div
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center transition hover:border-brand dark:border-slate-700 dark:bg-slate-900"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
        <p className="font-medium">ট্রেড লাইসেন্স আপলোড করুন</p>
        <p className="mt-1 text-sm text-slate-500">
          ছবি তুলুন বা PDF/ছবি নির্বাচন করুন (সর্বোচ্চ ১৫MB)
        </p>
      </div>

      {/* Preview */}
      {file && (
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="preview"
              className="h-20 w-20 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-red-100 text-sm font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
              PDF
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-slate-500">{sizeKB} KB</p>
          </div>
          <button
            onClick={upload}
            disabled={uploading}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {uploading ? "আপলোড হচ্ছে…" : "আপলোড করুন"}
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {/* Success — Phase 3 will add an "এক্সট্রাক্ট করুন" action here */}
      {result && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            ✅ আপলোড সম্পন্ন ({result.sourceType === "pdf" ? "PDF" : "ছবি"})
          </p>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block truncate text-xs text-emerald-700 underline dark:text-emerald-400"
          >
            {result.url}
          </a>
          <p className="mt-2 text-xs text-slate-500">
            পরবর্তী ধাপ (Phase 3): এই ফাইল থেকে তথ্য এক্সট্রাক্ট করা হবে।
          </p>
        </div>
      )}
    </div>
  );
}
