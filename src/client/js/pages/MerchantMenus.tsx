import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const PRIORITY_TIMEZONES = [
  'Asia/Kuala_Lumpur',
  'Asia/Singapore',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
];

function fetchJson(url: string, opts?: RequestInit) {
  return fetch(url, { credentials: 'same-origin', ...opts }).then((r) => r.json());
}

export default function MerchantMenus(props: any) {
  const { t } = useTranslation();
  const merchantUuid = props.match?.params?.uuid;
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [editMenuId, setEditMenuId] = useState<number | null>(null);

  useEffect(() => {
    const path = props.location?.pathname || '';
    if (path.endsWith('/add')) {
      setView('add');
    } else {
      const m = path.match(/\/menus\/(\d+)\/edit/);
      if (m) {
        setView('edit');
        setEditMenuId(parseInt(m[1], 10));
      } else {
        setView('list');
        setEditMenuId(null);
      }
    }
  }, [props.location?.pathname]);

  const navigate = (path: string) => props.history.push(path);

  if (!merchantUuid) {
    return <div className="max-w-2xl mx-auto p-8 text-gray-400">{t('merchant.noUuid')}</div>;
  }

  if (view === 'add') {
    return <MenuForm merchantUuid={merchantUuid} onBack={() => navigate(`/merchant-dashboard/${merchantUuid}/online-menus`)} onSaved={() => navigate(`/merchant-dashboard/${merchantUuid}/online-menus`)} t={t} />;
  }

  if (view === 'edit' && editMenuId) {
    return <MenuForm merchantUuid={merchantUuid} menuId={editMenuId} onBack={() => navigate(`/merchant-dashboard/${merchantUuid}/online-menus`)} onSaved={() => navigate(`/merchant-dashboard/${merchantUuid}/online-menus`)} t={t} />;
  }

  return <MenuList merchantUuid={merchantUuid} navigate={navigate} t={t} />;
}

// ─── Menu List ───

function MenuList({ merchantUuid, navigate, t }: { merchantUuid: string; navigate: (path: string) => void; t: (key: string) => string }) {
  const [merchant, setMerchant] = useState<any>(null);
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJson(`/api/merchants/${merchantUuid}`)
      .then((merchData) => {
        setMerchant(merchData);
        return fetchJson(`/api/merchants/${merchData.id}/menus`);
      })
      .then((menuData) => setMenus(menuData.menus || []))
      .finally(() => setLoading(false));
  }, [merchantUuid]);

  const togglePublished = async (menuId: number, current: boolean) => {
    if (!merchant?.id) return;
    await fetch(`/api/merchants/${merchant.id}/menus/${menuId}`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !current }),
    });
    setMenus((prev) =>
      prev.map((m) => (m.id === menuId ? { ...m, is_published: !current } : m))
    );
  };

  const deleteMenu = async (menuId: number) => {
    if (!merchant?.id) return;
    if (!confirm(t('menus.confirmDelete'))) return;
    await fetch(`/api/merchants/${merchant.id}/menus/${menuId}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    setMenus((prev) => prev.filter((m) => m.id !== menuId));
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto p-8 text-gray-400">{t('common.loading')}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(`/merchant-dashboard/${merchantUuid}`)} className="text-blue-600 text-sm">
          ← {t('merchant.backToOrders')}
        </button>
        <h1 className="text-lg font-bold text-gray-800">{t('menus.yourMenus')}</h1>
        <button
          onClick={() => navigate(`/merchant-dashboard/${merchantUuid}/online-menus/add`)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium"
        >
          + {t('menus.newMenu')}
        </button>
      </div>

      {menus.length === 0 ? (
        <p className="text-center text-gray-400 py-12">{t('menus.noMenus')}</p>
      ) : (
        <div className="space-y-3">
          {menus.map((menu) => (
            <div key={menu.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-gray-800">{menu.name}</h2>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-3">
                  <input
                    type="checkbox"
                    checked={!!menu.is_published}
                    onChange={() => togglePublished(menu.id, !!menu.is_published)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </label>
              </div>
              <p className="text-sm text-gray-500 mb-2">
                {menu.item_count} {t('menus.items')}
                {menu.slug && <span className="block text-xs text-gray-400 truncate">{menu.slug}</span>}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/merchant-dashboard/${merchantUuid}/online-menus/${menu.id}/edit`)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  {t('common.edit')}
                </button>
                <button onClick={() => deleteMenu(menu.id)} className="text-red-500 hover:underline text-sm">
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 border-t border-gray-100 pt-4">
        <a href={`/merchant-dashboard/${merchantUuid}/menuitems`} className="text-sm text-gray-500 hover:underline">
          {t('merchant.menuItems')} →
        </a>
      </div>
    </div>
  );
}

