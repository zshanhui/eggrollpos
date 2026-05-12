import React from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';

import Lazy from './components/Lazy';
import HomeLanding from './pages/HomeLanding';

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
  CheckoutPlaceholder: (props: PageProps) => <Lazy {...props} module={import('./pages/CheckoutPlaceholder')} />,
}

const SERVER_DATA = window.__VARS__ ? window.__VARS__ : null;

function App() {
  return <div>
    <BrowserRouter>

      <Switch>
        <Route path="/" exact component={HomeLanding} />
        <Route path="/about" exact component={Pages.AboutPage} />
        <Route path="/receipts/:id" exact component={Pages.Receipts} />

        {/* Merchant POS dashboard — UUID identifies the merchant */}
        <Route path="/merchant-dashboard/:uuid" exact component={Pages.MerchantRoutes} />

        {/* Merchant menu items management */}
        <Route path="/merchant-dashboard/:uuid/menuitems/add" exact component={Pages.MerchantMenuItems} />
        <Route path="/merchant-dashboard/:uuid/menuitems/:menuItemId/edit" exact component={Pages.MerchantMenuItems} />
        <Route path="/merchant-dashboard/:uuid/menuitems" exact component={Pages.MerchantMenuItems} />
        <Route path="/merchant-dashboard/:uuid/settings" exact component={Pages.MerchantSettings} />
        <Route path="/merchant-dashboard/:uuid/online-menus/add" exact component={Pages.MerchantMenus} />
        <Route path="/merchant-dashboard/:uuid/online-menus/:menuId/edit" exact component={Pages.MerchantMenus} />
        <Route path="/merchant-dashboard/:uuid/online-menus" exact component={Pages.MerchantMenus} />

        {/* Customer online ordering — public, slug-based */}
        <Route path="/online-ordering/:slug/checkout" exact component={Pages.CheckoutPlaceholder} />
        <Route path="/online-ordering/:slug" exact component={Pages.OnlineMenu} />

        {/* Customer menu webview for an existing order */}
        <Route path="/orders/:orderUuid/menus" exact component={Pages.Menus} />
      </Switch>

    </BrowserRouter>
  </div>
}

export default App;
