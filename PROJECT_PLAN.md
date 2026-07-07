# ই-ট্রেড লাইসেন্স ট্র্যাকার — Project Build Plan

A **multi-tenant SaaS PWA** (Next.js + Tailwind) for Bangladeshi trade-license inspectors to
**digitize their handwritten license registers**. Each inspector (tenant) uploads an issued trade
license (PDF or phone photo) → system extracts the info (OCR-first, AI fallback) → stores in
MongoDB Atlas → shows a filterable, printable list that mirrors the journal → sends bulk SMS
(with invoice) to license holders whose payment is **due**.

**SaaS model:** A **platform admin** onboards inspectors and manages accounts. Each inspector pays
**৳500 / month** to use the platform. All license data is **tenant-isolated** — an inspector only
ever sees their own records. Access is gated on an **active subscription**.

---

## 0. Confirmed Decisions

| Area | Decision |
|---|---|
| **Framework** | Next.js (App Router) + TypeScript + Tailwind CSS, installable **PWA** |
| **Product model** | **Multi-tenant SaaS**. Roles: `super_admin` (platform owner) & `inspector` (tenant). Inspectors pay **৳500/month**; access gated on active subscription. |
| **Tenant isolation** | Every domain record carries `tenantId` (the inspector's account/org). All queries filtered by `tenantId`; super_admin bypasses to manage accounts. |
| **DB** | **MongoDB Atlas** (via Mongoose) |
| **Image storage** | **Cloudinary** (stores uploaded license + Python-cropped owner photo) |
| **Extraction** | **OCR-first** (Bengali+English). If OCR text is clean & parseable → use it. Else **AI vision fallback** (Claude vision → structured JSON). PDF uploads prefer the PDF **text layer** (near-perfect, no OCR needed). |
| **Input types** | **Both** official digital PDF **and** phone photo of printed license |
| **Owner photo** | Cropped from the uploaded license image via **Python** (face/photo-region crop) and stored |
| **SMS** | **BD SMS gateway** now (adapter pattern, gateway configurable). **WhatsApp** kept as a second pluggable channel (needs API + business verification later) |
| **List columns** | ক্রমিক নং · ট্রেড লাইসেন্স নাম্বার · নাম · পুরাতন লাইসেন্স নাম্বার · রেফারেন্স বছর · অর্থ বছর · ছবি · পেইড/ডিউ · প্রিন্ট |
| **Filters** | ≥10 (see §4) |
| **CRUD** | Full manual create/read/update/delete on every record |

---

## 1. Data Model (derived from the real license + the journal)

**License / Register record** (MongoDB collection `licenses`):

Identity & business (from license §1–§9):
- `businessName` (ব্যবসা প্রতিষ্ঠানের নাম)
- `ownerName` (মালিকের নাম)
- `fatherOrHusbandName`, `motherName`
- `businessNature` (ব্যবসার প্রকৃতি), `businessType` (ব্যবসার ধরণ)
- `address` (প্রতিষ্ঠানের ঠিকানা), `ward`, `market`, `area`, `zone`
- `nidPassportBirth`, `binNo`, `tinNo`, `phone`, `email`
- `presentAddress {}`, `permanentAddress {}` (holding, road, village, postcode, thana, district, division)

License numbering (the key identifiers for search/filter):
- `licenseNo` — e.g. `TRAD/CHTG/006515/2024`
- `oldLicenseNo` (পুরাতন ট্রেড লাইসেন্স নং) — e.g. `০০৬৫১৫/২০২৪`
- `referenceYear` (রেফারেন্স বছর) — parsed from the license-no suffix (e.g. 2024)
- `fiscalYear` (অর্থ বছর) — e.g. `2026-2027`
- `status` — `new` (নতুন) | `renewed` (নবায়নকৃত)
- `businessStartDate`, `issueDate`, `issueTime`, `expiryDate`

Fees / ledger (license §12 + journal columns):
- `licenseFee` (লাইসেন্স/নবায়ন ফি)
- `signboardTax` (সাইনবোর্ড কর)
- `surcharge` (সারচার্জ), `vat` (ভ্যাট)
- `incomeTax` (আয়কর/উৎসে কর)
- `bookFee` (বই ফি), `formFee` (ফর্ম ফি)
- `arrears` (বকেয়া), `correctionFee` (সংশোধনী ফি)
- `total` (সর্বমোট)
- `paymentStatus` — `paid` (পেইড) | `due` (ডিউ)
- `amountPaid`, `amountDue`, `paymentDate`

Media & meta:
- `tenantId` (**owning inspector/account — required on every record; all queries scoped by it**)
- `licenseImageUrl` (Cloudinary — full uploaded license)
- `ownerPhotoUrl` (Cloudinary — Python-cropped owner photo)
- `sourceType` — `pdf` | `photo`
- `extractionMethod` — `pdf-text` | `ocr` | `ai`
- `extractionConfidence`, `rawExtractedText`, `verified` (bool — inspector confirmed)
- `smsHistory[]` (channel, to, body, invoiceRef, sentAt, status)
- `createdAt`, `updatedAt`

> **Notes:** All Bengali numerals stored as Western digits internally; a display helper renders
> Bangla digits in the UI. `licenseNo` is the unique key. `referenceYear` + `fiscalYear` +
> `status` + `paymentStatus` are the primary filter drivers.

### 1a. Renewal & Archive (year-over-year linking)

When a **new (renewed) license for the same person/business** is added for the next year, the
**previous year's license is archived** rather than deleted, and the new one becomes active with
`paymentStatus = due` by default.

Extra fields on the `License` record:
- `personKey` — stable owner/business identity used to group a person's licenses across years
  (derived from `oldLicenseNo` base + NID, e.g. `006515` from both `TRAD/CHTG/006515/2024` and
  `০০৬৫১৫/২০২৪`). Licenses sharing a `personKey` form one **history chain**.
- `isActive` (bool) — only the latest year's license is active.
- `archived` (bool) + `archivedAt` — set on the superseded record.
- `supersededBy` / `previousLicenseId` — links a record to its next/previous year.

**Flow on add:** when a record's `personKey` matches an existing active record with an older
`fiscalYear` → mark the old one `archived=true, isActive=false, supersededBy=<new id>`; new record
gets `isActive=true, previousLicenseId=<old id>, paymentStatus=due`.

**Detail view → "আর্কাইভ / Archive" tab:** shows that person's full year-by-year history chain
(all past licenses, fees, paid/due, images). Main list shows only active records by default (a
filter toggles "show archived").

> `personKey` is scoped **within a tenant** — two inspectors can independently hold the same base
> number without colliding.

### 1b. SaaS models (accounts, users, billing)

**`Tenant`** (one per inspector account / organization):
- `name`, `slug`, `ownerUserId`, `city/zone` (their jurisdiction), `smsSenderId`
- `status` — `active` | `suspended` | `trial`
- `createdAt`

**`User`** (login identities):
- `tenantId` (null for `super_admin`), `name`, `email`, `phone`, `passwordHash`
- `role` — `super_admin` | `inspector` (extendable: `staff`)
- `status` — `active` | `disabled`, `lastLoginAt`

**`Subscription`** (billing per tenant, **৳500/month**):
- `tenantId`, `plan` (`monthly_500`), `amount` (500), `currency` (BDT)
- `status` — `active` | `past_due` | `canceled` | `trialing`
- `currentPeriodStart`, `currentPeriodEnd`, `trialEndsAt`
- `payments[]` — { amount, method (bKash/Nagad/manual), reference, paidAt, recordedBy }
- Access rule: app is usable only while `status ∈ {active, trialing}` **and** `currentPeriodEnd ≥ now`;
  otherwise a paywall/"subscription expired" screen is shown (data preserved).

> **Billing note:** Start with **manual/admin-recorded payments** (bKash/Nagad reference entered by
> super_admin marks a tenant paid for the period) — fastest to launch. A payment-gateway
> integration (bKash PGW / SSLCommerz) can be added later behind the same `Subscription` model.

---

## 2. Architecture

```
Next.js (App Router, PWA)
├─ Auth + tenancy (session → { userId, tenantId, role }); middleware guards every request
├─ UI (Tailwind)
│    ├─ inspector app — list, filters, detail/CRUD, upload, SMS console, billing/status
│    └─ super_admin — tenants, users, subscriptions (record ৳500 payments), platform stats
├─ API routes (/app/api/*)  — ALL tenant-scoped except /admin/* (super_admin only)
│    ├─ /auth/*        → login, logout, session
│    ├─ /upload        → Cloudinary upload + kick off extraction
│    ├─ /extract       → orchestrates: pdf-text | OCR | AI fallback
│    ├─ /licenses      → CRUD (list w/ filters+pagination, get, create, update, delete)
│    ├─ /sms/send      → bulk SMS to due holders (BD gateway adapter)
│    ├─ /invoice/[id]  → invoice (for SMS link + print)
│    └─ /admin/*       → tenants, users, subscriptions, payments (super_admin)
├─ lib/
│    ├─ db (Mongoose connection + models: Tenant, User, Subscription, License)
│    ├─ auth (session, password hash, role/subscription guards, withTenant() helper)
│    ├─ cloudinary
│    ├─ extraction (pdf-text parser, ocr client, ai client, field-mapper)
│    └─ sms (gateway adapters: bdSmsAdapter, whatsappAdapter)
└─ python-service/  (FastAPI microservice, called by /extract)
     ├─ /ocr    → Tesseract ben+eng → cleaned text + confidence
     └─ /crop   → detect + crop owner photo region from license image
```

**Tenancy enforcement:** a `withTenant()` server helper resolves the session and injects
`tenantId` into every DB query; a subscription guard blocks the inspector app when the tenant's
subscription is expired/past_due (data preserved, paywall shown). `super_admin` routes bypass
tenant scoping to administer accounts.

**Why a small Python service:** Tesseract Bengali OCR and the owner-photo crop (OpenCV face/region
detection) live cleanly in Python. Next.js calls it over HTTP. If OCR confidence is low or the
parsed fields are incomplete, Next.js falls back to AI vision. (Can be collapsed into serverless
functions later; a separate service keeps OCR deps out of the Next build.)

---

## 3. Build Phases & Steps

### Phase 0 — Scaffold & infra
- [ ] **0.1** Init Next.js + TS + Tailwind + ESLint; App Router
- [ ] **0.2** Add PWA (manifest.json, service worker, icons, offline shell) — `next-pwa`
- [ ] **0.3** Env config (`.env.local`): Mongo URI, Cloudinary keys, SMS gateway keys, AI key, Python service URL
- [ ] **0.4** Base layout, Bangla-capable font (e.g. Noto Sans Bengali), RTL-safe Tailwind theme
- [ ] **0.5** Bangla ↔ Western digit helpers + fiscal-year/license-no parsers

### Phase 1 — Data layer
- [ ] **1.1** Mongoose connection singleton (`lib/db.ts`)
- [ ] **1.2** `License` schema/model (§1) with `tenantId` + indexes on `(tenantId, licenseNo)`, `(tenantId, paymentStatus)`, `(tenantId, fiscalYear)`, `(tenantId, personKey)`
- [ ] **1.3** `Tenant`, `User`, `Subscription` schemas/models (§1b)
- [ ] **1.4** Seed script — super_admin user + one demo tenant/inspector + sample license (উযাইর ট্রেড ভেঞ্চারস)
- [ ] **1.5** Zod validation schemas shared by API + forms

### Phase 1.5 — Auth, tenancy & subscription gate (SaaS core)
- [ ] **1.5.1** Auth: email/password login, session (JWT/cookie), logout, password hashing
- [ ] **1.5.2** Roles (`super_admin` | `inspector`) + route middleware guarding all pages/APIs
- [ ] **1.5.3** `withTenant()` helper — inject `tenantId` into every query; deny cross-tenant access
- [ ] **1.5.4** Subscription guard — paywall/"expired" screen when tenant subscription inactive

### Phase 2 — Upload & storage
- [ ] **2.1** Cloudinary helper (upload license image/PDF, return URLs)
- [ ] **2.2** Upload UI: file/camera input (photo or PDF), progress, preview
- [ ] **2.3** `/api/upload` route → store original → return asset id

### Phase 3 — Extraction pipeline (core automation)
- [ ] **3.1** Python service scaffold (FastAPI) with `/ocr` and `/crop`
- [ ] **3.2** `/ocr`: Tesseract `ben+eng`, preprocessing (deskew/threshold), return text + confidence
- [ ] **3.3** `/crop`: detect owner-photo region, crop, upload to Cloudinary, return `ownerPhotoUrl`
- [ ] **3.4** PDF text-layer parser (for real e-license PDFs — exact, no OCR)
- [ ] **3.5** Field mapper: regex/keyword map from Bengali labels → schema fields (see §1)
- [ ] **3.6** AI vision fallback (Claude vision → structured JSON) when OCR text is unclean/incomplete
- [ ] **3.7** `/api/extract` orchestrator: pdf-text → else OCR → else AI; returns draft record + method + confidence
- [ ] **3.8** "Review & confirm" screen: pre-filled editable form, inspector verifies → `verified=true` → save

### Phase 4 — List view (mirrors the journal)
- [ ] **4.1** `/api/licenses` list endpoint: filters + pagination + sort + text search
- [ ] **4.2** List table with the 9 required columns incl. thumbnail (cropped photo) & print button
- [ ] **4.3** Bangla serial numbering, paid/due badge, responsive/mobile card view
- [ ] **4.4** Row click → detail drawer/page

### Phase 5 — Filters (≥10)
- [ ] **5.1** Implement filters: (1) name/business search, (2) license no, (3) old license no,
  (4) new vs renewed, (5) paid vs due, (6) fiscal year, (7) reference year, (8) ward,
  (9) area/market, (10) date range (issue/payment), (11) amount-due range, (12) has-photo,
  (13) extraction method/verified. Filter bar + URL-synced query params + clear-all.

### Phase 6 — Detail & CRUD
- [ ] **6.1** Detail view: all fields + license image + owner photo
- [ ] **6.2** Manual **Create** (blank form, same as review screen)
- [ ] **6.3** **Edit/Update** existing record
- [ ] **6.4** **Delete** with confirm
- [ ] **6.5** Print single license/record (print-stylesheet)
- [ ] **6.6** Renewal auto-archive (§1a): on add, match `personKey` → archive prior year, new = active + due
- [ ] **6.7** Detail **Archive tab** — person's year-by-year history chain + "show archived" list filter

### Phase 7 — Invoice & bulk SMS
- [ ] **7.1** Invoice generator (`/invoice/[id]`): Bangla invoice with fee breakdown + due amount
- [ ] **7.2** SMS gateway adapter interface + **BD gateway** implementation (configurable via env)
- [ ] **7.3** **WhatsApp** adapter stub (same interface; enabled when API creds present)
- [ ] **7.4** Bulk SMS console: select all "due" (respecting filters) → preview Bangla message w/ invoice link → send → log to `smsHistory`
- [ ] **7.5** SMS/delivery log view per record

### Phase 7.5 — Super-admin & billing (SaaS)
- [ ] **7.5.1** Super-admin dashboard: list tenants, users, subscription status, platform stats
- [ ] **7.5.2** Onboard inspector: create tenant + inspector user (invite / set password)
- [ ] **7.5.3** Subscription management: start/renew/suspend; record **৳500** payment (bKash/Nagad ref, manual)
- [ ] **7.5.4** Inspector billing page: current plan, period end, payment history, "expired" state
- [ ] **7.5.5** (Later) Payment-gateway integration (bKash PGW / SSLCommerz) behind `Subscription`

### Phase 8 — PWA polish & deploy
- [ ] **8.1** Offline caching strategy (list read-only offline), install prompt, app icons/splash
- [ ] **8.2** Security hardening pass (tenant-isolation tests, rate limits, input validation)
- [ ] **8.3** Deploy: Next.js on Vercel; Python service on Render/Railway; env wiring
- [ ] **8.4** Final QA: sample license + phone photo + multi-tenant isolation + subscription gate

---

## 4. Filter List (the required ≥10)

1. নাম / প্রতিষ্ঠান search (name / business — fuzzy)
2. ট্রেড লাইসেন্স নাম্বার (license no)
3. পুরাতন লাইসেন্স নাম্বার (old license no)
4. নতুন / নবায়নকৃত (new vs renewed)
5. পেইড / ডিউ (paid vs due)
6. অর্থ বছর (fiscal year)
7. রেফারেন্স বছর (reference year)
8. ওয়ার্ড (ward)
9. এলাকা / মার্কেট (area / market)
10. তারিখ পরিসর (issue/payment date range)
11. বকেয়া পরিমাণ পরিসর (amount-due range)
12. ছবি আছে / নেই (has photo)
13. এক্সট্রাকশন মেথড / verified (source quality)

---

## 5. Tech Stack Summary

- **Frontend/Backend:** Next.js (App Router) + TypeScript + Tailwind, `next-pwa`
- **DB:** MongoDB Atlas + Mongoose
- **Storage:** Cloudinary
- **OCR/crop:** Python FastAPI + Tesseract (`ben+eng`) + OpenCV
- **AI fallback:** Claude vision (structured JSON)
- **PDF text:** `pdf-parse` / `pdfjs`
- **SMS:** BD gateway adapter (+ WhatsApp adapter, pluggable)
- **Validation:** Zod
- **Fonts:** Noto Sans Bengali

---

## 6. Open Items / To Confirm Later

- BD SMS gateway vendor + credentials (e.g. bulksmsbd, SSL Wireless) — needed for Phase 7.2
- WhatsApp Business API + trade license for that channel — Phase 7.3
- Which AI vision provider key (Claude recommended) — Phase 3.6
- Billing: start with manual (admin-recorded) ৳500 payments; payment gateway (bKash PGW / SSLCommerz) later — Phase 7.5
- Auth library choice (NextAuth vs custom JWT) — Phase 1.5
- Hosting accounts (Vercel + Render/Railway) — Phase 8.3

---

*Track implementation progress in **PROJECT_STATUS.md**.*
