# High-value refactors (ranked)

Audit date: 2026-07-14. Ranked by value-add × risk reduction × leverage.

## 1. Merchant order authorization + status machine (P0) ✅ DONE

**Value:** Security + correctness. Highest ROI.

**Problem:** `GET/POST /api/merchants/:merchantId/orders*` in `src/server/routes/merchants.js` load/update orders by numeric ID without verifying `merchant_id`. Status updates ignore `getNextStatus` / `canCancel` from `src/shared/orders.ts` (imported but unused; `canRefund` does not even exist).

**Change (landed):**
- Scope all order reads/writes by `merchant_id` (`Orders.getDetailWithID(id, merchantId)`)
- Enforce `getNextStatus` / `canCancel` / `canRefund` / `isValidStatusTransition` server-side
- Converted related JS → TS: `merchants.ts`, `merchantAuth.ts`, `menu_items.ts`, `modifiers.ts`
- Regression tests: `specs/routes/merchant_orders.spec.ts`

**Primary files:** `src/server/routes/merchants.ts`, `src/server/models/orders.ts`, `src/shared/orders.ts`

---

## 2. Timezone-aware business hours + shared tax/config (P0) ✅ DONE

**Value:** Wrong open/closed and tax in production ordering.

**Problem:**
- Duplicate `computeCurrentlyOpen()` in `menus.ts` and `checkout.ts` uses UTC (`getUTCHours`), not merchant local time — `date-fns-tz` is installed but unused
- Hardcoded `0.07` tax in `actions.ts`, `checkout.ts`, and `Checkout.tsx`; `src/server/constants.js` is dead

**Change (landed):**
- Shared `computeCurrentlyOpen(hours, timezone)` in `src/shared/business_hours.ts` (date-fns-tz)
- Shared tax/constants in `src/shared/constants.ts`; deleted dead `src/server/constants.js`
- Seeds store local wall-clock hours + merchant IANA timezones
- Tests: `specs/shared/business_hours.spec.ts`

**Primary files:** `src/shared/business_hours.ts`, `src/shared/constants.ts`, `src/server/routes/menus.ts`, `src/server/services/checkout.ts`, `src/server/services/actions.ts`, `src/client/js/pages/Checkout.tsx`

---

## 3. Finish server TypeScript migration + split `merchants.js` (P1)

**Value:** Type safety, maintainability; largest churn file today.

**Problem:** Server is ~16 `.js` / ~24 `.ts`. `merchants.js` (~495 lines) mixes settings, orders/SSE, menu items, images, modifiers. JS `require()` of TS modules needs fragile `.default` interop. `pnpm run type-check` excludes `src/server/**`.

**Change:**
- Migrate `merchants.js` → TS and split into route modules (settings / orders / menu-items / modifiers)
- Migrate remaining models/middleware (`db.js`, `menu_items.js`, `merchantAuth.js`, …)
- Include server in `tsc --noEmit` (or a `type-check:server` script)

**Primary files:** `src/server/routes/merchants.js`, `tsconfig.json`, `tsconfig.server.json`

---

## 4. Unify Knex + production server build path (P1)

**Value:** Connection hygiene and deploy clarity.

**Problem:**
- Two Knex pools: `db/knex.js` (health) and `src/server/models/db.js` (models)
- Prod runs `tsx` on sources; `build:server` / `dist-server` unused in Dockerfile

**Change:**
- Single shared Knex export consumed by models + health
- Either wire `build:server` into Docker/`start`, or drop the unused compile config and document `tsx` as intentional

**Primary files:** `db/knex.js`, `src/server/models/db.js`, `Dockerfile`, `package.json`

---

## 5. Frontend stack consolidation + page decomposition (P2)

**Value:** Bundle size, UX consistency, testability.

**Problem:**
- Polaris (merchant) + react-bootstrap + Bootstrap 4 CDN + Tailwind v4 + BEM CSS coexist
- `MerchantMenuItems.tsx` (~672) and `MerchantRoutes.tsx` (~660) are monoliths
- Dead client code: `CustomerRoutes.tsx` (no route), unused API helpers, orphan CSS
- React 16 runtime (types now aligned to 16); Polaris peers allow 16–18 — upgrade path still open

**Change:**
- Split KDS and menu-item admin into components/hooks
- Remove dead pages/CSS/API stubs
- Pick one public-site UI approach (Bootstrap CDN *or* Tailwind); keep Polaris for merchant admin until a deliberate React 18 upgrade

**Primary files:** `src/client/js/pages/MerchantRoutes.tsx`, `MerchantMenuItems.tsx`, `App.tsx`, `index.html`

---

## Dependency hygiene (done in this PR)

- Patch/minor bumps within current majors (AWS SDK, Supabase, knex, pg, vite 7.x, etc.)
- Removed unused `history`
- Moved `mocha` / `chai` to `devDependencies` (smaller prod Docker install)
- Aligned `@types/react` / `@types/react-dom` to v16 to match React 16
- Removed unused `lodash` import from `merchants.js`

**Intentionally not bumped (breaking majors):** React 16→18, Vite 7→8, Polaris 10→13, i18next 25→26, TypeScript 5→7, chai 4→6, concurrently 9→10.
