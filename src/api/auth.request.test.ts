import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, loginAccount } from './auth.js';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('authentication API responses', () => {
  it('returns the access token from a valid JSON response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(
      JSON.stringify({ data: { accessToken: 'token' } }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ));

    await expect(loginAccount({ email: 'ada@example.com', password: 'password' }))
      .resolves.toEqual({ accessToken: 'token' });
  });

  it('shows a useful error when the backend returns an empty response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 502 }));

    await expect(loginAccount({ email: 'ada@example.com', password: 'password' }))
      .rejects.toMatchObject({
        name: 'ApiError',
        message: 'Сервер вернул пустой ответ. Проверь, запущен ли backend.',
        status: 502,
      });
  });

  it('shows a useful error when the backend returns non-JSON content', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('<html>proxy error</html>', { status: 502 }));

    await expect(loginAccount({ email: 'ada@example.com', password: 'password' }))
      .rejects.toMatchObject({ name: 'ApiError', status: 502 });
  });

  it('turns a network failure into a backend availability message', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(loginAccount({ email: 'ada@example.com', password: 'password' }))
      .rejects.toEqual(expect.objectContaining({
        name: 'ApiError',
        message: 'Не удалось подключиться к серверу. Проверь, запущен ли backend.',
        status: 0,
      }));
  });

  it('preserves JSON API error messages', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(
      JSON.stringify({ error: { message: 'Email or password is incorrect.' } }),
      { status: 401, headers: { 'content-type': 'application/json' } },
    ));

    await expect(loginAccount({ email: 'ada@example.com', password: 'bad' }))
      .rejects.toEqual(expect.objectContaining(new ApiError('Email or password is incorrect.', 401)));
  });
});
