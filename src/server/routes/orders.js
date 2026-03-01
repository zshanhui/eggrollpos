const express = require('express');
const router = express.Router();
const _ = require('lodash');
const Actions = require('../services/actions');

const Orders = require('../models/orders');

router.get('/:uuid', async (req, res) => {

  const uuid = req.params.uuid;
  if (!uuid) {
    res.sendStatus(400);
  }

  const orderWithMenus = await Orders.getByUuid(uuid, {
    withMenus: true,
    withLineItems: true,
  });

  if (!orderWithMenus) {
    res.sendStatus(500);
  }

  res.json(orderWithMenus);
});

router.post('/lineitems', async (req, res) => {
  const params = _.pick(req.body, ['orderUuid', 'menuItemId', 'quantity', 'comments']);
  if (!params.orderUuid || !params.menuItemId || Number(params.quantity) < 1 || Number(params.quantity) > 10) {
    console.error('Missing one of required params: orderUuid, lineItemId, quantity');
    res.sendStatus(500);
  }

  const results = await Actions.addOrderLineItem(params);

  res.json(results);
});

router.post('/complete', async (req, res) => {
  const orderUuid = req.body.orderUuid;
  if (!orderUuid) {
    res.sendStatus(500);
  }

  const {lineItems, customer} = await Actions.verifyOrderLineItemsCompleted(orderUuid);
  res.sendStatus(200);
});

module.exports = router;
