import express from 'express';
import { resolve } from 'node:path';
import { createAuthRouter } from './routes/auth.js';
import { createInterviewRouter } from './routes/interviews.js';
import { createSkillsRouter } from './routes/skills.js';
import { createUsersRouter } from './routes/users.js';
import { createAdminRouter } from './routes/admin.js';
import { createQuestionsRouter } from './routes/questions.js';
import type { Database } from './types/database.js';
import { sendApiError } from './utils/api-error.js';
import { config } from './config.js';
import type { AnswerForExplanation, AnswerExplanationResult } from './services/answer-explainer.js';

const supportedTracks = new Set(['Frontend', 'Backend', 'Fullstack']);
const supportedLevels = new Set(['Junior', 'Junior+', 'Middle']);

export function createApp(
  database: Database,
  jwtSecret = 'test-only-secret',
  interviewQuestionCount = config.interviewQuestionCount,
  explainAnswers?: (answers: AnswerForExplanation[]) => Promise<AnswerExplanationResult>,
  frontendDirectory?: string,
) {
  const app = express();
  app.use(express.json({ limit: '32kb' }));
  app.use('/api/auth', createAuthRouter(database, jwtSecret));
  app.use('/api/users', createUsersRouter(database, jwtSecret));
  app.use('/api/admin', createAdminRouter(database, jwtSecret));
  app.use('/api/skills', createSkillsRouter(database, interviewQuestionCount));
  app.use('/api/questions', createQuestionsRouter(database, jwtSecret));

  app.get('/api/health', async (_request, response) => {
    try {
      await database.query('SELECT 1');
      return response.json({ status: 'ok', database: 'connected' });
    } catch {
      return response
        .status(503)
        .json({ detail: { status: 'error', database: 'unavailable' } });
    }
  });

  app.get('/api/interviews/questions', async (request, response) => {
    const { track, level } = request.query;

    if (typeof track !== 'string' || !supportedTracks.has(track)) {
      return sendApiError(response, 422, 'UNSUPPORTED_TRACK', 'Unsupported track.');
    }
    if (typeof level !== 'string' || !supportedLevels.has(level)) {
      return sendApiError(response, 422, 'UNSUPPORTED_LEVEL', 'Unsupported level.');
    }

    try {
      const result = await database.query(
        `SELECT topic, prompt
         FROM interview_question_prompts
         WHERE track = $1 AND level = $2
         ORDER BY position`,
        [track, level],
      );

      if (result.rows.length === 0) {
        return sendApiError(response, 404, 'QUESTIONS_NOT_FOUND', 'No interview questions found for this track and level.');
      }
      return response.json({ track, level, questions: result.rows });
    } catch {
      return sendApiError(response, 503, 'DATABASE_UNAVAILABLE', 'Interview questions are temporarily unavailable.');
    }
  });

  app.use('/api/interviews', createInterviewRouter(database, jwtSecret, interviewQuestionCount, explainAnswers));

  if (frontendDirectory) {
    app.use(express.static(frontendDirectory));
    app.get('/{*path}', (request, response, next) => {
      if (request.path === '/api' || request.path.startsWith('/api/') || !request.accepts('html')) return next();
      return response.sendFile(resolve(frontendDirectory, 'index.html'));
    });
  }

  app.use((_request, response) => sendApiError(response, 404, 'NOT_FOUND', 'The requested resource was not found.'));

  return app;
}
