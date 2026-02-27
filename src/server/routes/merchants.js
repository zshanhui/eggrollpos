const express = require('express');
const router = express.Router();
const _ = require('lodash');
const Actions = require('../services/actions');
const Orders = require('../models/orders');
const {getNextStatus, canCancel, canRefund, Status} = require('../../shared/orders');

router.get('/:merchantId/orders', async (req, res) => {
    const merchantId = req.params.merchantId;
    if (!merchantId || parseInt(merchantId) != merchantId) {
        return res.sendStatus(400);
    }
    const filter = {
        startDate: req.query['startdate'],
        endDate: req.query['enddate'],
        status: req.query['status'],
        limit: req.query['limit'],
        offset: req.query['offset']
    };
    const orders = await Actions.getMerchantOrders(merchantId, filter);
    if (orders) {
        res.json(orders);
    } else {
        res.sendStatus(500);
    }
});

router.get('/:merchantId/orders/:orderId', async (req, res) => {
    const orderId = req.params.orderId;
    if (!orderId || parseInt(orderId) != orderId) {
        return res.sendStatus(400);
    }
    const order = await Orders.getDetailWithID(parseInt(orderId));
    if (order) {
        res.json(order);
    } else {
        res.sendStatus(404);
    }
});

router.post('/:merchantId/orders', async (req, res) => {
    if (!req.body.orderId) {
        return res.json({error: 'no order id provided'});
    }

    const { orderId, status, cancelReason } = req.body;

    if (status === Status.CANCELED) {
        if (!cancelReason) {
            return res.status(400).json({ error: 'Cancel reason is required' });
        }
        const results = await Orders.update(orderId, {
            status: Status.CANCELED,
            cancel_reason: cancelReason,
        });
        return res.json({ message: 'Order canceled', orderId });
    }

    if (status === Status.REFUNDED) {
        if (!cancelReason) {
            return res.status(400).json({ error: 'Refund reason is required' });
        }
        const results = await Orders.update(orderId, {
            status: Status.REFUNDED,
            cancel_reason: cancelReason,
        });
        return res.json({ message: 'Order refunded', orderId });
    }

    const validStatuses = [
        Status.ACCEPTED,
        Status.PREPARING,
        Status.READY_FOR_PICKUP,
        Status.READY_FOR_DELIVERY,
        Status.PICKUP_SUCCESS,
        Status.DELIVERY_IN_PROGRESS,
        Status.DELIVERED,
    ];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const results = await Orders.update(orderId, { status });
    res.json({ message: 'Updated', orderId });
});

router.get('/:merchantId/menu', async (req, res) => {
    const merchantId = req.params.merchantId;
    if (!merchantId || parseInt(merchantId) != merchantId) {
        return res.sendStatus(400);
    }

    const menu = await Actions.getMerchantMenu(merchantId);
    res.json({ menu });
});

module.exports = router;
