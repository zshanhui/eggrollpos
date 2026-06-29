export type OrderEventType = 'order_created' | 'order_updated';

export interface OrderEvent {
  type: OrderEventType;
  orderId: number;
  merchantId: number;
}

export interface OrderStreamPayload {
  type: OrderEventType;
  orderId: number;
}
