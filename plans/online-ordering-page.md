# Plan: Merchant Online Ordering Page

## Summary

Merchants can create **named menus** (collections of menu items), generate a
**public slug** for that menu, and toggle it on/off with optional **business hours**.
Customers visit a unique URL (`/online-ordering/:slug`) to browse the menu catalog
on a mobile-first single page.

---

## 1. Data Model

### 1.1 New table: `menus`

| Column | Type | Notes |
|--------|------|-------|
| `id` | increments (PK) | |
| `merchant_id` | integer (FK → merchants.id) | indexed, CASCADE delete |
| `name` | string, not null | e.g. "Lunch Menu", "Dinner Menu" |
| `slug` | string, unique, not null | auto-generated; see slug logic below |
| `description` | text, nullable | Optional subtitle shown on the page |
| `is_published` | boolean, default false | Toggle: on = page is live |
| `business_hours` | jsonb, nullable | See schema below |
| `created_at` | timestamp, default now() | |
| `updated_at` | timestamp, default now() | |

**Slug generation logic:**
```
menu_slug = slugify(merchant.business_name + "-" + merchant.address_city + "-" + merchant.address_postal_code + "-" + menu.name)
```
- Example: `instep-cafe-new-york-10001-lunch-menu`
- Normalize: lowercase, replace spaces with hyphens, strip special chars
- Uses `address_city` and `address_postal_code` — both explicit fields, NOT parsed from the free-text `address_street`
- On collision, append `-2`, `-3`, etc. (enforced by DB UNIQUE constraint + application retry)
- Menu slug is immutable after creation

### 1.2 New junction table: `menu_menu_items`

Maps which menu items belong to which menu (many-to-many).

| Column | Type | Notes |
|--------|------|-------|
| `menu_id` | integer (FK → menus.id) | CASCADE delete |
| `menu_item_id` | integer (FK → menu_items.id) | CASCADE delete |
| `sort_order` | integer, default 0 | Controls display order within the menu |
| PK | (`menu_id`, `menu_item_id`) | Composite primary key |

### 1.3 Columns on `merchants` (all already added by prerequisite migrations)

| Column | Type | Notes |
|--------|------|-------|
| `address_city` | string, nullable | Set explicitly by the merchant. Used in slug generation. NOT parsed from free-text address. |
| `address_state` | string, nullable | Set explicitly by the merchant. For address consistency. |
| `timezone` | string, default `'UTC'` | IANA timezone identifier (e.g. `"America/New_York"`, `"Asia/Kuala_Lumpur"`). Used to convert business hours for display and `currently_open` calculation. |

### 1.4 Renamed columns on `merchants` (from existing)

| Old name | New name | Reason |
|----------|----------|--------|
| `address` | `address_street` | Consistent `address_` prefix |
| `postal_code` | `address_postal_code` | Consistent `address_` prefix |

### 1.5 `business_hours` JSONB schema

All times are stored in **UTC** in the database. Conversion to/from the merchant's
local timezone happens at the application layer using `date-fns-tz` and the
merchant's `timezone` column.

**Database format (UTC):**
```json
{
  "mon": { "open": "14:00", "close": "22:00" },
  "tue": { "open": "14:00", "close": "22:00" },
  "wed": { "open": null, "close": null },
  "thu": { "open": "14:00", "close": "02:00" },
  "fri": { "open": "14:00", "close": "03:00" },
  "sat": { "open": "15:00", "close": "03:00" },
  "sun": { "open": null, "close": null }
}
```

**What the merchant sees (local time, America/New_York, UTC-5):**
```
Mon: 09:00 - 17:00
Tue: 09:00 - 17:00
Wed: Closed
Thu: 09:00 - 21:00
Fri: 09:00 - 22:00
Sat: 10:00 - 22:00
Sun: Closed
```

**Conversion flow:**
- **Save**: merchant enters local time → client sends local time + `timezone` → server converts to UTC via `date-fns-tz` → stores UTC
- **Display**: read UTC from DB → convert to merchant's `timezone` → show local time in form
- **`currently_open`**: get current UTC time → compare directly against stored UTC hours (no timezone math needed)

