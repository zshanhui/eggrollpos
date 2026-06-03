/**
 * Normalize Knex insert/returning results across drivers and Knex versions.
 *
 * - Knex 0.20 + PostgreSQL: returning('id') → [42]
 * - Knex 1.0+: returning('id') → [{ id: 42 }]
 * - SQLite: returning() is unsupported; insert may return [lastRowId]
 */
export function extractInsertId(result: unknown): number {
  const row = Array.isArray(result) ? result[0] : result;

  if (typeof row === 'number' && !Number.isNaN(row)) {
    return row;
  }

  if (row && typeof row === 'object' && 'id' in row) {
    const id = Number((row as { id: unknown }).id);
    if (!Number.isNaN(id)) {
      return id;
    }
  }

  throw new Error('Could not extract insert id from Knex result');
}

/**
 * First row from .returning('*') or .returning([...columns]).
 */
export function extractReturningRow<T extends Record<string, unknown>>(
  result: unknown
): T | undefined {
  const row = Array.isArray(result) ? result[0] : result;
  if (row && typeof row === 'object') {
    return row as T;
  }
  return undefined;
}
