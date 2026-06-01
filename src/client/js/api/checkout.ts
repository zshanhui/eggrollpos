import { createPostBodyRequest } from './index';

export type MockPaymentMethod = 'mock_pay_at_pickup' | 'mock_card';

export interface MenuCheckoutPayload {
  lineItems: { menuItemId: number; quantity: number }[];
  contact: {
    name?: string;
    phone?: string;
    email?: string;
    whatsappOptIn?: boolean;
  };
  comments?: string;
  orderType?: 'pickup' | 'delivery';
  paymentMethod: MockPaymentMethod;
}

export interface MenuCheckoutResult {
  orderUuid: string;
  receiptId: number;
  displayTotalCents: number;
}

export async function submitMenuCheckout(
  slug: string,
  payload: MenuCheckoutPayload
): Promise<MenuCheckoutResult> {
  const resp = await fetch(`/api/menus/${encodeURIComponent(slug)}/checkout`, {
    ...createPostBodyRequest(payload),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data.error || `Checkout failed (${resp.status})`);
  }
  return data as MenuCheckoutResult;
}
