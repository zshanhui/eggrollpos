import { expect } from 'chai';
import type { Response } from 'express';
import { publishOrderEvent, subscribeMerchantOrders } from '../../src/server/services/order_events';

function createMockResponse() {
  const chunks: string[] = [];
  const res = {
    writeHead: () => res,
    write: (chunk: string) => {
      chunks.push(chunk);
      return true;
    },
    on: (event: string, handler: () => void) => {
      if (event === 'close') {
        (res as any)._closeHandler = handler;
      }
    },
    _chunks: chunks,
    _close: () => {
      (res as any)._closeHandler?.();
    },
  } as unknown as Response & { _chunks: string[]; _close: () => void };
  return res;
}

describe('order_events', () => {
  it('streams order_created events to subscribed clients', () => {
    const res = createMockResponse();
    subscribeMerchantOrders(42, res);

    publishOrderEvent({ type: 'order_created', orderId: 7, merchantId: 42 });

    const payload = res._chunks.find((c) => c.includes('order_created'));
    expect(payload).to.include('event: order_created');
    expect(payload).to.include('"orderId":7');

    res._close();
  });

  it('does not broadcast to other merchants', () => {
    const res = createMockResponse();
    subscribeMerchantOrders(1, res);

    publishOrderEvent({ type: 'order_updated', orderId: 9, merchantId: 2 });

    const payload = res._chunks.find((c) => c.includes('order_updated'));
    expect(payload).to.be.undefined;

    res._close();
  });
});
