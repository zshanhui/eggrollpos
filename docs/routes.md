# Routes

## Architecture

```
Browser
  ├── /api/*          → Express API routes (JSON)
  ├── /r/:receiptId   → Express shortlink (JSON)
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
| `PATCH` `PUT` | `/:merchantId` | Update settings (businessName, taxId, whatsappNumber, addressStreet, theme) |

**Orders**

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/:merchantId/orders` | List orders (query: `startdate`, `enddate`, `status`, `limit`, `offset`) |
| `GET` | `/:merchantId/orders/:orderId` | Single order detail |
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
| `GET` | `/:uuid` | Get order by UUID (with menus and line items) |
| `POST` | `/lineitems` | Add line item (`orderUuid`, `menuItemId`, `quantity`, `comments`) |
| `POST` | `/complete` | Mark order complete (`orderUuid`) |

---

### Users — `/api/users`

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/` | Placeholder (returns plain text) |

---

### Receipt shortlink

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/r/:receiptId` | Get receipt with line items (JSON) |

---

## Client Routes (React Router)

Defined in `src/client/js/App.tsx`. All routes are code-split via `Lazy` wrapper.

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `HomeLanding` | Landing page |
| `/about` | `About` | About page |
| `/receipts/:id` | `Receipts` | Order receipt |
| `/merchant-dashboard/:uuid` | `MerchantRoutes` | POS dashboard — order grid + detail |
| `/merchant-dashboard/:uuid/menuitems` | `MerchantMenuItems` | Menu items list |
| `/merchant-dashboard/:uuid/menuitems/add` | `MerchantMenuItems` | Add menu item |
| `/merchant-dashboard/:uuid/menuitems/:menuItemId/edit` | `MerchantMenuItems` | Edit menu item |
| `/merchant-dashboard/:uuid/settings` | `MerchantSettings` | Business info + theme |
| `/order-online/:merchantId` | `CustomerRoutes` | Customer-facing ordering |
| `/orders/:orderUuid/menus` | `Menus` | Customer menu webview |

### Seed merchant UUIDs

From `db/seeds/02_merchants.js`:

```
INSTEP Cafe        → /merchant-dashboard/a0000001-0001-0001-0001-000000000001
Eastern Express    → /merchant-dashboard/a0000002-0002-0002-0002-000000000002
Mazu Stewed Noodles → /merchant-dashboard/a0000003-0003-0003-0003-000000000003
```

### Merchant dashboard internal navigation

The `MerchantRoutes` component (`src/client/js/pages/MerchantRoutes.tsx`) uses local state to toggle between two views without changing the URL:

- **OrdersListPage** — card grid of active orders. Header links to `/merchant-dashboard/:uuid/menuitems` and `/merchant-dashboard/:uuid/settings`.
- **OrderDetailPage** — full order detail with status advancement, cancel/refund with reason modal.
