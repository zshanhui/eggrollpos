import { useEffect, useRef, useState } from 'react';
import type { OrderStreamPayload } from '../../../shared/order_events';
import { postApi } from '../lib/merchantApi';

export type ConnectionStatus = 'connecting' | 'live' | 'reconnecting';

export function useMerchantOrderStream(
  merchantId: number,
  onEvent: (event: OrderStreamPayload) => void,
) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!merchantId) return;

    let es: EventSource | null = null;
    let closed = false;
    setConnectionStatus('connecting');

    const handleEvent = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as OrderStreamPayload;
        onEventRef.current(data);
      } catch {
        // ignore malformed payloads
      }
    };

    postApi(`/api/merchants/${merchantId}/orders/stream-token`, {})
      .then((data) => {
        if (closed) return;
        const token = encodeURIComponent((data as { token: string }).token);
        es = new EventSource(`/api/merchants/${merchantId}/orders/stream?token=${token}`);

        es.addEventListener('order_created', handleEvent);
        es.addEventListener('order_updated', handleEvent);

        es.onopen = () => setConnectionStatus('live');
        es.onerror = () => setConnectionStatus('reconnecting');
      })
      .catch(() => setConnectionStatus('reconnecting'));

    return () => {
      closed = true;
      if (es) es.close();
    };
  }, [merchantId]);

  return { connectionStatus };
}

export function useElapsedTick(intervalMs = 30_000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}
