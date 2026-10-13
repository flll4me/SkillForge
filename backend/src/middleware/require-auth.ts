import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { sendApiError } from '../utils/api-error.js';
import type { UserRole } from '../types/database.js';

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; role: UserRole };
    }
  }
}

export function requireAuth(secret: string): RequestHandler {
  return (request, response, next) => {
    const authorization = request.get('authorization');
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (!token) {
      return sendApiError(response, 401, 'AUTHENTICATION_REQUIRED', 'Sign in to continue.');
    }

    try {
      const payload = jwt.verify(token, secret);
      if (typeof payload === 'string' || !payload.sub || !['USER', 'ADMIN'].includes(String(payload.role))) {
        return sendApiError(response, 401, 'INVALID_TOKEN', 'The access token is invalid.');
      }

      request.auth = { userId: payload.sub, role: payload.role as UserRole };
      return next();
    } catch {
      return sendApiError(response, 401, 'INVALID_TOKEN', 'The access token is invalid or expired.');
    }
  };
}