// ─── Menu Form (Create / Edit) ───

function MenuForm({
  merchantUuid,
  menuId,
  onBack,
  onSaved,
  t,
}: {
  merchantUuid: string;
  menuId?: number | null;
  onBack: () => void;
  onSaved: () => void;
  t: (key: string) => string;
}) {
  const [merchant, setMerchant] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [businessHours, setBusinessHours] = useState<Record<string, { open: string; close: string } | null>>({});

  // If editing, load menu data
  const [existingMenu, setExistingMenu] = useState<any>(null);
  const [existingItemIds, setExistingItemIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchJson(`/api/merchants/${merchantUuid}`)
      .then(async (merch) => {
        setMerchant(merch);
        const [itemsData] = await Promise.all([
          fetchJson(`/api/merchants/${merch.id}/menu-items`),
          menuId ? fetchJson(`/api/merchants/${merch.id}/menus/${menuId}`) : Promise.resolve(null),
        ]);
        setMenuItems(itemsData.menuItems || []);

        if (menuId && itemsData) {
          // Load existing menu for editing
          const menuData = await fetchJson(`/api/merchants/${merch.id}/menus/${menuId}`);
          const menu = menuData.menu;
          setExistingMenu(menu);
          setName(menu.name || '');
          setDescription(menu.description || '');
          setIsPublished(!!menu.is_published);
          setBusinessHours(menu.business_hours || {});
          setExistingItemIds(new Set((menu.menuItems || []).map((i: any) => i.id)));
        }
      })
      .finally(() => setLoading(false));
  }, [merchantUuid, menuId]);

  // Business hours helpers
  const getHours = (day: string): { open: string; close: string } | null => {
    return (businessHours as any)?.[day] || null;
  };

  const setHours = (day: string, value: { open: string; close: string } | null) => {
    setBusinessHours((prev) => ({ ...prev, [day]: value }));
  };

  const toggleDay = (day: string) => {
    const current = getHours(day);
    setHours(day, current ? null : { open: '09:00', close: '17:00' });
  };

  // Menu item selection
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  useEffect(() => {
    setSelectedItemIds(existingItemIds);
  }, [existingItemIds]);

  const toggleItem = (itemId: number) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant?.id) return;
    setSaving(true);

    const body = {
      name,
      description: description || null,
      isPublished,
      businessHours,
      menuItemIds: Array.from(selectedItemIds),
    };

    const url = menuId
      ? `/api/merchants/${merchant.id}/menus/${menuId}`
      : `/api/merchants/${merchant.id}/menus`;

    const res = await fetch(url, {
      method: menuId ? 'PUT' : 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (res.ok) onSaved();
  };

  if (loading) return <div className="max-w-2xl mx-auto p-8 text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="text-blue-600 text-sm mr-auto">
          ← {t('merchant.backToOrders')}
        </button>
        <h1 className="text-lg font-bold text-gray-800">
          {menuId ? t('menus.editMenu') : t('menus.newMenu')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('menus.menuName')} *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t('menus.menuNamePlaceholder')}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('menus.menuDescription')}</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Published toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{t('menus.published')}</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
          </label>
        </div>

        {/* Business hours */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">{t('menus.businessHours')}</h3>
          <p className="text-xs text-gray-400 mb-3">{t('menus.businessHoursHint')}</p>
          <div className="space-y-2">
            {DAYS.map((day) => {
              const hours = getHours(day);
              return (
                <div key={day} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 w-full">
                    <input
                      type="checkbox"
                      checked={!!hours}
                      onChange={() => toggleDay(day)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 w-10 capitalize">{day}</span>
                  </label>
                  {hours ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => setHours(day, { ...hours, open: e.target.value })}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-28"
                      />
                      <span className="text-gray-400">–</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => setHours(day, { ...hours, close: e.target.value })}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-28"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">{t('menus.closed')}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Menu items selection */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">{t('menus.selectItems')}</h3>
          {menuItems.length === 0 ? (
            <p className="text-sm text-gray-400">{t('menus.noItemsYet')}</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {menuItems.map((item: any) => (
                <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedItemIds.has(item.id)}
                    onChange={() => toggleItem(item.id)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-800 flex-1">{item.name}</span>
                  <span className="text-sm text-gray-400">${(item.price_cents / 100).toFixed(2)}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={onBack} className="flex-1 text-sm text-gray-600 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg font-medium disabled:opacity-50">
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
