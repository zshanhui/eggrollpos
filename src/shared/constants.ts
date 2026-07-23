/** Shared platform constants (tax, limits, feature flags). */

export const SALES_TAX = {
  SINGAPORE: 0.07,
  CALIFORNIA: 0.0906,
  NEW_YORK: 0.083,
  PENNSYLVANIA: 0.0622,
  MALAYSIA: 0.1,
} as const;

/** Default rate used for checkout/receipts until per-merchant tax is wired. */
export const DEFAULT_SALES_TAX_RATE = SALES_TAX.SINGAPORE;

export const LAUNCHED_CITIES = ['Singapore', 'Pittsburgh, PA', 'Austin, TX'] as const;

export const CUSTOMER_SERVICE_EMAIL = 'adrienshen.dev@gmail.com';

export const MAX_SHOPS_RETURN_CUSTOMERS = 5;

export const MAX_ORDERS_MERCHANTS = 10;

export const ONLINE_PAYMENTS_ENABLED = false;

export const PICKUP_INTERVALS = [15, 30, 45, 60] as const;
