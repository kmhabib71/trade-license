# Project Status — ই-ট্রেড লাইসেন্স ট্র্যাকার

> **Purpose:** Live tracker of what's built vs. planned. In every session, read this first to know
> where we left off. Update the phase checkboxes and the "Files" table as work lands.
> Plan of record: [PROJECT_PLAN.md](PROJECT_PLAN.md).

**Last updated:** 2026-07-07
**Current phase:** Phase 0 — ✅ complete. Next: Phase 1 (data layer) + Phase 1.5 (auth/tenancy).
**Overall progress:** Phase 0 done (scaffold builds clean). Plan expanded to SaaS + renewal-archive.

---

## Quick status by phase

| Phase | Title | Status |
|---|---|---|
| Planning | Plan + status docs, decisions locked (now SaaS + archive) | ✅ Done |
| 0 | Scaffold & infra (Next.js, PWA, env, fonts, helpers) | ✅ Done |
| 1 | Data layer (Mongoose: License + Tenant/User/Subscription, seed, Zod) | ⬜ Not started |
| 1.5 | Auth, tenancy & subscription gate (SaaS core) | ⬜ Not started |
| 1 | Data layer (Mongoose, License model, seed, Zod) | ⬜ Not started |
| 2 | Upload & storage (Cloudinary, upload UI/API) | ⬜ Not started |
| 3 | Extraction pipeline (Python OCR/crop, PDF text, AI fallback, review screen) | ⬜ Not started |
| 4 | List view (9 columns, thumbnails, print) | ⬜ Not started |
| 5 | Filters (≥10) | ⬜ Not started |
| 6 | Detail & CRUD + print | ⬜ Not started |
| 7 | Invoice & bulk SMS (BD gateway + WhatsApp stub) | ⬜ Not started |
| 8 | PWA polish, auth, deploy, QA | ⬜ Not started |

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
- [ ] 1.1 Mongoose connection singleton
- [ ] 1.2 License schema/model + indexes
- [ ] 1.3 Seed script (sample license)
- [ ] 1.4 Zod validation schema

### Phase 2 — Upload & storage
- [ ] 2.1 Cloudinary helper
- [ ] 2.2 Upload UI (photo/PDF, preview)
- [ ] 2.3 /api/upload route

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
| `.env.example` | 0 | Committed env template for all integrations |

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
  `src/lib/bangla.ts` helpers. `npm run build` passes. Next: Phase 1 data layer + Phase 1.5 auth.
