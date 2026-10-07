import { Router } from 'express';
import type { Database } from '../types/database.js';
import { sendApiError } from '../utils/api-error.js';

export function createSkillsRouter(database: Database, interviewQuestionCount: number) {
  const router = Router();

  router.get('/', async (_request, response) => {
    try {
      const result = await database.query(
        `SELECT skill.id, skill.name, skill.description,
                COUNT(question.id)::int AS "questionCount"
         FROM skills AS skill
         LEFT JOIN questions AS question
           ON question.skill_id = skill.id AND question.is_active = TRUE
         WHERE skill.is_active = TRUE
         GROUP BY skill.id
         ORDER BY skill.name`,
      );
      return response.json({ data: result.rows.map((skill) => ({
        ...skill,
        questionCount: Number(skill.questionCount),
        interviewQuestionCount,
        score: skill.score === undefined ? undefined : Number(skill.score),
      })) });
    } catch {
      return sendApiError(response, 503, 'DATABASE_UNAVAILABLE', 'Skills are temporarily unavailable.');
    }
  });

  return router;
}
