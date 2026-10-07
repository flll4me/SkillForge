import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth.js';
import type { Database, DatabaseClient, QueryExecutor } from '../types/database.js';
import { getNextDifficulty, getUserLevel, scoreAnswer, type Difficulty, type QuestionType } from '../services/interview-logic.js';
import { sendApiError } from '../utils/api-error.js';
import { HttpError } from '../utils/http-error.js';
import { withTransaction } from '../utils/transaction.js';
import { shuffleOptionsForQuestion } from '../services/option-order.js';

const difficultySchema = z.enum(['EASY', 'MEDIUM', 'HARD']);
const createSchema = z.object({ skillId: z.coerce.number().int().positive(), difficulty: difficultySchema });
const answerSchema = z.object({
  questionId: z.number().int().positive(),
  selectedOptionIds: z.array(z.number().int().positive()).min(1).max(20)
    .refine((ids) => new Set(ids).size === ids.length, 'Option ids must be unique.'),
});
const idSchema = z.coerce.number().int().positive();

interface InterviewRow {
  id: number | string;
  user_id: number | string;
  skill_id: number | string;
  skill_name: string;
  difficulty: Difficulty;
  current_difficulty: Difficulty;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  score: number | string | null;
  started_at: string;
  completed_at: string | null;
  total_questions: number;
}

interface QuestionRow {
  interview_question_id: number | string;
  question_id: number | string;
  question_order: number;
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  answered_count: number;
}

function getFallbackDifficulties(difficulty: Difficulty): [Difficulty, Difficulty] {
  if (difficulty === 'EASY') return ['MEDIUM', 'HARD'];
  if (difficulty === 'HARD') return ['MEDIUM', 'EASY'];
  return ['EASY', 'HARD'];
}

async function findOwnedInterview(client: QueryExecutor, interviewId: number, userId: string) {
  const result = await client.query<InterviewRow>(
    `SELECT interview.id, interview.user_id, interview.skill_id,
            skill.name AS skill_name, interview.difficulty,
            interview.current_difficulty, interview.status, interview.score,
            interview.started_at, interview.completed_at,
            COUNT(interview_question.id)::int AS total_questions
     FROM interviews AS interview
     JOIN skills AS skill ON skill.id = interview.skill_id
     LEFT JOIN interview_questions AS interview_question
       ON interview_question.interview_id = interview.id
     WHERE interview.id = $1 AND interview.user_id = $2
     GROUP BY interview.id, skill.name`,
    [interviewId, userId],
  );
  if (!result.rows[0]) throw new HttpError(404, 'INTERVIEW_NOT_FOUND', 'Interview not found.');
  return result.rows[0];
}

async function findNextQuestion(client: QueryExecutor, interview: InterviewRow): Promise<QuestionRow | undefined> {
  const [fallbackOne, fallbackTwo] = getFallbackDifficulties(interview.current_difficulty);
  const result = await client.query<QuestionRow>(
    `SELECT assignment.id AS interview_question_id,
            question.id AS question_id,
            assignment.question_order,
            question.text,
            question.type,
            question.difficulty,
            (
              SELECT COUNT(*)::int
              FROM user_answers AS answer
              JOIN interview_questions AS prior_assignment
                ON prior_assignment.id = answer.interview_question_id
              WHERE prior_assignment.interview_id = $1
            ) AS answered_count
     FROM interview_questions AS assignment
     JOIN questions AS question ON question.id = assignment.question_id
     WHERE assignment.interview_id = $1
       AND NOT EXISTS (
         SELECT 1 FROM user_answers AS answer
         WHERE answer.interview_question_id = assignment.id
       )
     ORDER BY CASE question.difficulty
       WHEN $2 THEN 0 WHEN $3 THEN 1 WHEN $4 THEN 2 ELSE 3 END,
       assignment.question_order
     LIMIT 1`,
    [interview.id, interview.current_difficulty, fallbackOne, fallbackTwo],
  );
  return result.rows[0];
}

function respondToError(error: unknown, response: Parameters<typeof sendApiError>[0]) {
  if (error instanceof HttpError) {
    return sendApiError(response, error.status, error.code, error.message);
  }
  return sendApiError(response, 500, 'INTERNAL_ERROR', 'The request could not be completed.');
}

