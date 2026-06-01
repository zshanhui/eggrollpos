import express from 'express';
import _ from 'lodash';
import * as Actions from '../services/actions';
import Orders from '../models/orders';

const router = express.Router();

router.get('/:uuid', async (req, res) => {
  const uuid = req.params.uuid;
  if (!uuid) {
    res.sendStatus(400);
    return;
  }

  const orderWithMenus = await Orders.getByUuid(uuid, {
    withMenus: true,
    withLineItems: true,
  });

  if (!orderWithMenus) {
    res.sendStatus(500);
    return;
  }

  res.json(orderWithMenus);
});

router.post('/lineitems', async (req, res) => {
  const params = _.pick(req.body, ['orderUuid', 'menuItemId', 'quantity']);
  if (!params.orderUuid || !params.menuItemId || Number(params.quantity) < 1 || Number(params.quantity) > 10) {
    console.error('Missing one of required params: orderUuid, lineItemId, quantity');
    res.sendStatus(500);
    return;
  }

  const results = await Actions.addOrderLineItem(params as any);

  res.json(results);
});

router.post('/', async (req, res) => {
  const { merchantId, customerName, customerPhone, orderType, items } = req.body;

  if (!merchantId || typeof merchantId !== 'string' || !customerName || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: 'merchantId (uuid or hash_id string), customerName, and a non-empty items array are required',
    });
  }

  for (const item of items) {
    if (!item.menuItemId || !item.quantity || item.quantity < 1 || item.quantity > 10) {
      return res.status(400).json({
        error: 'Each item must have a menuItemId and quantity (1-10)',
      });
    }
  }

  try {
    const result = await Actions.createOrder({
      merchantId,
      customerName,
      customerPhone,
      orderType,
      items,
    });
    res.status(201).json(result);
  } catch (err: any) {
    console.error('Failed to create order:', err.message);
    res.status(422).json({ error: err.message });
  }
});

router.post('/complete', async (req, res) => {
  const orderUuid = req.body.orderUuid;
  const comments = req.body.comments || '';
  if (!orderUuid) {
    res.sendStatus(500);
    return;
  }

  const { lineItems, customer, order } = await Actions.verifyOrderLineItemsCompleted(orderUuid);
  if (comments.trim() && order && order.id) {
    await Orders.update(order.id, { comments: comments.trim() });
  }
  res.sendStatus(200);
});

export default router;
