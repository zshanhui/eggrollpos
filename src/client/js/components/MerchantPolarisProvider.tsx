import React from 'react';
import { AppProvider } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';
import '@shopify/polaris/build/esm/styles.css';

interface MerchantPolarisProviderProps {
  children: React.ReactNode;
}

export default function MerchantPolarisProvider({ children }: MerchantPolarisProviderProps) {
  return <AppProvider i18n={enTranslations}>{children}</AppProvider>;
}
