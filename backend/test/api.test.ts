import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';

const calls: Array<{ sql: string; values: unknown[] }> = [];
let queryResult: { rows: Record<string, unknown>[]; rowCount: number | null } = { rows: [], rowCount: 0 };
let queryError: Error | undefined;
let databaseRole = 'USER';
let databaseStatus = 'ACTIVE';
const database = {
  async query(sql: string, values: unknown[] = []) {
    calls.push({ sql, values });
    if (queryError) throw queryError;
    if (sql.includes('COUNT(*)::int AS total') && sql.includes('FROM questions AS question')) {
      return { rows: [{ total: 1 }], rowCount: 1 };
    }
    if (sql.includes('SELECT role, status FROM users')) {
      return { rows: [{ role: databaseRole, status: databaseStatus }], rowCount: 1 };
    }
    return queryResult;
  },
};

let server: ReturnType<ReturnType<typeof createApp>['listen']>;
let baseUrl: string;

beforeAll(async () => {
  server = createApp(database as never, 'test-only-secret', 7).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address() && typeof server.address() !== 'string' ? server.address().port : 0}`;
});

beforeEach(() => {
  calls.length = 0;
  queryResult = { rows: [], rowCount: 0 };
  queryError = undefined;
  databaseRole = 'USER';
  databaseStatus = 'ACTIVE';
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe('public API', () => {
  it('confirms PostgreSQL connectivity', async () => {
    queryResult = { rows: [{ '?column?': 1 }], rowCount: 1 };
    const response = await fetch(`${baseUrl}/api/health`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', database: 'connected' });
    expect(calls[0].sql).toBe('SELECT 1');
  });

  it('reports database failures from the health endpoint', async () => {
    queryError = new Error('database unavailable');
    const response = await fetch(`${baseUrl}/api/health`);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ detail: { status: 'error', database: 'unavailable' } });
  });

  it('returns the configured interview length with each available skill', async () => {
    queryResult = { rows: [{ id: 4, name: 'React', description: '', questionCount: 12 }], rowCount: 1 };
    const response = await fetch(`${baseUrl}/api/skills`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: [{ id: 4, name: 'React', description: '', questionCount: 12, interviewQuestionCount: 7 }] });
  });

  it('denies regular users access to the question catalog', async () => {
    const token = jwt.sign({ role: 'USER' }, 'test-only-secret', { subject: '7' });
    const response = await fetch(`${baseUrl}/api/questions?skillId=2&difficulty=MEDIUM`, {
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: 'FORBIDDEN' } });
    expect(calls[0].sql).toContain('SELECT role, status FROM users');
  });

  it('filters the admin question catalog by skill and difficulty without exposing correct answers', async () => {
    databaseRole = 'ADMIN';
    const token = jwt.sign({ role: 'ADMIN' }, 'test-only-secret', { subject: '7' });
    queryResult = { rows: [{ id: 5, skill: 'JavaScript', text: 'Что вернёт Promise.all?', difficulty: 'MEDIUM' }], rowCount: 1 };
    const response = await fetch(`${baseUrl}/api/questions?skillId=2&difficulty=MEDIUM`, {
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: queryResult.rows, meta: { page: 1, limit: 50, total: 1 } });
    expect(calls[1].values).toEqual([2, 'MEDIUM']);
    expect(calls[2].values).toEqual([2, 'MEDIUM', 50, 0]);
    expect(calls[2].sql).toMatch(/question\.difficulty = \$2/i);
    expect(calls[2].sql).toMatch(/question\.is_active = TRUE/i);
    expect(calls[2].sql).not.toMatch(/question_options|is_correct/i);
  });

  it('rejects invalid question catalog filters for admins', async () => {
    databaseRole = 'ADMIN';
    const token = jwt.sign({ role: 'ADMIN' }, 'test-only-secret', { subject: '7' });
    const response = await fetch(`${baseUrl}/api/questions?skillId=0&difficulty=EXPERT`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(422);
    expect(calls).toHaveLength(1);
  });

  it('filters and orders legacy practice prompts by track and level', async () => {
    queryResult = {
      rows: [{ topic: 'API', prompt: 'First question' }, { topic: 'Database', prompt: 'Second question' }],
      rowCount: 2,
    };
    const response = await fetch(`${baseUrl}/api/interviews/questions?track=Backend&level=Middle`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ track: 'Backend', level: 'Middle', questions: queryResult.rows });
    expect(calls[0].values).toEqual(['Backend', 'Middle']);
    expect(calls[0].sql).toMatch(/FROM interview_question_prompts/i);
    expect(calls[0].sql).toMatch(/ORDER BY position/i);
  });

  it('returns a not-found error for an empty question set', async () => {
    const response = await fetch(`${baseUrl}/api/interviews/questions?track=Fullstack&level=Junior%2B`);
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: 'QUESTIONS_NOT_FOUND' } });
  });

  it('rejects unsupported track or level without querying the database', async () => {
    const badTrack = await fetch(`${baseUrl}/api/interviews/questions?track=Mobile&level=Middle`);
    const badLevel = await fetch(`${baseUrl}/api/interviews/questions?track=Backend&level=Expert`);
    expect(badTrack.status).toBe(422);
    expect(badLevel.status).toBe(422);
    expect(calls).toHaveLength(0);
  });

  it('reports database errors while reading questions', async () => {
    queryError = new Error('database unavailable');
    const response = await fetch(`${baseUrl}/api/interviews/questions?track=Frontend&level=Junior`);
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: 'DATABASE_UNAVAILABLE' } });
  });

  it('denies regular users access to the admin API', async () => {
    const token = jwt.sign({ role: 'USER' }, 'test-only-secret', { subject: '7' });
    const response = await fetch(`${baseUrl}/api/admin/statistics`, {
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: 'FORBIDDEN' } });
  });

  it('allows an active admin using the current database role', async () => {
    databaseRole = 'ADMIN';
    const token = jwt.sign({ role: 'ADMIN' }, 'test-only-secret', { subject: '7' });
    const response = await fetch(`${baseUrl}/api/admin/statistics`, {
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    expect(calls[0].sql).toContain('SELECT role, status FROM users');
  });

  it('denies blocked admins even when their token has the ADMIN role', async () => {
    databaseRole = 'ADMIN';
    databaseStatus = 'BLOCKED';
    const token = jwt.sign({ role: 'ADMIN' }, 'test-only-secret', { subject: '7' });
    const response = await fetch(`${baseUrl}/api/admin/statistics`, {
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(401);
  });
});
