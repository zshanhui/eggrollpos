import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import LangSwitcher from '../components/LangSwitcher';
import type { MerchantRow, MerchantTheme } from '../../../shared/merchants';
import '../../css/pages/MerchantMenuItems.css';

function fetchApi(url: string) {
  return fetch(url, { credentials: 'same-origin' as const }).then((r) => r.json());
}

function postApi(url: string, body: any) {
  return fetch(url, {
    method: 'POST',
    credentials: 'same-origin' as const,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((data as any)?.error || 'Request failed');
    return data;
  });
}

function putApi(url: string, body: any) {
  return fetch(url, {
    method: 'PUT',
    credentials: 'same-origin' as const,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((data as any)?.error || 'Request failed');
    return data;
  });
}

function deleteApi(url: string) {
  return fetch(url, {
    method: 'DELETE',
    credentials: 'same-origin' as const,
    headers: { Accept: 'application/json' },
  });
}

// ─── Main Container ───

export default function MerchantMenuItems(props: any) {
  const { t } = useTranslation();
  const merchantUuid = props.match?.params?.uuid;
  const menuItemId = props.match?.params?.menuItemId;
  const isAdd = props.location?.pathname?.endsWith('/add');
  const isEdit = menuItemId != null && !isAdd;

  const [merchant, setMerchant] = useState<MerchantRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!merchantUuid) {
      setError(t('merchant.noUuid'));
      return;
    }
    fetchApi(`/api/merchants/${merchantUuid}`)
      .then((data) => {
        if (data && data.id) setMerchant(data);
        else setError(t('merchant.notFound'));
      })
      .catch(() => setError(t('merchant.loadFailed')));
  }, [merchantUuid, t]);

  if (error) {
    return (
      <div className="MerchantMenuItems MerchantMenuItems--error">
        <div className="MerchantMenuItems__error">{error}</div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="MerchantMenuItems">
        <div className="MerchantMenuItems__loading">{t('common.loading')}</div>
      </div>
    );
  }

  if (isAdd) {
    return (
      <MenuItemForm
        merchant={merchant}
        onBack={() => props.history.push(`/merchant-dashboard/${merchantUuid}/menuitems`)}
        onSuccess={() => props.history.push(`/merchant-dashboard/${merchantUuid}/menuitems`)}
        t={t}
      />
    );
  }

  if (isEdit) {
    return (
      <MenuItemForm
        merchant={merchant}
        menuItemId={parseInt(menuItemId, 10)}
        onBack={() => props.history.push(`/merchant-dashboard/${merchantUuid}/menuitems`)}
        onSuccess={() => props.history.push(`/merchant-dashboard/${merchantUuid}/menuitems`)}
        t={t}
      />
    );
  }

  return (
    <MenuItemsList
      merchant={merchant}
      merchantUuid={merchantUuid}
      history={props.history}
      onAddClick={() => props.history.push(`/merchant-dashboard/${merchantUuid}/menuitems/add`)}
      onBack={() => props.history.push(`/merchant-dashboard/${merchantUuid}`)}
      t={t}
    />
  );
}

// ─── Menu Items List ───

