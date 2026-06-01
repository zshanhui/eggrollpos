import { expect } from 'chai';
import { normalizeEmail, normalizePhoneE164, hasContactMethod } from '../../src/shared/contact';

describe('contact normalization', () => {
  it('normalizes phone to E.164', () => {
    expect(normalizePhoneE164('+1 (631) 555-1234')).to.equal('+16315551234');
  });

  it('rejects invalid phone', () => {
    expect(normalizePhoneE164('abc')).to.equal(null);
  });

  it('normalizes email', () => {
    expect(normalizeEmail('  User@Example.COM ')).to.equal('user@example.com');
  });

  it('requires at least one contact method', () => {
    expect(hasContactMethod('+15551234', null)).to.equal(true);
    expect(hasContactMethod(null, 'a@b.co')).to.equal(true);
    expect(hasContactMethod(null, null)).to.equal(false);
  });
});
