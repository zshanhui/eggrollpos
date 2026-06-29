import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Banner,
  Button,
  Card,
  Checkbox,
  ChoiceList,
  EmptyState,
  Form,
  FormLayout,
  IndexTable,
  Layout,
  Modal,
  Page,
  ResourceList,
  Spinner,
  Text,
  TextField,
} from '@shopify/polaris';
import type { MerchantRow } from '../../../shared/merchants';
import { merchantDashboardPath } from '../../../shared/merchant_dashboard';
import MerchantAdminLayout from '../components/MerchantAdminLayout';
import MerchantPolarisProvider from '../components/MerchantPolarisProvider';
import { useMerchantHashRoute } from '../hooks/useMerchantHashRoute';
import { deleteApi, fetchApi, postApi, putApi } from '../lib/merchantApi';
import {
  menuItemImageErrorMessage,
  removeMenuItemImage,
  uploadMenuItemImage,
  validateMenuItemImageFile,
} from '../lib/menuItemImageUpload';

export default function MerchantMenuItems(props: any) {
  const { t } = useTranslation();
  const hashId = props.match?.params?.hashId;
  const menuItemId = props.match?.params?.menuItemId;
  const isAdd = props.location?.pathname?.endsWith('/add');
  const isEdit = menuItemId != null && !isAdd;

  const { merchant, error, merchantHashId } = useMerchantHashRoute(hashId, t);

  if (error) {
    return (
      <MerchantPolarisProvider>
        <Page title={t('merchant.menuItems')}>
          <Banner status="critical">{error}</Banner>
        </Page>
      </MerchantPolarisProvider>
    );
  }

  if (!merchant || !merchantHashId) {
    return (
      <MerchantPolarisProvider>
        <Page title={t('merchant.menuItems')}>
          <Spinner accessibilityLabel={t('common.loading')} size="large" />
        </Page>
      </MerchantPolarisProvider>
    );
  }

  if (isAdd) {
    return (
      <MenuItemForm
        merchant={merchant}
        merchantHashId={merchantHashId}
        onBack={() => props.history.push(merchantDashboardPath(merchantHashId, 'menuitems'))}
        onSuccess={() => props.history.push(merchantDashboardPath(merchantHashId, 'menuitems'))}
        t={t}
      />
    );
  }

  if (isEdit) {
    return (
      <MenuItemForm
        merchant={merchant}
        merchantHashId={merchantHashId}
        menuItemId={parseInt(menuItemId, 10)}
        onBack={() => props.history.push(merchantDashboardPath(merchantHashId, 'menuitems'))}
        onSuccess={() => props.history.push(merchantDashboardPath(merchantHashId, 'menuitems'))}
        t={t}
      />
    );
  }

  return (
    <MenuItemsList
      merchant={merchant}
      merchantHashId={merchantHashId}
      history={props.history}
      onAddClick={() => props.history.push(merchantDashboardPath(merchantHashId, 'menuitems/add'))}
      onBack={() => props.history.push(merchantDashboardPath(merchantHashId))}
      t={t}
    />
  );
}

