import { useCallback } from 'react';
import type { OrderStreamPayload } from '../../../shared/order_events';
import { shouldAutoPrintKitchenTicket } from '../../../shared/kitchen_print';
import { triggerKitchenTicketAutoPrint } from '../lib/kitchenTicketPrint';

/**
 * Returns a stream handler that auto-prints kitchen tickets for new orders when enabled.
 */
export function useKitchenAutoPrintHandler(
  merchantHashId: string,
  kitchenAutoPrintEnabled: boolean
) {
  return useCallback(
    (event: OrderStreamPayload) => {
      if (!shouldAutoPrintKitchenTicket(kitchenAutoPrintEnabled, event)) return;
      triggerKitchenTicketAutoPrint(merchantHashId, event.orderUuid!);
    },
    [merchantHashId, kitchenAutoPrintEnabled]
  );
}
