export interface User {
  id: number;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'BLOCKED';
}

interface ApiEnvelope<T> {
  data: T;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: { 'content-type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError('Не удалось подключиться к серверу. Проверь, запущен ли backend.', 0);
  }

  const responseText = await response.text();
  let body: ApiEnvelope<T> | { error?: { message?: string } };
  try {
    if (!responseText) throw new Error('Empty response');
    body = JSON.parse(responseText) as ApiEnvelope<T> | { error?: { message?: string } };
  } catch {
    const message = responseText
      ? 'Сервер вернул некорректный ответ. Проверь, запущен ли backend.'
      : 'Сервер вернул пустой ответ. Проверь, запущен ли backend.';
    throw new ApiError(message, response.status);
  }
  if (!response.ok) {
    throw new ApiError('error' in body ? body.error?.message ?? 'Request failed.' : 'Request failed.', response.status);
  }
  if (!('data' in body)) {
    throw new ApiError('Сервер вернул некорректный ответ. Проверь, запущен ли backend.', response.status);
  }
  return body.data;
}

export function registerAccount(input: { name: string; email: string; password: string }) {
  return request<User>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function loginAccount(input: { email: string; password: string }) {
  return request<{ accessToken: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getCurrentUser(accessToken: string) {
  return request<User>('/api/auth/me', {
    headers: { authorization: `Bearer ${accessToken}` },
  });
}

export function updateUserProfile(accessToken: string, changes: { name?: string; email?: string }) {
  return request<User>('/api/users/me', {
    method: 'PATCH',
    headers: { authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(changes),
  });
}
