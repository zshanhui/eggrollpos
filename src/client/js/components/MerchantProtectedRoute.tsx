import React from 'react';
import MerchantLogin from './MerchantLogin';
import { useMerchantAuth } from '../context/MerchantAuthContext';

interface MerchantProtectedRouteProps {
  component: React.ComponentType<any>;
  routeProps: any;
}

export default function MerchantProtectedRoute({
  component: Component,
  routeProps,
}: MerchantProtectedRouteProps) {
  const { loading, session } = useMerchantAuth();

  if (loading) {
    return (
      <div className="Merchant Merchant__centered Merchant__loading">
        Loading
      </div>
    );
  }

  if (!session) {
    return <MerchantLogin />;
  }

  return <Component {...routeProps} />;
}
