import { afterAll, beforeAll, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';

let directory: string;
let server: ReturnType<ReturnType<typeof createApp>['listen']>;
let baseUrl: string;

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'skillforge-web-'));
  await writeFile(join(directory, 'index.html'), '<!doctype html><div id="root">SkillForge</div>');
  await writeFile(join(directory, 'app.js'), 'console.log("SkillForge");');
  server = createApp({ query: async () => ({ rows: [], rowCount: 0 }) } as never,
    'test-only-secret', 10, undefined, directory).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing server address');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  await rm(directory, { recursive: true, force: true });
});

it('serves the frontend at the root and on direct React route navigation', async () => {
  for (const path of ['/', '/questions', '/interviews/42']) {
    const response = await fetch(`${baseUrl}${path}`, { headers: { accept: 'text/html' } });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(await response.text()).toContain('id="root"');
  }
});

it('serves built assets and preserves API JSON responses', async () => {
  expect(await (await fetch(`${baseUrl}/app.js`)).text()).toContain('console.log');
  const health = await fetch(`${baseUrl}/api/health`);
  expect(await health.json()).toEqual({ status: 'ok', database: 'connected' });
  const missing = await fetch(`${baseUrl}/api/missing`, { headers: { accept: 'text/html' } });
  expect(missing.status).toBe(404);
  expect(await missing.json()).toMatchObject({ error: { code: 'NOT_FOUND' } });
});
