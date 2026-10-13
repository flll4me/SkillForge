import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';

const jwtSecret = 'test-secret-for-auth-suite';
const user = {
  id: 7,
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  role: 'USER',
  status: 'ACTIVE',
};

let database: { query: ReturnType<typeof vi.fn> };
let server: ReturnType<ReturnType<typeof createApp>['listen']>;
let baseUrl: string;

beforeEach(async () => {
  database = { query: vi.fn() };
  server = createApp(database as never, jwtSecret).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address() && typeof server.address() !== 'string' ? server.address().port : 0}`;
});

afterEach(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe('authentication API', () => {
  it('registers a user with a hashed password and default USER role', async () => {
    database.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [user], rowCount: 1 });

    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: user.name, email: 'ADA@example.com', password: 'correct horse' }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ data: user });
    const [, values] = database.query.mock.calls[1];
    expect(values[0]).toBe('ada@example.com');
    expect(values[2]).toBe(user.name);
    expect(values[1]).not.toBe('correct horse');
    await expect(bcrypt.compare('correct horse', values[1])).resolves.toBe(true);
    expect(database.query.mock.calls[1][0]).toMatch(/RETURNING[\s\S]*\brole\b/i);
    expect(database.query.mock.calls[1][0]).not.toMatch(/INSERT INTO users\s*\([^)]*\brole\b/i);
  });

  it('rejects malformed registration data without writing to the database', async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Ada', email: 'bad-email', password: 'short' }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
    expect(database.query).not.toHaveBeenCalled();
  });

  it('returns conflict when the email is already registered', async () => {
    database.query.mockResolvedValueOnce({ rows: [user], rowCount: 1 });

    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: user.name, email: user.email, password: 'correct horse' }),
    });

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'EMAIL_ALREADY_EXISTS' } });
    expect(database.query).toHaveBeenCalledTimes(1);
  });

  it('logs in an active user and returns a signed access token', async () => {
    const passwordHash = await bcrypt.hash('correct horse', 4);
    database.query.mockResolvedValueOnce({ rows: [{ ...user, password_hash: passwordHash }], rowCount: 1 });

    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: 'correct horse' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.accessToken).toEqual(expect.any(String));
    const payload = jwt.verify(body.data.accessToken, jwtSecret);
    expect(payload).toMatchObject({ sub: String(user.id), role: user.role });
    expect((payload as jwt.JwtPayload).exp! - (payload as jwt.JwtPayload).iat!).toBe(30 * 24 * 60 * 60);
  });

  it('rejects wrong credentials without revealing which field was wrong', async () => {
    const passwordHash = await bcrypt.hash('correct horse', 4);
    database.query.mockResolvedValueOnce({ rows: [{ ...user, password_hash: passwordHash }], rowCount: 1 });

    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: 'wrong password' }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: 'INVALID_CREDENTIALS' } });
  });

  it('returns the signed-in user from the bearer token', async () => {
    const token = jwt.sign({ role: user.role }, jwtSecret, { subject: String(user.id), expiresIn: '15m' });
    database.query.mockResolvedValueOnce({ rows: [user], rowCount: 1 });

    const response = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: user });
  });

  it('rejects missing or invalid bearer tokens', async () => {
    const missing = await fetch(`${baseUrl}/api/auth/me`);
    const invalid = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { authorization: 'Bearer invalid-token' },
    });

    expect(missing.status).toBe(401);
    expect(invalid.status).toBe(401);
    expect(database.query).not.toHaveBeenCalled();
  });
});
