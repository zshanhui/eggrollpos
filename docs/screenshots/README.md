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

| File | Description |
|------|-------------|
| `merchant-orders-list-mobile.png` | Orders grid on mobile (390×844) |
| `merchant-order-detail-mobile.png` | Single order detail view on mobile |
| `merchant-menu-items-list-mobile.png` | Menu items list on mobile |
| `merchant-menu-item-add-mobile.png` | Add menu item form on mobile |
| `merchant-orders-list-desktop.png` | Orders grid on desktop (1280×800) |

## Demo Video

To record a demo video with Playwright:

```bash
VIDEO=1 pnpm run screenshots:merchant
```

Output: `merchant-demo-mobile.webm` (webm format, playable in Chrome/Firefox).

Or use a screen recorder (OBS, QuickTime, etc.) while navigating the app manually.
