const express = require('express');
const router = express.Router();
const _ = require('lodash');
const Actions = require('../services/actions');

const Orders = require('../models/orders');

/* GET orders */
router.get('/:merchantId/orders', async (req, res) => {
    const merchantId = req.params.merchantId;
    if(!merchantId || parseInt(merchantId) != merchantId) {
        res.sendStatus(400);
    }
    // parse query params
    const filter = {
        startDate: req.query['startdate'],
        endDate: req.query['enddate'],
        status: req.query['status'],
        limit: req.query['limit'],
        offset: req.query['offset']
    };
    const orders = await Actions.getMerchantOrders(merchantId, filter);
    if(orders) {
        res.json(orders);
    } else {
        res.sendStatus(500);
    }
  });

router.post('/:merchantId/orders', async (req, res) => {
    if (!req.body.orderId) {
        return res.json({error: 'no order id provided'});
    }

    /**
     * - update status -> accepted
     * - add accepted_at timestamp
     * - return success or failure to update to Merchant UI

     */

    const params = _.pick(req.body, ['status']);
    if (['accepted', 'declined', 'preparing', 'ready'].indexOf(params.status) === -1) {
        return res.json({error: 'invalid params'});
    }

    console.log('params >> ', params);

    const results = await Orders.update(req.body.orderId, params);

    res.json({
        message: 'Updated',
        orderId: req.body.orderId,
    });
});

router.get('/:merchantId/menu', async (req,res) => {
    const merchantId = req.params.merchantId;
    if(!merchantId || parseInt(merchantId) != merchantId) {
        res.sendStatus(400);
    }

    const menu = await Actions.getMerchantMenu(merchantId);
    console.log(menu)
    res.json({
      menu:menu
    })
});

module.exports = router;
