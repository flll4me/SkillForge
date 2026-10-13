import bcrypt from 'bcryptjs';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth.js';
import type { AuthenticatedUser, Database, PublicUser } from '../types/database.js';
import { sendApiError } from '../utils/api-error.js';

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(72),
});

const publicUserColumns = 'id, email, name, role, status';

export function createAuthRouter(database: Database, jwtSecret: string) {
  const router = Router();

  router.post('/register', async (request, response) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendApiError(response, 400, 'VALIDATION_ERROR', 'Name, valid email, and password of at least 8 characters are required.');
    }

    const name = parsed.data.name;
    const email = parsed.data.email.toLowerCase();
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    try {
      const existing = await database.query<{ id: number }>(
        'SELECT id FROM users WHERE email = $1',
        [email],
      );
      if (existing.rows.length > 0) {
        return sendApiError(response, 409, 'EMAIL_ALREADY_EXISTS', 'An account with this email already exists.');
      }

      const created = await database.query<PublicUser>(
        `INSERT INTO users (email, password_hash, name)
         VALUES ($1, $2, $3)
         RETURNING ${publicUserColumns}`,
        [email, passwordHash, name],
      );

      return response.status(201).json({ data: created.rows[0] });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
        return sendApiError(response, 409, 'EMAIL_ALREADY_EXISTS', 'An account with this email already exists.');
      }
      return sendApiError(response, 500, 'INTERNAL_ERROR', 'The account could not be created.');
    }
  });

  router.post('/login', async (request, response) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendApiError(response, 400, 'VALIDATION_ERROR', 'A valid email and password are required.');
    }

    try {
      const result = await database.query<AuthenticatedUser>(
        `SELECT ${publicUserColumns}, password_hash
         FROM users
         WHERE email = $1`,
        [parsed.data.email.toLowerCase()],
      );
      const user = result.rows[0];
      if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) {
        return sendApiError(response, 401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
      }
      if (user.status !== 'ACTIVE') {
        return sendApiError(response, 403, 'USER_BLOCKED', 'This account is blocked.');
      }

      const accessToken = jwt.sign(
        { role: user.role },
        jwtSecret,
        { subject: String(user.id), expiresIn: '30d' },
      );
      return response.json({ data: { accessToken } });
    } catch {
      return sendApiError(response, 500, 'INTERNAL_ERROR', 'The sign-in request could not be completed.');
    }
  });

  router.get('/me', requireAuth(jwtSecret), async (request, response) => {
    try {
      const result = await database.query<PublicUser>(
        `SELECT ${publicUserColumns}
         FROM users
         WHERE id = $1 AND status = 'ACTIVE'`,
        [request.auth?.userId],
      );
      const user = result.rows[0];
      if (!user) {
        return sendApiError(response, 401, 'INVALID_TOKEN', 'The account is unavailable. Sign in again.');
      }
      return response.json({ data: user });
    } catch {
      return sendApiError(response, 500, 'INTERNAL_ERROR', 'The profile could not be loaded.');
    }
  });

  return router;
}
