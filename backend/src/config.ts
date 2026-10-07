import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseInterviewQuestionCount, userLevelThresholds } from './config/interview.js';

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: resolve(backendRoot, '..', '.env') });

const jwtSecret = process.env.JWT_SECRET ??
  (process.env.NODE_ENV === 'production' ? '' : 'local-development-only-secret-change-me');

if (!jwtSecret) {
  throw new Error('JWT_SECRET must be configured in production.');
}

export const config = {
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgresql://skillforge:local-only-password@127.0.0.1:5432/skillforge',
  host: process.env.API_HOST ?? '127.0.0.1',
  port: Number(process.env.API_PORT ?? process.env.PORT ?? 8000),
  jwtSecret,
  interviewQuestionCount: parseInterviewQuestionCount(process.env.INTERVIEW_QUESTION_COUNT),
  userLevelThresholds,
};
