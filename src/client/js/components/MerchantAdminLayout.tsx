import React from 'react';
import { Page } from '@shopify/polaris';
import type { MenuActionDescriptor, PageProps } from '@shopify/polaris';
import { merchantDashboardPath } from '../../../shared/merchant_dashboard';
import LangSwitcher from './LangSwitcher';
import MerchantPolarisProvider from './MerchantPolarisProvider';

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
  const navActions = showNav
    ? [
        { content: 'Menus', url: merchantDashboardPath(merchantHashId, 'online-menus') },
        { content: 'Menu Items', url: merchantDashboardPath(merchantHashId, 'menuitems') },
        { content: 'Settings', url: merchantDashboardPath(merchantHashId, 'settings') },
      ]
    : [];

  return (
    <MerchantPolarisProvider>
      <Page
        title={title}
        titleMetadata={<LangSwitcher />}
        backAction={{ content: backLabel, onAction: onBack }}
        primaryAction={primaryAction}
        secondaryActions={[...navActions, ...(secondaryActions || [])]}
      >
        {children}
      </Page>
    </MerchantPolarisProvider>
  );
}
