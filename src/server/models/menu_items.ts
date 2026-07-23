import db from './db';
import { extractReturningRow } from '../db/insert-id';

const T = () => db('menu_items');

export type MenuItemRow = {
  id: number;
  merchant_id: number;
  name: string;
  description: string | null;
  price_cents: number;
  is_active: boolean | number;
  sort_order: number;
  image_url: string | null;
};

type CreateMenuItemParams = {
  merchantId?: number;
  merchant_id?: number;
  name: string;
  description?: string;
  priceCents?: number;
  price_cents?: number;
  isActive?: boolean;
  is_active?: boolean;
  sortOrder?: number;
  sort_order?: number;
};

class MenuItem {
  menuItem: MenuItemRow;

  constructor(menuItem: MenuItemRow) {
    this.menuItem = menuItem;
  }

  static async getByMerchantId(merchantId: number): Promise<MenuItemRow[]> {
    return T()
      .select()
      .where('merchant_id', merchantId)
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc');
  }

  static async getById(id: number): Promise<MenuItemRow | undefined> {
    return T().select().where('id', id).first();
  }

  static async create(params: CreateMenuItemParams): Promise<MenuItemRow | null> {
    const merchantId = params.merchantId ?? params.merchant_id;
    const name = params.name;
    const description = params.description ?? '';
    const priceCents = params.priceCents ?? params.price_cents;
    const isActive = params.isActive ?? params.is_active ?? true;
    const sortOrder = params.sortOrder ?? params.sort_order ?? 0;
    const result = await T()
      .insert({
        merchant_id: merchantId,
        name,
        description,
        price_cents: priceCents,
        is_active: isActive !== false,
        sort_order: sortOrder,
      })
      .returning('*');
    return extractReturningRow<MenuItemRow>(result);
  }

  static async update(
    id: number,
    params: Record<string, unknown>
  ): Promise<MenuItemRow | null> {
    const allowed = ['name', 'description', 'price_cents', 'is_active', 'sort_order', 'image_url'];
    const updates: Record<string, unknown> = {};
    for (const k of allowed) {
      if (params[k] !== undefined) updates[k] = params[k];
    }
    if (Object.keys(updates).length === 0) return null;
    const result = await T().update(updates).where('id', id).returning('*');
    return extractReturningRow<MenuItemRow>(result);
  }

  static async delete(id: number): Promise<number> {
    return T().where('id', id).del();
  }
}

export default MenuItem;
