# Project Status — ই-ট্রেড লাইসেন্স ট্র্যাকার

> **Purpose:** Live tracker of what's built vs. planned. In every session, read this first to know
> where we left off. Update the phase checkboxes and the "Files" table as work lands.
> Plan of record: [PROJECT_PLAN.md](PROJECT_PLAN.md).

**Last updated:** 2026-07-07
**Current phase:** Phases 0–6 ✅ complete (full CRUD + renewal auto-archive verified live). Next: Phase 7 (invoice & bulk SMS).
**Overall progress:** SaaS core + upload + extraction + list + filters + **full CRUD** working — login/JWT, role fencing, tenant scoping, ৳500 paywall, Cloudinary upload, photo/PDF → AI extract → review → save, filterable journal list, 13-filter bar, and manual create / edit / delete / print / **renewal auto-archive** (year-over-year personKey chain), all tested end-to-end (incl. tenant-isolation + chain self-heal on delete).

---

## Quick status by phase

| Phase | Title | Status |
|---|---|---|
| Planning | Plan + status docs, decisions locked (now SaaS + archive) | ✅ Done |
| 0 | Scaffold & infra (Next.js, PWA, env, fonts, helpers) | ✅ Done |
| 1 | Data layer (Mongoose: License + Tenant/User/Subscription, seed, Zod) | ✅ Done |
| 1.5 | Auth, tenancy & subscription gate (SaaS core) | ✅ Done |
| 2 | Upload & storage (Cloudinary, upload UI/API) | ✅ Done |
| 3 | Extraction pipeline (OCR-first→AI, review/confirm, save) | ✅ Done (Python OCR svc scaffolded, deferred) |
| 4 | List view (9 columns, thumbnails, print, row→detail) | ✅ Done |
| 5 | Filters (13, URL-synced + clear-all) | ✅ Done |
| 6 | Detail & CRUD + print + renewal archive | ✅ Done |
| 7 | Invoice & bulk SMS (BD gateway + WhatsApp stub) | ⬜ Not started |
| 7.5 | Super-admin & billing (SaaS) | ⬜ Not started |
| 8 | PWA polish, deploy, QA | ⬜ Not started |

Legend: ✅ done · 🟡 in progress · ⬜ not started

---

## Step checklist (mirrors PROJECT_PLAN §3)

### Phase 0 — Scaffold & infra
- [x] 0.1 Init Next.js 16 + TS + Tailwind 4 + ESLint (App Router, `src/`) — builds clean
- [x] 0.2 PWA manifest (`src/app/manifest.ts`) + metadata/theme; SW + icons deferred to 8.1
- [x] 0.3 Env template (`.env.example`) — Mongo, Cloudinary, Python svc, AI, SMS, subscription
- [x] 0.4 Base layout + Noto Sans Bengali font + teal theme (`layout.tsx`, `globals.css`)
- [x] 0.5 Bangla/Western digit + fiscal-year/license-no/personKey parsers (`src/lib/bangla.ts`)

### Phase 1 — Data layer
- [x] 1.1 Mongoose connection singleton (`src/lib/db.ts`)
- [x] 1.2 `License` model — all fields + archive chain + tenant-scoped indexes (`src/models/License.ts`)
- [x] 1.3 `Tenant`/`User`/`Subscription` models (`src/models/*`); shared enums (`src/lib/types.ts`)
- [x] 1.4 Seed script — admin + demo tenant/inspector + subscription + sample license (`scripts/seed.ts`); run & verified on Atlas
- [x] 1.5 Zod validation (`src/lib/validation.ts`) — license input, list filters, login

### Phase 1.5 — Auth, tenancy & subscription gate (SaaS core)
- [x] 1.5.1 Email/password login (bcrypt) + JWT session cookie + logout (`session.ts`, `api/auth/*`)
- [x] 1.5.2 Roles + edge `proxy.ts` (Next 16 middleware) guarding all pages by role
- [x] 1.5.3 `withTenant()` / `requireUser` / `requireRole` server guards (`src/lib/auth.ts`)
- [x] 1.5.4 Subscription guard → `/billing` paywall when inactive (verified expire→redirect, restore→ok)
- [x] UI: `/login`, `/dashboard` (inspector), `/admin`, `/billing`; `/` redirects by role

