import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAdminQuestions, getAdminUsers } from './admin.js';

afterEach(() => vi.unstubAllGlobals());

describe('admin question list', () => {
  it('loads every question across pages instead of truncating the bank at one hundred', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: [{ id: 1, text: 'Question one' }],
        meta: { page: 1, limit: 100, total: 101 },
      }), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: [{ id: 101, text: 'Question 101' }],
        meta: { page: 2, limit: 100, total: 101 },
      }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getAdminQuestions('admin-token');

    expect(result.data.map((question) => question.id)).toEqual([1, 101]);
    expect(result.meta.total).toBe(101);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      '/api/admin/questions?includeInactive=true&limit=100&page=1',
      '/api/admin/questions?includeInactive=true&limit=100&page=2',
    ]);
  });
});

describe('admin user search', () => {
  it('passes a trimmed search term to the users endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: [], meta: { page: 1, limit: 20, total: 0 },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    await getAdminUsers('admin-token', '  anna@example.com  ');

    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/admin/users?search=anna%40example.com');
  });
});