- `null` open/close on a day means "closed that day"
- If `business_hours` is `null` entirely, the page is always open (as long as `is_published` is true)
- Overnight hours (e.g., Thu 14:00–02:00 UTC) are handled naturally since UTC timestamps don't cross a conceptual day boundary — the `close` value is simply later than `open`

---

## 2. API Endpoints

All menu management routes are scoped under `/api/merchants/:merchantId`.

### 2.1 Merchant-side CRUD

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/merchants/:merchantId/menus` | List all menus for merchant (with item count) |
| `POST` | `/api/merchants/:merchantId/menus` | Create a new menu. Body: `{ name, description, menuItemIds[], isPublished, businessHours }` |
| `GET` | `/api/merchants/:merchantId/menus/:menuId` | Get single menu with its items (with modifiers) |
| `PUT` | `/api/merchants/:merchantId/menus/:menuId` | Full update of menu + its item associations |
| `PATCH` | `/api/merchants/:merchantId/menus/:menuId` | Partial update (same handler as PUT) |
| `DELETE` | `/api/merchants/:merchantId/menus/:menuId` | Delete menu (cascades junction rows) |

### 2.2 Public customer endpoint

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/menus/:slug` | **Public (no auth).** Returns the published menu with items, modifiers, merchant info. 404 if unpublished or not found. |

**Response shape for `GET /api/menus/:slug`:**

Only returns `menuItems` where `is_active = true`, ordered by `sort_order ASC, name ASC`. Inactive items are hidden from customers but still visible in the merchant admin menu editor.

```json
{
  "menu": {
    "id": 1,
    "name": "Lunch Menu",
    "slug": "instep-cafe-new-york-10001-lunch-menu",
    "description": "Available weekdays 11am-2pm",
    "is_published": true,
    "business_hours": { "mon": { "open": "16:00", "close": "19:00" }, ... },
    "currently_open": true,
    "merchant": {
      "id": 1,
      "business_name": "INSTEP Cafe",
      "address_street": "100 Main St",
      "address_city": "New York",
      "address_state": "NY",
      "address_postal_code": "10001",
      "type": "cafe"
    },
    "menuItems": [
      {
        "id": 1,
        "name": "Drip Coffee",
        "description": "House blend, 16oz",
        "price_cents": 350,
        "image_url": null,
        "modifiers": [
          { "id": 1, "name": "Oat Milk", "price_adjustment_cents": 75 }
        ]
      }
    ]
  }
}
```

`currently_open` is computed server-side: gets current UTC time, compares directly against stored UTC hours for today's weekday. No timezone conversion needed — both are already in UTC. If `business_hours` is null, returns `true` (always open).

---

## 3. Client Routes

### 3.1 Customer-facing (public)

| Path | Component | Description |
|------|-----------|-------------|
| `/online-ordering/:slug` | `OnlineMenu` | Mobile-first menu catalog SPA |
| `/order-online/:slug/checkout` | `CheckoutPlaceholder` | "Your payment method and QR codes here..." |

The existing `/order-online/:merchantId` placeholder route gets replaced by slug-based routing.

### 3.2 Merchant admin (protected by merchant auth)

| Path | Component | Description |
|------|-----------|-------------|
| `/merchant/:uuid/menus` | `MerchantMenus` | List of menus with toggles |
| `/merchant/:uuid/menus/add` | `MerchantMenus` | Create menu form |
| `/merchant/:uuid/menus/:menuId/edit` | `MerchantMenus` | Edit menu form |

---

## 4. UI Design — Customer Page (Mobile-First)

### 4.1 Page structure (top → bottom)