**Verified end-to-end (dev server):** unauth→login redirect · valid login · wrong-pass 401 ·
role fencing (inspector⊥/admin, admin⊥/dashboard) · logout · subscription expire/restore gate.

### Phase 2 — Upload & storage
- [x] 2.1 Cloudinary helper — tenant-namespaced uploads under `trade-license/` (`src/lib/cloudinary.ts`)
- [x] 2.2 Upload UI — camera/file picker, image preview + PDF badge, progress (`src/app/upload/*`)
- [x] 2.3 `/api/upload` — auth+tenant scoped, type/size validation, returns Cloudinary URL

**Verified live:** real 832KB sample PDF uploaded → Cloudinary URL under
`trade-license/<tenantId>/licenses/`; wrong type→415; unauth→401 JSON. Also fixed proxy
matcher to exclude `/api` so API routes return JSON status (not HTML redirects).

### Phase 3 — Extraction pipeline
> **Reframe (user, this session):** licenses arrive as **hard-copy paper → phone photo**, not PDF. So the
> **photo path is primary**; extraction is **OCR-first → AI fallback**; PDFs are the rare bonus case.
- [~] 3.1 Python FastAPI scaffold (`/ocr`, `/crop`) — **scaffolded & deferred** (`python-service/`); Node falls back to AI when it's not running
- [~] 3.2 /ocr Tesseract ben+eng + preprocessing — implemented in the scaffold (needs the Tesseract binary + ben/eng data to run)
- [ ] 3.3 /crop owner-photo detect + Cloudinary — stub (returns 501; later sub-phase)
- [x] 3.4 PDF text-layer — folded into the AI path (Claude reads the PDF `document` block directly; no separate parser)
- [x] 3.5 Field mapper (Bengali labels → schema) — `FIELD_LABELS` + `mapOcrTextToDraft` (`lib/extraction/ocr.ts`, `fields.ts`)
- [x] 3.6 AI vision fallback — Claude `claude-opus-4-8` vision/PDF → structured JSON (`lib/extraction/ai.ts`)
- [x] 3.7 /api/extract orchestrator — OCR-first → AI (`lib/extraction/orchestrator.ts`, `api/extract`)
- [x] 3.8 Review & confirm screen — editable pre-filled form → `/api/licenses` save (`upload/ReviewForm.tsx`, `api/licenses`)

**Verified live (dev server, real sample license):** upload PDF → `/api/extract` (AI) returned an accurate
draft (businessName উযাইর ট্রেড ভেঞ্চারস, licenseNo TRAD/CHTG/006515/2024, total 8015, status renewed, Bengali
digits → Western) → edited → `/api/licenses` saved **201** with derived `referenceYear`/`fiscalYear`/`personKey`
and `dd/mm/yyyy`→ISO dates. Guards: duplicate licenseNo→409, unauth extract/save→401. `npm run build` passes.
**Two integration fixes:** extract reads the uploaded **bytes directly** (Cloudinary blocks public PDF delivery →
URL fetch 401s); added `parseBanglaDate` for `dd/mm/yyyy` license dates (Zod `coerce.date` rejects them).

### Phase 4 — List view
- [x] 4.1 GET `/api/licenses` — filters + pagination + sort + text search (`api/licenses`, `lib/licenseQuery.ts`)
- [x] 4.2 List table — 9 columns (serial · licenseNo · নাম · পুরাতন নং · রেফ বছর · অর্থ বছর · ছবি · পেইড/ডিউ · প্রিন্ট) + owner-photo thumbnail + per-row print link
- [x] 4.3 Bangla serials, paid/due badge (with due amount), responsive mobile card view
- [x] 4.4 Row click → `/licenses/[id]` minimal read-only detail (full CRUD/print = Phase 6)

