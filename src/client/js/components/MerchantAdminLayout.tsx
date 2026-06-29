import React from 'react';
import { Page } from '@shopify/polaris';
import type { MenuActionDescriptor, PageProps } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';
import { merchantDashboardPath } from '../../../shared/merchant_dashboard';
import MerchantPolarisProvider from './MerchantPolarisProvider';
import { useMerchantAuth } from '../context/MerchantAuthContext';

interface MerchantAdminLayoutProps {
  merchantHashId: string;
  title: string;
  onBack: () => void;
  backLabel: string;
  primaryAction?: PageProps['primaryAction'];
  secondaryActions?: MenuActionDescriptor[];
  children: React.ReactNode;
  showNav?: boolean;
}

export default function MerchantAdminLayout({
  merchantHashId,
  title,
  onBack,
  backLabel,
  primaryAction,
  secondaryActions = [],
  children,
  showNav = true,
}: MerchantAdminLayoutProps) {
  const { t } = useTranslation();
  const { signOut } = useMerchantAuth();
  const navActions = showNav
    ? [
        { content: t('merchant.menus'), url: merchantDashboardPath(merchantHashId, 'online-menus') },
        { content: t('merchant.menu'), url: merchantDashboardPath(merchantHashId, 'menuitems') },
        { content: t('merchant.settings'), url: merchantDashboardPath(merchantHashId, 'settings') },
        { content: 'Sign out', onAction: signOut },
      ]
    : [];

  return (
    <MerchantPolarisProvider>
      <Page
        title={title}
        backAction={{ content: backLabel, onAction: onBack }}
        primaryAction={primaryAction}
        secondaryActions={[...navActions, ...(secondaryActions || [])]}
      >
        {children}
      </Page>
    </MerchantPolarisProvider>
  );
}
