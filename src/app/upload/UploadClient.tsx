"use client";

import { useRef, useState } from "react";
import { toBanglaDigits } from "@/lib/bangla";
import ReviewForm from "./ReviewForm";
import type { ExtractionDraft, DraftMethod } from "@/lib/extraction/fields";

interface UploadOk {
  ok: true;
  sourceType: "pdf" | "photo";
  url: string;
  publicId: string;
  resourceType: string;
  bytes: number;
}

interface ExtractOk {
  ok: true;
  draft: ExtractionDraft;
  method: DraftMethod;
  confidence: number;
  rawText: string;
  notes?: string;
}

type Phase = "pick" | "uploaded" | "extracting" | "review";

export default function UploadClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upload, setUpload] = useState<UploadOk | null>(null);
  const [extract, setExtract] = useState<ExtractOk | null>(null);
  const [phase, setPhase] = useState<Phase>("pick");

  function reset() {
    setError(null);
    setUpload(null);
    setExtract(null);
    setPhase("pick");
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  function pick(f: File | null) {
    setError(null);
    setUpload(null);
    setExtract(null);
    setPhase("pick");
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f && f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  }

  async function uploadAndExtract() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      // 1) Upload to Cloudinary
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "আপলোড ব্যর্থ হয়েছে");
        return;
      }
      const up = data as UploadOk;
      setUpload(up);
      setPhase("extracting");

      // 2) Extract (OCR-first → AI) — send the file bytes directly.
      // (Cloudinary blocks public PDF/raw delivery by default, so we don't
      //  round-trip through the stored URL.)
      const exFd = new FormData();
      exFd.append("file", file);
      const exRes = await fetch("/api/extract", { method: "POST", body: exFd });
      const exData = await exRes.json();
      if (!exRes.ok) {
        setError(exData.error ?? "তথ্য এক্সট্রাক্ট করা যায়নি");
        setPhase("uploaded");
        return;
      }
      setExtract(exData as ExtractOk);
      setPhase("review");
    } catch {
      setError("সার্ভারে সংযোগ করা যায়নি");
    } finally {
      setUploading(false);
    }
  }

  const sizeKB = file ? toBanglaDigits(Math.round(file.size / 1024)) : "";

  // ── Review screen ──────────────────────────────────────────
  if (phase === "review" && extract && upload) {
    return (
      <ReviewForm
        draft={extract.draft}
        method={extract.method}
        confidence={extract.confidence}
        notes={extract.notes}
        licenseImageUrl={upload.url}
        sourceType={upload.sourceType}
        previewImageUrl={previewUrl}
        onCancel={reset}
      />
    );
  }

  // ── Upload / extract screen ────────────────────────────────
  return (
    <div className="space-y-6">
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
          কাগজের লাইসেন্সের ছবি তুলুন বা ফাইল নির্বাচন করুন (সর্বোচ্চ ১৫MB)
        </p>
      </div>

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
            onClick={uploadAndExtract}
            disabled={uploading}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {phase === "extracting"
              ? "তথ্য পড়া হচ্ছে…"
              : uploading
                ? "আপলোড হচ্ছে…"
                : "আপলোড ও এক্সট্রাক্ট করুন"}
          </button>
        </div>
      )}

      {phase === "extracting" && (
        <div className="flex items-center gap-3 rounded-xl border border-brand/30 bg-brand/5 p-4 text-sm text-brand">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          লাইসেন্স থেকে তথ্য বের করা হচ্ছে (OCR → AI)…
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
