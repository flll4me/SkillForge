import { createApp } from './app.js';
import { config } from './config.js';
import { pool } from './db/pool.js';

const app = createApp(pool, config.jwtSecret);
const server = app.listen(config.port, config.host, () => {
  console.log(`SkillForge API listening on http://${config.host}:${config.port}`);
});

async function shutdown() {
  server.close(async () => {
    await pool.end();
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
