import Orders from '../models/orders';
import Customers from '../models/customers';
import Merchants from '../models/merchants';
import LineItems from '../models/lineItems';
import MenuItems from '../models/menu_items';
import Receipts from '../models/receipts';
import { Status } from '../../shared/orders';
import type { OrderType } from '../../shared/orders';
import { DEFAULT_SALES_TAX_RATE } from '../../shared/constants';
import { publishOrderEvent } from './order_events';

interface CreateOrderItem {
  menuItemId: number;
  quantity: number;
  modifierIds?: number[];
}

interface CreateOrderParams {
  merchantId: string;
  customerName: string;
  customerPhone?: string;
  orderType?: OrderType;
  items: CreateOrderItem[];
}

export async function getMerchantMenu(merchantId: number) {
  const menu = await MenuItems.getByMerchantId(merchantId);
  if (!menu) {
    throw Error(`No menu with this merchant id #${merchantId} found`);
  }
  return menu;
}

export async function getMerchantOrders(merchantId: number, filter: Record<string, any>) {
  try {
    let orders = await Orders.list(merchantId, filter);
    return orders;
  } catch(err) {
    console.log("failed to get orders: ", err);
    return null;
  }
}

export async function addOrderLineItem({ orderUuid, menuItemId, quantity }: { orderUuid: string; menuItemId: number; quantity: number }) {
  if (!orderUuid || !menuItemId || !quantity) {
    return null;
  }

  const {order} = await Orders.getByUuid(orderUuid);

  if (!order || !order.id || order.status !== Status.WAITING_FOR_ACCEPTANCE) {
    throw Error('No order found for UUID provided: ' + orderUuid);
  }

  const results = await LineItems.create({
    orderId: order.id,
    menuItemId,
    quantity,
  });

  return results;
}

export async function removeLineItem({ lineItemId, orderId }: { lineItemId: number; orderId: number }) {
  if (!orderId || !lineItemId) {
    return null;
  }

  return await LineItems.remove({lineItemId, orderId});
}

export async function updateLineItemQuantity({ lineItemId, quantity }: { lineItemId: number; quantity: number }) {
  if (!lineItemId || !quantity) {
    return null;
  }

  const results = await LineItems.update(lineItemId, {
    quantity,
  });

  return results;
}

export async function verifyOrderLineItemsCompleted(orderUuid: string) {
  const {order} = await Orders.getByUuid(orderUuid);

  if (!order.id || order.status !== Status.WAITING_FOR_ACCEPTANCE) {
    throw new Error('Order not found or status is not started');
  }

  const lineItems = await Orders.lineItems(order.id);

  if (!lineItems || lineItems.length === 0) {
    throw new Error('No line items added to this Order yet');
  }

  const customer = await Customers.getWithId(order.customer_id);
  if (!customer) {
    throw new Error('No customer found for this Order');
  }

  return {
    lineItems,
    customer,
    order,
  };
}

export async function createReceipt({ orderId, paymentMethod }: { orderId: number; paymentMethod: string }) {
  const order = await Orders.getWithID(orderId);
  if (!order || !order.id) {
    throw Error(`No order with order id #${orderId} found`);
  }

  const orderCostParams = {
    id: orderId,
    taxRate: DEFAULT_SALES_TAX_RATE,
  };

  const params = await Orders.calculateSubtotal(orderCostParams);

  const receiptId = await Receipts.create({orderId, paymentMethod, params});
  return receiptId;
}

export async function getReceipt({ orderUuid }: { orderUuid: string }) {
  const receipt = await Receipts.getWithOrderUuid(orderUuid);
  if (!receipt || !receipt.id) {
    throw Error(`No receipt for order ${orderUuid}`);
  }
  return receipt;
}

export async function getLineItems({ orderId }: { orderId: number }) {
  const lineItems = await Orders.lineItems(orderId);
  return lineItems;
}

export async function createOrder({ merchantId, customerName, customerPhone, orderType = 'pickup', items }: CreateOrderParams) {
  const merchant = await Merchants.resolveFromParam(merchantId);
  if (!merchant) {
    throw new Error(`Merchant '${merchantId}' not found`);
  }

  if (!items || items.length === 0) {
    throw new Error('At least one item is required');
  }

  const customerId = await Customers.create({
    name: customerName,
    ...(customerPhone ? { mobile_phone: customerPhone } : {}),
  });

  const orderUuid = await Orders.create({ merchantId: merchant.id, customerId, orderType });
  const { order } = await Orders.getByUuid(orderUuid);

  for (const item of items) {
    const lineItemId = await LineItems.create({
      orderId: order.id,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
    });
    if (item.modifierIds && item.modifierIds.length > 0) {
      await LineItems.addModifiers(lineItemId, item.modifierIds);
    }
  }

  publishOrderEvent({
    type: 'order_created',
    orderId: order.id,
    merchantId: merchant.id,
    orderUuid,
  });

  return { orderUuid, orderId: order.id };
}
