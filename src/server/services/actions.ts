import Orders from '../models/orders';
import Customers from '../models/customers';
import Merchants from '../models/merchants';
import LineItems from '../models/lineItems';
import MenuItems from '../models/menu_items';
import Receipts from '../models/receipts';
import { Status } from '../../shared/orders';
import type { OrderType } from '../../shared/orders';

interface CreateOrderParams {
  merchantId: number;
  customerName: string;
  customerPhone?: string;
  orderType?: OrderType;
  items: { menuItemId: number; quantity: number }[];
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
    taxRate: 0.07
  };

  const params = await Orders.calculateSubtotal(orderCostParams);

  const receiptId = await Receipts.create({orderId, paymentMethod, params});
  return receiptId;
}

export async function getReceipt({ receiptId }: { receiptId: number }) {
  const receipt = await Receipts.getWithId(receiptId);
  if (!receipt || !receipt.id) {
    throw Error(`No receipt with receipt id #${receiptId} found`);
  }
  return receipt;
}

export async function getLineItems({ orderId }: { orderId: number }) {
  const lineItems = await Orders.lineItems(orderId);
  return lineItems;
}

export async function createOrder({ merchantId, customerName, customerPhone, orderType = 'pickup', items }: CreateOrderParams) {
  const merchant = await Merchants.get(merchantId);
  if (!merchant) {
    throw new Error(`Merchant #${merchantId} not found`);
  }

  if (!items || items.length === 0) {
    throw new Error('At least one item is required');
  }

  const customerIds = await Customers.create({
    name: customerName,
    ...(customerPhone ? { mobile_phone: customerPhone } : {}),
  });
  const customerId = customerIds[0];

  const orderUuid = await Orders.create({ merchantId, customerId, orderType });
  const { order } = await Orders.getByUuid(orderUuid);

  for (const item of items) {
    await LineItems.create({
      orderId: order.id,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
    });
  }

  return { orderUuid, orderId: order.id };
}
