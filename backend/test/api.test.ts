import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';

const calls: Array<{ sql: string; values: unknown[] }> = [];
let analysisRows: Record<string, unknown>[] = [];
let interviewRow: Record<string, unknown> | undefined;
let explainerCalls: unknown[][] = [];
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
    if (sql.includes('STRING_AGG(DISTINCT correct_option.text')) return { rows: analysisRows, rowCount: analysisRows.length };
    if (sql.includes('skill.name AS skill_name') && sql.includes('COUNT(interview_question.id)')) {
      return { rows: interviewRow ? [interviewRow] : [], rowCount: interviewRow ? 1 : 0 };
    }
    return queryResult;
  },
};

let server: ReturnType<ReturnType<typeof createApp>['listen']>;
let baseUrl: string;

beforeAll(async () => {
  server = createApp(database as never, 'test-only-secret', 7, async (answers) => {
    explainerCalls.push(answers as unknown as unknown[]);
    return { summary: 'Повтори работу промисов.', explanations: [{ questionOrder: 1, explanation: 'then возвращает новый Promise.' }] };
  }).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address() && typeof server.address() !== 'string' ? server.address().port : 0}`;
});

beforeEach(() => {
  calls.length = 0;
  queryResult = { rows: [], rowCount: 0 };
  queryError = undefined;
  databaseRole = 'USER';
  databaseStatus = 'ACTIVE';
  analysisRows = [];
  interviewRow = undefined;
  explainerCalls = [];
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe('public API', () => {
  it('requires authentication before recording activity', async () => {
    const response = await fetch(`${baseUrl}/api/users/me/activity`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    expect(response.status).toBe(401);
    expect(calls).toHaveLength(0);
  });

  it('rejects invalid activity duration before writing to the database', async () => {
    const token = jwt.sign({ role: 'USER' }, 'test-only-secret', { subject: '7' });
    const response = await fetch(`${baseUrl}/api/users/me/activity`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: '1bb25a92-fad4-4332-9705-ad78a2f5a641', activeSeconds: -1 }) });
    expect(response.status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it('binds an activity sample to the authenticated user, ignoring a supplied user id', async () => {
    queryResult = { rows: [{ id: '1bb25a92-fad4-4332-9705-ad78a2f5a641' }], rowCount: 1 };
    const token = jwt.sign({ role: 'USER' }, 'test-only-secret', { subject: '7' });
    const response = await fetch(`${baseUrl}/api/users/me/activity`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: '1bb25a92-fad4-4332-9705-ad78a2f5a641', activeSeconds: 15, userId: 999 }) });
    expect(response.status).toBe(204);
    expect(calls[0].values).toEqual(['1bb25a92-fad4-4332-9705-ad78a2f5a641', '7', 15]);
  });

  it('rejects unsupported statistics periods for admins', async () => {
    databaseRole = 'ADMIN';
    const token = jwt.sign({ role: 'ADMIN' }, 'test-only-secret', { subject: '7' });
    const response = await fetch(`${baseUrl}/api/admin/statistics?days=1000`, { headers: { authorization: `Bearer ${token}` } });
    expect(response.status).toBe(400);
  });
  it('generates explanations only from the authenticated user’s completed interview answers', async () => {
    interviewRow = { id: 42, user_id: 7, skill_id: 1, skill_name: 'JavaScript', difficulty: 'EASY', current_difficulty: 'EASY', status: 'COMPLETED', score: 0, started_at: '', completed_at: '', total_questions: 1 };
    analysisRows = [{ order: 1, question: 'Что возвращает then?', difficulty: 'EASY', correct_answer: 'Promise', selected_answer: 'undefined', is_correct: false }];
    const token = jwt.sign({ role: 'USER' }, 'test-only-secret', { subject: '7' });
    const response = await fetch(`${baseUrl}/api/interviews/42/analysis`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: '{}' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { summary: 'Повтори работу промисов.', explanations: [{ questionOrder: 1, explanation: 'then возвращает новый Promise.' }] } });
    expect(explainerCalls).toEqual([[{ questionOrder: 1, question: 'Что возвращает then?', difficulty: 'EASY', correctAnswer: 'Promise', selectedAnswer: 'undefined' }]]);
    expect(calls.some(({ sql }) => sql.includes('user_answer_options'))).toBe(true);
  });

  it('does not allow AI analysis before an interview is completed', async () => {
    interviewRow = { id: 42, user_id: 7, skill_id: 1, skill_name: 'JavaScript', difficulty: 'EASY', current_difficulty: 'EASY', status: 'IN_PROGRESS', score: null, started_at: '', completed_at: null, total_questions: 1 };
    const token = jwt.sign({ role: 'USER' }, 'test-only-secret', { subject: '7' });
    const response = await fetch(`${baseUrl}/api/interviews/42/analysis`, { method: 'POST', headers: { authorization: `Bearer ${token}` } });
    expect(response.status).toBe(409);
    expect(explainerCalls).toHaveLength(0);
  });

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
