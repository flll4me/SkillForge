import { createApp } from './app.js';
import { config } from './config.js';
import { pool } from './db/pool.js';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../../dist');
const app = createApp(pool, config.jwtSecret, undefined, undefined,
  existsSync(resolve(frontendDirectory, 'index.html')) ? frontendDirectory : undefined);
const port = Number(process.env.PORT) || config.port;

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`SkillForge API listening on port ${port}`);
});

async function shutdown() {
  server.close(async () => {
    await pool.end();
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
