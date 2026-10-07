import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth.js';
import type { Database } from '../types/database.js';
import { sendApiError } from '../utils/api-error.js';

const profileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().max(320).optional(),
}).refine((profile) => profile.name !== undefined || profile.email !== undefined);

export function createUsersRouter(database: Database, jwtSecret: string) {
  const router = Router();
  router.use(requireAuth(jwtSecret));

  router.get('/me', async (request, response) => {
    try {
      const result = await database.query(
        `SELECT id, email, name, role, status, created_at AS "createdAt"
         FROM users WHERE id = $1 AND status = 'ACTIVE'`,
        [request.auth!.userId],
      );
      if (!result.rows[0]) return sendApiError(response, 404, 'USER_NOT_FOUND', 'User not found.');
      return response.json({ data: result.rows[0] });
    } catch {
      return sendApiError(response, 503, 'DATABASE_UNAVAILABLE', 'The profile is temporarily unavailable.');
    }
  });

  router.patch('/me', async (request, response) => {
    const parsed = profileSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendApiError(response, 400, 'VALIDATION_ERROR', 'Provide a valid name or email.');
    }

    const name = parsed.data.name;
    const email = parsed.data.email?.toLowerCase();
    try {
      const result = await database.query(
        `UPDATE users
         SET name = COALESCE($2, name), email = COALESCE($3, email), updated_at = NOW()
         WHERE id = $1 AND status = 'ACTIVE'
         RETURNING id, email, name, role, status`,
        [request.auth!.userId, name ?? null, email ?? null],
      );
      if (!result.rows[0]) return sendApiError(response, 404, 'USER_NOT_FOUND', 'User not found.');
      return response.json({ data: result.rows[0] });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
        return sendApiError(response, 409, 'EMAIL_ALREADY_EXISTS', 'An account with this email already exists.');
      }
      return sendApiError(response, 503, 'DATABASE_UNAVAILABLE', 'The profile could not be updated.');
    }
  });

  router.get('/me/statistics', async (request, response) => {
    try {
      const result = await database.query(
        `SELECT COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS "completedInterviews",
                COALESCE(ROUND(AVG(score) FILTER (WHERE status = 'COMPLETED'), 2), 0) AS "averageScore",
                COALESCE(MAX(score) FILTER (WHERE status = 'COMPLETED'), 0) AS "bestScore",
                MAX(completed_at) AS "lastInterviewAt"
         FROM interviews WHERE user_id = $1`,
        [request.auth!.userId],
      );
      const recent = await database.query(
        `SELECT interview.id, skill.name AS skill, interview.difficulty,
                interview.score, interview.status,
                interview.completed_at AS "completedAt"
         FROM interviews AS interview
         JOIN skills AS skill ON skill.id = interview.skill_id
         WHERE interview.user_id = $1 AND interview.status = 'COMPLETED'
         ORDER BY interview.completed_at DESC LIMIT 1`,
        [request.auth!.userId],
      );
      const statistics = result.rows[0] as {
        completedInterviews: number | string;
        averageScore: number | string;
        bestScore: number | string;
        lastInterviewAt: string | null;
      };
      return response.json({ data: {
        completedInterviews: Number(statistics.completedInterviews),
        averageScore: Number(statistics.averageScore),
        bestScore: Number(statistics.bestScore),
        lastInterviewAt: statistics.lastInterviewAt,
        recentInterview: recent.rows[0]
          ? { ...recent.rows[0], score: Number(recent.rows[0].score) }
          : null,
      } });
    } catch {
      return sendApiError(response, 503, 'DATABASE_UNAVAILABLE', 'Statistics are temporarily unavailable.');
    }
  });

  router.get('/me/skills', async (request, response) => {
    try {
      const result = await database.query(
        `SELECT skill.id, skill.name, user_skill.score,
                user_skill.completed_interviews AS "completedInterviews",
                user_skill.updated_at AS "updatedAt"
         FROM user_skills AS user_skill
         JOIN skills AS skill ON skill.id = user_skill.skill_id
         WHERE user_skill.user_id = $1
         ORDER BY user_skill.score DESC, skill.name`,
        [request.auth!.userId],
      );
      return response.json({ data: result.rows.map((skill) => ({
        ...skill,
        score: Number(skill.score),
        completedInterviews: Number(skill.completedInterviews),
      })) });
    } catch {
      return sendApiError(response, 503, 'DATABASE_UNAVAILABLE', 'Skill progress is temporarily unavailable.');
    }
  });

  router.get('/me/progress', async (request, response) => {
    const skillId = request.query.skillId === undefined ? undefined : Number(request.query.skillId);
    if (skillId !== undefined && (!Number.isInteger(skillId) || skillId < 1)) {
      return sendApiError(response, 400, 'VALIDATION_ERROR', 'skillId must be a positive integer.');
    }
    try {
      const result = await database.query(
        `SELECT interview.id, skill.id AS "skillId", skill.name AS skill,
                interview.score, interview.completed_at AS "completedAt"
         FROM interviews AS interview
         JOIN skills AS skill ON skill.id = interview.skill_id
         WHERE interview.user_id = $1 AND interview.status = 'COMPLETED'
           AND ($2::bigint IS NULL OR skill.id = $2)
         ORDER BY interview.completed_at ASC`,
        [request.auth!.userId, skillId ?? null],
      );
      return response.json({ data: result.rows.map((item) => ({
        ...item,
        score: Number(item.score),
      })) });
    } catch {
      return sendApiError(response, 503, 'DATABASE_UNAVAILABLE', 'Progress history is temporarily unavailable.');
    }
  });

  return router;
}
