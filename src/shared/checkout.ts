export type MockPaymentMethod = 'mock_pay_at_pickup' | 'mock_card';

export interface CheckoutLineItemInput {
  menuItemId: number;
  quantity: number;
}

export interface CheckoutContactInput {
  name?: string;
  phone?: string;
  email?: string;
  whatsappOptIn?: boolean;
}

export interface MenuCheckoutRequest {
  lineItems: CheckoutLineItemInput[];
  contact: CheckoutContactInput;
  comments?: string;
  orderType?: 'pickup' | 'delivery';
  paymentMethod: MockPaymentMethod;
}

export interface MenuCheckoutResponse {
  /** Public receipt URL: `/receipts/{orderUuid}` */
  orderUuid: string;
  receiptId: number;
  displayTotalCents: number;
}