**Verified live (dev server, 6 seeded records across 2 fiscal years + a 2nd tenant):** list renders;
search by name + by licenseNo substring; `paymentStatus` filter (due 4 / paid 2); `fiscalYear` filter;
pagination (limit=2 → 3 pages, distinct rows); `sort=businessName`; detail page 200; bad/invalid id → 404;
unauth → 401; **cross-tenant record → 404 and excluded from list** (isolation). Test data cleaned up.
`npm run build` passes. Note: filter *inputs* (schema already wired in `buildLicenseQuery`) get their UI in Phase 5.

### Phase 5 — Filters
- [x] 5.1 **13 filters** + URL sync + clear-all (`app/licenses/FilterBar.tsx`, `LicenseTable.tsx`)
  1. নাম/প্রতিষ্ঠান/লাইসেন্স search · 2. licenseNo · 3. oldLicenseNo · 4. নতুন/নবায়নকৃত · 5. পেইড/ডিউ ·
  6. অর্থ বছর · 7. রেফারেন্স বছর · 8. ওয়ার্ড · 9. এলাকা/মার্কেট · 10. ইস্যু-তারিখ পরিসর ·
  11. বকেয়া পরিমাণ পরিসর · 12. ছবি আছে/নেই · 13. এক্সট্রাকশন মেথড **+ যাচাইকৃত** (added `extractionMethod`/`verified`
  to `licenseFilterSchema` + `buildLicenseQuery`). Collapsible panel, active-filter count badge, clear-all;
  URL is the single source of truth (server first-paint honors it, client keeps it in sync, any filter → page 1).

**Verified live (5 seeded records spanning method/verified/status/photo/ward/fy/due):** every filter returns the
right subset (ai 2 / ocr 1; verified yes 3 / no 2; hasPhoto yes 2 / no 3; ward, fy, refYear, due-range, status);
**combined filters AND correctly** (ai+due → 2; verified+ward → 1); and a **bookmarked filtered URL server-renders
the filtered set** (no all-records flash). Test data cleaned up. `npm run build` passes.

### Phase 6 — Detail & CRUD
- [x] 6.1 Detail view — all fields + fees + license image + actions (`licenses/[id]/page.tsx`)
- [x] 6.2 Manual create — blank `LicenseForm` → auto-archive-aware POST (`licenses/new`, `LicenseForm.tsx`)
- [x] 6.3 Edit/update — prefilled form → PUT `/api/licenses/[id]` (`licenses/[id]/edit`)
- [x] 6.4 Delete w/ confirm — inline confirm → DELETE, **restores superseded prior-year to active** (chain self-heal)
- [x] 6.5 Print single record — `window.print()` + `@media print` stylesheet + `print:hidden` chrome
- [x] 6.6 **Renewal auto-archive (§1a)** — on create, matching `personKey` with older `fiscalYear` → old record
  `archived+isActive=false+supersededBy`, new record `previousLicenseId`+`paymentStatus=due` (`lib/licenseWrite.ts`)
- [x] 6.7 Detail **archive history chain** — every year's record for the person (active+archived), newest-first, with
  active/archive badges + "show archived" list filter (already wired in Phase 5)

**Verified live (2-year renewal chain, personKey lic:7777):** create 2025-26 → create 2026-27 auto-archives the
prior year (old inactive+archived+supersededBy; new active+previousLicenseId+due) and returns `archivedPreviousId`;
default list excludes archived, `showArchived=1` shows both; **edit (PUT)** persists; **delete (DELETE)** the active
record restores the prior year to active; detail page renders the history chain + edit/delete/print actions;
create/edit pages render (prefilled). Guards: bad-id PUT/DELETE → 404, unauth → 401. Test data cleaned up.
Fixed a client/server-boundary bug: `emptyFormValues`/types were exported from a `"use client"` module and called
by server pages (500) → hoisted to `src/lib/licenseFormValues.ts`. `npm run build` passes.

### Phase 7 — Invoice & bulk SMS
- [ ] 7.1 Invoice generator
- [ ] 7.2 BD SMS gateway adapter
- [ ] 7.3 WhatsApp adapter stub
- [ ] 7.4 Bulk SMS console (due holders + invoice link)
- [ ] 7.5 SMS/delivery log per record

