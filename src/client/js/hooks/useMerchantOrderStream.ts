import { useEffect, useRef, useState } from 'react';
import type { OrderStreamPayload } from '../../../shared/order_events';

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

    setConnectionStatus('connecting');
    const es = new EventSource(`/api/merchants/${merchantId}/orders/stream`);

    const handleEvent = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as OrderStreamPayload;
        onEventRef.current(data);
      } catch {
        // ignore malformed payloads
      }
    };

    es.addEventListener('order_created', handleEvent);
    es.addEventListener('order_updated', handleEvent);

    es.onopen = () => setConnectionStatus('live');
    es.onerror = () => setConnectionStatus('reconnecting');

    return () => es.close();
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