export function createInterviewRouter(database: Database, jwtSecret: string, questionCount: number) {
  const router = Router();
  router.use(requireAuth(jwtSecret));

  router.get('/', async (request, response) => {
    const page = Number(request.query.page ?? 1);
    const limit = Number(request.query.limit ?? 10);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return sendApiError(response, 400, 'VALIDATION_ERROR', 'Page must be positive and limit must be between 1 and 100.');
    }
    try {
      const result = await database.query(
        `SELECT interview.id, skill.name AS skill,
                interview.difficulty, interview.status, interview.score,
                interview.started_at AS "startedAt",
                interview.completed_at AS "completedAt"
         FROM interviews AS interview
         JOIN skills AS skill ON skill.id = interview.skill_id
         WHERE interview.user_id = $1
         ORDER BY interview.started_at DESC
         LIMIT $2 OFFSET $3`,
        [request.auth!.userId, limit, (page - 1) * limit],
      );
      const count = await database.query<{ total: number }>(
        'SELECT COUNT(*)::int AS total FROM interviews WHERE user_id = $1',
        [request.auth!.userId],
      );
      return response.json({
        data: result.rows.map((row) => ({ ...row, score: row.score === null ? null : Number(row.score) })),
        meta: { page, limit, total: count.rows[0]?.total ?? 0 },
      });
    } catch {
      return sendApiError(response, 503, 'DATABASE_UNAVAILABLE', 'Interview history is temporarily unavailable.');
    }
  });

  router.post('/', async (request, response) => {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendApiError(response, 400, 'VALIDATION_ERROR', 'A valid skillId and difficulty are required.');
    }

    try {
      const created = await withTransaction(database, async (client) => {
        const skill = await client.query<{ id: number | string }>(
          'SELECT id FROM skills WHERE id = $1 AND is_active = TRUE',
          [parsed.data.skillId],
        );
        if (!skill.rows[0]) throw new HttpError(404, 'SKILL_NOT_FOUND', 'Skill not found or inactive.');

        const [fallbackOne, fallbackTwo] = getFallbackDifficulties(parsed.data.difficulty);
        const questions = await client.query<{ id: number | string }>(
          `WITH ranked_questions AS (
             SELECT question.id,
                    question.difficulty,
                    CASE question.difficulty
                      WHEN $2 THEN 0 WHEN $3 THEN 1 WHEN $4 THEN 2 ELSE 3
                    END AS difficulty_priority,
                    ROW_NUMBER() OVER (
                      PARTITION BY question.difficulty ORDER BY RANDOM()
                    ) AS difficulty_position
             FROM questions AS question
             WHERE question.skill_id = $1 AND question.is_active = TRUE
               AND (SELECT COUNT(*) FROM question_options AS option WHERE option.question_id = question.id) >= 2
               AND EXISTS (SELECT 1 FROM question_options AS option WHERE option.question_id = question.id AND option.is_correct = TRUE)
           )
           SELECT id
           FROM ranked_questions
           WHERE difficulty_position <= CEIL($5::numeric / 3)
           ORDER BY difficulty_priority, RANDOM(), id
           LIMIT $5`,
          [parsed.data.skillId, parsed.data.difficulty, fallbackOne, fallbackTwo, questionCount],
        );
        if (questions.rows.length < questionCount) {
          throw new HttpError(422, 'QUESTION_SET_INCOMPLETE', `This skill does not have ${questionCount} active questions yet.`);
        }

        const interview = await client.query<{ id: number | string }>(
          `INSERT INTO interviews (user_id, skill_id, difficulty, current_difficulty)
           VALUES ($1, $2, $3, $3) RETURNING id`,
          [request.auth!.userId, parsed.data.skillId, parsed.data.difficulty],
        );
        const interviewId = interview.rows[0].id;
        for (const [index, question] of questions.rows.entries()) {
          await client.query(
            `INSERT INTO interview_questions (interview_id, question_id, question_order)
             VALUES ($1, $2, $3)`,
            [interviewId, question.id, index + 1],
          );
        }
        return { id: interviewId, status: 'IN_PROGRESS', difficulty: parsed.data.difficulty, totalQuestions: questionCount };
      });
      return response.status(201).json({ data: created });
    } catch (error) {
      return respondToError(error, response);
    }
  });

  router.get('/:id/current-question', async (request, response) => {
    const parsedId = idSchema.safeParse(request.params.id);
    if (!parsedId.success) return sendApiError(response, 400, 'VALIDATION_ERROR', 'Interview id must be a positive integer.');

    try {
      const interview = await findOwnedInterview(database, parsedId.data, request.auth!.userId);
      if (interview.status !== 'IN_PROGRESS') {
        return sendApiError(response, 409, 'INTERVIEW_NOT_IN_PROGRESS', 'This interview is no longer in progress.');
      }
      const question = await findNextQuestion(database, interview);
      if (!question) return sendApiError(response, 404, 'QUESTION_NOT_FOUND', 'No unanswered question remains.');

      const options = await database.query<{ id: number | string; text: string }>(
        'SELECT id, text FROM question_options WHERE question_id = $1 ORDER BY id',
        [question.question_id],
      );
      return response.json({
        data: {
          questionNumber: Number(question.answered_count) + 1,
          totalQuestions: interview.total_questions,
          question: {
            id: Number(question.question_id),
            text: question.text,
            type: question.type,
            difficulty: question.difficulty,
            options: shuffleOptionsForQuestion(
              options.rows.map((option) => ({ id: Number(option.id), text: option.text })),
              interview.id,
              question.question_id,
            ),
          },
        },
      });
    } catch (error) {
      return respondToError(error, response);
    }
  });

  router.post('/:id/answer', async (request, response) => {
    const parsedId = idSchema.safeParse(request.params.id);
    const parsedAnswer = answerSchema.safeParse(request.body);
    if (!parsedId.success || !parsedAnswer.success) {
      return sendApiError(response, 400, 'VALIDATION_ERROR', 'A valid questionId and selectedOptionIds are required.');
    }

    try {
      const result = await withTransaction(database, async (client) => {
        const lockedInterview = await client.query(
          'SELECT id FROM interviews WHERE id = $1 AND user_id = $2 FOR UPDATE',
          [parsedId.data, request.auth!.userId],
        );
        if (!lockedInterview.rows[0]) throw new HttpError(404, 'INTERVIEW_NOT_FOUND', 'Interview not found.');

        const interviewResult = await client.query<InterviewRow>(
          `SELECT interview.id, interview.user_id, interview.skill_id,
                  skill.name AS skill_name, interview.difficulty,
                  interview.current_difficulty, interview.status, interview.score,
                  interview.started_at, interview.completed_at,
                  COUNT(assignment.id)::int AS total_questions
           FROM interviews AS interview
           JOIN skills AS skill ON skill.id = interview.skill_id
           LEFT JOIN interview_questions AS assignment ON assignment.interview_id = interview.id
           WHERE interview.id = $1 AND interview.user_id = $2
           GROUP BY interview.id, skill.name`,
          [parsedId.data, request.auth!.userId],
        );
        const interview = interviewResult.rows[0];
        if (!interview) throw new HttpError(404, 'INTERVIEW_NOT_FOUND', 'Interview not found.');
        if (interview.status !== 'IN_PROGRESS') throw new HttpError(409, 'INTERVIEW_NOT_IN_PROGRESS', 'This interview is no longer in progress.');

        const currentQuestion = await findNextQuestion(client, interview);
        if (!currentQuestion || Number(currentQuestion.question_id) !== parsedAnswer.data.questionId) {
          throw new HttpError(409, 'QUESTION_OUT_OF_ORDER', 'Answer the current question before continuing.');
        }

        const options = await client.query<{ id: number | string; is_correct: boolean }>(
          'SELECT id, is_correct FROM question_options WHERE question_id = $1',
          [currentQuestion.question_id],
        );
        const knownOptionIds = new Set(options.rows.map((option) => Number(option.id)));
        if (parsedAnswer.data.selectedOptionIds.some((id) => !knownOptionIds.has(id))) {
          throw new HttpError(400, 'INVALID_OPTIONS', 'One or more selected options do not belong to this question.');
        }
        if (currentQuestion.type === 'SINGLE_CHOICE' && parsedAnswer.data.selectedOptionIds.length !== 1) {
          throw new HttpError(400, 'INVALID_OPTIONS', 'Select exactly one option for this question.');
        }

        const correctIds = options.rows.filter((option) => option.is_correct).map((option) => Number(option.id));
        const questionScore = scoreAnswer(currentQuestion.type, parsedAnswer.data.selectedOptionIds, correctIds);
        const answer = await client.query<{ id: number | string }>(
          `INSERT INTO user_answers (interview_question_id, score, is_correct)
           VALUES ($1, $2, $3) RETURNING id`,
          [currentQuestion.interview_question_id, questionScore, questionScore === 100],
        );
        for (const optionId of parsedAnswer.data.selectedOptionIds) {
          await client.query(
            'INSERT INTO user_answer_options (user_answer_id, question_option_id) VALUES ($1, $2)',
            [answer.rows[0].id, optionId],
          );
        }

        const nextDifficulty = getNextDifficulty(currentQuestion.difficulty, questionScore === 100);
        const answeredResult = await client.query<{ answered: number }>(
          `SELECT COUNT(*)::int AS answered
           FROM user_answers AS answer
           JOIN interview_questions AS assignment ON assignment.id = answer.interview_question_id
           WHERE assignment.interview_id = $1`,
          [parsedId.data],
        );
        const isComplete = answeredResult.rows[0].answered >= interview.total_questions;

        let finalScore: number | null = null;
        if (isComplete) {
          const scoreResult = await client.query<{ score: number | string }>(
            `SELECT ROUND(AVG(answer.score), 2) AS score
             FROM user_answers AS answer
             JOIN interview_questions AS assignment ON assignment.id = answer.interview_question_id
             WHERE assignment.interview_id = $1`,
            [parsedId.data],
          );
          finalScore = Number(scoreResult.rows[0].score);
          await client.query(
            `UPDATE interviews
             SET status = 'COMPLETED', score = $2, completed_at = NOW(), current_difficulty = $3
             WHERE id = $1`,
            [parsedId.data, finalScore, nextDifficulty],
          );
          await client.query(
            `INSERT INTO user_skills (user_id, skill_id, score, completed_interviews)
             VALUES ($1, $2, $3, 1)
             ON CONFLICT (user_id, skill_id) DO UPDATE SET
               score = ((user_skills.score * user_skills.completed_interviews) + EXCLUDED.score)
                 / (user_skills.completed_interviews + 1),
               completed_interviews = user_skills.completed_interviews + 1,
               updated_at = NOW()`,
            [request.auth!.userId, interview.skill_id, finalScore],
          );
        } else {
          await client.query('UPDATE interviews SET current_difficulty = $2 WHERE id = $1', [parsedId.data, nextDifficulty]);
        }

        return {
          isCorrect: questionScore === 100,
          questionScore,
          nextDifficulty,
          completed: isComplete,
          score: finalScore,
          userLevel: isComplete ? getUserLevel(finalScore!) : null,
        };
      });
      return response.json({ data: result });
    } catch (error) {
      return respondToError(error, response);
    }
  });

  router.get('/:id/result', async (request, response) => {
    const parsedId = idSchema.safeParse(request.params.id);
    if (!parsedId.success) return sendApiError(response, 400, 'VALIDATION_ERROR', 'Interview id must be a positive integer.');
    try {
      const interview = await findOwnedInterview(database, parsedId.data, request.auth!.userId);
      if (interview.status !== 'COMPLETED') {
        return sendApiError(response, 409, 'INTERVIEW_NOT_COMPLETED', 'Complete the interview before viewing its result.');
      }
      const questionRows = await database.query<{
        interview_question_id: number | string;
        question_id: number | string;
        question_order: number;
        text: string;
        type: QuestionType;
        difficulty: Difficulty;
        score: number | string;
        is_correct: boolean;
      }>(
        `SELECT assignment.id AS interview_question_id, question.id AS question_id,
                assignment.question_order, question.text, question.type,
                question.difficulty, answer.score, answer.is_correct
         FROM interview_questions AS assignment
         JOIN questions AS question ON question.id = assignment.question_id
         JOIN user_answers AS answer ON answer.interview_question_id = assignment.id
         WHERE assignment.interview_id = $1
         ORDER BY assignment.question_order`,
        [parsedId.data],
      );
      const questions = [];
      for (const row of questionRows.rows) {
        const options = await database.query<{ id: number | string; text: string; is_correct: boolean; selected: boolean }>(
          `SELECT option.id, option.text, option.is_correct,
                  EXISTS (
                    SELECT 1 FROM user_answer_options AS selected
                    WHERE selected.user_answer_id = $2 AND selected.question_option_id = option.id
                  ) AS selected
           FROM question_options AS option
           WHERE option.question_id = $1
           ORDER BY option.id`,
          [row.question_id, row.interview_question_id],
        );
        questions.push({
          id: Number(row.question_id),
          order: row.question_order,
          text: row.text,
          type: row.type,
          difficulty: row.difficulty,
          score: Number(row.score),
          isCorrect: row.is_correct,
          options: options.rows.map((option) => ({
            id: Number(option.id),
            text: option.text,
            isCorrect: option.is_correct,
            selected: option.selected,
          })),
        });
      }
      const score = Number(interview.score ?? 0);
      return response.json({
        data: {
          id: Number(interview.id),
          skill: interview.skill_name,
          difficulty: interview.difficulty,
          status: interview.status,
          score,
          userLevel: getUserLevel(score),
          startedAt: interview.started_at,
          completedAt: interview.completed_at,
          correctAnswers: questions.filter((question) => question.isCorrect).length,
          totalQuestions: interview.total_questions,
          questions,
        },
      });
    } catch (error) {
      return respondToError(error, response);
    }
  });

  router.get('/:id', async (request, response) => {
    const parsedId = idSchema.safeParse(request.params.id);
    if (!parsedId.success) return sendApiError(response, 400, 'VALIDATION_ERROR', 'Interview id must be a positive integer.');
    try {
      const interview = await findOwnedInterview(database, parsedId.data, request.auth!.userId);
      return response.json({
        data: {
          id: Number(interview.id), skill: interview.skill_name,
          difficulty: interview.difficulty, status: interview.status,
          score: interview.score === null ? null : Number(interview.score),
          startedAt: interview.started_at, completedAt: interview.completed_at,
          totalQuestions: interview.total_questions,
        },
      });
    } catch (error) {
      return respondToError(error, response);
    }
  });

  return router;
}
