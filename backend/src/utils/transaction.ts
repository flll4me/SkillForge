import type { Database, DatabaseClient } from '../types/database.js';

export async function withTransaction<T>(database: Database, callback: (client: DatabaseClient) => Promise<T>): Promise<T> {
  const client = await database.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
