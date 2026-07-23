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
import { computeCurrentlyOpen } from '../../shared/business_hours';
import { DEFAULT_SALES_TAX_RATE } from '../../shared/constants';
import { publishOrderEvent } from './order_events';

const VALID_PAYMENT: MockPaymentMethod[] = ['mock_pay_at_pickup', 'mock_card'];

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

  if (!computeCurrentlyOpen(menuRow.business_hours, menuRow.merchant__timezone)) {
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

  const customerId = await Customers.create({
    name: customerName,
    mobile_phone: phone,
    email,
  });

  const orderUuid = await Orders.create({
    merchantId,
    customerId,
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
      customerId,
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

  const totals = await Orders.calculateSubtotal({
    id: order.id,
    taxRate: DEFAULT_SALES_TAX_RATE,
  });

  publishOrderEvent({
    type: 'order_created',
    orderId: order.id,
    merchantId,
    orderUuid,
  });

  return {
    orderUuid,
    receiptId,
    displayTotalCents: totals.totalCents,
  };
}
