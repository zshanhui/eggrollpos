import { Router } from 'express';
import MenuCategories from '../models/menu_categories';

export const categoriesRouter = Router({ mergeParams: true });

categoriesRouter.get('/', async (req, res) => {
  const merchantId = parseInt((req.params as any).merchantId, 10);
  if (isNaN(merchantId)) return res.sendStatus(400);
  const categories = await MenuCategories.list(merchantId);
  res.json({ categories });
});

categoriesRouter.post('/', async (req, res) => {
  const merchantId = parseInt((req.params as any).merchantId, 10);
  if (isNaN(merchantId)) return res.status(400).json({ error: 'Invalid merchant ID' });

  const name = req.body.name;
  if (!name || String(name).trim() === '') {
    return res.status(400).json({ error: 'name is required' });
  }

  const category = await MenuCategories.create({
    merchantId,
    name: String(name).trim(),
    sortOrder: req.body.sortOrder ?? req.body.sort_order ?? 0,
  });
  res.status(201).json({ category });
});

async function updateHandler(req: any, res: any) {
  const merchantId = parseInt((req.params as any).merchantId, 10);
  const categoryId = parseInt((req.params as any).categoryId, 10);
  if (isNaN(merchantId) || isNaN(categoryId)) return res.status(400).json({ error: 'Invalid IDs' });

  const category = await MenuCategories.get(categoryId);
  if (!category || (category.merchant_id !== null && category.merchant_id !== merchantId)) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const name = req.body.name;
  const sortOrder = req.body.sortOrder ?? req.body.sort_order;
  const updates: any = {};
  if (name !== undefined) updates.name = String(name).trim();
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;

  const updated = await MenuCategories.update(categoryId, updates);
  res.json({ category: updated });
}

categoriesRouter.put('/:categoryId', updateHandler);
categoriesRouter.patch('/:categoryId', updateHandler);

categoriesRouter.delete('/:categoryId', async (req, res) => {
  const merchantId = parseInt((req.params as any).merchantId, 10);
  const categoryId = parseInt((req.params as any).categoryId, 10);
  if (isNaN(merchantId) || isNaN(categoryId)) return res.status(400).json({ error: 'Invalid IDs' });

  const category = await MenuCategories.get(categoryId);
  if (!category || (category.merchant_id !== null && category.merchant_id !== merchantId)) {
    return res.status(404).json({ error: 'Category not found' });
  }

  await MenuCategories.delete(categoryId);
  res.status(204).send();
});
