import type { RequestHandler } from 'express';
import type { Database, UserRole } from '../types/database.js';
import { sendApiError } from '../utils/api-error.js';
import { requireAuth } from './require-auth.js';

export function requireRole(database: Database, jwtSecret: string, role: UserRole): RequestHandler[] {
  return [
    requireAuth(jwtSecret),
    async (request, response, next) => {
      try {
        const result = await database.query<{ role: UserRole; status: string }>(
          'SELECT role, status FROM users WHERE id = $1',
          [request.auth!.userId],
        );
        const currentUser = result.rows[0];
        if (!currentUser || currentUser.status !== 'ACTIVE') {
          return sendApiError(response, 401, 'INVALID_TOKEN', 'The account is unavailable.');
        }
        if (currentUser.role !== role) {
          return sendApiError(response, 403, 'FORBIDDEN', 'You do not have permission to access this resource.');
        }
        return next();
      } catch {
        return sendApiError(response, 503, 'DATABASE_UNAVAILABLE', 'Authorization is temporarily unavailable.');
      }
    },
  ];
}