function MenuItemsList({
  merchant,
  merchantHashId,
  history,
  onAddClick,
  onBack,
  t,
}: {
  merchant: MerchantRow;
  merchantHashId: string;
  history: any;
  onAddClick: () => void;
  onBack: () => void;
  t: (key: string) => string;
}) {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [modifiers, setModifiers] = useState<any[]>([]);
  const [showModifiersModal, setShowModifiersModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const handleDelete = async (id: number) => {
    if (!confirm(t('merchant.deleteMenuItemConfirm'))) return;
    setDeleteError(null);
    const res = await deleteApi(`/api/merchants/${merchant.id}/menu-items/${id}`);
    if (res.ok) {
      loadMenuItems();
    } else {
      const data = await res.json().catch(() => ({}));
      setDeleteError((data as any)?.error || t('merchant.deleteFailed'));
    }
  };

  const rowMarkup = menuItems.map((item: any, index: number) => (
    <IndexTable.Row id={String(item.id)} key={item.id} position={index}>
      <IndexTable.Cell>
        <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: '#f1f2f3' }}>
          {item.image_url ? (
            <img
              src={item.image_url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8c9196', fontSize: 12 }}>
              —
            </div>
          )}
        </div>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="semibold" as="span">
          {item.name}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        {(item.description || '').slice(0, 50)}
        {(item.description || '').length > 50 ? '…' : ''}
      </IndexTable.Cell>
      <IndexTable.Cell>${((item.price_cents || 0) / 100).toFixed(2)}</IndexTable.Cell>
      <IndexTable.Cell>
        {item.modifiers?.length ? item.modifiers.map((m: any) => m.name).join(', ') : '—'}
      </IndexTable.Cell>
      <IndexTable.Cell>{item.is_active !== false ? t('common.yes') : t('common.no')}</IndexTable.Cell>
      <IndexTable.Cell>
        <Button plain onClick={() => history.push(merchantDashboardPath(merchantHashId, `menuitems/${item.id}/edit`))}>
          {t('common.edit')}
        </Button>
        {' · '}
        <Button plain destructive onClick={() => handleDelete(item.id)}>
          {t('common.delete')}
        </Button>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <MerchantAdminLayout
      merchantHashId={merchantHashId}
      title={`${merchant.business_name} — ${t('merchant.menuItems')}`}
      backLabel={t('merchant.backToOrders')}
      onBack={onBack}
      primaryAction={{ content: t('merchant.addMenuItem'), onAction: onAddClick }}
      secondaryActions={[{ content: t('merchant.manageModifiers'), onAction: () => setShowModifiersModal(true) }]}
    >
      <Layout>
        {deleteError && (
          <Layout.Section>
            <Banner status="critical" onDismiss={() => setDeleteError(null)}>
              {deleteError}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          {menuItems.length === 0 ? (
            <Card sectioned>
              <EmptyState
                heading={t('merchant.noMenuItems')}
                action={{ content: t('merchant.addFirstItem'), onAction: onAddClick }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              />
            </Card>
          ) : (
            <Card>
              <IndexTable
                resourceName={{ singular: 'menu item', plural: 'menu items' }}
                itemCount={menuItems.length}
                headings={[
                  { title: t('merchant.menuItemImage') },
                  { title: t('common.name') },
                  { title: t('common.description') },
                  { title: t('common.price') },
                  { title: t('merchant.modifiers') },
                  { title: t('merchant.active') },
                  { title: '' },
                ]}
                selectable={false}
              >
                {rowMarkup}
              </IndexTable>
            </Card>
          )}
        </Layout.Section>
      </Layout>

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
    </MerchantAdminLayout>
  );
}

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
  const [priceAdjustmentCents, setPriceAdjustmentCents] = useState('0');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('0');

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await postApi(`/api/merchants/${merchant.id}/modifiers`, {
      name: name.trim(),
      priceAdjustmentCents: parseInt(priceAdjustmentCents, 10) || 0,
    });
    setName('');
    setPriceAdjustmentCents('0');
    setSaving(false);
    onSaved();
  };

  const handleUpdate = async (id: number) => {
    setSaving(true);
    await putApi(`/api/merchants/${merchant.id}/modifiers/${id}`, {
      name: editName.trim(),
      priceAdjustmentCents: parseInt(editPrice, 10) || 0,
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
    setEditPrice(String(m.price_adjustment_cents || 0));
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t('merchant.modifiersTitle')}
      primaryAction={{ content: t('common.close'), onAction: onClose }}
    >
      <Modal.Section>
        <Text as="p" variant="bodyMd" color="subdued">
          {t('merchant.modifiersHintModal')}
        </Text>
      </Modal.Section>

      <Modal.Section>
        <FormLayout>
          <FormLayout.Group>
            <TextField
              label={t('common.name')}
              value={name}
              onChange={setName}
              autoComplete="off"
              placeholder={t('merchant.modifierNamePlaceholder')}
            />
            <TextField
              label={t('merchant.priceAddPlaceholder')}
              value={priceAdjustmentCents}
              onChange={setPriceAdjustmentCents}
              type="number"
              autoComplete="off"
            />
          </FormLayout.Group>
          <Button primary onClick={handleCreate} disabled={saving || !name.trim()} loading={saving}>
            {t('merchant.addModifier')}
          </Button>
        </FormLayout>
      </Modal.Section>

      <Modal.Section>
        {modifiers.length === 0 ? (
          <Text as="p" color="subdued">
            {t('merchant.noModifiersYet')}
          </Text>
        ) : (
          <ResourceList
            resourceName={{ singular: 'modifier', plural: 'modifiers' }}
            items={modifiers}
            renderItem={(m) => {
              const isEditing = editingId === m.id;
              return (
                <ResourceList.Item
                  id={String(m.id)}
                  accessibilityLabel={m.name}
                  onClick={() => {}}
                >
                  {isEditing ? (
                    <FormLayout>
                      <FormLayout.Group>
                        <TextField label={t('common.name')} value={editName} onChange={setEditName} autoComplete="off" />
                        <TextField
                          label={t('merchant.priceAddPlaceholder')}
                          value={editPrice}
                          onChange={setEditPrice}
                          type="number"
                          autoComplete="off"
                        />
                      </FormLayout.Group>
                      <FormLayout.Group>
                        <Button primary onClick={() => handleUpdate(m.id)} disabled={saving} loading={saving}>
                          {t('common.save')}
                        </Button>
                        <Button onClick={() => setEditingId(null)}>{t('common.cancel')}</Button>
                      </FormLayout.Group>
                    </FormLayout>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <Text as="span" variant="bodyMd" fontWeight="semibold">
                          {m.name}
                        </Text>
                        <Text as="p" variant="bodySm" color="subdued">
                          {m.price_adjustment_cents
                            ? `+$${(m.price_adjustment_cents / 100).toFixed(2)}`
                            : t('merchant.noCharge')}
                        </Text>
                      </div>
                      <div>
                        <Button plain onClick={() => startEdit(m)}>
                          {t('common.edit')}
                        </Button>
                        <Button plain destructive onClick={() => handleDelete(m.id)}>
                          {t('common.delete')}
                        </Button>
                      </div>
                    </div>
                  )}
                </ResourceList.Item>
              );
            }}
          />
        )}
      </Modal.Section>
    </Modal>
  );
}

function MenuItemForm({
  merchant,
  merchantHashId,
  menuItemId,
  onBack,
  onSuccess,
  t,
}: {
  merchant: MerchantRow;
  merchantHashId: string;
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
  const [selectedModifierIds, setSelectedModifierIds] = useState<string[]>([]);
  const [modifiers, setModifiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

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
            setSelectedModifierIds((item.modifiers || []).map((m: any) => String(m.id)));
            setExistingImageUrl(item.image_url || null);
          }
        })
        .catch(() => setError(t('merchant.loadMenuItemFailed')))
        .finally(() => setLoading(false));
    }
  }, [isEdit, menuItemId, merchant.id, t]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validationError = validateMenuItemImageFile(file);
    if (validationError) {
      setError(validationError);
      event.target.value = '';
      return;
    }
    setError(null);
    setRemoveExistingImage(false);
    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setRemoveExistingImage(true);
  };

  const handleSubmit = async () => {
    const price = parseInt(priceCents, 10);
    if (!name.trim() || isNaN(price) || price < 0) {
      setError(t('merchant.namePriceRequired'));
      return;
    }
    setSaving(true);
    setError(null);
    const modifierIds = selectedModifierIds.map((id) => parseInt(id, 10));
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        priceCents: price,
        isActive,
        modifierIds,
      };
      let savedMenuItemId = menuItemId;
      if (isEdit && menuItemId) {
        await putApi(`/api/merchants/${merchant.id}/menu-items/${menuItemId}`, payload);
      } else {
        const created = await postApi(`/api/merchants/${merchant.id}/menu-items`, payload);
        savedMenuItemId = created.menuItem?.id;
      }

      if (!savedMenuItemId) {
        throw new Error('Missing menu item id');
      }

      if (removeExistingImage && (existingImageUrl || isEdit)) {
        await removeMenuItemImage(merchant.id, savedMenuItemId);
      }

      if (imageFile) {
        try {
          await uploadMenuItemImage(merchant.id, savedMenuItemId, imageFile);
        } catch (imageErr) {
          throw new Error(menuItemImageErrorMessage(imageErr));
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err?.message || t('merchant.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const previewUrl = imagePreview || (!removeExistingImage ? existingImageUrl : null);

  if (loading) {
    return (
      <MerchantPolarisProvider>
        <Page title={isEdit ? t('merchant.editMenuItem') : t('merchant.addMenuItemTitle')}>
          <Spinner accessibilityLabel={t('common.loading')} size="large" />
        </Page>
      </MerchantPolarisProvider>
    );
  }

  const modifierChoices = modifiers.map((m) => ({
    label: `${m.name}${m.price_adjustment_cents ? ` (+$${(m.price_adjustment_cents / 100).toFixed(2)})` : ''}`,
    value: String(m.id),
  }));

  return (
    <MerchantAdminLayout
      merchantHashId={merchantHashId}
      title={isEdit ? t('merchant.editMenuItem') : t('merchant.addMenuItemTitle')}
      backLabel={t('merchant.backToMenuItems')}
      onBack={onBack}
      showNav={false}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner status="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card sectioned>
            <Form onSubmit={handleSubmit}>
              <FormLayout>
                <TextField
                  label={t('merchant.nameRequired')}
                  value={name}
                  onChange={setName}
                  autoComplete="off"
                  requiredIndicator
                />
                <TextField
                  label={t('common.description')}
                  value={description}
                  onChange={setDescription}
                  multiline={3}
                  autoComplete="off"
                />
                <TextField
                  label={t('merchant.priceCents')}
                  value={priceCents}
                  onChange={setPriceCents}
                  type="number"
                  autoComplete="off"
                  helpText={t('merchant.priceHint')}
                  requiredIndicator
                />
                <Checkbox label={t('merchant.activeLabel')} checked={isActive} onChange={setIsActive} />

                <div>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    {t('merchant.menuItemImage')}
                  </Text>
                  <Text as="p" color="subdued">
                    {t('merchant.menuItemImageHelp')}
                  </Text>
                  {previewUrl && (
                    <div style={{ marginTop: 12, marginBottom: 12 }}>
                      <img
                        src={previewUrl}
                        alt=""
                        style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #dfe3e8' }}
                      />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    <Button onClick={() => fileInputRef.current?.click()}>
                      {previewUrl ? t('merchant.menuItemImageReplace') : t('merchant.menuItemImageChoose')}
                    </Button>
                    {previewUrl && (
                      <Button plain destructive onClick={handleRemoveImage}>
                        {t('merchant.menuItemImageRemove')}
                      </Button>
                    )}
                  </div>
                </div>

                {modifiers.length === 0 ? (
                  <Text as="p" color="subdued">
                    {t('merchant.noModifiersHint')}
                  </Text>
                ) : (
                  <ChoiceList
                    title={t('merchant.modifiers')}
                    allowMultiple
                    choices={modifierChoices}
                    selected={selectedModifierIds}
                    onChange={setSelectedModifierIds}
                  />
                )}
                <FormLayout.Group>
                  <Button onClick={onBack}>{t('common.cancel')}</Button>
                  <Button primary submit loading={saving}>
                    {saving ? t('merchant.saving') : isEdit ? t('common.update') : t('common.create')}
                  </Button>
                </FormLayout.Group>
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </MerchantAdminLayout>
  );
}
