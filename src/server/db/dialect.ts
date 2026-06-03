/**
 * Prefer DB_CLIENT over Knex internals — stable across Knex 0.x–3.x.
 */
export function isSqlite(): boolean {
  return process.env.DB_CLIENT === 'sqlite3';
}
