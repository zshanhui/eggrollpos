/**
 * Shape returned by the API / DB (snake_case).
 */
export interface CustomerRow {
  id: number;
  psid: string | null;
  name: string | null;
  mobile_phone: string | null;
  created_at: string | null;
}

/**
 * Shape accepted by Customers.create().
 * Only name is required; created_at is set by the DB default.
 */
export interface CustomerCreateParams {
  name: string;
  psid?: string | null;
  mobile_phone?: string | null;
}
