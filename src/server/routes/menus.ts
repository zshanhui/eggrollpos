import { Router, type Request, type Response } from 'express';
import Menus from '../models/menus';
import { submitMenuCheckout, CheckoutError } from '../services/checkout';
import type { MenuCheckoutRequest } from '../../shared/checkout';

// ─── currently_open ───

function computeCurrentlyOpen(
  businessHours: Record<string, { open: string | null; close: string | null }> | null
): boolean {
  if (!businessHours) return true;

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const currentTime = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}`;

  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = days[now.getUTCDay()];
  const hours = businessHours[today];

  if (!hours || hours.open === null || hours.close === null) return false;

  if (hours.open <= hours.close) {
    return currentTime >= hours.open && currentTime < hours.close;
  }
  // Overnight window (e.g., 22:00 – 02:00)
  return currentTime >= hours.open || currentTime < hours.close;
}

// ─── body normalization ───

function normalizeBody(body: any) {
  if (!body) return {};
  return {
    name: body.name,
    description: body.description,
    isPublished: body.isPublished ?? body.is_published,
    businessHours: body.businessHours ?? body.business_hours,
    menuItemIds: body.menuItemIds ?? body.menu_item_ids,
  };
}

// ─── Admin router (mounted at /api/merchants/:merchantId/menus) ───

export const adminRouter = Router({ mergeParams: true });

adminRouter.get('/', async (req, res) => {
  const merchantId = parseInt((req.params as any).merchantId, 10);
  if (isNaN(merchantId)) return res.sendStatus(400);
  const menus = await Menus.list(merchantId);
  res.json({ menus });
});

adminRouter.post('/', async (req, res) => {
  const merchantId = parseInt((req.params as any).merchantId, 10);
  if (isNaN(merchantId)) return res.status(400).json({ error: 'Invalid merchant ID' });

  const { name, description, isPublished, businessHours, menuItemIds } = normalizeBody(req.body);
  if (!name || String(name).trim() === '') {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const menu = await Menus.create({
      merchantId,
      name: String(name).trim(),
      description,
      isPublished,
      businessHours,
      menuItemIds: menuItemIds ?? [],
    });
    const items = await Menus.getItemsForMenu(menu.id);
    res.status(201).json({ menu: { ...menu, menuItems: items } });
  } catch (err: any) {
    if (err.message === 'Merchant not found') {
      return res.status(404).json({ error: 'Merchant not found' });
    }
    res.status(500).json({ error: 'Failed to create menu' });
  }
});

adminRouter.get('/:menuId', async (req, res) => {
  const merchantId = parseInt((req.params as any).merchantId, 10);
  const menuId = parseInt((req.params as any).menuId, 10);
  if (isNaN(merchantId) || isNaN(menuId)) return res.status(400).json({ error: 'Invalid IDs' });

  const menu = await Menus.get(menuId);
  if (!menu || menu.merchant_id !== merchantId) {
    return res.status(404).json({ error: 'Menu not found' });
  }

  const items = await Menus.getItemsForMenu(menuId);
  res.json({ menu: { ...menu, menuItems: items } });
});

async function updateHandler(req: any, res: any) {
  const merchantId = parseInt((req.params as any).merchantId, 10);
  const menuId = parseInt((req.params as any).menuId, 10);
  if (isNaN(merchantId) || isNaN(menuId)) return res.status(400).json({ error: 'Invalid IDs' });

  const menu = await Menus.get(menuId);
  if (!menu || menu.merchant_id !== merchantId) {
    return res.status(404).json({ error: 'Menu not found' });
  }

  const { name, description, isPublished, businessHours, menuItemIds } = normalizeBody(req.body);
  const updates: any = {};
  if (name !== undefined) updates.name = String(name).trim();
  if (description !== undefined) updates.description = description;
  if (isPublished !== undefined) updates.isPublished = isPublished;
  if (businessHours !== undefined) updates.businessHours = businessHours;
  if (menuItemIds !== undefined) updates.menuItemIds = menuItemIds;

  const updated = await Menus.update(menuId, updates);
  const items = await Menus.getItemsForMenu(menuId);
  res.json({ menu: { ...updated, menuItems: items } });
}

adminRouter.put('/:menuId', updateHandler);
adminRouter.patch('/:menuId', updateHandler);

adminRouter.delete('/:menuId', async (req, res) => {
  const merchantId = parseInt((req.params as any).merchantId, 10);
  const menuId = parseInt((req.params as any).menuId, 10);
  if (isNaN(merchantId) || isNaN(menuId)) return res.status(400).json({ error: 'Invalid IDs' });

  const menu = await Menus.get(menuId);
  if (!menu || menu.merchant_id !== merchantId) {
    return res.status(404).json({ error: 'Menu not found' });
  }

  await Menus.delete(menuId);
  res.status(204).send();
});

// ─── Public router (mounted at /api/menus) ───

export const publicRouter = Router();


publicRouter.post('/:slug/checkout', async (req, res) => {
  try {
    const result = await submitMenuCheckout(
      req.params.slug,
      req.body as MenuCheckoutRequest
    );
    res.json(result);
  } catch (err) {
    if (err instanceof CheckoutError) {
      return res.status(err.status).json({ error: err.message });
    }
    throw err;
  }
});

publicRouter.get('/:slug', async (req, res) => {
  const result = await Menus.getByMenuSlug(req.params.slug);
  if (!result) {
    return res.status(404).json({ error: 'Menu not found' });
  }

  const items = await Menus.getItemsForMenu(result.id);

  // Group items by category
  const categoriesMap = new Map<number | string, { id: number | null; name: string; items: any[] }>();
  const uncategorized: any[] = [];

  for (const item of items) {
    if (item.category_id) {
      if (!categoriesMap.has(item.category_id)) {
        categoriesMap.set(item.category_id, {
          id: item.category_id,
          name: item.category_name,
          items: [],
        });
      }
      categoriesMap.get(item.category_id)!.items.push(item);
    } else {
      uncategorized.push(item);
    }
  }

  res.json({
    menu: {
      id: result.id,
      name: result.name,
      slug: result.slug,
      description: result.description,
      is_published: result.is_published,
      business_hours: result.business_hours,
      currently_open: computeCurrentlyOpen(result.business_hours),
      merchant: {
        id: result.merchant__id,
        business_name: result.merchant__business_name,
        address_street: result.merchant__address_street,
        address_city: result.merchant__address_city,
        address_state: result.merchant__address_state,
        address_postal_code: result.merchant__address_postal_code,
        type: result.merchant__type,
      },
      categories: Array.from(categoriesMap.values()),
      uncategorized,
    },
  });
});
