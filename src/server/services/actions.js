const Orders = require('../models/orders');
const Customers = require('../models/customers');
const Merchants = require('../models/merchants');
const LineItems = require('../models/lineItems');
const MenuItems = require('../models/menu_items');
const Receipts = require('../models/receipts');

const {Status} = require('../../shared/orders');

const axios = require("axios");
const { ZOMATO_API_KEY, ZOMATO_API_URL } = require("../constants");

async function getNearbyShopsFromZomato(lat, lon) {
  try {
    const resp = await requestNearbyZomato(lat, lon);

    let shops = resp.nearby_restaurants.map(res => res.restaurant);
    const zomatoIds = shops.map(shop => shop.id);
    const validMerchants = await Merchants.getByZomatoIds(zomatoIds);

    const merchantIdMap = new Map(validMerchants.map(i => [i.zomato_id, i.id]));
    shops = shops.filter(shop => merchantIdMap.has(parseInt(shop.id)));
    shops.forEach(shop => shop.merchantId = merchantIdMap.get(parseInt(shop.id)));

    return shops;
  } catch (err) {
    console.log("getNearbyShops failed:", err);
    return null;
  }
}

async function zomatoAPICall(endpoint, params) {
  try {
    const response = await axios.get(`${ZOMATO_API_URL}/${endpoint}`, {
      headers: {
        "user-key": ZOMATO_API_KEY,
        Accept: "application/json",
      },
      params: params,
    });
    return response.data;
  } catch (error) {
    console.error("Zomato API Error:", error.response.data);
    throw error;
  }
}

async function requestNearbyZomato(lat, lon) {
  const data = await zomatoAPICall("geocode", { lat, lon });
  const nearbyRestaurants = data.nearby_restaurants.map((r) => {
    return {
      id: r.restaurant.id,
      name: r.restaurant.name,
      url: r.restaurant.url,
      location: r.restaurant.location,
      photos: r.restaurant.photos,
    };
  });
  return nearbyRestaurants;
}

async function getMerchantMenu(merchantId) {
  const menu = await MenuItems.getByMerchantId(merchantId);
  if (!menu) {
    throw Error(`No menu with this merchant id #${merchantId} found`);
  }
  return menu;
}

async function getMerchantOrders(merchantId, filter) {
  try {
    let orders = await Orders.list(merchantId, filter);
    return orders;
  } catch(err) {
    console.log("failed to get orders: ", err);
    return null;
  }
}

async function addOrderLineItem({orderUuid, menuItemId, comments = '', quantity}) {
  if (!orderUuid || !menuItemId || !quantity) {
    return null;
  }

  const {order} = await Orders.getByUuid(orderUuid);

  if (!order || !order.id || order.status !== Status.STARTED) {
    throw Error('No order found for UUID provided: ' + orderUuid);
  }

  const results = await LineItems.create({
    orderId: order.id,
    menuItemId,
    quantity,
    comments: comments,
  });

  return results;
}

async function removeLineItem({lineItemId, orderId}) {
  if (!orderId || !lineItemId) {
    return null;
  }

  return await LineItems.remove({lineItemId, orderId});
}

async function updateLineItemQuantity({lineItemId, quantity}) {
  if (!lineItemId || !quantity) {
    return null;
  }

  const results = await LineItems.update(lineItemId, {
    quantity,
  });

  return results;
}

async function verifyOrderLineItemsCompleted(orderUuid) {
  const {order} = await Orders.getByUuid(orderUuid);

  if (!order.id || order.status !== Status.STARTED) {
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
  }
}

async function createReceipt({orderId, paymentMethod}) {
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

async function getReceipt({receiptId}) {
  const receipt = await Receipts.getWithId(receiptId);
  if (!receipt || !receipt.id) {
    throw Error(`No receipt with receipt id #${receiptId} found`);
  }
  return receipt;
}

async function getLineItems({orderId}) {
  const lineItems = await Orders.lineItems(orderId);
  return lineItems;
}

module.exports = {
  getNearbyShopsFromZomato,
  getMerchantOrders,
  getMerchantMenu,
  addOrderLineItem,
  updateLineItemQuantity,
  removeLineItem,
  verifyOrderLineItemsCompleted,
  getReceipt,
  getLineItems,
  createReceipt
};
