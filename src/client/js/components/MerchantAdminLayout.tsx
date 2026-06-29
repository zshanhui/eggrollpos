import React from 'react';
import { Page } from '@shopify/polaris';
import type { MenuActionDescriptor, PageProps } from '@shopify/polaris';
import LangSwitcher from './LangSwitcher';
import MerchantPolarisProvider from './MerchantPolarisProvider';

interface MerchantAdminLayoutProps {
  merchantUuid: string;
  title: string;
  onBack: () => void;
  backLabel: string;
  primaryAction?: PageProps['primaryAction'];
  secondaryActions?: MenuActionDescriptor[];
  children: React.ReactNode;
  showNav?: boolean;
}

export default function MerchantAdminLayout({
  merchantUuid,
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
        { content: 'Menus', url: `/merchant-dashboard/${merchantUuid}/online-menus` },
        { content: 'Menu Items', url: `/merchant-dashboard/${merchantUuid}/menuitems` },
        { content: 'Settings', url: `/merchant-dashboard/${merchantUuid}/settings` },
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