### Phase 8 — PWA polish, auth, deploy
- [ ] 8.1 Offline caching + install prompt + icons
- [ ] 8.2 Basic auth
- [ ] 8.3 Deploy (Vercel + Python service)
- [ ] 8.4 Final QA vs real license + phone photo

---

## Files (implementation index)

> One row per meaningful file added, with a one-line description. Empty until Phase 0 begins.

| File | Phase | Description |
|---|---|---|
| `PROJECT_PLAN.md` | Planning | Full build plan: SaaS model, data model (License + Tenant/User/Subscription), renewal-archive, architecture, phases |
| `PROJECT_STATUS.md` | Planning | This tracker |
| `উযাইর ট্রেড ভেঞ্চারস.pdf` | — | Sample real e-trade-license (reference for schema + extraction testing) |
| `package.json` | 0 | App name + deps (Next 16, React 19, Tailwind 4) |
| `src/app/layout.tsx` | 0 | Root layout: Noto Sans Bengali font, Bangla metadata, PWA/theme, viewport |
| `src/app/globals.css` | 0 | Tailwind 4 import + brand (teal) theme tokens, Bengali font var |
| `src/app/page.tsx` | 0 | Placeholder home page (Bangla) showing scaffold status |
| `src/app/manifest.ts` | 0 | PWA web manifest (name, theme, icons placeholder) |
| `src/lib/bangla.ts` | 0 | Digit conversion + `parseLicenseNo`/`parseFiscalYear`/`buildPersonKey` helpers |
| `.env.example` | 0 | Committed env template for all integrations (placeholders only — no secrets) |
| `src/lib/db.ts` | 1 | Mongoose connection singleton (cached on globalThis) |
| `src/lib/types.ts` | 1 | Shared enums (roles, statuses, license/payment/source/extraction) |
| `src/models/Tenant.ts` | 1 | Tenant (inspector account) model |
| `src/models/User.ts` | 1 | User model (super_admin / inspector, passwordHash) |
| `src/models/Subscription.ts` | 1 | Subscription model (৳500/mo) + `isSubscriptionActive()` guard helper |
| `src/models/License.ts` | 1 | License model — full fields, archive chain, tenant-scoped + text indexes |
| `src/lib/validation.ts` | 1 | Zod: `licenseInputSchema`, `licenseFilterSchema`, `loginSchema` |
| `scripts/seed.ts` | 1 | Seeds admin + demo tenant/inspector + subscription + sample license |
| `src/lib/session.ts` | 1.5 | JWT sign/verify (jose) + session cookie options |
| `src/lib/auth.ts` | 1.5 | Server guards: `getSession`/`requireUser`/`requireRole`/`withTenant`/subscription |
| `src/proxy.ts` | 1.5 | Edge middleware (Next 16 `proxy`) — auth + role-based route fencing |
| `src/app/api/auth/login/route.ts` | 1.5 | Login: verify creds, set JWT cookie, role redirect |
| `src/app/api/auth/logout/route.ts` | 1.5 | Logout: clears session cookie |
| `src/app/login/{page,LoginForm}.tsx` | 1.5 | Login page (Suspense) + client form |
| `src/app/dashboard/page.tsx` | 1.5 | Inspector dashboard (subscription-gated) with counts |
| `src/app/billing/page.tsx` | 1.5 | Subscription status / paywall page |
| `src/app/admin/page.tsx` | 1.5 | Super-admin panel (platform counts) |
| `src/components/LogoutButton.tsx` | 1.5 | Client logout button |
| `src/app/page.tsx` | 1.5 | Root — redirects to /login or role home |
| `src/lib/cloudinary.ts` | 2 | Cloudinary upload/delete helper (tenant-namespaced folders) |
| `src/app/api/upload/route.ts` | 2 | Upload API — auth+tenant, validates type/size, → Cloudinary |
| `src/app/upload/{page,UploadClient}.tsx` | 2 | Upload page (gated) + client: picker/preview → upload → extract → review |
| `src/lib/extraction/fields.ts` | 3 | Canonical extraction-draft Zod schema + `FIELD_LABELS` (Bengali) + `emptyDraft` + result types |
| `src/lib/extraction/ai.ts` | 3 | AI-vision extractor — Claude `claude-opus-4-8` vision (photo) / PDF `document` block → structured JSON; Bengali→Western digit normalize |
| `src/lib/extraction/ocr.ts` | 3 | OCR client hook — POSTs image to Python `/ocr`; field-maps Bengali labels → draft; fails soft when svc absent |
| `src/lib/extraction/orchestrator.ts` | 3 | `extract()` — OCR-first → AI fallback; PDFs go straight to AI/text-layer; `ExtractionError` |
| `src/app/api/extract/route.ts` | 3 | Extract API — auth+tenant, multipart file → orchestrator → draft (reads bytes, not Cloudinary URL) |
| `src/app/api/licenses/route.ts` | 3 | Save API — Zod-validate confirmed record, derive referenceYear/fiscalYear/personKey, ISO-normalize dates, insert (409 on dup) |
| `src/app/upload/ReviewForm.tsx` | 3 | Editable review/confirm screen — grouped Bengali fields + image preview → save; success card |
| `src/lib/bangla.ts` (updated) | 3 | Added `parseBanglaDate` — `dd/mm/yyyy`(+Bengali digits) → ISO for Zod date coercion |
| `python-service/{main,requirements,README}` | 3 | FastAPI OCR/crop scaffold — `/ocr` (Tesseract ben+eng), `/crop` (stub); deferred sub-phase |
| `src/lib/licenseQuery.ts` | 4 | `buildLicenseQuery` (tenant-scoped filter → Mongo) + `parseSort` (whitelisted); shared by list endpoint & (Phase 5) filter bar |
| `src/app/api/licenses/route.ts` (GET added) | 4 | List endpoint — validates `licenseFilterSchema`, builds query, paginates/sorts, returns list rows + paging meta |
| `src/app/licenses/page.tsx` | 4 | Journal list page (gated) — server-renders page 1, hands off to the client table |
| `src/app/licenses/LicenseTable.tsx` | 4 | Client table — 9 columns, thumbnail, print link, paid/due badge, debounced search, pagination, mobile cards, row→detail |
| `src/app/licenses/[id]/page.tsx` | 4 | Read-only license detail (tenant-scoped; 404 on miss/cross-tenant); full CRUD/print in Phase 6 |
| `src/app/licenses/FilterBar.tsx` | 5 | 13-filter bar — quick search + collapsible panel, active-count badge, clear-all; emits a `Filters` object |
| `src/app/licenses/LicenseTable.tsx` (updated) | 5 | Now owns filter state, URL sync (`useSearchParams`/`router.replace`), debounced refetch; renders `FilterBar` |
| `src/app/licenses/page.tsx` (updated) | 5 | Accepts `searchParams`, server-renders honoring URL filters, wraps table in `<Suspense>` |
| `src/lib/validation.ts` / `src/lib/licenseQuery.ts` (updated) | 5 | Added `extractionMethod` + `verified` to `licenseFilterSchema` and the query builder (filter 13) |
| `src/lib/licenseWrite.ts` | 6 | `createLicense` (with renewal auto-archive §1a) + `updateLicense` + `parseLicensePayload` (date-normalize + Zod); shared by POST/PUT |
| `src/lib/licenseFormValues.ts` | 6 | Neutral `LicenseFormValues` type + `emptyFormValues` (importable by both client form & server pages) |
| `src/app/api/licenses/[id]/route.ts` | 6 | GET one / PUT update / DELETE (with chain-repair), tenant-scoped, 404/409 guards |
| `src/app/licenses/LicenseForm.tsx` | 6 | Reusable grouped create/edit form → POST or PUT → detail redirect |
| `src/app/licenses/new/page.tsx` | 6 | Manual-create page (blank form) |
| `src/app/licenses/[id]/edit/page.tsx` | 6 | Edit page — loads record, maps to form values (dates→dd/mm/yyyy) |
| `src/app/licenses/[id]/DetailActions.tsx` | 6 | Client edit/print/delete bar (inline delete-confirm) |
| `src/app/licenses/[id]/page.tsx` (updated) | 6 | Detail: actions bar, archived banner, archive history chain |
| `src/app/globals.css` (updated) | 6 | `@media print` — clean light single-record printout |

