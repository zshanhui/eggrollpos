import Menus from '../models/menus';
import Customers from '../models/customers';
import Orders from '../models/orders';
import LineItems from '../models/lineItems';
import WhatsAppOptIns from '../models/whatsapp_opt_ins';
import * as Actions from './actions';
import {
  hasContactMethod,
  normalizeEmail,
  normalizePhoneE164,
} from '../../shared/contact';
import type { MenuCheckoutRequest, MenuCheckoutResponse, MockPaymentMethod } from '../../shared/checkout';

const VALID_PAYMENT: MockPaymentMethod[] = ['mock_pay_at_pickup', 'mock_card'];

function computeCurrentlyOpen(
  businessHours: Record<string, { open: string | null; close: string | null }> | null
): boolean {
  if (!businessHours) return true;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const currentTime = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}`;
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = days[now.getUTCDay()];
  const hours = businessHours[today];
  if (!hours || hours.open === null || hours.close === null) return false;
  if (hours.open <= hours.close) {
    return currentTime >= hours.open && currentTime < hours.close;
  }
  return currentTime >= hours.open || currentTime < hours.close;
}

export class CheckoutError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function submitMenuCheckout(
  slug: string,
  body: MenuCheckoutRequest
): Promise<MenuCheckoutResponse> {
  const menuRow = await Menus.getByMenuSlug(slug);
  if (!menuRow) {
    throw new CheckoutError(404, 'Menu not found');
  }

  if (!computeCurrentlyOpen(menuRow.business_hours)) {
    throw new CheckoutError(400, 'This menu is currently closed');
  }

  const merchantId = menuRow.merchant__id as number;
  const menuId = menuRow.id as number;

  const lineItemsIn = body.lineItems;
  if (!Array.isArray(lineItemsIn) || lineItemsIn.length === 0) {
    throw new CheckoutError(400, 'Cart is empty');
  }

  const menuItems = await Menus.getItemsForMenu(menuId);
  const allowedIds = new Set(menuItems.map((i: { id: number }) => i.id));

  for (const line of lineItemsIn) {
    const q = Number(line.quantity);
    if (!allowedIds.has(line.menuItemId) || !Number.isInteger(q) || q < 1 || q > 10) {
      throw new CheckoutError(400, 'Invalid cart item');
    }
  }

  const phone = body.contact?.phone ? normalizePhoneE164(body.contact.phone) : null;
  const email = body.contact?.email ? normalizeEmail(body.contact.email) : null;

  if (body.contact?.phone?.trim() && !phone) {
    throw new CheckoutError(400, 'Invalid phone number');
  }
  if (body.contact?.email?.trim() && !email) {
    throw new CheckoutError(400, 'Invalid email address');
  }
  if (!hasContactMethod(phone, email)) {
    throw new CheckoutError(400, 'Provide a phone number or email for order updates');
  }

  const whatsappOptIn = Boolean(body.contact?.whatsappOptIn);
  if (whatsappOptIn && !phone) {
    throw new CheckoutError(400, 'A phone number is required for WhatsApp order updates');
  }

  const paymentMethod = body.paymentMethod;
  if (!VALID_PAYMENT.includes(paymentMethod)) {
    throw new CheckoutError(400, 'Invalid payment method');
  }

  const orderType = body.orderType === 'delivery' ? 'delivery' : 'pickup';
  const customerName =
    (body.contact?.name && body.contact.name.trim()) || 'Guest';

  const customerIds = await Customers.create({
    name: customerName,
    mobile_phone: phone,
    email,
  });
  const firstId = Array.isArray(customerIds) ? customerIds[0] : customerIds;
  const customerIdNum =
    typeof firstId === 'number'
      ? firstId
      : typeof firstId === 'object' && firstId !== null && 'id' in firstId
        ? Number((firstId as { id: number }).id)
        : Number(firstId);
  if (!customerIdNum || Number.isNaN(customerIdNum)) {
    throw new CheckoutError(500, 'Failed to create customer');
  }

  const orderUuid = await Orders.create({
    merchantId,
    customerId: customerIdNum,
    orderType,
  });

  const { order } = await Orders.getByUuid(orderUuid);
  if (!order?.id) {
    throw new CheckoutError(500, 'Failed to create order');
  }

  for (const line of lineItemsIn) {
    await LineItems.create({
      orderId: order.id,
      menuItemId: line.menuItemId,
      quantity: Number(line.quantity),
    });
  }

  const comments = (body.comments || '').trim();
  if (comments) {
    await Orders.update(order.id, { comments });
  }

  if (whatsappOptIn && phone) {
    await WhatsAppOptIns.create({
      customerId: customerIdNum,
      merchantId,
      orderId: order.id,
      phoneE164: phone,
      optInSource: 'web_checkout',
      marketingAllowed: false,
    });
  }

  const receiptId = await Actions.createReceipt({
    orderId: order.id,
    paymentMethod,
  });

  await Orders.update(order.id, {
    paid: true,
    payment_method: paymentMethod,
  });

  const totals = await Orders.calculateSubtotal({ id: order.id, taxRate: 0.07 });

  return {
    orderUuid,
    receiptId: typeof receiptId === 'object' ? Number((receiptId as { id: number }).id) : Number(receiptId),
    displayTotalCents: totals.totalCents,
  };
}
