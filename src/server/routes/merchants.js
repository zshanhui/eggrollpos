const express = require('express');
const router = express.Router();
const _ = require('lodash');
const Actions = require('../services/actions');
const Orders = require('../models/orders');
const Merchants = require('../models/merchants');
const MenuItems = require('../models/menu_items');
const Modifiers = require('../models/modifiers');
const {getNextStatus, canCancel, Status} = require('../../shared/orders');

router.get('/by-uuid/:uuid', async (req, res) => {
    const merchant = await Merchants.getByUuid(req.params.uuid);
    if (merchant) {
        res.json(merchant);
    } else {
        res.sendStatus(404);
    }
});

router.get('/:merchantId/orders', async (req, res) => {
    const merchantId = req.params.merchantId;
    if (!merchantId || parseInt(merchantId) != merchantId) {
        return res.sendStatus(400);
    }
    const q = req.query;
    const dateParam = q['date'] || q['Date'];
    const filter = {
        startDate: dateParam || q['startdate'] || q['startDate'],
        endDate: dateParam || q['enddate'] || q['endDate'],
        status: q['status'],
        limit: q['limit'],
        offset: q['offset']
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

// ─── Menu Items CRUD ───

router.get('/:merchantId/menu-items', async (req, res) => {
    const merchantId = parseInt(req.params.merchantId, 10);
    if (isNaN(merchantId)) return res.sendStatus(400);
    const items = await MenuItems.getByMerchantId(merchantId);
    const itemsWithModifiers = await Promise.all(
        items.map(async (item) => {
            const modifiers = await Modifiers.getModifiersForMenuItem(item.id);
            return { ...item, modifiers };
        })
    );
    res.json({ menuItems: itemsWithModifiers });
});

// Normalize body: accept both camelCase and snake_case for REST client flexibility
function normalizeMenuItemBody(body) {
    if (!body) return {};
    const modifierIds = body.modifierIds ?? body.modifier_ids;
    return {
        name: body.name,
        description: body.description ?? body.desc,
        priceCents: body.priceCents ?? body.price_cents,
        isActive: body.isActive ?? body.is_active,
        sortOrder: body.sortOrder ?? body.sort_order,
        modifierIds: modifierIds !== undefined ? modifierIds : undefined,
    };
}

router.post('/:merchantId/menu-items', async (req, res) => {
    const merchantId = parseInt(req.params.merchantId, 10);
    if (isNaN(merchantId)) return res.status(400).json({ error: 'Invalid merchant ID' });
    const { name, description, priceCents, isActive, sortOrder, modifierIds } = normalizeMenuItemBody(req.body);
    const price = priceCents ?? req.body?.price_cents;
    if (!name || price === undefined) {
        return res.status(400).json({ error: 'name and priceCents (or price_cents) are required' });
    }
    const item = await MenuItems.create({
        merchantId,
        name,
        description,
        priceCents: price,
        isActive,
        sortOrder,
    });
    if (modifierIds && modifierIds.length > 0) {
        await Modifiers.setModifiersForMenuItem(item.id, modifierIds);
    }
    const modifiers = await Modifiers.getModifiersForMenuItem(item.id);
    res.status(201).json({ menuItem: { ...item, modifiers } });
});

router.get('/:merchantId/menu-items/:menuItemId', async (req, res) => {
    const merchantId = parseInt(req.params.merchantId, 10);
    const menuItemId = parseInt(req.params.menuItemId, 10);
    if (isNaN(merchantId) || isNaN(menuItemId)) return res.status(400).json({ error: 'Invalid merchant or menu item ID' });
    const item = await MenuItems.getById(menuItemId);
    if (!item || item.merchant_id !== merchantId) return res.status(404).json({ error: 'Menu item not found' });
    const modifiers = await Modifiers.getModifiersForMenuItem(menuItemId);
    res.json({ menuItem: { ...item, modifiers } });
});

// PUT and PATCH both support partial updates (REST: PUT = replace, PATCH = partial; we accept both for flexibility)
async function updateMenuItemHandler(req, res) {
    const merchantId = parseInt(req.params.merchantId, 10);
    const menuItemId = parseInt(req.params.menuItemId, 10);
    if (isNaN(merchantId) || isNaN(menuItemId)) return res.status(400).json({ error: 'Invalid merchant or menu item ID' });
    const item = await MenuItems.getById(menuItemId);
    if (!item || item.merchant_id !== merchantId) return res.status(404).json({ error: 'Menu item not found' });
    const { name, description, priceCents, isActive, sortOrder, modifierIds } = normalizeMenuItemBody(req.body);
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (priceCents !== undefined) updates.price_cents = priceCents;
    if (isActive !== undefined) updates.is_active = isActive;
    if (sortOrder !== undefined) updates.sort_order = sortOrder;
    if (Object.keys(updates).length > 0) {
        await MenuItems.update(menuItemId, updates);
    }
    if (modifierIds !== undefined) {
        await Modifiers.setModifiersForMenuItem(menuItemId, modifierIds);
    }
    const updated = await MenuItems.getById(menuItemId);
    const modifiers = await Modifiers.getModifiersForMenuItem(menuItemId);
    res.json({ menuItem: { ...updated, modifiers } });
}

router.put('/:merchantId/menu-items/:menuItemId', updateMenuItemHandler);
router.patch('/:merchantId/menu-items/:menuItemId', updateMenuItemHandler);

router.delete('/:merchantId/menu-items/:menuItemId', async (req, res) => {
    const merchantId = parseInt(req.params.merchantId, 10);
    const menuItemId = parseInt(req.params.menuItemId, 10);
    if (isNaN(merchantId) || isNaN(menuItemId)) return res.status(400).json({ error: 'Invalid merchant or menu item ID' });
    const item = await MenuItems.getById(menuItemId);
    if (!item || item.merchant_id !== merchantId) return res.status(404).json({ error: 'Menu item not found' });
    await MenuItems.delete(menuItemId);
    res.status(204).send();
});

// ─── Modifiers CRUD ───

function normalizeModifierBody(body) {
    if (!body) return {};
    return {
        name: body.name,
        priceAdjustmentCents: body.priceAdjustmentCents ?? body.price_adjustment_cents,
        sortOrder: body.sortOrder ?? body.sort_order,
    };
}

router.get('/:merchantId/modifiers', async (req, res) => {
    const merchantId = parseInt(req.params.merchantId, 10);
    if (isNaN(merchantId)) return res.status(400).json({ error: 'Invalid merchant ID' });
    const modifiers = await Modifiers.listByMerchantId(merchantId);
    res.json({ modifiers });
});

router.post('/:merchantId/modifiers', async (req, res) => {
    const merchantId = parseInt(req.params.merchantId, 10);
    if (isNaN(merchantId)) return res.status(400).json({ error: 'Invalid merchant ID' });
    const { name, priceAdjustmentCents, sortOrder } = normalizeModifierBody(req.body);
    if (!name || String(name).trim() === '') {
        return res.status(400).json({ error: 'name is required' });
    }
    const modifier = await Modifiers.create({
        merchantId,
        name: String(name).trim(),
        priceAdjustmentCents: priceAdjustmentCents ?? 0,
        sortOrder: sortOrder ?? 0,
    });
    res.status(201).json({ modifier });
});

async function updateModifierHandler(req, res) {
    const merchantId = parseInt(req.params.merchantId, 10);
    const modifierId = parseInt(req.params.modifierId, 10);
    if (isNaN(merchantId) || isNaN(modifierId)) return res.status(400).json({ error: 'Invalid merchant or modifier ID' });
    const modifier = await Modifiers.getById(modifierId);
    if (!modifier || modifier.merchant_id !== merchantId) return res.status(404).json({ error: 'Modifier not found' });
    const { name, priceAdjustmentCents, sortOrder } = normalizeModifierBody(req.body);
    const updateParams = {};
    if (name !== undefined) updateParams.name = String(name).trim();
    if (priceAdjustmentCents !== undefined) updateParams.priceAdjustmentCents = priceAdjustmentCents;
    if (sortOrder !== undefined) updateParams.sortOrder = sortOrder;
    const updated = Object.keys(updateParams).length > 0
        ? await Modifiers.update(modifierId, updateParams)
        : modifier;
    res.json({ modifier: updated });
}

router.put('/:merchantId/modifiers/:modifierId', updateModifierHandler);
router.patch('/:merchantId/modifiers/:modifierId', updateModifierHandler);

router.delete('/:merchantId/modifiers/:modifierId', async (req, res) => {
    const merchantId = parseInt(req.params.merchantId, 10);
    const modifierId = parseInt(req.params.modifierId, 10);
    if (isNaN(merchantId) || isNaN(modifierId)) return res.status(400).json({ error: 'Invalid merchant or modifier ID' });
    const modifier = await Modifiers.getById(modifierId);
    if (!modifier || modifier.merchant_id !== merchantId) return res.status(404).json({ error: 'Modifier not found' });
    await Modifiers.delete(modifierId);
    res.status(204).send();
});

module.exports = router;