---

## Decisions locked (see PROJECT_PLAN §0)
- Next.js + TS + Tailwind PWA · MongoDB Atlas · Cloudinary
- Extraction: OCR-first (ben+eng), AI vision fallback, PDF text-layer preferred for PDFs
- Input: both official PDF and phone photo
- Owner photo cropped via Python from the license image
- SMS: BD gateway now (adapter), WhatsApp pluggable later

## Open items (blockers to note when reached)
- BD SMS gateway vendor + credentials (Phase 7.2)
- WhatsApp Business API + license (Phase 7.3)
- ~~AI vision provider key (Phase 3.6)~~ ✅ ANTHROPIC_API_KEY set (Claude `claude-opus-4-8`)
- OCR service: to enable the OCR-first path in prod, run `python-service/` with the Tesseract binary +
  ben/eng traineddata and set `PYTHON_SERVICE_URL`; until then extraction uses the AI path (Phase 3.1–3.3)
- Auth scope: single vs multi-inspector (Phase 8.2)
- Hosting accounts: Vercel + Render/Railway (Phase 8.3)

---

## Session log
- **2026-07-07 (1)** — Read sample license PDF + journal/portal images. Locked decisions
  (MongoDB Atlas, Cloudinary, OCR-first+AI fallback, both PDF/photo, BD SMS + WhatsApp later).
  Wrote PROJECT_PLAN.md and PROJECT_STATUS.md.
