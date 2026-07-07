/**
 * Bangla ↔ Western digit helpers + trade-license/fiscal-year parsers.
 *
 * Rule of thumb: store everything as Western digits internally; render Bangla
 * digits only in the UI via `toBanglaDigits`.
 */

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const EN_DIGITS = "0123456789";

/** Convert Western digits in a string to Bangla digits (for display). */
export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/** Convert Bangla digits in a string to Western digits (for storage/parsing). */
export function toEnglishDigits(input: string | number): string {
  return String(input).replace(/[০-৯]/g, (d) => EN_DIGITS[BN_DIGITS.indexOf(d)]);
}

/**
 * Parse a trade-license number like `TRAD/CHTG/006515/2024`.
 * Returns the base serial, the city code, and the reference (issue) year.
 */
export function parseLicenseNo(raw: string): {
  base: string | null;
  cityCode: string | null;
  referenceYear: number | null;
} {
  const norm = toEnglishDigits(String(raw ?? "").trim());
  // TRAD / <CITY> / <serial> / <year>
  const m = norm.match(/TRAD\/([A-Z]+)\/(\d+)\/(\d{4})/i);
  if (m) {
    return {
      cityCode: m[1].toUpperCase(),
      base: m[2].replace(/^0+/, "") || m[2],
      referenceYear: Number(m[3]),
    };
  }
  // Old-format `০০৬৫১৫/২০২৪` → serial/year
  const m2 = norm.match(/(\d+)\/(\d{4})/);
  if (m2) {
    return {
      cityCode: null,
      base: m2[1].replace(/^0+/, "") || m2[1],
      referenceYear: Number(m2[2]),
    };
  }
  return { base: null, cityCode: null, referenceYear: null };
}

/**
 * Build a stable per-person history key (scoped within a tenant elsewhere).
 * Prefers the license base serial; falls back to NID.
 */
export function buildPersonKey(opts: {
  licenseNo?: string;
  oldLicenseNo?: string;
  nid?: string;
}): string | null {
  const fromNew = opts.licenseNo ? parseLicenseNo(opts.licenseNo).base : null;
  const fromOld = opts.oldLicenseNo ? parseLicenseNo(opts.oldLicenseNo).base : null;
  const base = fromNew || fromOld;
  if (base) return `lic:${base}`;
  const nid = opts.nid ? toEnglishDigits(opts.nid).trim() : "";
  if (nid) return `nid:${nid}`;
  return null;
}

/** Normalize a fiscal year like `২০২৬-২০২৭` / `2026-2027` → `2026-2027`. */
export function parseFiscalYear(raw: string): string | null {
  const norm = toEnglishDigits(String(raw ?? "").trim());
  const m = norm.match(/(\d{4})\s*[-–]\s*(\d{4})/);
  return m ? `${m[1]}-${m[2]}` : null;
}

/** Numeric start year of a fiscal year string, for range filtering/sorting. */
export function fiscalYearStart(fiscalYear: string): number | null {
  const fy = parseFiscalYear(fiscalYear);
  return fy ? Number(fy.split("-")[0]) : null;
}

/** Compare two fiscal years; returns >0 if `a` is later than `b`. */
export function compareFiscalYear(a: string, b: string): number {
  return (fiscalYearStart(a) ?? 0) - (fiscalYearStart(b) ?? 0);
}
