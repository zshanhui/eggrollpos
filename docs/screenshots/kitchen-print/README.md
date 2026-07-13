# Kitchen print QA screenshots

Captured during kitchen ticket printing feature QA.

| File | Description |
|------|-------------|
| `01-settings-kitchen-printing-desktop.png` | Settings → Kitchen printing toggle (auto-print) |
| `02-settings-kitchen-printing-mobile.png` | Same settings card, mobile viewport |
| `03-kds-orders-board-desktop.png` | KDS board with highlighted new order |
| `04-order-detail-print-button-desktop.png` | Order detail with **Print Kitchen Ticket** action |
| `05-kitchen-ticket-print-page-desktop.png` | Kitchen ticket print page with toolbar |
| `07-kitchen-ticket-print-page-mobile.png` | Kitchen ticket, mobile viewport |
| `08-kitchen-ticket-print-media-desktop.png` | Ticket under `@media print` (80mm layout) |
| `kitchen-ticket-preview.html` | Static HTML preview of seeded ticket data |

## Regenerate (offline, no Supabase)

```bash
pnpm run qa:kitchen-print-visual
```

## Regenerate against staging (requires login + live deploy)

```bash
BASE_URL=https://eggrollpos-staging.up.railway.app pnpm run screenshots:kitchen-print
```

See `docs/printers.md` for the full printing flow.
