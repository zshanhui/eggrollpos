import { expect } from 'chai';
import { shouldAutoPrintKitchenTicket } from '../../src/shared/kitchen_print';
import { isKitchenAutoPrintEnabled } from '../../src/shared/merchants';

describe('kitchen_print shared helpers', () => {
  describe('shouldAutoPrintKitchenTicket', () => {
    it('returns true for order_created with uuid when enabled', () => {
      expect(
        shouldAutoPrintKitchenTicket(true, {
          type: 'order_created',
          orderUuid: 'abc-uuid',
        })
      ).to.equal(true);
    });

    it('returns false when auto-print is disabled', () => {
      expect(
        shouldAutoPrintKitchenTicket(false, {
          type: 'order_created',
          orderUuid: 'abc-uuid',
        })
      ).to.equal(false);
    });

    it('returns false for order_updated even when enabled', () => {
      expect(
        shouldAutoPrintKitchenTicket(true, {
          type: 'order_updated',
          orderUuid: 'abc-uuid',
        })
      ).to.equal(false);
    });

    it('returns false when orderUuid is missing', () => {
      expect(
        shouldAutoPrintKitchenTicket(true, {
          type: 'order_created',
        })
      ).to.equal(false);
    });
  });

  describe('isKitchenAutoPrintEnabled', () => {
    it('treats true and 1 as enabled', () => {
      expect(isKitchenAutoPrintEnabled({ kitchen_auto_print: true })).to.equal(true);
      expect(isKitchenAutoPrintEnabled({ kitchen_auto_print: 1 })).to.equal(true);
    });

    it('treats false, 0, and null as disabled', () => {
      expect(isKitchenAutoPrintEnabled({ kitchen_auto_print: false })).to.equal(false);
      expect(isKitchenAutoPrintEnabled({ kitchen_auto_print: 0 })).to.equal(false);
      expect(isKitchenAutoPrintEnabled({ kitchen_auto_print: null })).to.equal(false);
      expect(isKitchenAutoPrintEnabled(null)).to.equal(false);
    });
  });
});