```
┌─────────────────────────────────┐
│  [Merchant Logo / Name]         │  ← Sticky header
│  123 Main St · Open until 9pm   │
│  ★ Cafe                         │
├─────────────────────────────────┤
│  Menu Name                      │
│  Menu description (optional)    │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │ [img]  Drip Coffee        │  │  ← Menu item card
│  │        House blend, 16oz  │  │
│  │        $3.50              │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ [img]  Avocado Toast      │  │
│  │        Sourdough...       │  │
│  │        $11.00             │  │
│  └───────────────────────────┘  │
│  ...                            │
├─────────────────────────────────┤
│  [     Proceed to Checkout    ] │  ← Sticky footer button
└─────────────────────────────────┘
```

### 4.2 Behavior

- **Loading state**: Skeleton cards (pulsing gray placeholders)
- **Empty state**: "This menu has no items yet."
- **Closed state**: If `currently_open` is false, show a banner: "This store is currently closed. Business hours: Mon-Fri 9am-5pm"
- **Unpublished state**: 404-style message: "This menu is not available right now."
- **Checkout click**: Navigates to `/order-online/:slug/checkout` — a blank page showing "Your payment method and QR codes here..."
- **Scroll**: Sticky header (merchant info) + sticky footer (checkout button); items scroll in between
- **Item images**: Show a placeholder image if `image_url` is null
- **Price display**: `price_cents / 100` formatted as currency (`$3.50`, `$11.00`)

### 4.3 Mobile optimization details

- Max page width: 480px, centered on larger screens
- Touch-friendly: item cards full-width, tappable
- Font sizes: 16px body, 18px item name, 14px description, 20px price
- Sticky header/footer use `position: sticky` with safe-area-inset for notched phones
- No horizontal scroll; text truncates with ellipsis for long names/descriptions
- Minimal dependencies: custom BEM-style CSS only (consistent with newer merchant pages); no Bootstrap components used on this page

---

## 5. UI Design — Merchant Menu Management

### 5.1 Menu list page (`/merchant/:uuid/menus`)

