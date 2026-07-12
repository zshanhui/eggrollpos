/** URL prefixes for the merchant admin SPA (canonical: /md). */
export const MERCHANT_DASHBOARD_PREFIXES = ['/md', '/merchant-dashboard'] as const;

export const MERCHANT_HASH_PREFIX = 'mc_';

export function isMerchantHashId(value: string | undefined | null): value is string {
  return typeof value === 'string' && value.startsWith(MERCHANT_HASH_PREFIX);
}

/** Build a merchant dashboard path. Segment is optional, e.g. `menuitems` or `online-menus/add`. */
export function merchantDashboardPath(hashId: string, segment?: string): string {
  const base = `/md/${hashId}`;
  if (!segment) return base;
  return `${base}/${segment.replace(/^\//, '')}`;
}

/** Kitchen ticket print page for an order (append ?print=1 to auto-open print dialog). */
export function merchantKitchenTicketPath(hashId: string, orderId: number, autoPrint = false): string {
  const path = merchantDashboardPath(hashId, `kitchen-ticket/${orderId}`);
  return autoPrint ? `${path}?print=1` : path;
}
