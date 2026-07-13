# Routes

## Architecture

```
Browser
  ├── /api/*          → Express API routes (JSON)
  ├── /r/:orderUuid   → Express shortlink (JSON, order UUID)
  └── /*              → React SPA (EJS shell → React Router)
```

API routes are mounted in `src/server/index.js`. All other paths fall through to the React SPA, where React Router handles client-side routing.

---

## API Routes

### WhatsApp webhooks — `/api/webhooks/whatsapp`

Mounted when `WHATSAPP_VERIFY_TOKEN` or `WHATSAPP_ENABLED` is set (see `.env.example`).

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/` | Meta webhook verification (query: `hub.mode`, `hub.verify_token`, `hub.challenge`) |
| `POST` | `/` | Receive WhatsApp events (requires `WHATSAPP_ENABLED`, `WHATSAPP_APP_SECRET`; logs to `whatsapp_message_log`) |

---


### Public menus — `/api/menus`

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/:slug` | Published menu catalog for online ordering |
| `POST` | `/:slug/checkout` | Place order (cart, contact, mock payment, optional WhatsApp opt-in) |

### Contact — `/api/contact`

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/` | Submit contact form (redirects to `/`) |

---

### Merchants — `/api/merchants`

**Merchant lookup**

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/:param` | Lookup by numeric ID or UUID |

**Merchant settings**

| Method | Path | Purpose |
|--------|------|---------|
| `PATCH` `PUT` | `/:merchantId` | Update settings (businessName, taxId, whatsappNumber, addressStreet, theme, kitchenAutoPrint) |

**Orders**

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/:merchantId/orders` | List orders (query: `startdate`, `enddate`, `status`, `limit`, `offset`) |
| `GET` | `/:merchantId/orders/:orderId` | Single order detail |
| `GET` | `/:merchantId/orders/:orderUuid/kitchenticket` | Kitchen ticket JSON for printing |
| `POST` | `/:merchantId/orders` | Advance status / cancel / refund |

**Menu**

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/:merchantId/menu` | Full merchant menu |

**Menu items**

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/:merchantId/menu-items` | List items (includes modifiers) |
| `POST` | `/:merchantId/menu-items` | Create item |
| `GET` | `/:merchantId/menu-items/:menuItemId` | Single item |
| `PUT` `PATCH` | `/:merchantId/menu-items/:menuItemId` | Update item |
| `DELETE` | `/:merchantId/menu-items/:menuItemId` | Delete item |

**Modifiers**

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/:merchantId/modifiers` | List modifiers |
| `POST` | `/:merchantId/modifiers` | Create modifier |
| `PUT` `PATCH` | `/:merchantId/modifiers/:modifierId` | Update modifier |
| `DELETE` | `/:merchantId/modifiers/:modifierId` | Delete modifier |

---

### Orders — `/api/orders`

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/` | Create order (see details below) |
| `GET` | `/:uuid` | Get order by UUID (with menus and line items) |
| `POST` | `/lineitems` | Add line item (`orderUuid`, `menuItemId`, `quantity`, `comments`) |
| `POST` | `/complete` | Mark order complete (`orderUuid`) |

**POST `/` — Create order**

Used by the online ordering frontend after checkout. Creates a customer, order, line items, and attaches modifiers.

```json
{
  "merchantId": "a0000001-0001-0001-0001-000000000001",
  "customerName": "Jane Doe",
  "customerPhone": "+15551234567",
  "orderType": "pickup",
  "items": [
    { "menuItemId": 3, "quantity": 2, "modifierIds": [1, 2] },
    { "menuItemId": 27, "quantity": 1 }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `merchantId` | `string` | yes | Merchant UUID or `hash_id` |
| `customerName` | `string` | yes | |
| `customerPhone` | `string` | no | |
| `orderType` | `"pickup"` \| `"delivery"` | no | Defaults to `"pickup"` |
| `items` | `array` | yes | ≥ 1 entry |
| `items[].menuItemId` | `number` | yes | |
| `items[].quantity` | `number` | yes | 1–10 |
| `items[].modifierIds` | `number[]` | no | Modifier IDs to attach to this line item |

Returns `201 { orderUuid, orderId }`, `400` for validation errors, `422` for business rule violations.

---

### Users — `/api/users`

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/` | Placeholder (returns plain text) |

---

### Receipt shortlink

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/r/:orderUuid` | Get receipt with line items (JSON, keyed by order UUID) |

---

## Client Routes (React Router)

Defined in `src/client/js/App.tsx`. All routes are code-split via `Lazy` wrapper.

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `HomeLanding` | Landing page |
| `/about` | `About` | About page |
| `/receipts/:uuid` | `Receipts` | Order receipt (order UUID) |
| `/md/:hashId` | `MerchantRoutes` | POS dashboard — order grid + detail |
| `/merchant-dashboard/:hashId` | (alias) | Same as `/md/:hashId` |
| `/md/:hashId/menuitems` | `MerchantMenuItems` | Menu items list |
| `/md/:hashId/menuitems/add` | `MerchantMenuItems` | Add menu item |
| `/md/:hashId/menuitems/:menuItemId/edit` | `MerchantMenuItems` | Edit menu item |
| `/md/:hashId/settings` | `MerchantSettings` | Business info + theme |
| `/md/:hashId/kitchenticket/:orderUuid` | `KitchenTicketPrint` | Kitchen ticket print view (`?print=1` opens print dialog) |
| `/md/:hashId/kt/:orderUuid` | `KitchenTicketPrint` | Short alias for kitchen ticket print view |
| `/md/:hashId/online-menus` | `MerchantMenus` | Online menus list |
| `/online-ordering/:slug` | `OnlineMenu` | Customer-facing menu (by menu slug) |
| `/online-ordering/:slug/checkout` | `Checkout` | Online checkout (contact, payment, WhatsApp opt-in) |
| `/orders/:orderUuid/menus` | `Menus` | Customer menu webview (legacy) |

### Seed merchant UUIDs

From `db/seeds/02_merchants.js`:

```
INSTEP Cafe         → /md/mc_n1c0ffee
Eastern Express     → /md/mc_3xpr3ss0
Mazu Stewed Noodles → /md/mc_m4zun00d
```

UUID URLs are not supported. Use `hash_id` from seeds or `pnpm run create-merchant`.

### Merchant dashboard internal navigation

The `MerchantRoutes` component (`src/client/js/pages/MerchantRoutes.tsx`) uses local state to toggle between two views without changing the URL:

- **OrdersListPage** — card grid of active orders. Header links to `/merchant-dashboard/:uuid/menuitems` and `/merchant-dashboard/:uuid/settings`.
- **OrderDetailPage** — full order detail with status advancement, cancel/refund with reason modal.
