import React from 'react';
import { useTranslation } from 'react-i18next';

export default function CustomerRoutes(props: any) {
  const { t } = useTranslation();
  const merchantId = props.match?.params?.merchantId;

  return (
    <section style={{ padding: '2rem' }}>
      <h1>{t('customer.orderOnline')}</h1>
      <p>{t('customer.merchantId')}: {merchantId || t('customer.none')}</p>
      <p>{t('customer.comingSoon')}</p>
    </section>
  )
}
