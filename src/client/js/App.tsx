import React from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';

import Lazy from './components/Lazy';
import HomeLanding from './pages/HomeLanding';
import { MERCHANT_DASHBOARD_PREFIXES } from '../../shared/merchant_dashboard';
import MerchantProtectedRoute from './components/MerchantProtectedRoute';
import { MerchantAuthProvider } from './context/MerchantAuthContext';

// Global types are defined in src/types/global.d.ts

interface PageProps {
  [key: string]: any;
}

const Pages = {
  AboutPage: (props: PageProps) => <Lazy {...props} module={import('./pages/About')} />,
  Receipts: (props: PageProps) => <Lazy {...props} module={import('./pages/Receipts')} />,
  MerchantRoutes: (props: PageProps) => <Lazy {...props} module={import('./pages/MerchantRoutes')} />,
  MerchantMenuItems: (props: PageProps) => <Lazy {...props} module={import('./pages/MerchantMenuItems')} />,
  MerchantSettings: (props: PageProps) => <Lazy {...props} module={import('./pages/MerchantSettings')} />,
  MerchantMenus: (props: PageProps) => <Lazy {...props} module={import('./pages/MerchantMenus')} />,
  CustomerRoutes: (props: PageProps) => <Lazy {...props} module={import('./pages/CustomerRoutes')} />,
  Menus: (props: PageProps) => <Lazy {...props} module={import('./pages/Menus')} />,
  OnlineMenu: (props: PageProps) => <Lazy {...props} module={import('./pages/OnlineMenu')} />,
  Checkout: (props: PageProps) => <Lazy {...props} module={import('./pages/Checkout')} />,
}

const MERCHANT_DASHBOARD_ROUTES = [
  { path: '/:hashId', exact: true, component: Pages.MerchantRoutes },
  { path: '/:hashId/menuitems/add', exact: true, component: Pages.MerchantMenuItems },
  { path: '/:hashId/menuitems/:menuItemId/edit', exact: true, component: Pages.MerchantMenuItems },
  { path: '/:hashId/menuitems', exact: true, component: Pages.MerchantMenuItems },
  { path: '/:hashId/settings', exact: true, component: Pages.MerchantSettings },
  { path: '/:hashId/online-menus/add', exact: true, component: Pages.MerchantMenus },
  { path: '/:hashId/online-menus/:menuId/edit', exact: true, component: Pages.MerchantMenus },
  { path: '/:hashId/online-menus', exact: true, component: Pages.MerchantMenus },
] as const;

function App() {
  return <div>
    <MerchantAuthProvider>
      <BrowserRouter>

      <Switch>
        <Route path="/" exact component={HomeLanding} />
        <Route path="/about" exact component={Pages.AboutPage} />
        <Route path="/receipts/:uuid" exact component={Pages.Receipts} />

        {MERCHANT_DASHBOARD_PREFIXES.flatMap((prefix) =>
          MERCHANT_DASHBOARD_ROUTES.map((route) => (
            <Route
              key={`${prefix}${route.path}`}
              path={`${prefix}${route.path}`}
              exact={route.exact}
              render={(props) => (
                <MerchantProtectedRoute component={route.component} routeProps={props} />
              )}
            />
          ))
        )}

        {/* Customer online ordering — public, slug-based */}
        <Route path="/online-ordering/:slug/checkout" exact component={Pages.Checkout} />
        <Route path="/online-ordering/:slug" exact component={Pages.OnlineMenu} />

        {/* Customer menu webview for an existing order */}
        <Route path="/orders/:orderUuid/menus" exact component={Pages.Menus} />
      </Switch>

      </BrowserRouter>
    </MerchantAuthProvider>
  </div>
}

export default App;