- **2026-07-07 (2)** — Added §1a **renewal-archive** (personKey chain, auto-archive prior year,
  new year = due) and **SaaS pivot**: multi-tenant, roles `super_admin`/`inspector`, ৳500/mo
  subscription, tenant isolation. Added §1b models, Phase 1.5 (auth/tenancy) and Phase 7.5
  (super-admin/billing) to the plan.
- **2026-07-07 (3)** — **Phase 0 complete.** Scaffolded Next.js 16 app (TS, Tailwind 4, App
  Router, `src/`) into project root; Bangla font + theme + PWA manifest + env template +
  `src/lib/bangla.ts` helpers. `npm run build` passes.
- **2026-07-07 (4)** — Pushed to GitHub (`kmhabib71/trade-license`, branch `main`).
- **2026-07-07 (5)** — **Phase 1 complete.** Installed mongoose/zod/bcryptjs/tsx. Built db
  singleton, shared enums, Tenant/User/Subscription/License models (tenant-scoped indexes +
  archive chain), Zod schemas, and seed script. Credentials set in gitignored `.env.local`;
  Cloudinary folder = `trade-license` (`CLOUDINARY_FOLDER`). **Seeded & verified on Atlas**
  (2 users, sample license total=8015/due, personKey=lic:6515). `npm run build` passes.
- **2026-07-07 (6)** — **Phase 1.5 complete.** Auth = email/password (chose option A). Installed
  jose + server-only. Built JWT session, server guards, edge `proxy.ts` route fencing, login/logout
  APIs, and login/dashboard/admin/billing pages. Fixed two Next 16 issues (Suspense around
  `useSearchParams`; `middleware`→`proxy` rename). **Verified live** on dev server (all auth +
  subscription-gate cases pass). `npm run build` passes.
- **2026-07-07 (7)** — **Phase 2 complete.** Installed cloudinary SDK. Built tenant-namespaced
  upload helper, `/api/upload` (auth + type/size validation), and the upload UI (camera/file
  picker, preview, progress). **Verified live**: real sample PDF → Cloudinary URL under
  `trade-license/<tenantId>/licenses/`. Fixed proxy matcher to exclude `/api`. `npm run build`
  passes. (Note: on Windows, `next dev` sometimes leaves stray servers on 3000/3001 — kill by
  PID via `taskkill //F //PID`; curl needs Windows-style file paths, not `/tmp`.)
  Next: **Phase 3** extraction (Python OCR/crop + PDF text + AI fallback + review screen).
