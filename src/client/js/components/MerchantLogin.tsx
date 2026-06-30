import React, { useState } from 'react';
import {
  Banner,
  Button,
  Card,
  Form,
  FormLayout,
  Page,
  TextField,
} from '@shopify/polaris';
import MerchantPolarisProvider from './MerchantPolarisProvider';
import { useMerchantAuth } from '../context/MerchantAuthContext';

export default function MerchantLogin() {
  const { configError, signIn } = useMerchantAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MerchantPolarisProvider>
      <Page title="Merchant sign in">
        {configError && (
          <Banner status="critical">
            {configError}
          </Banner>
        )}
        <Card sectioned>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            gap: 12,
            marginBottom: 16,
          }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
              Sign in to manage your restaurant
            </h2>
            <span style={{ color: '#6d7175', fontSize: '0.9rem' }}>
              use email: demo@eggrollpos.com and pass: eggroll123 to log into the demo account.
            </span>
          </div>
          <Form onSubmit={handleSubmit}>
            <FormLayout>
              {error && (
                <Banner status="critical" onDismiss={() => setError(null)}>
                  {error}
                </Banner>
              )}
              <TextField
                label="Email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                type="email"
                disabled={Boolean(configError)}
              />
              <TextField
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                type="password"
                disabled={Boolean(configError)}
              />
              <Button
                primary
                submit
                loading={submitting}
                disabled={Boolean(configError) || !email.trim() || !password}
              >
                Sign in
              </Button>
            </FormLayout>
          </Form>
        </Card>
      </Page>
    </MerchantPolarisProvider>
  );
}
