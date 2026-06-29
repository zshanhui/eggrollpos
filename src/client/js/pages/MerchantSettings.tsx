import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Banner,
  Button,
  ButtonGroup,
  Card,
  Form,
  FormLayout,
  Layout,
  Page,
  Spinner,
  Text,
  TextField,
} from '@shopify/polaris';
import type { MerchantRow } from '../../../shared/merchants';
import { resolveMerchantTheme } from '../../../shared/merchants';
import { merchantDashboardPath } from '../../../shared/merchant_dashboard';
import MerchantAdminLayout from '../components/MerchantAdminLayout';
import LanguageSelector from '../components/LanguageSelector';
import MerchantPolarisProvider from '../components/MerchantPolarisProvider';
import { useMerchantHashRoute } from '../hooks/useMerchantHashRoute';
import { patchApi } from '../lib/merchantApi';

export default function MerchantSettings(props: any) {
  const { t } = useTranslation();
  const hashId = props.match?.params?.hashId;
  const { merchant, error, merchantHashId } = useMerchantHashRoute(hashId, t);
  const [savedMerchant, setSavedMerchant] = useState<MerchantRow | null>(null);
  const activeMerchant = savedMerchant || merchant;

  if (error) {
    return (
      <MerchantPolarisProvider>
        <Page title={t('merchant.settings')}>
          <Banner status="critical">{error}</Banner>
        </Page>
      </MerchantPolarisProvider>
    );
  }

  if (!activeMerchant) {
    return (
      <MerchantPolarisProvider>
        <Page title={t('merchant.settings')}>
          <Spinner accessibilityLabel={t('common.loading')} size="large" />
        </Page>
      </MerchantPolarisProvider>
    );
  }

  return (
    <SettingsForm
      merchant={activeMerchant}
      merchantHashId={merchantHashId}
      onBack={() => props.history.push(merchantDashboardPath(merchantHashId))}
      onSave={setSavedMerchant}
      t={t}
    />
  );
}

function SettingsForm({
  merchant,
  merchantHashId,
  onBack,
  onSave,
  t,
}: {
  merchant: MerchantRow;
  merchantHashId: string;
  onBack: () => void;
  onSave: (merchant: MerchantRow) => void;
  t: (key: string) => string;
}) {
  const [businessName, setBusinessName] = useState(merchant.business_name || '');
  const [taxId, setTaxId] = useState(merchant.tax_id || '');
  const [whatsappNumber, setWhatsappNumber] = useState(merchant.whatsapp_number || '');
  const [addressStreet, setAddressStreet] = useState(merchant.address_street || '');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => resolveMerchantTheme(merchant.theme));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const syncFromMerchant = useCallback(() => {
    setBusinessName(merchant.business_name || '');
    setTaxId(merchant.tax_id || '');
    setWhatsappNumber(merchant.whatsapp_number || '');
    setAddressStreet(merchant.address_street || '');
    setTheme(resolveMerchantTheme(merchant.theme));
  }, [merchant]);

  useEffect(() => {
    syncFromMerchant();
  }, [syncFromMerchant]);

  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    setSaving(true);
    setSaveError(null);
    try {
      const data = await patchApi(`/api/merchants/${merchant.id}`, { theme: newTheme });
      onSave(data.merchant);
    } catch {
      setSaveError(t('merchant.settingsSaveFailed'));
      setTheme(theme);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!businessName.trim()) {
      setSaveError(t('merchant.businessNameRequired'));
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const data = await patchApi(`/api/merchants/${merchant.id}`, {
        businessName: businessName.trim(),
        taxId: taxId.trim() || null,
        whatsappNumber: whatsappNumber.trim() || null,
        addressStreet: addressStreet.trim() || null,
      });
      onSave(data.merchant);
    } catch {
      setSaveError(t('merchant.settingsSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <MerchantAdminLayout
      merchantHashId={merchantHashId}
      title={t('merchant.settings')}
      backLabel={t('merchant.backToOrders')}
      onBack={onBack}
    >
      <Layout>
        {saveError && (
          <Layout.Section>
            <Banner status="critical" onDismiss={() => setSaveError(null)}>
              {saveError}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Form onSubmit={handleSubmit}>
            <FormLayout>
              <Card title={t('merchant.businessInfo')} sectioned>
                <FormLayout>
                  <TextField
                    label={t('merchant.businessName')}
                    value={businessName}
                    onChange={setBusinessName}
                    autoComplete="organization"
                    placeholder={t('merchant.businessNamePlaceholder')}
                    requiredIndicator
                  />
                  <TextField
                    label={t('merchant.taxId')}
                    value={taxId}
                    onChange={setTaxId}
                    autoComplete="off"
                    placeholder={t('merchant.taxIdPlaceholder')}
                  />
                  <TextField
                    label={t('merchant.whatsappNumber')}
                    value={whatsappNumber}
                    onChange={setWhatsappNumber}
                    type="tel"
                    autoComplete="tel"
                    placeholder={t('merchant.whatsappNumberPlaceholder')}
                  />
                  <TextField
                    label={t('merchant.businessAddress')}
                    value={addressStreet}
                    onChange={setAddressStreet}
                    multiline={3}
                    autoComplete="street-address"
                    placeholder={t('merchant.businessAddressPlaceholder')}
                  />
                </FormLayout>
              </Card>

              <Card title={t('merchant.appearance')} sectioned>
                <FormLayout>
                  <Text as="p" variant="bodyMd">
                    {t('merchant.theme')}
                  </Text>
                  <ButtonGroup segmented>
                    <Button
                      pressed={theme === 'light'}
                      onClick={() => handleThemeChange('light')}
                      disabled={saving}
                    >
                      {t('merchant.themeLight')}
                    </Button>
                    <Button
                      pressed={theme === 'dark'}
                      onClick={() => handleThemeChange('dark')}
                      disabled={saving}
                    >
                      {t('merchant.themeDark')}
                    </Button>
                  </ButtonGroup>
                  <Text as="p" variant="bodyMd">
                    {t('merchant.language')}
                  </Text>
                  <LanguageSelector />
                </FormLayout>
              </Card>

              <FormLayout.Group>
                <Button onClick={onBack}>{t('common.cancel')}</Button>
                <Button primary submit loading={saving}>
                  {saving ? t('merchant.saving') : t('common.save')}
                </Button>
              </FormLayout.Group>
            </FormLayout>
          </Form>
        </Layout.Section>
      </Layout>
    </MerchantAdminLayout>
  );
}
