import { expect } from 'chai';
import path from 'path';
import db from '../../src/server/models/db';
import Menus from '../../src/server/models/menus';

const migrationsDir = path.resolve(__dirname, '../../db/migrations');

// SQLite stores booleans as 0/1 — normalize for cross-DB compatibility
function isPublished(val: any): boolean {
  return val === true || val === 1;
}

async function resetMenus() {
  await db('menu_menu_items').del();
  await db('menus').del();
}

describe('Menus', () => {
  before(async () => {
    await db.raw('PRAGMA foreign_keys = ON');
    await db.migrate.latest({ directory: migrationsDir, tableName: 'knex_migrations' });

    // Reset tables to a clean state (respect FK order: children first)
    await db('menu_menu_items').del();
    await db('menus').del();
    await db('menu_items').del();
    await db('merchants').del();
    await db.raw("DELETE FROM sqlite_sequence WHERE name IN ('menus','menu_items','merchants')");

    // Seed: a merchant with address fields (needed for slug generation)
    await db('merchants').insert({
      id: 1,
      uuid: 'a0000001-0001-0001-0001-000000000001',
      business_name: 'INSTEP Cafe',
      address_street: '100 Main St',
      address_city: 'New York',
      address_state: 'NY',
      address_postal_code: '10001',
      type: 'cafe',
    });
    // Seed: some menu items
    await db('menu_items').insert([
      { id: 1, merchant_id: 1, name: 'Drip Coffee', description: 'House blend', price_cents: 350, is_active: true },
      { id: 2, merchant_id: 1, name: 'Avocado Toast', description: 'Sourdough', price_cents: 1100, is_active: true },
      { id: 3, merchant_id: 1, name: 'Secret Item', description: 'Hidden', price_cents: 500, is_active: false },
    ]);
  });

  // ─── create ───

  describe('create', () => {
    beforeEach(resetMenus);

    it('creates a menu with auto-generated slug', async () => {
      const menu = await Menus.create({ merchantId: 1, name: 'Lunch Menu' });

      expect(menu.name).to.equal('Lunch Menu');
      expect(menu.slug).to.equal('instep-cafe-new-york-10001-lunch-menu');
      expect(isPublished(menu.is_published)).to.equal(false);
    });

    it('returns a row with a valid id that can be retrieved via get()', async () => {
      const menu = await Menus.create({ merchantId: 1, name: 'Verify ID' });

      expect(menu.id).to.be.a('number');
      expect(menu.id).to.be.greaterThan(0);

      // Verify the row actually exists in the DB (not just returned from insert)
      const retrieved = await Menus.get(menu.id);
      expect(retrieved).to.exist;
      expect(retrieved.name).to.equal('Verify ID');
      expect(retrieved.slug).to.equal(menu.slug);
    });

    it('handles slug collision by appending a suffix', async () => {
      await Menus.create({ merchantId: 1, name: 'Lunch Menu' });
      const menu = await Menus.create({ merchantId: 1, name: 'Lunch Menu' });

      expect(menu.slug).to.equal('instep-cafe-new-york-10001-lunch-menu-2');
    });

    it('creates junction entries when menuItemIds are provided', async () => {
      const menu = await Menus.create({
        merchantId: 1,
        name: 'Dinner Menu',
        menuItemIds: [1, 2],
      });

      const items = await Menus.getItemsForMenu(menu.id);
      expect(items).to.have.lengthOf(2);
      expect(items[0].name).to.equal('Drip Coffee');
      expect(items[1].name).to.equal('Avocado Toast');
    });

    it('stores is_published and description when provided', async () => {
      const menu = await Menus.create({
        merchantId: 1,
        name: 'Weekend Brunch',
        description: 'Available weekends only',
        isPublished: true,
      });

      expect(menu.description).to.equal('Available weekends only');
      expect(isPublished(menu.is_published)).to.equal(true);
    });
  });

  // ─── get ───

  describe('get', () => {
    let menuId: number;

    before(async () => {
      await resetMenus();
      const menu = await Menus.create({ merchantId: 1, name: 'Get Test Menu' });
      menuId = menu.id;
    });

    it('returns a single menu by id', async () => {
      const menu = await Menus.get(menuId);
      expect(menu.name).to.equal('Get Test Menu');
    });

    it('returns undefined for non-existent id', async () => {
      const menu = await Menus.get(9999);
      expect(menu).to.be.undefined;
    });
  });

  // ─── getByMenuSlug ───

  describe('getByMenuSlug', () => {
    before(async () => {
      await resetMenus();
      await Menus.create({ merchantId: 1, name: 'Public Menu', isPublished: true });
      await Menus.create({ merchantId: 1, name: 'Hidden Menu', isPublished: false });
    });

    it('returns a published menu with merchant data', async () => {
      const result = await Menus.getByMenuSlug('instep-cafe-new-york-10001-public-menu');

      expect(result).to.exist;
      expect(result.name).to.equal('Public Menu');
      expect(result.merchant__business_name).to.equal('INSTEP Cafe');
      expect(result.merchant__address_city).to.equal('New York');
    });

    it('returns undefined for an unpublished menu', async () => {
      const result = await Menus.getByMenuSlug('instep-cafe-new-york-10001-hidden-menu');
      expect(result).to.be.undefined;
    });

    it('returns undefined for a non-existent slug', async () => {
      const result = await Menus.getByMenuSlug('nonexistent-slug-9999');
      expect(result).to.be.undefined;
    });
  });

  // ─── list ───

  describe('list', () => {
    before(async () => {
      await resetMenus();
      await Menus.create({ merchantId: 1, name: 'List A', menuItemIds: [1] });
      await Menus.create({ merchantId: 1, name: 'List B', menuItemIds: [1, 2] });
    });

    it('returns all menus for a merchant with item counts', async () => {
      const menus = await Menus.list(1);

      expect(menus).to.have.lengthOf(2);
      const a = menus.find((m: any) => m.name === 'List A');
      expect(a.item_count).to.equal(1);
      const b = menus.find((m: any) => m.name === 'List B');
      expect(b.item_count).to.equal(2);
    });

    it('returns empty array for merchant with no menus', async () => {
      const menus = await Menus.list(9999);
      expect(menus).to.be.empty;
    });
  });

  // ─── update ───

  describe('update', () => {
    beforeEach(resetMenus);

    it('updates menu fields', async () => {
      const menu = await Menus.create({ merchantId: 1, name: 'Update Test' });
      await Menus.update(menu.id, { name: 'Updated Name', isPublished: true });

      const updated = await Menus.get(menu.id);
      expect(updated.name).to.equal('Updated Name');
      expect(isPublished(updated.is_published)).to.equal(true);
    });

    it('replaces menu items when menuItemIds is passed', async () => {
      const menu = await Menus.create({ merchantId: 1, name: 'Items Update', menuItemIds: [1] });
      await Menus.update(menu.id, { menuItemIds: [2] });

      const items = await Menus.getItemsForMenu(menu.id);
      expect(items).to.have.lengthOf(1);
      expect(items[0].name).to.equal('Avocado Toast');
    });

    it('does not touch unpassed fields', async () => {
      const menu = await Menus.create({ merchantId: 1, name: 'Partial Update' });
      await Menus.update(menu.id, { name: 'Only Name Changed' });

      const updated = await Menus.get(menu.id);
      expect(updated.name).to.equal('Only Name Changed');
      expect(updated.description).to.be.null;
    });
  });

  // ─── delete ───

  describe('delete', () => {
    it('removes the menu', async () => {
      const menu = await Menus.create({ merchantId: 1, name: 'Delete Me' });
      await Menus.delete(menu.id);

      const found = await Menus.get(menu.id);
      expect(found).to.be.undefined;
    });

    it('cascade-deletes junction entries', async () => {
      const menu = await Menus.create({
        merchantId: 1,
        name: 'Cascade Test',
        menuItemIds: [1, 2],
      });
      await Menus.delete(menu.id);

      const items = await Menus.getItemsForMenu(menu.id);
      expect(items).to.be.empty;
    });
  });

  // ─── getItemsForMenu ───

  describe('getItemsForMenu', () => {
    let menuId: number;

    before(async () => {
      await resetMenus();
      const menu = await Menus.create({
        merchantId: 1,
        name: 'Items Test',
        menuItemIds: [1, 2, 3],
      });
      menuId = menu.id;
    });

    it('returns only active items', async () => {
      const items = await Menus.getItemsForMenu(menuId);

      const names = items.map((i: any) => i.name);
      expect(names).to.include('Drip Coffee');
      expect(names).to.include('Avocado Toast');
      expect(names).to.not.include('Secret Item');
    });

    it('orders items by sort_order', async () => {
      const items = await Menus.getItemsForMenu(menuId);

      expect(items[0].name).to.equal('Drip Coffee');
      expect(items[1].name).to.equal('Avocado Toast');
    });
  });

  // ─── setItemsForMenu ───

  describe('setItemsForMenu', () => {
    let menuId: number;

    beforeEach(async () => {
      await resetMenus();
      const menu = await Menus.create({ merchantId: 1, name: 'SetItems Test' });
      menuId = menu.id;
    });

    it('adds items to an empty menu', async () => {
      await Menus.setItemsForMenu(menuId, [1, 2]);

      const items = await Menus.getItemsForMenu(menuId);
      expect(items).to.have.lengthOf(2);
    });

    it('replaces all existing items', async () => {
      await Menus.setItemsForMenu(menuId, [1, 2]);
      await Menus.setItemsForMenu(menuId, [2]);

      const items = await Menus.getItemsForMenu(menuId);
      expect(items).to.have.lengthOf(1);
      expect(items[0].name).to.equal('Avocado Toast');
    });

    it('clears all items when given an empty array', async () => {
      await Menus.setItemsForMenu(menuId, [1, 2]);
      await Menus.setItemsForMenu(menuId, []);

      const items = await Menus.getItemsForMenu(menuId);
      expect(items).to.be.empty;
    });
  });
});
