import db from './db';

const T = () => db('menus');
const JunctionT = () => db('menu_menu_items');

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

class Menus {
  static async list(merchantId: number) {
    return T()
      .select(
        'menus.*',
        db.raw('(SELECT COUNT(*) FROM menu_menu_items WHERE menu_menu_items.menu_id = menus.id) as item_count')
      )
      .where('merchant_id', merchantId)
      .orderBy('created_at', 'asc');
  }

  static async get(menuId: number) {
    return T().where('id', menuId).first();
  }

  static async getByMenuSlug(slug: string) {
    return T()
      .join('merchants', 'menus.merchant_id', 'merchants.id')
      .select(
        'menus.*',
        'merchants.id as merchant__id',
        'merchants.business_name as merchant__business_name',
        'merchants.address_street as merchant__address_street',
        'merchants.address_city as merchant__address_city',
        'merchants.address_state as merchant__address_state',
        'merchants.address_postal_code as merchant__address_postal_code',
        'merchants.type as merchant__type',
        'merchants.description as merchant__description'
      )
      .where('menus.slug', slug)
      .where('menus.is_published', true)
      .first();
  }

  static async create(params: {
    merchantId: number;
    name: string;
    description?: string;
    isPublished?: boolean;
    businessHours?: Record<string, { open: string | null; close: string | null }>;
    menuItemIds?: number[];
  }) {
    const { merchantId, name, description, isPublished, businessHours, menuItemIds } = params;

    // Slug: business_name + city + postal_code + menu name
    const merchant = await db('merchants').where('id', merchantId).first();
    if (!merchant) throw new Error('Merchant not found');

    const baseSlug = slugify(
      [merchant.business_name, merchant.address_city, merchant.address_postal_code, name]
        .filter(Boolean)
        .join('-')
    );
    let slug = baseSlug;
    let suffix = 2;
    while (await T().where('slug', slug).first()) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    const insertedIds = await T().insert({
      merchant_id: merchantId,
      name,
      slug,
      description: description || null,
      is_published: isPublished ?? false,
      business_hours: businessHours || null,
    });
    const id = Array.isArray(insertedIds) ? insertedIds[0] : insertedIds;
    const row = await T().where('id', id).first();

    if (menuItemIds && menuItemIds.length > 0) {
      await Menus.setItemsForMenu(row.id, menuItemIds);
    }

    return row;
  }

  static async update(menuId: number, params: {
    name?: string;
    description?: string;
    isPublished?: boolean;
    businessHours?: Record<string, { open: string | null; close: string | null }>;
    menuItemIds?: number[];
  }) {
    const { name, description, isPublished, businessHours, menuItemIds } = params;
    const updates: Record<string, any> = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (isPublished !== undefined) updates.is_published = isPublished;
    if (businessHours !== undefined) updates.business_hours = businessHours;
    updates.updated_at = db.fn.now();

    await T().update(updates).where('id', menuId);
    const row = await T().where('id', menuId).first();

    if (menuItemIds !== undefined) {
      await Menus.setItemsForMenu(menuId, menuItemIds);
    }

    return row;
  }

  static async delete(menuId: number) {
    return T().where('id', menuId).del();
  }

  // ─── Junction: menu_menu_items ───

  static async getItemsForMenu(menuId: number) {
    const rows = await JunctionT()
      .join('menu_items', 'menu_menu_items.menu_item_id', 'menu_items.id')
      .leftJoin('menu_categories', 'menu_items.category_id', 'menu_categories.id')
      .leftJoin('menu_item_modifiers', 'menu_items.id', 'menu_item_modifiers.menu_item_id')
      .leftJoin('modifiers', 'menu_item_modifiers.modifier_id', 'modifiers.id')
      .select(
        'menu_items.id',
        'menu_items.name',
        'menu_items.description',
        'menu_items.price_cents',
        'menu_items.image_url',
        'menu_items.category_id',
        'menu_categories.name as category_name',
        'menu_categories.sort_order as category_sort_order',
        'menu_menu_items.sort_order',
        'modifiers.id as modifier_id',
        'modifiers.name as modifier_name',
        'modifiers.price_adjustment_cents as modifier_price_adjustment_cents'
      )
      .where('menu_menu_items.menu_id', menuId)
      .where('menu_items.is_active', true)
      .orderByRaw('menu_categories.sort_order ASC NULLS LAST, menu_menu_items.sort_order ASC, menu_items.name ASC');

    // Group modifiers under each item — one query, no N+1
    const itemsMap = new Map<number, any>();
    for (const r of rows) {
      if (!itemsMap.has(r.id)) {
        itemsMap.set(r.id, {
          id: r.id,
          name: r.name,
          description: r.description,
          price_cents: r.price_cents,
          image_url: r.image_url,
          category_id: r.category_id,
          category_name: r.category_name,
          modifiers: [],
        });
      }
      if (r.modifier_id) {
        itemsMap.get(r.id).modifiers.push({
          id: r.modifier_id,
          name: r.modifier_name,
          price_adjustment_cents: r.modifier_price_adjustment_cents,
        });
      }
    }
    return Array.from(itemsMap.values());
  }

  static async setItemsForMenu(menuId: number, itemIds: number[]) {
    await JunctionT().where('menu_id', menuId).del();
    if (itemIds.length > 0) {
      await JunctionT().insert(
        itemIds.map((itemId, index) => ({
          menu_id: menuId,
          menu_item_id: itemId,
          sort_order: index,
        }))
      );
    }
  }
}

export default Menus;
