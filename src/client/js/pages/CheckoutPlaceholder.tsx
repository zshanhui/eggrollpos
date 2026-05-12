import React from 'react';
import { useTranslation } from 'react-i18next';

export default function CheckoutPlaceholder() {
  const { t } = useTranslation();

  return (
    <div className="max-w-lg mx-auto min-h-screen flex items-center justify-center p-8">
      <div className="text-center">
        <div className="text-4xl mb-4">💳</div>
        <h1 className="text-xl font-semibold text-gray-700 mb-2">{t('checkout.title')}</h1>
        <p className="text-gray-500">{t('checkout.comingSoon')}</p>
      </div>
    </div>
  );
}
