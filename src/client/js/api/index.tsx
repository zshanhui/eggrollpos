const ORDERS_URL = '/api/merchants/$id/orders';
const ORDER_MENUS_URL = '/api/orders/$uuid';
const LINE_ITEMS_URL = '/api/orders/lineitems';
const ORDER_ADD_COMPLETE_URL = '/api/orders/complete';
const CREATE_ORDER_URL = '/api/orders';

const defaultGetOptions = {
  method: 'GET',
  credentials: 'same-origin',
  retries: 2,
};

const defaultPostOptions = {
  method: 'POST',
  credentials: 'same-origin',
  headers: {'Content-Type': 'application/json'},
};

export function createPostBodyRequest(body) {
  return Object.assign(defaultPostOptions, {body: JSON.stringify(body)});
}

const fetchResource = async (url, options = defaultGetOptions) => {
  try {
    const resp = await fetch(url, {credentials: 'same-origin', ...options});
    if (!resp.ok) {
      throw new Error('Request error:', resp.status);
    }
    return await resp.json();
  } catch (err) {
    if (options && options.retries && options.retries-- > 0) {
      return fetchResource(url, options);
    }
    throw err;
  }
};

export const getOrders = async (merchantId, params) => {
  const response = await fetchResource(ORDERS_URL.replace('$id', String(merchantId)));
  return response;
}

export const updateOrderStatus = async (params, merchantId) => {
  const response = await fetchResource(ORDERS_URL.replace('$id', String(merchantId)), createPostBodyRequest({
    ...params,
  }));
  return response;
}

export const getCustomerOrderMenu = async (orderUuid) => {
  const response = await fetchResource(ORDER_MENUS_URL.replace('$uuid', orderUuid));
  return response;
}

export const createLineItem = async (params) => {
  const response = await fetchResource(LINE_ITEMS_URL, createPostBodyRequest({
    ...params,
  }));
  return response;
}

export const removeLineItem = async (lineItemId) => {
  // @todo: implement remove line item API
}

export const completeAddingLineItems = async (orderUuid, comments = '') => {
  const response = await fetchResource(ORDER_ADD_COMPLETE_URL, createPostBodyRequest({
    orderUuid,
    comments,
  }));
  return response;
}

export const createOrder = async ({ merchantId, customerName, customerPhone, orderType, items }) => {
  const response = await fetchResource(CREATE_ORDER_URL, createPostBodyRequest({
    merchantId,
    customerName,
    customerPhone,
    orderType,
    items,
  }));
  return response;
}
