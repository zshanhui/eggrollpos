import type { OrderStatus, OrderType } from './orders';

export interface KitchenTicketModifier {
  name: string;
  priceAdjustmentCents: number;
}

export interface KitchenTicketLine {
  lineItemId: number;
  quantity: number;
  name: string;
  modifiers: KitchenTicketModifier[];
}

export interface KitchenTicket {
  orderId: number;
  orderUuid: string;
  displayNumber: number;
  orderType: OrderType;
  status: OrderStatus;
  createdAt: string;
  customerName: string | null;
  comments: string | null;
  lineItems: KitchenTicketLine[];
  merchantName: string;
}

export interface KitchenTicketResponse {
  kitchenTicket: KitchenTicket;
}

const DIVIDER = '------------------------';

function padCenter(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  const left = Math.floor((width - text.length) / 2);
  return ' '.repeat(left) + text;
}

/** Plain-text kitchen ticket for debugging, copy/paste, or future ESC/POS adapters. */
export function formatKitchenTicketText(ticket: KitchenTicket, width = 24): string {
  const lines: string[] = [];
  const orderLabel = ticket.orderType === 'delivery' ? 'DELIVERY' : 'PICKUP';
  const created = new Date(ticket.createdAt);

  lines.push(padCenter(ticket.merchantName, width));
  lines.push(DIVIDER);
  lines.push(`ORDER #${ticket.displayNumber}`.padEnd(width - orderLabel.length) + orderLabel);
  lines.push(created.toLocaleString());
  lines.push(DIVIDER);

  for (const item of ticket.lineItems) {
    lines.push(`${item.quantity}x  ${item.name}`.slice(0, width));
    for (const mod of item.modifiers) {
      lines.push(`    + ${mod.name}`.slice(0, width));
    }
  }

  if (ticket.comments?.trim()) {
    lines.push(DIVIDER);
    lines.push(`NOTE: ${ticket.comments.trim()}`.slice(0, width));
  }

  if (ticket.customerName?.trim()) {
    lines.push(DIVIDER);
    lines.push(ticket.customerName.trim().slice(0, width));
  }

  lines.push(DIVIDER);
  return lines.join('\n');
}
