import type { Response } from 'express';
import type { OrderEvent } from '../../shared/order_events';

type Subscriber = Response;

const subscribersByMerchant = new Map<number, Set<Subscriber>>();
const HEARTBEAT_MS = 30_000;

export function subscribeMerchantOrders(merchantId: number, res: Response): void {
  if (!subscribersByMerchant.has(merchantId)) {
    subscribersByMerchant.set(merchantId, new Set());
  }
  subscribersByMerchant.get(merchantId)!.add(res);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': connected\n\n');

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, HEARTBEAT_MS);

  res.on('close', () => {
    clearInterval(heartbeat);
    const subs = subscribersByMerchant.get(merchantId);
    if (!subs) return;
    subs.delete(res);
    if (subs.size === 0) {
      subscribersByMerchant.delete(merchantId);
    }
  });
}

export function publishOrderEvent(event: OrderEvent): void {
  const subs = subscribersByMerchant.get(event.merchantId);
  if (!subs || subs.size === 0) return;

  const data = JSON.stringify({
    type: event.type,
    orderId: event.orderId,
  });

  for (const res of subs) {
    res.write(`event: ${event.type}\ndata: ${data}\n\n`);
  }
}
