import type { OrderStreamPayload } from './order_events';

/** Whether an SSE event should trigger kitchen ticket auto-print. */
export function shouldAutoPrintKitchenTicket(
  kitchenAutoPrintEnabled: boolean,
  event: Pick<OrderStreamPayload, 'type' | 'orderUuid'>
): boolean {
  return (
    kitchenAutoPrintEnabled &&
    event.type === 'order_created' &&
    typeof event.orderUuid === 'string' &&
    event.orderUuid.length > 0
  );
}
