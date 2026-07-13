import { merchantKitchenTicketPath } from '../../shared/merchant_dashboard';

const IFRAME_CLEANUP_MS = 60_000;

/** URL for the kitchen ticket print page with auto-print enabled. */
export function kitchenTicketAutoPrintUrl(hashId: string, orderUuid: string): string {
  return merchantKitchenTicketPath(hashId, orderUuid, true);
}

/**
 * Load the kitchen ticket print page in a hidden iframe so the KDS stays visible.
 * The print page calls window.print() when ?print=1 is set.
 */
export function triggerKitchenTicketAutoPrint(hashId: string, orderUuid: string): void {
  if (typeof document === 'undefined') return;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Kitchen ticket print');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden';
  iframe.src = kitchenTicketAutoPrintUrl(hashId, orderUuid);

  const cleanup = () => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };

  iframe.addEventListener('load', () => {
    window.setTimeout(cleanup, IFRAME_CLEANUP_MS);
  });

  document.body.appendChild(iframe);
}
