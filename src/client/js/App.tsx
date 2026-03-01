import React from 'react';
import {Router, Route, Switch} from 'react-router-dom';
import {createBrowserHistory} from 'history';

import Lazy from './components/Lazy';
import HomeLanding from './pages/HomeLanding';

// Global types are defined in src/types/global.d.ts

const history = createBrowserHistory();

interface PageProps {
  [key: string]: any;
}

const Pages = {
  AboutPage: (props: PageProps) => <Lazy {...props} module={import('./pages/About')} />,
  Receipts: (props: PageProps) => <Lazy {...props} module={import('./pages/Receipts')} />,
  MerchantRoutes: (props: PageProps) => <Lazy {...props} module={import('./pages/MerchantRoutes')} />,
  MerchantMenuItems: (props: PageProps) => <Lazy {...props} module={import('./pages/MerchantMenuItems')} />,
  CustomerRoutes: (props: PageProps) => <Lazy {...props} module={import('./pages/CustomerRoutes')} />,
  Menus: (props: PageProps) => <Lazy {...props} module={import('./pages/Menus')} />,
}

const SERVER_DATA = window.__VARS__ ? window.__VARS__ : null;

function App() {
  return <div>
    <Router history={history}>

      <Switch>
        <Route path="/" exact component={HomeLanding} />
        <Route path="/about" exact component={Pages.AboutPage} />
        <Route path="/receipts/:id" exact component={Pages.Receipts} />

        {/* Merchant POS dashboard — UUID identifies the merchant */}
        <Route path="/merchant/:uuid" exact component={Pages.MerchantRoutes} />

        {/* Merchant menu items management */}
        <Route path="/merchant/:uuid/menuitems/add" exact component={Pages.MerchantMenuItems} />
        <Route path="/merchant/:uuid/menuitems/:menuItemId/edit" exact component={Pages.MerchantMenuItems} />
        <Route path="/merchant/:uuid/menuitems" exact component={Pages.MerchantMenuItems} />

        {/* Customer online ordering — scoped to a specific merchant */}
        <Route path="/order-online/:merchantId" exact component={Pages.CustomerRoutes} />

        {/* Customer menu webview for an existing order */}
        <Route path="/orders/:orderUuid/menus" exact component={Pages.Menus} />
      </Switch>

    </Router>
  </div>
}

export default App;
