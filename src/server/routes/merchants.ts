import express, { type Request, type Response } from 'express';
import * as Actions from '../services/actions';
import Orders from '../models/orders';
import Merchants from '../models/merchants';
import MenuItems from '../models/menu_items';
import Modifiers from '../models/modifiers';
import { Status, type OrderStatus } from '../../shared/orders';
import type { MerchantTheme, MerchantUpdateParams } from '../../shared/merchants';
import { adminRouter as menusRouter } from './menus';
import { categoriesRouter } from './menu_categories';
import { subscribeMerchantOrders } from '../services/order_events';

const router = express.Router();

interface MerchantIdParams {
  merchantId: string;
}

interface MerchantLookupParams {
  param: string;
}

interface OrderIdParams extends MerchantIdParams {
  orderId: string;
}

interface MenuItemIdParams extends MerchantIdParams {
  menuItemId: string;
}

interface ModifierIdParams extends MerchantIdParams {
  modifierId: string;
}

interface MerchantSettingsBody {
  businessName?: string;
  taxId?: string;
  whatsappNumber?: string;
  addressStreet?: string;
  theme?: MerchantTheme;
}

interface MenuItemBody {
  name?: string;
  description?: string;
  priceCents?: number;
  isActive?: boolean;
  sortOrder?: number;
  modifierIds?: number[];
}

interface ModifierBody {
  name?: string;
  priceAdjustmentCents?: number;
  sortOrder?: number;
}

interface OrderUpdateBody {
  orderId?: number;
  status?: OrderStatus;
  cancelReason?: string;
}

function isNumericId(value: string | undefined): value is string {
  if (!value) return false;
  return /^[0-9]+$/.test(value);
}

function parsePositiveInt(value: string | undefined): number | null {
  if (!value) return null;
  const id = parseInt(value, 10);
  return isNaN(id) ? null : id;
}

function normalizeMerchantSettingsBody(body: Record<string, unknown> | undefined): MerchantSettingsBody {
  if (!body) return {};
  return {
    businessName: (body.businessName ?? body.business_name) as string | undefined,
    taxId: (body.taxId ?? body.tax_id) as string | undefined,
    whatsappNumber: (body.whatsappNumber ?? body.whatsapp_number) as string | undefined,
    addressStreet: (body.addressStreet ?? body.address_street) as string | undefined,
    theme: body.theme as MerchantTheme | undefined,
  };
}

function normalizeMenuItemBody(body: Record<string, unknown> | undefined): MenuItemBody {
  if (!body) return {};
  const modifierIds = body.modifierIds ?? body.modifier_ids;
  return {
    name: body.name as string | undefined,
    description: (body.description ?? body.desc) as string | undefined,
    priceCents: (body.priceCents ?? body.price_cents) as number | undefined,
    isActive: (body.isActive ?? body.is_active) as boolean | undefined,
    sortOrder: (body.sortOrder ?? body.sort_order) as number | undefined,
    modifierIds: modifierIds !== undefined ? (modifierIds as number[]) : undefined,
  };
}

function normalizeModifierBody(body: Record<string, unknown> | undefined): ModifierBody {
  if (!body) return {};
  return {
    name: body.name as string | undefined,
    priceAdjustmentCents: (body.priceAdjustmentCents ?? body.price_adjustment_cents) as number | undefined,
    sortOrder: (body.sortOrder ?? body.sort_order) as number | undefined,
  };
}

// Lookup by hash_id first, then fall back to UUID for backward compatibility
router.get('/:param', async (req: Request<MerchantLookupParams>, res: Response) => {
  const merchant =
    (await Merchants.getByHashId(req.params.param)) ||
    (await Merchants.getByUuid(req.params.param));
  if (merchant) {
    res.json(merchant);
  } else {
    res.sendStatus(404);
  }
});

async function updateMerchantSettingsHandler(
  req: Request<MerchantIdParams>,
  res: Response
) {
  const merchantId = parsePositiveInt(req.params.merchantId);
  if (merchantId === null) return res.status(400).json({ error: 'Invalid merchant ID' });
  const merchant = await Merchants.get(merchantId);
  if (!merchant) return res.status(404).json({ error: 'Merchant not found' });
  const { businessName, taxId, whatsappNumber, addressStreet, theme } =
    normalizeMerchantSettingsBody(req.body);
  const updates: MerchantUpdateParams = {};
  if (businessName !== undefined) updates.business_name = String(businessName).trim();
  if (taxId !== undefined) updates.tax_id = taxId ? String(taxId).trim() : null;
  if (whatsappNumber !== undefined) {
    updates.whatsapp_number = whatsappNumber ? String(whatsappNumber).trim() : null;
  }
  if (addressStreet !== undefined) {
    updates.address_street = addressStreet ? String(addressStreet).trim() : null;
  }
  if (theme !== undefined) {
    if (theme !== 'light' && theme !== 'dark') {
      return res.status(400).json({ error: 'theme must be "light" or "dark"' });
    }
    updates.theme = theme;
  }
  if (Object.keys(updates).length === 0) {
    return res.json({ merchant });
  }
  await Merchants.update(merchantId, updates);
  const updated = await Merchants.get(merchantId);
  res.json({ merchant: updated });
}

