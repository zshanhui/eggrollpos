import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import LangSwitcher from '../components/LangSwitcher';
import type { MerchantRow } from '../../../shared/merchants';
import '../../css/pages/MerchantSettings.css';

function fetchApi(url: string) {
  return fetch(url, { credentials: 'same-origin' as const }).then((r) => r.json());
}

function patchApi(url: string, body: any) {
  return fetch(url, {
    method: 'PATCH',
    credentials: 'same-origin' as const,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((data as any)?.error || 'Request failed');
    return data;
  });
}

export default function MerchantSettings(props: any) {
  const { t } = useTranslation();
  const merchantUuid = props.match?.params?.uuid;

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
      <div className="MerchantSettings MerchantSettings--error">
        <div className="MerchantSettings__error">{error}</div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="MerchantSettings">
        <div className="MerchantSettings__loading">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <SettingsForm
      merchant={merchant}
      merchantUuid={merchantUuid}
      onBack={() => props.history.push(`/merchant-dashboard/${merchantUuid}`)}
      onSave={(updated) => setMerchant(updated)}
      t={t}
    />
  );
}

function SettingsForm({
  merchant,
  merchantUuid,
  onBack,
  onSave,
  t,
}: {
  merchant: MerchantRow;
  merchantUuid: string;
  onBack: () => void;
  onSave: (merchant: MerchantRow) => void;
  t: (key: string) => string;
}) {
  const [businessName, setBusinessName] = useState(merchant.business_name || '');
  const [taxId, setTaxId] = useState(merchant.tax_id || '');
  const [whatsappNumber, setWhatsappNumber] = useState(merchant.whatsapp_number || '');
  const [addressStreet, setAddressStreet] = useState(merchant.address_street || '');
  const [theme, setTheme] = useState<'light' | 'dark'>(merchant.theme === 'light' ? 'light' : 'dark');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const syncFromMerchant = useCallback(() => {
    setBusinessName(merchant.business_name || '');
    setTaxId(merchant.tax_id || '');
    setWhatsappNumber(merchant.whatsapp_number || '');
    setAddressStreet(merchant.address_street || '');
    setTheme(merchant.theme === 'light' ? 'light' : 'dark');
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
    } catch (err) {
      setSaveError(t('merchant.settingsSaveFailed'));
      setTheme(theme);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (err) {
      setSaveError(t('merchant.settingsSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const themeValue = merchant.theme === 'light' ? 'light' : 'dark';

  return (
    <div className={`MerchantSettings MerchantSettings--theme-${themeValue}`}>
      <header className="MerchantSettings__header">
        <button type="button" className="MerchantSettings__back" onClick={onBack}>
          {t('merchant.backToOrders')}
        </button>
        <h1 className="MerchantSettings__title">
          {t('merchant.settings')} <LangSwitcher />
        </h1>
        <div className="MerchantSettings__nav">
          <a href={`/merchant-dashboard/${merchantUuid}/menuitems`}>{t('merchant.menu')}</a>
        </div>
      </header>

      <form className="MerchantSettings__form" onSubmit={handleSubmit}>
        {saveError && <div className="MerchantSettings__error">{saveError}</div>}

        <section className="MerchantSettings__section">
          <h2 className="MerchantSettings__sectionTitle">{t('merchant.businessInfo')}</h2>

          <div className="MerchantSettings__field">
            <label htmlFor="businessName">{t('merchant.businessName')} *</label>
            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              className="MerchantSettings__input"
              placeholder={t('merchant.businessNamePlaceholder')}
            />
          </div>

          <div className="MerchantSettings__field">
            <label htmlFor="taxId">{t('merchant.taxId')}</label>
            <input
              id="taxId"
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="MerchantSettings__input"
              placeholder={t('merchant.taxIdPlaceholder')}
            />
          </div>

          <div className="MerchantSettings__field">
            <label htmlFor="whatsappNumber">{t('merchant.whatsappNumber')}</label>
            <input
              id="whatsappNumber"
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="MerchantSettings__input"
              placeholder={t('merchant.whatsappNumberPlaceholder')}
            />
          </div>

          <div className="MerchantSettings__field">
            <label htmlFor="address">{t('merchant.businessAddress')}</label>
            <textarea
              id="address"
              value={addressStreet}
              onChange={(e) => setAddressStreet(e.target.value)}
              className="MerchantSettings__input MerchantSettings__textarea"
              rows={3}
              placeholder={t('merchant.businessAddressPlaceholder')}
            />
          </div>
        </section>

        <section className="MerchantSettings__section">
          <h2 className="MerchantSettings__sectionTitle">{t('merchant.appearance')}</h2>
          <div className="MerchantSettings__themeToggle">
            <button
              type="button"
              className={`MerchantSettings__themeBtn ${theme === 'light' ? 'MerchantSettings__themeBtn--active' : ''}`}
              onClick={() => handleThemeChange('light')}
              disabled={saving}
            >
              {t('merchant.themeLight')}
            </button>
            <button
              type="button"
              className={`MerchantSettings__themeBtn ${theme === 'dark' ? 'MerchantSettings__themeBtn--active' : ''}`}
              onClick={() => handleThemeChange('dark')}
              disabled={saving}
            >
              {t('merchant.themeDark')}
            </button>
          </div>
        </section>

        <div className="MerchantSettings__formActions">
          <button type="button" className="MerchantSettings__btn MerchantSettings__btn--secondary" onClick={onBack}>
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="MerchantSettings__btn MerchantSettings__btn--primary"
            disabled={saving}
          >
            {saving ? t('merchant.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
