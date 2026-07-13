export type MerchantTheme = 'light' | 'dark';

export const MerchantThemes = {
  LIGHT: 'light' as const,
  DARK: 'dark' as const,
} as const;

/** Merchant dashboard theme; defaults to light when unset or unknown. */
export function resolveMerchantTheme(
  theme: MerchantTheme | string | null | undefined
): MerchantTheme {
  return theme === MerchantThemes.DARK ? MerchantThemes.DARK : MerchantThemes.LIGHT;
}

/**
 * Shape returned by GET /api/merchants/:param.
 * Matches the DB row in snake_case — the API passes it through directly.
 */
export interface MerchantRow {
  id: number;
  uuid: string | null;
  business_name: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_postal_code: string | null;
  description: string | null;
  type: string | null;
  tax_id: string | null;
  whatsapp_number: string | null;
  theme: MerchantTheme | null;
  timezone: string | null;
  hash_id: string | null;
  zomato_id: number | null;
  kitchen_auto_print: boolean | number | null;
  created_at: string | null;
}

/**
 * Shape accepted by Merchants.create().
 * Used server-side by admin scripts — NOT exposed via API.
 */
export interface MerchantCreateParams {
  uuid: string;
  business_name: string;
  address_street?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_postal_code?: string | null;
  description?: string | null;
  type?: string | null;
  tax_id?: string | null;
  whatsapp_number?: string | null;
  theme?: MerchantTheme;
  hash_id?: string | null;
}

/**
 * Shape accepted by Merchants.update().
 * All fields optional — only provided keys are written to the DB.
 */
export interface MerchantUpdateParams {
  business_name?: string;
  address_street?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_postal_code?: string | null;
  description?: string | null;
  tax_id?: string | null;
  whatsapp_number?: string | null;
  theme?: MerchantTheme | null;
  timezone?: string | null;
  kitchen_auto_print?: boolean;
}

/** True when merchant has kitchen auto-print enabled (handles SQLite 0/1). */
export function isKitchenAutoPrintEnabled(
  merchant: Pick<MerchantRow, 'kitchen_auto_print'> | null | undefined
): boolean {
  const value = merchant?.kitchen_auto_print;
  return value === true || value === 1;
}
