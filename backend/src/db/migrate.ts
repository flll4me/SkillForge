import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const migrationsDirectory = resolve(backendRoot, 'migrations');
const advisoryLockId = 730041;

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [advisoryLockId]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationFiles = (await readdir(migrationsDirectory))
      .filter((fileName) => fileName.endsWith('.sql'))
      .sort();

    for (const fileName of migrationFiles) {
      const applied = await client.query(
        'SELECT 1 FROM schema_migrations WHERE version = $1',
        [fileName],
      );
      if ((applied.rowCount ?? applied.rows.length) > 0) continue;

      const migrationSql = await readFile(resolve(migrationsDirectory, fileName), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(migrationSql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [fileName]);
        await client.query('COMMIT');
        console.log(`Applied migration ${fileName}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [advisoryLockId]);
    } finally {
      client.release();
    }
  }
}

try {
  await runMigrations();
} catch (error) {
  console.error('Database migration failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
