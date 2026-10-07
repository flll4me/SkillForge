import type { Response } from 'express';

export function sendApiError(
  response: Response,
  status: number,
  code: string,
  message: string,
) {
  return response.status(status).json({ error: { code, message } });
}