router.patch('/:merchantId', updateMerchantSettingsHandler);
router.put('/:merchantId', updateMerchantSettingsHandler);

router.get('/:merchantId/orders/stream', (req: Request<MerchantIdParams>, res: Response) => {
  const merchantId = parsePositiveInt(req.params.merchantId);
  if (merchantId === null) return res.sendStatus(400);
  subscribeMerchantOrders(merchantId, res);
});

router.get('/:merchantId/orders', async (req: Request<MerchantIdParams>, res: Response) => {
  const { merchantId } = req.params;
  if (!isNumericId(merchantId)) {
    return res.sendStatus(400);
  }
  const q = req.query;
  const dateParam = q['date'] || q['Date'];
  const filter = {
    startDate: dateParam || q['startdate'] || q['startDate'],
    endDate: dateParam || q['enddate'] || q['endDate'],
    status: q['status'],
    limit: q['limit'],
    offset: q['offset'],
  };
  const orders = await Actions.getMerchantOrders(parseInt(merchantId, 10), filter);
  if (orders) {
    res.json(orders);
  } else {
    res.sendStatus(500);
  }
});

router.get('/:merchantId/orders/:orderId', async (req: Request<OrderIdParams>, res: Response) => {
  const { orderId } = req.params;
  if (!isNumericId(orderId)) {
    return res.sendStatus(400);
  }
  const order = await Orders.getDetailWithID(parseInt(orderId, 10));
  if (order) {
    res.json(order);
  } else {
    res.sendStatus(404);
  }
});

router.post('/:merchantId/orders', async (req: Request<MerchantIdParams>, res: Response) => {
  const body = (req.body ?? {}) as OrderUpdateBody;
  if (!body.orderId) {
    return res.json({ error: 'no order id provided' });
  }

  const { orderId, status, cancelReason } = body;

  if (status === Status.CANCELED) {
    if (!cancelReason) {
      return res.status(400).json({ error: 'Cancel reason is required' });
    }
    await Orders.update(orderId, {
      status: Status.CANCELED,
      cancel_reason: cancelReason,
    });
    return res.json({ message: 'Order canceled', orderId });
  }

  if (status === Status.REFUNDED) {
    if (!cancelReason) {
      return res.status(400).json({ error: 'Refund reason is required' });
    }
    await Orders.update(orderId, {
      status: Status.REFUNDED,
      cancel_reason: cancelReason,
    });
    return res.json({ message: 'Order refunded', orderId });
  }

  const validStatuses: OrderStatus[] = [
    Status.ACCEPTED,
    Status.PREPARING,
    Status.READY_FOR_PICKUP,
    Status.READY_FOR_DELIVERY,
    Status.PICKUP_SUCCESS,
    Status.DELIVERY_IN_PROGRESS,
    Status.DELIVERED,
  ];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  await Orders.update(orderId, { status });
  res.json({ message: 'Updated', orderId });
});

router.get('/:merchantId/menu', async (req: Request<MerchantIdParams>, res: Response) => {
  const { merchantId } = req.params;
  if (!isNumericId(merchantId)) {
    return res.sendStatus(400);
  }

  const menu = await Actions.getMerchantMenu(parseInt(merchantId, 10));
  res.json({ menu });
});

// ─── Menu Items CRUD ───

router.get('/:merchantId/menu-items', async (req: Request<MerchantIdParams>, res: Response) => {
  const merchantId = parsePositiveInt(req.params.merchantId);
  if (merchantId === null) return res.sendStatus(400);
  const items = await MenuItems.getByMerchantId(merchantId);
  const itemsWithModifiers = await Promise.all(
    items.map(async (item: { id: number }) => {
      const modifiers = await Modifiers.getModifiersForMenuItem(item.id);
      return { ...item, modifiers };
    })
  );
  res.json({ menuItems: itemsWithModifiers });
});

