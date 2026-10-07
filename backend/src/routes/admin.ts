import { Router } from 'express';
import { z } from 'zod';
import type { Database, DatabaseClient } from '../types/database.js';
import { requireRole } from '../middleware/require-role.js';
import { sendApiError } from '../utils/api-error.js';
import { withTransaction } from '../utils/transaction.js';

const difficultySchema = z.enum(['EASY', 'MEDIUM', 'HARD']);
const typeSchema = z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE']);
const skillSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).default(''),
});
const skillPatchSchema = skillSchema.partial().extend({ isActive: z.boolean().optional() });
const optionSchema = z.object({ text: z.string().trim().min(1).max(500), isCorrect: z.boolean() });
const questionSchema = z.object({
  skillId: z.coerce.number().int().positive(),
  text: z.string().trim().min(10).max(4000),
  type: typeSchema,
  difficulty: difficultySchema,
  isActive: z.boolean().default(true),
  options: z.array(optionSchema).min(2).max(8),
}).refine((question) => question.type === 'SINGLE_CHOICE'
  ? question.options.filter((option) => option.isCorrect).length === 1
  : question.options.some((option) => option.isCorrect), {
  message: 'A single-choice question needs one correct option; a multiple-choice question needs at least one.',
});
const questionPatchSchema = z.object({
  skillId: z.coerce.number().int().positive().optional(),
  text: z.string().trim().min(10).max(4000).optional(),
  type: typeSchema.optional(),
  difficulty: difficultySchema.optional(),
  isActive: z.boolean().optional(),
  options: z.array(optionSchema).min(2).max(8).optional(),
}).refine((patch) => Object.keys(patch).length > 0);
const idSchema = z.coerce.number().int().positive();

async function saveOptions(client: DatabaseClient, questionId: number | string, options: Array<z.infer<typeof optionSchema>>) {
  for (const option of options) {
    await client.query(
      'INSERT INTO question_options (question_id, text, is_correct) VALUES ($1, $2, $3)',
      [questionId, option.text, option.isCorrect],
    );
  }
}

async function getQuestion(database: Database, id: number) {
  const question = await database.query(
    `SELECT question.id, question.skill_id AS "skillId", skill.name AS skill,
            question.text, question.type, question.difficulty,
            question.is_active AS "isActive",
            question.created_at AS "createdAt", question.updated_at AS "updatedAt"
     FROM questions AS question JOIN skills AS skill ON skill.id = question.skill_id
     WHERE question.id = $1`,
    [id],
  );
  if (!question.rows[0]) return null;
  const options = await database.query(
    'SELECT id, text, is_correct AS "isCorrect" FROM question_options WHERE question_id = $1 ORDER BY id',
    [id],
  );
  return { ...question.rows[0], options: options.rows };
}

