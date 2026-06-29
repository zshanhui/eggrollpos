import { useEffect, useState } from 'react';
import type { MerchantRow } from '../../../shared/merchants';
import { isMerchantHashId } from '../../../shared/merchant_dashboard';
import { fetchApi } from '../lib/merchantApi';

export function useMerchantHashRoute(
  hashId: string | undefined,
  t: (key: string) => string,
) {
  const [merchant, setMerchant] = useState<MerchantRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hashId) {
      setError(t('merchant.noHashId'));
      setMerchant(null);
      return;
    }
    if (!isMerchantHashId(hashId)) {
      setError(t('merchant.invalidHashId'));
      setMerchant(null);
      return;
    }

    setError(null);
    setMerchant(null);
    fetchApi(`/api/merchants/${hashId}`)
      .then(async (data) => {
        if (!data || !data.id) {
          setError(t('merchant.notFound'));
          return;
        }
        await fetchApi(`/api/merchants/${data.id}/authz`);
        setMerchant(data);
      })
      .catch((err) => setError(err.message || t('merchant.loadFailed')));
  }, [hashId, t]);

  const merchantHashId = merchant?.hash_id || (isMerchantHashId(hashId) ? hashId : '');

  return { merchant, error, merchantHashId };
}