function MenuItemsList({
  merchant,
  merchantUuid,
  history,
  onAddClick,
  onBack,
  t,
}: {
  merchant: MerchantRow;
  merchantUuid: string;
  history: any;
  onAddClick: () => void;
  onBack: () => void;
  t: (key: string) => string;
}) {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [modifiers, setModifiers] = useState<any[]>([]);
  const [showModifiersModal, setShowModifiersModal] = useState(false);

  const loadMenuItems = useCallback(() => {
    fetchApi(`/api/merchants/${merchant.id}/menu-items`).then((data) =>
      setMenuItems(data.menuItems || [])
    );
  }, [merchant.id]);

  const loadModifiers = useCallback(() => {
    fetchApi(`/api/merchants/${merchant.id}/modifiers`).then((data) =>
      setModifiers(data.modifiers || [])
    );
  }, [merchant.id]);

  useEffect(() => {
    loadMenuItems();
    loadModifiers();
  }, [loadMenuItems, loadModifiers]);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const theme = merchant.theme === 'light' ? 'light' : 'dark';

  const handleDelete = async (id: number) => {
    if (!confirm(t('merchant.deleteMenuItemConfirm'))) return;
    setDeleteError(null);
    const res = await deleteApi(`/api/merchants/${merchant.id}/menu-items/${id}`);
    if (res.ok) {
      setDeleteError(null);
      loadMenuItems();
    } else {
      const data = await res.json().catch(() => ({}));
      setDeleteError((data as any)?.error || t('merchant.deleteFailed'));
    }
  };

  return (
    <div className={`MerchantMenuItems MerchantMenuItems--theme-${theme}`}>
      <header className="MerchantMenuItems__header">
        <button type="button" className="MerchantMenuItems__back" onClick={onBack}>
          {t('merchant.backToOrders')}
        </button>
        <h1 className="MerchantMenuItems__title">{merchant.business_name} — {t('merchant.menuItems')} <LangSwitcher /></h1>
        <div className="MerchantMenuItems__actions">
          <a href={`/merchant-dashboard/${merchantUuid}/settings`} className="MerchantMenuItems__link MerchantMenuItems__link--nav">
            {t('merchant.settings')}
          </a>
          <button
            type="button"
            className="MerchantMenuItems__btn MerchantMenuItems__btn--secondary"
            onClick={() => setShowModifiersModal(true)}
          >
            {t('merchant.manageModifiers')}
          </button>
          <button
            type="button"
            className="MerchantMenuItems__btn MerchantMenuItems__btn--primary"
            onClick={onAddClick}
          >
            {t('merchant.addMenuItem')}
          </button>
        </div>
      </header>

      {deleteError && (
        <div className="MerchantMenuItems__error" style={{ marginBottom: 16 }}>
          {deleteError}
        </div>
      )}

      <div className="MerchantMenuItems__list">
        {menuItems.length === 0 ? (
          <div className="MerchantMenuItems__empty">
            {t('merchant.noMenuItems')} <button onClick={onAddClick}>{t('merchant.addFirstItem')}</button>
          </div>
        ) : (
          <table className="MerchantMenuItems__table">
            <thead>
              <tr>
                <th>{t('common.name')}</th>
                <th>{t('common.description')}</th>
                <th>{t('common.price')}</th>
                <th>{t('merchant.modifiers')}</th>
                <th>{t('merchant.active')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map((item: any) => (
                <tr key={item.id}>
                  <td className="MerchantMenuItems__cell-name">{item.name}</td>
                  <td className="MerchantMenuItems__cell-desc">
                    {(item.description || '').slice(0, 50)}
                    {(item.description || '').length > 50 ? '…' : ''}
                  </td>
                  <td>${((item.price_cents || 0) / 100).toFixed(2)}</td>
                  <td>
                    {item.modifiers?.length
                      ? item.modifiers.map((m: any) => m.name).join(', ')
                      : '—'}
                  </td>
                  <td>{item.is_active !== false ? t('common.yes') : t('common.no')}</td>
                  <td>
                    <button
                      type="button"
                      className="MerchantMenuItems__link"
                      onClick={() => history.push(`/merchant-dashboard/${merchantUuid}/menuitems/${item.id}/edit`)}
                    >
                      {t('common.edit')}
                    </button>
                    {' · '}
                    <button
                      type="button"
                      className="MerchantMenuItems__link MerchantMenuItems__link--danger"
                      onClick={() => handleDelete(item.id)}
                    >
                      {t('common.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModifiersModal && (
        <ModifiersModal
          merchant={merchant}
          modifiers={modifiers}
          onClose={() => setShowModifiersModal(false)}
          onSaved={() => {
            loadModifiers();
            loadMenuItems();
          }}
          t={t}
        />
      )}
    </div>
  );
}

// ─── Modifiers Modal ───

function ModifiersModal({
  merchant,
  modifiers,
  onClose,
  onSaved,
  t,
}: {
  merchant: MerchantRow;
  modifiers: any[];
  onClose: () => void;
  onSaved: () => void;
  t: (key: string) => string;
}) {
  const [name, setName] = useState('');
  const [priceAdjustmentCents, setPriceAdjustmentCents] = useState(0);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState(0);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await postApi(`/api/merchants/${merchant.id}/modifiers`, {
      name: name.trim(),
      priceAdjustmentCents,
    });
    setName('');
    setPriceAdjustmentCents(0);
    setSaving(false);
    onSaved();
  };

  const handleUpdate = async (id: number) => {
    setSaving(true);
    await putApi(`/api/merchants/${merchant.id}/modifiers/${id}`, {
      name: editName.trim(),
      priceAdjustmentCents: editPrice,
    });
    setEditingId(null);
    setSaving(false);
    onSaved();
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('merchant.deleteModifierConfirm'))) return;
    await deleteApi(`/api/merchants/${merchant.id}/modifiers/${id}`);
    onSaved();
  };

  const startEdit = (m: any) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditPrice(m.price_adjustment_cents || 0);
  };

  return (
    <div className="ModifiersModal__overlay" onClick={onClose}>
      <div className="ModifiersModal" onClick={(e) => e.stopPropagation()}>
        <h2>{t('merchant.modifiersTitle')}</h2>
        <p className="ModifiersModal__hint">
          {t('merchant.modifiersHintModal')}
        </p>

        <div className="ModifiersModal__add">
          <input
            type="text"
            placeholder={t('merchant.modifierNamePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="ModifiersModal__input"
          />
          <input
            type="number"
            placeholder={t('merchant.priceAddPlaceholder')}
            value={priceAdjustmentCents || ''}
            onChange={(e) => setPriceAdjustmentCents(parseInt(e.target.value, 10) || 0)}
            className="ModifiersModal__input ModifiersModal__input--narrow"
          />
          <button
            type="button"
            className="MerchantMenuItems__btn MerchantMenuItems__btn--primary"
            onClick={handleCreate}
            disabled={saving || !name.trim()}
          >
            {t('merchant.addModifier')}
          </button>
        </div>

        <ul className="ModifiersModal__list">
          {modifiers.map((m) => (
            <li key={m.id} className="ModifiersModal__item">
              {editingId === m.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="ModifiersModal__input"
                  />
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(parseInt(e.target.value, 10) || 0)}
                    className="ModifiersModal__input ModifiersModal__input--narrow"
                  />
                  <button
                    type="button"
                    className="MerchantMenuItems__btn MerchantMenuItems__btn--primary"
                    onClick={() => handleUpdate(m.id)}
                    disabled={saving}
                  >
                    {t('common.save')}
                  </button>
                  <button
                    type="button"
                    className="MerchantMenuItems__btn MerchantMenuItems__btn--secondary"
                    onClick={() => setEditingId(null)}
                  >
                    {t('common.cancel')}
                  </button>
                </>
              ) : (
                <>
                  <span className="ModifiersModal__item-name">{m.name}</span>
                  <span className="ModifiersModal__item-price">
                    {m.price_adjustment_cents
                      ? `+$${(m.price_adjustment_cents / 100).toFixed(2)}`
                      : t('merchant.noCharge')}
                  </span>
                  <button
                    type="button"
                    className="MerchantMenuItems__link"
                    onClick={() => startEdit(m)}
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    type="button"
                    className="MerchantMenuItems__link MerchantMenuItems__link--danger"
                    onClick={() => handleDelete(m.id)}
                  >
                    {t('common.delete')}
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>

        {modifiers.length === 0 && (
          <p className="ModifiersModal__empty">{t('merchant.noModifiersYet')}</p>
        )}

        <button
          type="button"
          className="MerchantMenuItems__btn MerchantMenuItems__btn--secondary"
          onClick={onClose}
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  );
}

// ─── Menu Item Form (Add / Edit) ───

function MenuItemForm({
  merchant,
  menuItemId,
  onBack,
  onSuccess,
  t,
}: {
  merchant: MerchantRow;
  menuItemId?: number;
  onBack: () => void;
  onSuccess: () => void;
  t: (key: string) => string;
}) {
  const isEdit = menuItemId != null;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceCents, setPriceCents] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedModifierIds, setSelectedModifierIds] = useState<number[]>([]);
  const [modifiers, setModifiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi(`/api/merchants/${merchant.id}/modifiers`).then((data) =>
      setModifiers(data.modifiers || [])
    );
  }, [merchant.id]);

  useEffect(() => {
    if (isEdit && menuItemId) {
      fetchApi(`/api/merchants/${merchant.id}/menu-items/${menuItemId}`)
        .then((data) => {
          const item = data.menuItem;
          if (item) {
            setName(item.name || '');
            setDescription(item.description || '');
            setPriceCents(String(item.price_cents || ''));
            setIsActive(item.is_active !== false);
            setSelectedModifierIds((item.modifiers || []).map((m: any) => m.id));
          }
        })
        .catch(() => setError(t('merchant.loadMenuItemFailed')))
        .finally(() => setLoading(false));
    }
  }, [isEdit, menuItemId, merchant.id, t]);

  const toggleModifier = (id: number) => {
    setSelectedModifierIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseInt(priceCents, 10);
    if (!name.trim() || isNaN(price) || price < 0) {
      setError(t('merchant.namePriceRequired'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit && menuItemId) {
        await putApi(`/api/merchants/${merchant.id}/menu-items/${menuItemId}`, {
          name: name.trim(),
          description: description.trim(),
          priceCents: price,
          isActive,
          modifierIds: selectedModifierIds,
        });
      } else {
        await postApi(`/api/merchants/${merchant.id}/menu-items`, {
          name: name.trim(),
          description: description.trim(),
          priceCents: price,
          isActive,
          modifierIds: selectedModifierIds,
        });
      }
      onSuccess();
    } catch (err) {
      setError(t('merchant.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const theme = merchant.theme === 'light' ? 'light' : 'dark';

  if (loading) {
    return (
      <div className={`MerchantMenuItems MerchantMenuItems--theme-${theme}`}>
        <div className="MerchantMenuItems__loading">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className={`MerchantMenuItems MerchantMenuItems--theme-${theme}`}>
      <header className="MerchantMenuItems__header">
        <button type="button" className="MerchantMenuItems__back" onClick={onBack}>
          {t('merchant.backToMenuItems')}
        </button>
        <h1 className="MerchantMenuItems__title">
          {isEdit ? t('merchant.editMenuItem') : t('merchant.addMenuItemTitle')}
        </h1>
      </header>

      <form className="MerchantMenuItems__form" onSubmit={handleSubmit}>
        {error && <div className="MerchantMenuItems__error">{error}</div>}

        <div className="MerchantMenuItems__field">
          <label htmlFor="name">{t('merchant.nameRequired')}</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="MerchantMenuItems__input"
          />
        </div>

        <div className="MerchantMenuItems__field">
          <label htmlFor="description">{t('common.description')}</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="MerchantMenuItems__input MerchantMenuItems__textarea"
            rows={3}
          />
        </div>

        <div className="MerchantMenuItems__field">
          <label htmlFor="price">{t('merchant.priceCents')}</label>
          <input
            id="price"
            type="number"
            min="0"
            value={priceCents}
            onChange={(e) => setPriceCents(e.target.value)}
            required
            className="MerchantMenuItems__input"
          />
          <span className="MerchantMenuItems__hint">{t('merchant.priceHint')}</span>
        </div>

        <div className="MerchantMenuItems__field">
          <label>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            {' '}{t('merchant.activeLabel')}
          </label>
        </div>

        <div className="MerchantMenuItems__field">
          <label>{t('merchant.modifiers')}</label>
          <p className="MerchantMenuItems__hint">
            {t('merchant.modifiersHint')}
          </p>
          {modifiers.length === 0 ? (
            <p className="MerchantMenuItems__hint">
              {t('merchant.noModifiersHint')}
            </p>
          ) : (
            <div className="MerchantMenuItems__modifiers">
              {modifiers.map((m) => (
                <label key={m.id} className="MerchantMenuItems__modifier-label">
                  <input
                    type="checkbox"
                    checked={selectedModifierIds.includes(m.id)}
                    onChange={() => toggleModifier(m.id)}
                  />
                  {' '}
                  {m.name}
                  {m.price_adjustment_cents
                    ? ` (+$${(m.price_adjustment_cents / 100).toFixed(2)})`
                    : ''}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="MerchantMenuItems__form-actions">
          <button type="button" className="MerchantMenuItems__btn MerchantMenuItems__btn--secondary" onClick={onBack}>
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="MerchantMenuItems__btn MerchantMenuItems__btn--primary"
            disabled={saving}
          >
            {saving ? t('merchant.saving') : isEdit ? t('common.update') : t('common.create')}
          </button>
        </div>
      </form>
    </div>
  );
}
