import { expect } from 'chai';
import { extractInsertId, extractReturningRow } from '../../src/server/db/insert-id';

describe('extractInsertId', () => {
  it('extracts a bare number (SQLite last insert id)', () => {
    expect(extractInsertId([42])).to.equal(42);
  });

  it('extracts id from Knex 1+ returning object', () => {
    expect(extractInsertId([{ id: 7 }])).to.equal(7);
  });

  it('extracts a single object without array wrapper', () => {
    expect(extractInsertId({ id: 3 })).to.equal(3);
  });

  it('throws when result is empty', () => {
    expect(() => extractInsertId([])).to.throw('Could not extract insert id');
  });
});

describe('extractReturningRow', () => {
  it('returns the first row object', () => {
    const row = extractReturningRow<{ id: number; name: string }>([
      { id: 1, name: 'Latte' },
    ]);
    expect(row).to.deep.equal({ id: 1, name: 'Latte' });
  });

  it('returns undefined for empty results', () => {
    expect(extractReturningRow([])).to.equal(undefined);
  });
});
