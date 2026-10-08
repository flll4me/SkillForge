import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import type { PoolClient } from 'pg';
import { pool } from '../src/db/pool.js';
import { createApp } from '../src/app.js';
import type { Database } from '../src/types/database.js';

// Explicit opt-in: all fixture rows are contained in one rolled-back transaction.
describe.skipIf(process.env.RUN_DATABASE_TESTS !== '1')('activity storage in PostgreSQL', () => {
  let client: PoolClient;
  let server: ReturnType<ReturnType<typeof createApp>['listen']>;
  let baseUrl: string;
  let userIds: string[];
  beforeAll(async () => {
    client = await pool.connect();
    await client.query('BEGIN');
    const result = await client.query(`INSERT INTO users (email, password_hash, name)
      VALUES ($1, 'test-unusable-password', 'Analytics test'), ($2, 'test-unusable-password', 'Other analytics test') RETURNING id`,
      [`${randomUUID()}@analytics.test`, `${randomUUID()}@analytics.test`]);
    userIds = result.rows.map((row) => String(row.id));
    server = createApp({ query: client.query.bind(client) } as unknown as Database, 'activity-test-secret').listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing test server address');
    baseUrl = `http://127.0.0.1:${address.port}`;
  });
  afterAll(async () => {
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
    if (client) { await client.query('ROLLBACK'); client.release(); }
    await pool.end();
  });
  it('does not double-count repeated samples or let another account change a visit', async () => {
    const sessionId = randomUUID();
    const post = (userId: string, seconds: number) => fetch(`${baseUrl}/api/users/me/activity`, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${jwt.sign({ role: 'USER' }, 'activity-test-secret', { subject: userId })}` },
      body: JSON.stringify({ sessionId, activeSeconds: seconds }),
    });
    expect((await post(userIds[0], 0)).status).toBe(204);
    await client.query("UPDATE activity_sessions SET last_seen_at = NOW() - INTERVAL '15 seconds' WHERE id = $1", [sessionId]);
    expect((await post(userIds[0], 15)).status).toBe(204);
    expect((await post(userIds[0], 15)).status).toBe(204);
    expect((await post(userIds[0], 10)).status).toBe(204);
    expect((await post(userIds[1], 60)).status).toBe(403);
    const result = await client.query('SELECT user_id, active_seconds FROM activity_sessions WHERE id = $1', [sessionId]);
    expect(String(result.rows[0].user_id)).toBe(userIds[0]);
    expect(result.rows[0].active_seconds).toBe(15);
    expect((await post(userIds[0], 86401)).status).toBe(400);
  });
});
