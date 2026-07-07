# Project Status — ই-ট্রেড লাইসেন্স ট্র্যাকার

> **Purpose:** Live tracker of what's built vs. planned. In every session, read this first to know
> where we left off. Update the phase checkboxes and the "Files" table as work lands.
> Plan of record: [PROJECT_PLAN.md](PROJECT_PLAN.md).

**Last updated:** 2026-07-07
**Current phase:** Phases 0, 1, 1.5, 2 ✅ complete (upload → Cloudinary verified live). Next: Phase 3 (extraction pipeline).
**Overall progress:** SaaS core + upload working — login/JWT, role fencing, tenant scoping, ৳500 paywall, and tenant-namespaced Cloudinary upload all tested end-to-end.

---

## Quick status by phase

| Phase | Title | Status |
|---|---|---|
| Planning | Plan + status docs, decisions locked (now SaaS + archive) | ✅ Done |
| 0 | Scaffold & infra (Next.js, PWA, env, fonts, helpers) | ✅ Done |
| 1 | Data layer (Mongoose: License + Tenant/User/Subscription, seed, Zod) | ✅ Done |
| 1.5 | Auth, tenancy & subscription gate (SaaS core) | ✅ Done |
| 2 | Upload & storage (Cloudinary, upload UI/API) | ✅ Done |
| 3 | Extraction pipeline (Python OCR/crop, PDF text, AI fallback, review screen) | ⬜ Not started |
| 4 | List view (9 columns, thumbnails, print) | ⬜ Not started |
| 5 | Filters (≥10) | ⬜ Not started |
| 6 | Detail & CRUD + print + renewal archive | ⬜ Not started |
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
- [ ] 3.1 Python FastAPI scaffold (/ocr, /crop)
- [ ] 3.2 /ocr Tesseract ben+eng + preprocessing
- [ ] 3.3 /crop owner-photo detect + Cloudinary
- [ ] 3.4 PDF text-layer parser
- [ ] 3.5 Field mapper (Bengali labels → schema)
- [ ] 3.6 AI vision fallback
- [ ] 3.7 /api/extract orchestrator
- [ ] 3.8 Review & confirm screen

### Phase 4 — List view
- [ ] 4.1 /api/licenses list (filters+pagination+sort+search)
- [ ] 4.2 List table (9 columns + thumbnail + print btn)
- [ ] 4.3 Bangla serial, paid/due badge, mobile cards
- [ ] 4.4 Row click → detail

### Phase 5 — Filters
- [ ] 5.1 Implement ≥10 filters + URL sync + clear-all

### Phase 6 — Detail & CRUD
- [ ] 6.1 Detail view (all fields + images)
- [ ] 6.2 Manual create
- [ ] 6.3 Edit/update
- [ ] 6.4 Delete w/ confirm
- [ ] 6.5 Print single record

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
| `src/app/upload/{page,UploadClient}.tsx` | 2 | Upload page (gated) + client picker/preview/progress |

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
- AI vision provider key (Phase 3.6)
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

## Seeded demo credentials (dev)
- super_admin: `admin@tradelicense.local` / `admin123`
- inspector:   `inspector@tradelicense.local` / `inspector123`
- tenant: চট্টগ্রাম ডেমো ইন্সপেক্টর (`demo-chattogram`)
