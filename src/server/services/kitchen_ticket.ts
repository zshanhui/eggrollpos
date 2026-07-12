import LineItems from '../models/lineItems';
import Orders from '../models/orders';
import type { KitchenTicket, KitchenTicketLine, KitchenTicketModifier } from '../../shared/kitchen_ticket';
import type { OrderStatus, OrderType } from '../../shared/orders';

export class KitchenTicketError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function loadLineItemModifiers(lineItemId: number): Promise<KitchenTicketModifier[]> {
  const rows = await LineItems.getModifiers(lineItemId);
  return rows.map((row: { name: string; price_adjustment_cents?: number; priceAdjustmentCents?: number }) => ({
    name: row.name,
    priceAdjustmentCents: Number(row.price_adjustment_cents ?? row.priceAdjustmentCents ?? 0),
  }));
}

export async function buildKitchenTicket(
  merchantId: number,
  orderId: number
): Promise<KitchenTicket> {
  const detail = await Orders.getDetailWithID(orderId);
  if (!detail) {
    throw new KitchenTicketError(404, 'Order not found');
  }

  if (detail.merchantId !== merchantId) {
    throw new KitchenTicketError(404, 'Order not found');
  }

  const rawLineItems = detail.lineItems || [];
  const lineItems: KitchenTicketLine[] = await Promise.all(
    rawLineItems.map(async (li: {
      id: number;
      quantity: number;
      name: string;
    }) => ({
      lineItemId: li.id,
      quantity: Number(li.quantity) || 1,
      name: li.name,
      modifiers: await loadLineItemModifiers(li.id),
    }))
  );

  return {
    orderId: detail.id,
    orderUuid: detail.uuid,
    displayNumber: Number(detail.displayNumber ?? detail.id),
    orderType: (detail.orderType || 'pickup') as OrderType,
    status: detail.status as OrderStatus,
    createdAt: detail.createdAt,
    customerName: detail.customerName ?? null,
    comments: detail.comments ?? null,
    lineItems,
    merchantName: detail.merchantName || '',
  };
}
