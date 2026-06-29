import db from '../models/db';

export function isDuplicateKeyError(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  const msg = e?.message ?? '';
  return (
    e?.code === '23505' ||
    msg.includes('UNIQUE constraint failed') ||
    msg.includes('duplicate key value')
  );
}

export async function syncPgSequence(table: string): Promise<void> {
  const client = db.client.config.client;
  if (client !== 'postgresql' && client !== 'postgres') {
    return;
  }

  try {
    await db.raw(`
      SELECT setval(
        pg_get_serial_sequence('${table}', 'id'),
        COALESCE((SELECT MAX(id) FROM "${table}"), 1),
        true
      )
    `);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!/does not exist|pg_get_serial_sequence|null/i.test(message)) {
      throw err;
    }
  }
}
