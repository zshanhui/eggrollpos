import db from './db';

const T = () => db('menu_categories');

class MenuCategories {
  static async list(merchantId: number) {
    return T()
      .select('*')
      .where('merchant_id', merchantId)
      .orWhereNull('merchant_id')
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc');
  }

  static async get(categoryId: number) {
    return T().where('id', categoryId).first();
  }

  static async create(params: {
    merchantId?: number | null;
    name: string;
    sortOrder?: number;
  }) {
    const [id] = await T().insert({
      merchant_id: params.merchantId ?? null,
      name: params.name,
      sort_order: params.sortOrder ?? 0,
    });
    return T().where('id', id).first();
  }

  static async update(categoryId: number, params: {
    name?: string;
    sortOrder?: number;
  }) {
    const updates: Record<string, any> = { updated_at: db.fn.now() };
    if (params.name !== undefined) updates.name = params.name;
    if (params.sortOrder !== undefined) updates.sort_order = params.sortOrder;

    await T().update(updates).where('id', categoryId);
    return T().where('id', categoryId).first();
  }

  static async delete(categoryId: number) {
    return T().where('id', categoryId).del();
  }
}

export default MenuCategories;