export function createAdminRouter(database: Database, jwtSecret: string) {
  const router = Router();
  router.use(...requireRole(database, jwtSecret, 'ADMIN'));

  router.get('/statistics', async (_request, response) => {
    try {
      const result = await database.query(
        `SELECT
           (SELECT COUNT(*)::int FROM users) AS users,
           (SELECT COUNT(*)::int FROM questions WHERE is_active = TRUE) AS questions,
           (SELECT COUNT(*)::int FROM skills WHERE is_active = TRUE) AS skills,
           (SELECT COUNT(*)::int FROM interviews) AS interviews,
           COALESCE((SELECT ROUND(AVG(score), 2) FROM interviews WHERE status = 'COMPLETED'), 0) AS "averageScore"`,
      );
      return response.json({ data: result.rows[0] });
    } catch {
      return sendApiError(response, 503, 'DATABASE_UNAVAILABLE', 'Statistics are temporarily unavailable.');
    }
  });

  router.get('/users', async (request, response) => {
    const page = Number(request.query.page ?? 1);
    const limit = Number(request.query.limit ?? 20);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return sendApiError(response, 400, 'VALIDATION_ERROR', 'Invalid pagination values.');
    }
    const search = typeof request.query.search === 'string' ? request.query.search.trim() : '';
    const values: unknown[] = [];
    let filter = '';
    if (search) {
      values.push(`%${search}%`);
      filter = `WHERE email ILIKE $1 OR name ILIKE $1`;
    }
    try {
      const pageValues = [...values, limit, (page - 1) * limit];
      const limitParameter = values.length + 1;
      const offsetParameter = values.length + 2;
      const users = await database.query(
        `SELECT id, email, name, role, status, created_at AS "createdAt"
         FROM users ${filter}
         ORDER BY created_at DESC LIMIT $${limitParameter} OFFSET $${offsetParameter}`,
        pageValues,
      );
      const total = await database.query<{ total: number }>(
        `SELECT COUNT(*)::int AS total FROM users ${filter}`,
        values,
      );
      return response.json({ data: users.rows, meta: { page, limit, total: total.rows[0]?.total ?? 0 } });
    } catch {
      return sendApiError(response, 503, 'DATABASE_UNAVAILABLE', 'Users are temporarily unavailable.');
    }
  });

  router.patch('/users/:id/status', async (request, response) => {
    const parsedId = idSchema.safeParse(request.params.id);
    const status = z.enum(['ACTIVE', 'BLOCKED']).safeParse(request.body?.status);
    if (!parsedId.success || !status.success) {
      return sendApiError(response, 400, 'VALIDATION_ERROR', 'A valid user id and status are required.');
    }
    if (String(parsedId.data) === request.auth!.userId && status.data === 'BLOCKED') {
      return sendApiError(response, 400, 'CANNOT_BLOCK_SELF', 'You cannot block your own account.');
    }
    try {
      const result = await database.query(
        `UPDATE users SET status = $2, updated_at = NOW() WHERE id = $1
         RETURNING id, email, name, role, status`,
        [parsedId.data, status.data],
      );
      if (!result.rows[0]) return sendApiError(response, 404, 'USER_NOT_FOUND', 'User not found.');
      return response.json({ data: result.rows[0] });
    } catch {
      return sendApiError(response, 503, 'DATABASE_UNAVAILABLE', 'The user status could not be updated.');
    }
  });

  router.get('/skills', async (_request, response) => {
    try {
      const result = await database.query(
        `SELECT skill.id, skill.name, skill.description,
                skill.is_active AS "isActive", skill.created_at AS "createdAt",
                COUNT(question.id)::int AS "questionCount"
         FROM skills AS skill LEFT JOIN questions AS question ON question.skill_id = skill.id
         GROUP BY skill.id ORDER BY skill.name`,
      );
      return response.json({ data: result.rows });
    } catch {
      return sendApiError(response, 503, 'DATABASE_UNAVAILABLE', 'Skills are temporarily unavailable.');
    }
  });

  router.post('/skills', async (request, response) => {
    const parsed = skillSchema.safeParse(request.body);
    if (!parsed.success) return sendApiError(response, 400, 'VALIDATION_ERROR', 'A valid unique skill name is required.');
    try {
      const result = await database.query(
        `INSERT INTO skills (name, description) VALUES ($1, $2)
         RETURNING id, name, description, is_active AS "isActive"`,
        [parsed.data.name, parsed.data.description],
      );
      return response.status(201).json({ data: result.rows[0] });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
        return sendApiError(response, 409, 'SKILL_ALREADY_EXISTS', 'A skill with this name already exists.');
      }
      return sendApiError(response, 503, 'DATABASE_UNAVAILABLE', 'The skill could not be created.');
    }
  });

  router.patch('/skills/:id', async (request, response) => {
    const parsedId = idSchema.safeParse(request.params.id);
    const parsed = skillPatchSchema.safeParse(request.body);
    if (!parsedId.success || !parsed.success || Object.keys(parsed.data).length === 0) {
      return sendApiError(response, 400, 'VALIDATION_ERROR', 'Provide a valid skill id and at least one field to update.');
    }
    try {
      const result = await database.query(
        `UPDATE skills SET name = COALESCE($2, name), description = COALESCE($3, description),
           is_active = COALESCE($4, is_active), updated_at = NOW() WHERE id = $1
         RETURNING id, name, description, is_active AS "isActive"`,
        [parsedId.data, parsed.data.name ?? null, parsed.data.description ?? null, parsed.data.isActive ?? null],
      );
      if (!result.rows[0]) return sendApiError(response, 404, 'SKILL_NOT_FOUND', 'Skill not found.');
      return response.json({ data: result.rows[0] });
    } catch {
      return sendApiError(response, 409, 'SKILL_UPDATE_FAILED', 'The skill could not be updated.');
    }
  });

  router.delete('/skills/:id', async (request, response) => {
    const parsedId = idSchema.safeParse(request.params.id);
    if (!parsedId.success) return sendApiError(response, 400, 'VALIDATION_ERROR', 'Skill id must be a positive integer.');
    try {
      const result = await database.query(
        `UPDATE skills SET is_active = FALSE, updated_at = NOW() WHERE id = $1
         RETURNING id, name, is_active AS "isActive"`,
        [parsedId.data],
      );
      if (!result.rows[0]) return sendApiError(response, 404, 'SKILL_NOT_FOUND', 'Skill not found.');
      return response.json({ data: result.rows[0] });
    } catch {
      return sendApiError(response, 503, 'DATABASE_UNAVAILABLE', 'The skill could not be deactivated.');
    }
  });

  router.get('/questions', async (request, response) => {
    const page = Number(request.query.page ?? 1);
    const limit = Number(request.query.limit ?? 20);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return sendApiError(response, 400, 'VALIDATION_ERROR', 'Invalid pagination values.');
    }
    const conditions: string[] = [];
    const values: unknown[] = [];
    if (request.query.skillId !== undefined) {
      const skillId = idSchema.safeParse(request.query.skillId);
      if (!skillId.success) return sendApiError(response, 400, 'VALIDATION_ERROR', 'Invalid skillId.');
      values.push(skillId.data);
      conditions.push(`question.skill_id = $${values.length}`);
    }
    if (request.query.difficulty !== undefined) {
      const difficulty = difficultySchema.safeParse(request.query.difficulty);
      if (!difficulty.success) return sendApiError(response, 400, 'VALIDATION_ERROR', 'Invalid difficulty.');
      values.push(difficulty.data);
      conditions.push(`question.difficulty = $${values.length}`);
    }
    if (request.query.includeInactive !== 'true') conditions.push('question.is_active = TRUE');
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    try {
      const listValues = [...values, limit, (page - 1) * limit];
      const result = await database.query(
        `SELECT question.id, question.skill_id AS "skillId", skill.name AS skill,
                question.text, question.type, question.difficulty,
                question.is_active AS "isActive"
         FROM questions AS question JOIN skills AS skill ON skill.id = question.skill_id
         ${where} ORDER BY question.id DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        listValues,
      );
      const count = await database.query<{ total: number }>(
        `SELECT COUNT(*)::int AS total FROM questions AS question ${where}`,
        values,
      );
      return response.json({ data: result.rows, meta: { page, limit, total: count.rows[0]?.total ?? 0 } });
    } catch {
      return sendApiError(response, 503, 'DATABASE_UNAVAILABLE', 'Questions are temporarily unavailable.');
    }
  });

  router.post('/questions', async (request, response) => {
    const parsed = questionSchema.safeParse(request.body);
    if (!parsed.success) return sendApiError(response, 400, 'VALIDATION_ERROR', 'The question or its answer options are invalid.');
    try {
      const id = await withTransaction(database, async (client) => {
        const skill = await client.query('SELECT id FROM skills WHERE id = $1 AND is_active = TRUE', [parsed.data.skillId]);
        if (!skill.rows[0]) throw new Error('SKILL_NOT_FOUND');
        const question = await client.query<{ id: number | string }>(
          `INSERT INTO questions (skill_id, text, type, difficulty, is_active)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [parsed.data.skillId, parsed.data.text, parsed.data.type, parsed.data.difficulty, parsed.data.isActive],
        );
        await saveOptions(client, question.rows[0].id, parsed.data.options);
        return question.rows[0].id;
      });
      return response.status(201).json({ data: await getQuestion(database, Number(id)) });
    } catch (error) {
      if (error instanceof Error && error.message === 'SKILL_NOT_FOUND') {
        return sendApiError(response, 404, 'SKILL_NOT_FOUND', 'Skill not found or inactive.');
      }
      return sendApiError(response, 503, 'DATABASE_UNAVAILABLE', 'The question could not be created.');
    }
  });

  router.get('/questions/:id', async (request, response) => {
    const parsedId = idSchema.safeParse(request.params.id);
    if (!parsedId.success) return sendApiError(response, 400, 'VALIDATION_ERROR', 'Question id must be a positive integer.');
    try {
      const question = await getQuestion(database, parsedId.data);
      if (!question) return sendApiError(response, 404, 'QUESTION_NOT_FOUND', 'Question not found.');
      return response.json({ data: question });
    } catch {
      return sendApiError(response, 503, 'DATABASE_UNAVAILABLE', 'The question could not be loaded.');
    }
  });

  router.patch('/questions/:id', async (request, response) => {
    const parsedId = idSchema.safeParse(request.params.id);
    const parsed = questionPatchSchema.safeParse(request.body);
    if (!parsedId.success || !parsed.success) return sendApiError(response, 400, 'VALIDATION_ERROR', 'The question update is invalid.');
    try {
      await withTransaction(database, async (client) => {
        const existing = await client.query<{ type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' }>(
          'SELECT type FROM questions WHERE id = $1',
          [parsedId.data],
        );
        if (!existing.rows[0]) throw new Error('QUESTION_NOT_FOUND');
        if (parsed.data.skillId !== undefined) {
          const skill = await client.query(
            'SELECT id FROM skills WHERE id = $1 AND is_active = TRUE',
            [parsed.data.skillId],
          );
          if (!skill.rows[0]) throw new Error('SKILL_NOT_FOUND');
        }
        if (parsed.data.options) {
          const questionType = parsed.data.type ?? existing.rows[0].type;
          const correctOptions = parsed.data.options.filter((option) => option.isCorrect).length;
          if ((questionType === 'SINGLE_CHOICE' && correctOptions !== 1)
            || (questionType === 'MULTIPLE_CHOICE' && correctOptions < 1)) {
            throw new Error('QUESTION_OPTIONS_INVALID');
          }
        }
        const result = await client.query(
          `UPDATE questions SET skill_id = COALESCE($2, skill_id),
             text = COALESCE($3, text), type = COALESCE($4, type),
             difficulty = COALESCE($5, difficulty), is_active = COALESCE($6, is_active),
             updated_at = NOW()
           WHERE id = $1 RETURNING id`,
          [parsedId.data, parsed.data.skillId ?? null, parsed.data.text ?? null,
            parsed.data.type ?? null, parsed.data.difficulty ?? null, parsed.data.isActive ?? null],
        );
        if (!result.rows[0]) throw new Error('QUESTION_NOT_FOUND');
        if (parsed.data.options) {
          await client.query('DELETE FROM question_options WHERE question_id = $1', [parsedId.data]);
          await saveOptions(client, parsedId.data, parsed.data.options);
        }
      });
      return response.json({ data: await getQuestion(database, parsedId.data) });
    } catch (error) {
      if (error instanceof Error && error.message === 'QUESTION_NOT_FOUND') {
        return sendApiError(response, 404, 'QUESTION_NOT_FOUND', 'Question not found.');
      }
      if (error instanceof Error && error.message === 'SKILL_NOT_FOUND') {
        return sendApiError(response, 404, 'SKILL_NOT_FOUND', 'Skill not found or inactive.');
      }
      if (error instanceof Error && error.message === 'QUESTION_OPTIONS_INVALID') {
        return sendApiError(response, 400, 'VALIDATION_ERROR', 'The answer options do not match the question type.');
      }
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23503') {
        return sendApiError(response, 409, 'QUESTION_IN_USE', 'The question options are referenced by saved answers.');
      }
      return sendApiError(response, 503, 'DATABASE_UNAVAILABLE', 'The question could not be updated.');
    }
  });

  router.delete('/questions/:id', async (request, response) => {
    const parsedId = idSchema.safeParse(request.params.id);
    if (!parsedId.success) return sendApiError(response, 400, 'VALIDATION_ERROR', 'Question id must be a positive integer.');
    try {
      const result = await database.query(
        `UPDATE questions SET is_active = FALSE, updated_at = NOW()
         WHERE id = $1 RETURNING id, is_active AS "isActive"`,
        [parsedId.data],
      );
      if (!result.rows[0]) return sendApiError(response, 404, 'QUESTION_NOT_FOUND', 'Question not found.');
      return response.json({ data: result.rows[0] });
    } catch {
      return sendApiError(response, 503, 'DATABASE_UNAVAILABLE', 'The question could not be deactivated.');
    }
  });

  return router;
}