```
┌─────────────────────────────────┐
│  Your Menus              [+ New]│
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │ Lunch Menu          [ON]  │  │  ← Toggle switch
│  │ 5 items                   │  │
│  │ Slug: instep-cafe-new..  │  │
│  │ [Edit] [Delete]           │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ Dinner Menu         [OFF] │  │
│  │ 3 items                   │  │
│  │ Slug: instep-cafe-new..  │  │
│  │ [Edit] [Delete]           │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### 5.2 Create/Edit menu form (`/merchant/:uuid/menus/add` or `/edit`)

```
┌─────────────────────────────────┐
│  Menu Name: [________________]  │
│  Description: [______________]  │
│                                 │
│  Published: [ON ● OFF]          │
│                                 │
│  Timezone: [America/New_York ▼] │
│                                 │
│  Business Hours:                │
│  Mon: [09:00] - [17:00] [×]    │
│  Tue: [09:00] - [17:00] [×]    │
│  Wed: [Closed]                  │
│  ...                            │
│                                 │
│  Menu Items:                    │
│  ☑ Drip Coffee        $3.50   │
│  ☐ Cappuccino         $5.25   │
│  ☑ Avocado Toast     $11.00   │
│  ☑ Breakfast Burrito   $9.50  │
│  ☐ Blueberry Muffin   $4.25   │
│                                 │
│  [Save Menu]                    │
└─────────────────────────────────┘
```

- Menu items are checkboxes pre-populated from the merchant's existing menu items
- Business hours: 7 rows (mon-sun), each with open/close time inputs, or a "Closed" checkbox. Times shown in merchant's local timezone.
- **Timezone selector**: dropdown of IANA identifiers above the business hours grid. Priority options at top: `Asia/Kuala_Lumpur`, `Asia/Singapore`, `America/New_York`, `America/Chicago`, `America/Denver`, `America/Los_Angeles`. Changing timezone re-renders the hours grid (converts stored UTC → new local time).
- Slug is auto-generated and shown as read-only below the name field

---

## 6. Implementation Steps

### Step 1: ✅ Database migration
- ✅ Create `menus` table — `db/migrations/20260511000001_create_menus.js`
- ✅ Create `menu_menu_items` junction table (same migration)
- ✅ `address_city`, `address_state`, `address_*` renames, `image_url`, and `timezone` in prerequisite migrations

### Step 2: ✅ Server-side models
- ✅ `Menus` model (`src/server/models/menus.ts`) — CRUD + `getByMenuSlug` + junction ops
- ✅ Seed data: 2 example menus — `db/seeds/07_menus.js`
- ✅ `00_cleanup.js` — FK-safe table cleanup so seeds are repeatable on PostgreSQL
- ✅ 22 unit tests — `specs/models/menus.spec.ts`

### Step 3: ✅ Server-side routes
- ✅ Merchant admin routes: `/api/merchants/:merchantId/menus` CRUD
- ✅ Public route: `GET /api/menus/:slug`
  - ✅ Filters menu items to `is_active = true` only
  - ✅ Computes `currently_open` from stored UTC hours
- ✅ Mounted in `merchants.js` (admin) and `index.js` (public)

### Step 4: Client-side customer page 🔜
- `OnlineMenu` component at `src/client/js/pages/OnlineMenu.tsx`
- Styled with **Tailwind CSS v4** (via `@tailwindcss/vite` plugin) — no BEM or Bootstrap
- Replace `CustomerRoutes` placeholder with the real component
- Add checkout placeholder page

### Step 5: Client-side merchant management
- `MerchantMenus` component (list + create/edit forms)
- Update `App.tsx` with new routes
- Wire up API calls

### Step 6: Slug generation — Done in Step 2
- ✅ Slug generation in `Menus.create()` — from merchant identity + menu name
- ✅ Collision handling (append `-2`, `-3`, etc.)
- ✅ Slug is immutable after creation

---

## 7. File Manifest

| File | Action | Purpose |
|------|--------|---------|
| `db/migrations/20260303000001_add_image_url_to_menu_items.js` | ✅ Done | Add `image_url` column to `menu_items` |
| `db/migrations/20260401000000_add_city_to_merchants.js` | ✅ Done | Add `address_city` column to `merchants` |
| `db/migrations/20260401000001_add_state_to_merchants.js` | ✅ Done | Add `address_state` column to `merchants` |
| `db/migrations/20260401000002_rename_address_columns.js` | ✅ Done | Rename `address`→`address_street`, `postal_code`→`address_postal_code` |
| `db/migrations/20260401000003_add_timezone_to_merchants.js` | ✅ Done | Add `timezone` column (IANA, default UTC) for business hours conversion |
| `db/migrations/20260511000001_create_menus.js` | ✅ Done | Migration for `menus` table + `menu_menu_items` junction |
| `db/seeds/00_cleanup.js` | ✅ Done | FK-safe table cleanup for repeatable seeds |
| `db/seeds/07_menus.js` | ✅ Done | Seed data (2 menus, 6 junction rows) |
| `src/server/models/menus.ts` | ✅ Done | Menus model (8 methods, TypeScript) |
| `specs/models/menus.spec.ts` | ✅ Done | 22 unit tests |
| `src/server/routes/menus.ts` | ✅ Done | Menu API routes (admin CRUD + public slug) |
| `.mocharc.yml` | ✅ Done | Mocha config for TypeScript via tsx/cjs |
| `src/server/index.js` | ✅ Done | Mount public menu routes |
| `src/server/routes/merchants.js` | ✅ Done | Mount admin menu routes |
| `package.json` | ✅ Done | tsx dev support, test/db scripts |
| `src/client/js/pages/OnlineMenu.tsx` | 🔜 Create | Customer-facing menu catalog |
| `src/client/css/pages/OnlineMenu.css` | 🔜 Create | Mobile-first styles |
| `src/client/js/pages/MerchantMenus.tsx` | Create | Merchant menu management |
| `src/client/js/pages/CheckoutPlaceholder.tsx` | Create | Checkout placeholder page |
| `src/client/js/App.tsx` | Edit | Add new routes, update customer route |
| `src/client/js/api/index.tsx` | Edit | Add API client functions |
| `src/server/services/actions.js` | Edit | Add menu service functions |
