import { Router } from 'express';
import { z } from 'zod';
import type { Database } from '../types/database.js';
import { sendApiError } from '../utils/api-error.js';
import { requireRole } from '../middleware/require-role.js';

const catalogQuery = z.object({
  skillId: z.coerce.number().int().positive().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export function createQuestionsRouter(database: Database, jwtSecret: string) {
  const router = Router();
  router.use(...requireRole(database, jwtSecret, 'ADMIN'));

  router.get('/', async (request, response) => {
    const parsed = catalogQuery.safeParse(request.query);
    if (!parsed.success) {
      return sendApiError(response, 422, 'VALIDATION_ERROR', 'Invalid question catalog filters.');
    }

    const { skillId, difficulty, page, limit } = parsed.data;
    const filters: string[] = ['question.is_active = TRUE', 'skill.is_active = TRUE'];
    const values: unknown[] = [];
    if (skillId !== undefined) {
      values.push(skillId);
      filters.push(`question.skill_id = $${values.length}`);
    }
    if (difficulty !== undefined) {
      values.push(difficulty);
      filters.push(`question.difficulty = $${values.length}`);
    }
    const where = filters.join(' AND ');

    try {
      const count = await database.query<{ total: number }>(
        `SELECT COUNT(*)::int AS total
         FROM questions AS question
         JOIN skills AS skill ON skill.id = question.skill_id
         WHERE ${where}`,
        values,
      );
      const pageValues = [...values, limit, (page - 1) * limit];
      const result = await database.query(
        `SELECT question.id, question.skill_id AS "skillId", skill.name AS skill,
                question.text, question.difficulty
         FROM questions AS question
         JOIN skills AS skill ON skill.id = question.skill_id
         WHERE ${where}
         ORDER BY skill.name, CASE question.difficulty
           WHEN 'EASY' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END, question.id
         LIMIT $${pageValues.length - 1} OFFSET $${pageValues.length}`,
        pageValues,
      );
      return response.json({
        data: result.rows,
        meta: { page, limit, total: Number(count.rows[0]?.total ?? 0) },
      });
    } catch {
      return sendApiError(response, 503, 'DATABASE_UNAVAILABLE', 'Questions are temporarily unavailable.');
    }
  });

  return router;
}
