# Merchant Admin Screenshots

Screenshots of the merchant POS dashboard and menu management UI.

## Capturing Screenshots

1. Start the dev servers:
   ```bash
   ./dev.sh
   # or: NODE_ENV=development npx tsx ./bin/www & npx vite
   ```

2. Run the capture script:
   ```bash
   pnpm run screenshots:merchant
   ```

## Files

All screenshots are captured with Chinese (zh) as the default language.

| File | Description |
|------|-------------|
| `merchant-orders-list-mobile.jpg` | Orders grid on mobile (390×844) |
| `merchant-order-detail-mobile.jpg` | Single order detail view on mobile |
| `merchant-menu-items-list-mobile.jpg` | Menu items list on mobile |
| `merchant-menu-item-add-mobile.jpg` | Add menu item form on mobile |
| `merchant-menu-item-edit-mobile.jpg` | Edit menu item form on mobile |
| `merchant-modifiers-modal-mobile.jpg` | Modifiers management modal on mobile |
| `merchant-orders-list-desktop.jpg` | Orders grid on desktop (960×600) |
| `merchant-order-detail-desktop.jpg` | Single order detail view on desktop |
| `merchant-menu-items-list-desktop.jpg` | Menu items list on desktop |
| `merchant-menu-item-add-desktop.jpg` | Add menu item form on desktop |
| `merchant-menu-item-edit-desktop.jpg` | Edit menu item form on desktop |
| `merchant-modifiers-modal-desktop.jpg` | Modifiers management modal on desktop |

## Demo Video

To record a demo video with Playwright:

```bash
VIDEO=1 pnpm run screenshots:merchant
```

Output: `merchant-demo-mobile.webm` (webm format, playable in Chrome/Firefox).

Or use a screen recorder (OBS, QuickTime, etc.) while navigating the app manually.