router.post('/:merchantId/menu-items', async (req: Request<MerchantIdParams>, res: Response) => {
  const merchantId = parsePositiveInt(req.params.merchantId);
  if (merchantId === null) return res.status(400).json({ error: 'Invalid merchant ID' });
  const { name, description, priceCents, isActive, sortOrder, modifierIds } =
    normalizeMenuItemBody(req.body);
  const price = priceCents ?? (req.body as Record<string, unknown>)?.price_cents;
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

router.get('/:merchantId/menu-items/:menuItemId', async (req: Request<MenuItemIdParams>, res: Response) => {
  const merchantId = parsePositiveInt(req.params.merchantId);
  const menuItemId = parsePositiveInt(req.params.menuItemId);
  if (merchantId === null || menuItemId === null) {
    return res.status(400).json({ error: 'Invalid merchant or menu item ID' });
  }
  const item = await MenuItems.getById(menuItemId);
  if (!item || item.merchant_id !== merchantId) {
    return res.status(404).json({ error: 'Menu item not found' });
  }
  const modifiers = await Modifiers.getModifiersForMenuItem(menuItemId);
  res.json({ menuItem: { ...item, modifiers } });
});

async function updateMenuItemHandler(req: Request<MenuItemIdParams>, res: Response) {
  const merchantId = parsePositiveInt(req.params.merchantId);
  const menuItemId = parsePositiveInt(req.params.menuItemId);
  if (merchantId === null || menuItemId === null) {
    return res.status(400).json({ error: 'Invalid merchant or menu item ID' });
  }
  const item = await MenuItems.getById(menuItemId);
  if (!item || item.merchant_id !== merchantId) {
    return res.status(404).json({ error: 'Menu item not found' });
  }
  const { name, description, priceCents, isActive, sortOrder, modifierIds } =
    normalizeMenuItemBody(req.body);
  const updates: Record<string, unknown> = {};
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

router.delete('/:merchantId/menu-items/:menuItemId', async (req: Request<MenuItemIdParams>, res: Response) => {
  const merchantId = parsePositiveInt(req.params.merchantId);
  const menuItemId = parsePositiveInt(req.params.menuItemId);
  if (merchantId === null || menuItemId === null) {
    return res.status(400).json({ error: 'Invalid merchant or menu item ID' });
  }
  const item = await MenuItems.getById(menuItemId);
  if (!item || item.merchant_id !== merchantId) {
    return res.status(404).json({ error: 'Menu item not found' });
  }
  await MenuItems.delete(menuItemId);
  res.status(204).send();
});

// ─── Modifiers CRUD ───

router.get('/:merchantId/modifiers', async (req: Request<MerchantIdParams>, res: Response) => {
  const merchantId = parsePositiveInt(req.params.merchantId);
  if (merchantId === null) return res.status(400).json({ error: 'Invalid merchant ID' });
  const modifiers = await Modifiers.listByMerchantId(merchantId);
  res.json({ modifiers });
});

router.post('/:merchantId/modifiers', async (req: Request<MerchantIdParams>, res: Response) => {
  const merchantId = parsePositiveInt(req.params.merchantId);
  if (merchantId === null) return res.status(400).json({ error: 'Invalid merchant ID' });
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

async function updateModifierHandler(req: Request<ModifierIdParams>, res: Response) {
  const merchantId = parsePositiveInt(req.params.merchantId);
  const modifierId = parsePositiveInt(req.params.modifierId);
  if (merchantId === null || modifierId === null) {
    return res.status(400).json({ error: 'Invalid merchant or modifier ID' });
  }
  const modifier = await Modifiers.getById(modifierId);
  if (!modifier || modifier.merchant_id !== merchantId) {
    return res.status(404).json({ error: 'Modifier not found' });
  }
  const { name, priceAdjustmentCents, sortOrder } = normalizeModifierBody(req.body);
  const updateParams: { name?: string; priceAdjustmentCents?: number; sortOrder?: number } = {};
  if (name !== undefined) updateParams.name = String(name).trim();
  if (priceAdjustmentCents !== undefined) updateParams.priceAdjustmentCents = priceAdjustmentCents;
  if (sortOrder !== undefined) updateParams.sortOrder = sortOrder;
  const updated =
    Object.keys(updateParams).length > 0
      ? await Modifiers.update(modifierId, updateParams)
      : modifier;
  res.json({ modifier: updated });
}

router.put('/:merchantId/modifiers/:modifierId', updateModifierHandler);
router.patch('/:merchantId/modifiers/:modifierId', updateModifierHandler);

router.delete('/:merchantId/modifiers/:modifierId', async (req: Request<ModifierIdParams>, res: Response) => {
  const merchantId = parsePositiveInt(req.params.merchantId);
  const modifierId = parsePositiveInt(req.params.modifierId);
  if (merchantId === null || modifierId === null) {
    return res.status(400).json({ error: 'Invalid merchant or modifier ID' });
  }
  const modifier = await Modifiers.getById(modifierId);
  if (!modifier || modifier.merchant_id !== merchantId) {
    return res.status(404).json({ error: 'Modifier not found' });
  }
  await Modifiers.delete(modifierId);
  res.status(204).send();
});

// Menu management CRUD (under /api/merchants/:merchantId/menus)
router.use('/:merchantId/menus', menusRouter);
router.use('/:merchantId/menu-categories', categoriesRouter);

export default router;