- **2026-07-07 (8)** — **Phase 3 complete.** User reframed the workflow: licenses are **hard-copy paper →
  phone photo** (PDFs rare), so the **photo/OCR-first→AI** path is primary. Installed `@anthropic-ai/sdk`;
  added `ANTHROPIC_API_KEY`. Built the extraction lib (`fields`/`ai`/`ocr`/`orchestrator`), `/api/extract`
  (OCR-first→AI), `/api/licenses` save, and the editable `ReviewForm`; wired upload→extract→review→save.
  Python OCR/crop service **scaffolded but deferred** (Node falls back to AI when it's down). **Verified live**
  end-to-end against the real sample license (accurate AI extraction, 201 save with derived fields, 409 dup,
  401 unauth). Fixed two integration issues: extract now reads uploaded **bytes** (Cloudinary 401s on public
  PDF delivery), and added `parseBanglaDate` for `dd/mm/yyyy` license dates. `npm run build` passes.
  Next: **Phase 4** list view (9 columns + thumbnails + print).
- **2026-07-07 (9)** — **Phase 4 complete.** Built the tenant-scoped list: `GET /api/licenses`
  (filters+pagination+sort+search via `lib/licenseQuery.ts`), the `/licenses` journal page + client table
  (9 columns, owner-photo thumbnail, paid/due badge, Bangla serials, debounced search, pagination, mobile
  cards), and a read-only `/licenses/[id]` detail (row→detail). Linked from the dashboard. **Verified live**
  with 6 seeded records + a 2nd tenant: search/filter/paginate/sort all correct, detail 200, bad id 404,
  **cross-tenant record 404 + excluded from list** (isolation). Fixed a Mongoose-9 `FilterQuery` type-export
  issue (used a local query type). Test data cleaned up. `npm run build` passes.
  Next: **Phase 5** filters (≥10) — the filter-bar UI over the already-wired query builder.
- **2026-07-07 (10)** — **Phase 5 complete.** Added the 13th filter pair (`extractionMethod` + `verified`) to
  the schema + query builder, then built the `FilterBar` (quick search + collapsible 13-filter panel, active-count
  badge, clear-all) and rewired `LicenseTable` so the **URL is the single source of truth** (server first-paint
  honors URL filters via `searchParams`; client syncs with `router.replace` + debounced refetch; any filter → page 1;
  table wrapped in `<Suspense>` for `useSearchParams`). **Verified live** (5 varied records): each filter returns the
  right subset, combined filters AND correctly, and bookmarked filtered URLs server-render filtered. Cleaned up test
  data. `npm run build` passes. Next: **Phase 6** detail & CRUD (manual create/edit/delete + single-record print +
  renewal auto-archive §1a).
- **2026-07-07 (11)** — **Phase 6 complete.** Built full CRUD + the renewal-archive engine: `lib/licenseWrite.ts`
  (`createLicense` applies §1a auto-archive, `updateLicense`, shared `parseLicensePayload`), `/api/licenses/[id]`
  (GET/PUT/DELETE with chain-repair), a reusable `LicenseForm` (create + edit), the `/licenses/new` and
  `/licenses/[id]/edit` pages, and enhanced the detail page (edit/print/delete actions, archived banner, year-by-year
  archive history chain + print stylesheet). **Verified live** on a 2-year renewal chain: auto-archive on renewal,
  archived-exclusion + showArchived, edit persist, delete restores the prior year, history chain renders, guards
  (404/401). Fixed a client/server-boundary 500 (hoisted `emptyFormValues`/types out of the `"use client"` form into
  `lib/licenseFormValues.ts`; saved to memory). `npm run build` passes. Next: **Phase 7** invoice & bulk SMS
  (BD gateway adapter + WhatsApp stub) — note the **open blocker**: BD SMS vendor + credentials.

## Seeded demo credentials (dev)
- super_admin: `admin@tradelicense.local` / `admin123`
- inspector:   `inspector@tradelicense.local` / `inspector123`
- tenant: চট্টগ্রাম ডেমো ইন্সপেক্টর (`demo-chattogram`)
