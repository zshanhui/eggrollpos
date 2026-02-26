const Orders = require('../models/orders');
const Customers = require('../models/customers');
const Merchants = require('../models/merchants');
const LineItems = require('../models/lineItems');
const MenuItems = require('../models/menu_items');
const Receipts = require('../models/receipts');

const GraphAPI = require('../services/graph-apis');
const Dialog = require('../services/dialog');

const {Status} = require('../../shared/orders');

// Helpers
const {getTimeUntilPickup} = require('../../shared/orders');
const axios = require("axios");
const { ZOMATO_API_KEY, ZOMATO_API_URL } = require("../constants");

async function startOrderingChat(psid) {
  const profile = await GraphAPI.getUserProfile(psid);
  let name = '';
  if (profile && profile.first_name) {
    name = `${profile.first_name} ${profile.last_name}`;
  }

  const customer = await Customers.getWithPSID(psid);
  if (!customer || !customer.id) {
    const customerId = await Customers.create({
      psid,
      name,
    });
    return Dialog.introduction(psid, profile);
  }

  await Dialog.introduction(psid, customer);
}

async function initOrderProcess(psid, mhash) {
  if (!psid) {
    return;
  }
  // Get customer if exists, otherwise create
  let customer = await Customers.getWithPSID(psid);
  // console.log('customer >> ', customer);

  const merchant = await Merchants.getByHash(mhash);
  if (!merchant || !merchant.id) {
    throw Error(`Merchant with id ${mhash} not founded!`);
  }

  console.log('merchant >> ', merchant);

  const uuid = await Orders.create({merchantId: merchant.id, customerId: customer.id});
  console.log('order uuid >> ', uuid);

  Dialog.respondWithMerchantMenu(psid, merchant, uuid);
}

async function getNearbyShops(psid, zipCode) {
  // get merchants by zip for now
  const merchants = await Merchants.getByZip(zipCode);
  // console.log('merchants by zip >> ', merchants);
  Dialog.responseWithNearbyLocations(psid, merchants);
}

async function getNearbyShopsFromZomato(lat, lon) {
  try {
    const resp = await requestNearbyZomato(lat, lon);

    let shops = resp.nearby_restaurants.map(res => res.restaurant);
    const zomatoIds = shops.map(shop => shop.id);
    const validMerchants = await Merchants.getByZomatoIds(zomatoIds);

    // mapping of zomatoIds to merchantId
    const merchantIdMap = new Map(validMerchants.map(i => [i.zomato_id, i.id]));
    // filter to display shops that are working with us
    shops = shops.filter(shop => merchantIdMap.has(parseInt(shop.id)));
    // append merchantId as part of result
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
  console.log(menu)
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

async function getCustomersOrders({psid}) {
  // @todo: given psid, get all of customers previous and current orders
}

async function updateOrderPickupTime({psid, time}) {
  // time: Integer = 15, 30, 45, 60

  if (!psid || !time) {
    throw Error('Params missing');
  }

  // Quick validation
  if ([15, 30, 45, 60].indexOf(parseInt(time)) === -1) {
    throw Error('Time format is wrong or missing');
  }

  // Make sure customer with psid exists
  const customer = await Customers.getWithPSID(psid);
  if (!customer || !customer.id) {
    throw Error(`No customer with ${psid} found`);
  }

  // Get the current/latest orderId from customer psid
  const order = await Orders.getWithCustomerId(customer.id);
  console.log('most recent orders >> ', order);

  const params = {
    pickup_in: time,
  };
  const updated = await Orders.update(order.id, params);
  console.log('updated order: ', updated);

  Dialog.askOrVerifyMobile(customer, updated);
}

async function addOrderLineItem({orderUuid, menuItemId, comments = '', quantity}) {
  // @todo: adds order line items
  if (!orderUuid || !menuItemId || !quantity) {
    return null;
  }

  const {order} = await Orders.getByUuid(orderUuid);

  console.log('ORDER >> ', order);

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

  console.log('results >> ', results);
  return results;
}

async function verifyOrderLineItemsCompleted(orderUuid) {
  const {order} = await Orders.getByUuid(orderUuid);

  if (!order.id || order.status !== Status.STARTED) {
    throw new Error('Order not found or status is not started');
  }

  const lineItems = await Orders.lineItems(order.id);

  console.log('HERE >> ', lineItems.length);
  if (!lineItems || lineItems.length === 0) {
    throw new Error('No line items added to this Order yet');
  }

  // Verify customer exists and has psid
  const customer = await Customers.getWithId(order.customer_id);
  if (!customer || !customer.psid) {
    throw new Error('No customer founded for this Order');
  }

  return {
    lineItems,
    customer,
  }
}

async function storePhoneNumber(psid, mobile) {
  const params = {
    mobile_phone: mobile,
  };
  const customer = await Customers.update(psid, params);
  await Dialog.askForPaymentMethod(customer);
}

async function updatePaymentMethod(psid, params) {
  const updatedOrder = await Customers.updateLatestCustomerOrderWithPSID(psid, params);
  if (!updatedOrder) {
    await Dialog.unableToUpdatePaymentMethod(psid);
  }

  const totals = await Orders.calculateTotals(updatedOrder.id);
  // console.log('line totals >> ', totals);

  await Dialog.askForOrderConfirmation(psid, totals);
}

/**
 * Used to send direct messages from Merchant to Customer
 * @param {*} params
 */
async function sendCustomerDirectMessageFromMerchant(params) {
  console.log('@todo');
}

/**
 * Used to send direct messages from Customer to Merchant
 * @param {*} params
 */
async function sendMerchantDirectMessageFromCustomer(params) {
  console.log('@todo');
}

async function createReceipt({orderId, paymentMethod}) {
  // Checks if the order exist
  const order = await Orders.getWithID(orderId);
  if (!order || !order.id) {
    throw Error(`No order with order id #${orderId} found`);
  }

  const orderCostParams = {
    id: orderId,
    taxRate: 0.07
  };

  const params = await Orders.calculateSubtotal(orderCostParams);

  // Creates new receipt
  const receiptId = await Receipts.create({orderId, paymentMethod, params});
  return receiptId;

}

async function getReceipt({receiptId}) {
  const receipt =  await Receipts.getWithId(receiptId);
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
  startOrderingChat,
  initOrderProcess,
  getNearbyShopsFromZomato,
  getNearbyShops,
  getMerchantOrders,
  getMerchantMenu,
  updateOrderPickupTime,
  // Menu actions
  addOrderLineItem,
  updateLineItemQuantity,
  removeLineItem,
  verifyOrderLineItemsCompleted,
  storePhoneNumber,
  updatePaymentMethod,
  // sendCustomerTextMessageFromMerchant,
  getReceipt,
  getLineItems,
  createReceipt
};
