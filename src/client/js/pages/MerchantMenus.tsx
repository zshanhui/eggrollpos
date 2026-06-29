import React, { useEffect, useState } from 'react';
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
  Page,
  Spinner,
  TextField,
} from '@shopify/polaris';
import MerchantAdminLayout from '../components/MerchantAdminLayout';
import MerchantPolarisProvider from '../components/MerchantPolarisProvider';
import { useMerchantHashRoute } from '../hooks/useMerchantHashRoute';
import { merchantDashboardPath } from '../../../shared/merchant_dashboard';
import { deleteApi, fetchApi } from '../lib/merchantApi';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function MerchantMenus(props: any) {
  const { t } = useTranslation();
  const hashId = props.match?.params?.hashId;
  const { error, merchantHashId } = useMerchantHashRoute(hashId, t);
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [editMenuId, setEditMenuId] = useState<number | null>(null);

  useEffect(() => {
    const path = props.location?.pathname || '';
    if (path.endsWith('/add')) {
      setView('add');
    } else {
      const m = path.match(/\/online-menus\/(\d+)\/edit/);
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

  if (error || !merchantHashId) {
    return (
      <MerchantPolarisProvider>
        <Page title={t('menus.yourMenus')}>
          <Banner status="critical">{error || t('merchant.noHashId')}</Banner>
        </Page>
      </MerchantPolarisProvider>
    );
  }

  if (view === 'add') {
    return (
      <MenuForm
        merchantHashId={merchantHashId}
        onBack={() => navigate(merchantDashboardPath(merchantHashId, 'online-menus'))}
        onSaved={() => navigate(merchantDashboardPath(merchantHashId, 'online-menus'))}
        t={t}
      />
    );
  }

  if (view === 'edit' && editMenuId) {
    return (
      <MenuForm
        merchantHashId={merchantHashId}
        menuId={editMenuId}
        onBack={() => navigate(merchantDashboardPath(merchantHashId, 'online-menus'))}
        onSaved={() => navigate(merchantDashboardPath(merchantHashId, 'online-menus'))}
        t={t}
      />
    );
  }

  return <MenuList merchantHashId={merchantHashId} navigate={navigate} t={t} />;
}

function MenuList({
  merchantHashId,
  navigate,
  t,
}: {
  merchantHashId: string;
  navigate: (path: string) => void;
  t: (key: string) => string;
}) {
  const [merchant, setMerchant] = useState<any>(null);
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi(`/api/merchants/${merchantHashId}`)
      .then((merchData) => {
        setMerchant(merchData);
        return fetchApi(`/api/merchants/${merchData.id}/menus`);
      })
      .then((menuData) => setMenus(menuData.menus || []))
      .finally(() => setLoading(false));
  }, [merchantHashId]);

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
    await deleteApi(`/api/merchants/${merchant.id}/menus/${menuId}`);
    setMenus((prev) => prev.filter((m) => m.id !== menuId));
  };

  if (loading) {
    return (
      <MerchantPolarisProvider>
        <Page title={t('menus.yourMenus')}>
          <Spinner accessibilityLabel={t('common.loading')} size="large" />
        </Page>
      </MerchantPolarisProvider>
    );
  }

  const rowMarkup = menus.map((menu, index) => (
    <IndexTable.Row id={String(menu.id)} key={menu.id} position={index}>
      <IndexTable.Cell>{menu.name}</IndexTable.Cell>
      <IndexTable.Cell>
        {menu.item_count} {t('menus.items')}
        {menu.slug ? ` · ${menu.slug}` : ''}
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Checkbox
          label={t('menus.published')}
          labelHidden
          checked={!!menu.is_published}
          onChange={() => togglePublished(menu.id, !!menu.is_published)}
        />
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Button plain onClick={() => navigate(merchantDashboardPath(merchantHashId, `online-menus/${menu.id}/edit`))}>
          {t('common.edit')}
        </Button>
        {' · '}
        <Button plain destructive onClick={() => deleteMenu(menu.id)}>
          {t('common.delete')}
        </Button>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <MerchantAdminLayout
      merchantHashId={merchantHashId}
      title={t('menus.yourMenus')}
      backLabel={t('merchant.backToOrders')}
      onBack={() => navigate(merchantDashboardPath(merchantHashId))}
      primaryAction={{
        content: t('menus.newMenu'),
        onAction: () => navigate(merchantDashboardPath(merchantHashId, 'online-menus/add')),
      }}
    >
      <Layout>
        <Layout.Section>
          {menus.length === 0 ? (
            <Card sectioned>
              <EmptyState
                heading={t('menus.noMenus')}
                action={{
                  content: t('menus.newMenu'),
                  onAction: () => navigate(merchantDashboardPath(merchantHashId, 'online-menus/add')),
                }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              />
            </Card>
          ) : (
            <Card>
              <IndexTable
                resourceName={{ singular: 'menu', plural: 'menus' }}
                itemCount={menus.length}
                headings={[
                  { title: t('menus.menuName') },
                  { title: t('menus.menuDescription') },
                  { title: t('menus.published') },
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
    </MerchantAdminLayout>
  );
}

function MenuForm({
  merchantHashId,
  menuId,
  onBack,
  onSaved,
  t,
}: {
  merchantHashId: string;
  menuId?: number | null;
  onBack: () => void;
  onSaved: () => void;
  t: (key: string) => string;
}) {
  const [merchant, setMerchant] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [businessHours, setBusinessHours] = useState<Record<string, { open: string; close: string } | null>>({});
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  useEffect(() => {
    fetchApi(`/api/merchants/${merchantHashId}`)
      .then(async (merch) => {
        setMerchant(merch);
        const itemsData = await fetchApi(`/api/merchants/${merch.id}/menu-items`);
        setMenuItems(itemsData.menuItems || []);

        if (menuId) {
          const menuData = await fetchApi(`/api/merchants/${merch.id}/menus/${menuId}`);
          const menu = menuData.menu;
          setName(menu.name || '');
          setDescription(menu.description || '');
          setIsPublished(!!menu.is_published);
          setBusinessHours(menu.business_hours || {});
          const ids = (menu.menuItems || []).map((i: any) => i.id);
          setSelectedItemIds(ids.map(String));
        }
      })
      .finally(() => setLoading(false));
  }, [merchantHashId, menuId]);

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

  const handleSubmit = async () => {
    if (!merchant?.id) return;
    setSaving(true);

    const body = {
      name,
      description: description || null,
      isPublished,
      businessHours,
      menuItemIds: selectedItemIds.map((id) => parseInt(id, 10)),
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

  if (loading) {
    return (
      <MerchantPolarisProvider>
        <Page title={menuId ? t('menus.editMenu') : t('menus.newMenu')}>
          <Spinner accessibilityLabel={t('common.loading')} size="large" />
        </Page>
      </MerchantPolarisProvider>
    );
  }

  const itemChoices = menuItems.map((item: any) => ({
    label: `${item.name} — $${(item.price_cents / 100).toFixed(2)}`,
    value: String(item.id),
  }));

  return (
    <MerchantAdminLayout
      merchantHashId={merchantHashId}
      title={menuId ? t('menus.editMenu') : t('menus.newMenu')}
      backLabel={t('merchant.backToOrders')}
      onBack={onBack}
      showNav={false}
    >
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Form onSubmit={handleSubmit}>
              <FormLayout>
                <TextField
                  label={t('menus.menuName')}
                  value={name}
                  onChange={setName}
                  autoComplete="off"
                  placeholder={t('menus.menuNamePlaceholder')}
                  requiredIndicator
                />
                <TextField
                  label={t('menus.menuDescription')}
                  value={description}
                  onChange={setDescription}
                  autoComplete="off"
                />
                <Checkbox label={t('menus.published')} checked={isPublished} onChange={setIsPublished} />

                <FormLayout.Group title={t('menus.businessHours')}>
                  <p style={{ margin: 0, color: '#6d7175', fontSize: 13 }}>{t('menus.businessHoursHint')}</p>
                  {DAYS.map((day) => {
                    const hours = getHours(day);
                    return (
                      <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <Checkbox label={day} checked={!!hours} onChange={() => toggleDay(day)} />
                        {hours ? (
                          <>
                            <TextField
                              label={`${day} open`}
                              labelHidden
                              value={hours.open}
                              onChange={(value) => setHours(day, { ...hours, open: value })}
                              type="time"
                              autoComplete="off"
                            />
                            <span>–</span>
                            <TextField
                              label={`${day} close`}
                              labelHidden
                              value={hours.close}
                              onChange={(value) => setHours(day, { ...hours, close: value })}
                              type="time"
                              autoComplete="off"
                            />
                          </>
                        ) : (
                          <span style={{ color: '#6d7175', fontSize: 13 }}>{t('menus.closed')}</span>
                        )}
                      </div>
                    );
                  })}
                </FormLayout.Group>

                {menuItems.length === 0 ? (
                  <p style={{ margin: 0, color: '#6d7175' }}>{t('menus.noItemsYet')}</p>
                ) : (
                  <ChoiceList
                    title={t('menus.selectItems')}
                    allowMultiple
                    choices={itemChoices}
                    selected={selectedItemIds}
                    onChange={setSelectedItemIds}
                  />
                )}

                <FormLayout.Group>
                  <Button onClick={onBack}>{t('common.cancel')}</Button>
                  <Button primary submit loading={saving}>
                    {saving ? t('merchant.saving') : t('common.save')}
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
