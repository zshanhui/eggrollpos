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
        <Card title="Sign in to manage your restaurant" sectioned>
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
