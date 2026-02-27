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

        {/* Merchant dashboard entry point */}
        <Route path="/merchant" exact component={Pages.MerchantRoutes} />

        {/* Ordering and Menu routes */}
        <Route path="/orders/:orderUuid/menus" exact component={Pages.Menus} />

        {/* Customer webview entry point: menus, receipts? */}
        <Route path="/customer" exact component={Pages.CustomerRoutes} />
      </Switch>

    </Router>
  </div>
}

export default App;
