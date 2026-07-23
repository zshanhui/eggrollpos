import { expect } from 'chai';
import { computeCurrentlyOpen, type BusinessHours } from '../../src/shared/business_hours';
import { DEFAULT_SALES_TAX_RATE, SALES_TAX } from '../../src/shared/constants';

describe('computeCurrentlyOpen', () => {
  const weekdayLunch: BusinessHours = {
    mon: { open: '11:00', close: '14:00' },
    tue: { open: '11:00', close: '14:00' },
    wed: { open: '11:00', close: '14:00' },
    thu: { open: '11:00', close: '14:00' },
    fri: { open: '11:00', close: '14:00' },
    sat: { open: null, close: null },
    sun: { open: null, close: null },
  };

  it('returns true when businessHours is null', () => {
    expect(computeCurrentlyOpen(null, 'America/New_York')).to.equal(true);
  });

  it('evaluates wall-clock time in the merchant timezone', () => {
    // Tuesday 2026-07-14 16:30 UTC = 12:30 America/New_York (EDT)
    const noonishEt = new Date('2026-07-14T16:30:00Z');
    expect(computeCurrentlyOpen(weekdayLunch, 'America/New_York', noonishEt)).to.equal(true);

    // Same instant is 16:30 UTC — closed if timezone is UTC
    expect(computeCurrentlyOpen(weekdayLunch, 'UTC', noonishEt)).to.equal(false);
  });

  it('returns false outside open hours in that timezone', () => {
    // Tuesday 2026-07-14 20:00 UTC = 16:00 America/New_York
    const afternoonEt = new Date('2026-07-14T20:00:00Z');
    expect(computeCurrentlyOpen(weekdayLunch, 'America/New_York', afternoonEt)).to.equal(false);
  });

  it('returns false on closed days', () => {
    // Sunday 2026-07-12 16:30 UTC = 12:30 ET
    const sundayNoonEt = new Date('2026-07-12T16:30:00Z');
    expect(computeCurrentlyOpen(weekdayLunch, 'America/New_York', sundayNoonEt)).to.equal(false);
  });

  it('handles overnight windows', () => {
    const overnight: BusinessHours = {
      fri: { open: '22:00', close: '02:00' },
    };
    // Friday 23:30 ET = Saturday 03:30 UTC (EDT)
    const lateFri = new Date('2026-07-18T03:30:00Z');
    expect(computeCurrentlyOpen(overnight, 'America/New_York', lateFri)).to.equal(true);

    // Saturday 01:00 ET = Saturday 05:00 UTC
    const earlySat = new Date('2026-07-18T05:00:00Z');
    expect(computeCurrentlyOpen(overnight, 'America/New_York', earlySat)).to.equal(true);
  });

  it('falls back to UTC for invalid timezones', () => {
    const atUtcNoon = new Date('2026-07-14T12:00:00Z');
    expect(computeCurrentlyOpen(weekdayLunch, 'Not/A_Zone', atUtcNoon)).to.equal(true);
  });
});

describe('shared tax constants', () => {
  it('exports a default sales tax rate used by checkout', () => {
    expect(DEFAULT_SALES_TAX_RATE).to.equal(SALES_TAX.SINGAPORE);
    expect(DEFAULT_SALES_TAX_RATE).to.equal(0.07);
  });
});
