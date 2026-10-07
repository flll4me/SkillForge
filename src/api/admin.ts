interface Envelope<T> { data: T }
interface PageEnvelope<T> { data: T[]; meta: { page: number; limit: number; total: number } }

async function adminRequest<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, ...init?.headers },
  });
  const body = await response.json() as Envelope<T> | PageEnvelope<T> | { error?: { message?: string } };
  if (!response.ok) throw new Error('error' in body ? body.error?.message ?? 'Request failed.' : 'Request failed.');
  return body as T;
}

export interface AdminSkill {
  id: number | string;
  name: string;
  description: string;
  isActive: boolean;
  questionCount?: number;
}

export interface AdminQuestion {
  id: number | string;
  skillId: number | string;
  skill: string;
  text: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isActive: boolean;
  options?: Array<{ id: number | string; text: string; isCorrect: boolean }>;
}

export function getAdminStatistics(token: string) {
  return adminRequest<Envelope<{ users: number; questions: number; skills: number; interviews: number; averageScore: number }>>('/api/admin/statistics', token);
}

export function getAdminUsers(token: string, search = '') {
  const query = new URLSearchParams();
  if (search.trim()) query.set('search', search.trim());
  const suffix = query.size ? `?${query.toString()}` : '';
  return adminRequest<PageEnvelope<{ id: number | string; name: string; email: string; role: string; status: string }>>(`/api/admin/users${suffix}`, token);
}

export function setAdminUserStatus(token: string, id: number | string, status: 'ACTIVE' | 'BLOCKED') {
  return adminRequest<Envelope<unknown>>(`/api/admin/users/${id}/status`, token, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export function getAdminSkills(token: string) {
  return adminRequest<Envelope<AdminSkill[]>>('/api/admin/skills', token);
}

export function createAdminSkill(token: string, input: { name: string; description: string }) {
  return adminRequest<Envelope<AdminSkill>>('/api/admin/skills', token, { method: 'POST', body: JSON.stringify(input) });
}

export function updateAdminSkill(token: string, id: number | string, changes: { name?: string; description?: string; isActive?: boolean }) {
  return adminRequest<Envelope<AdminSkill>>(`/api/admin/skills/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}

export function setAdminSkillActive(token: string, id: number | string, active: boolean) {
  return adminRequest<Envelope<AdminSkill>>(`/api/admin/skills/${id}`, token, {
    method: active ? 'PATCH' : 'DELETE',
    ...(active ? { body: JSON.stringify({ isActive: true }) } : {}),
  });
}

export async function getAdminQuestions(token: string): Promise<PageEnvelope<AdminQuestion>> {
  const pageSize = 100;
  const firstPage = await adminRequest<PageEnvelope<AdminQuestion>>(
    `/api/admin/questions?includeInactive=true&limit=${pageSize}&page=1`, token,
  );
  const pageCount = Math.ceil(firstPage.meta.total / firstPage.meta.limit);
  const remainingPages = await Promise.all(Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
    adminRequest<PageEnvelope<AdminQuestion>>(
      `/api/admin/questions?includeInactive=true&limit=${pageSize}&page=${index + 2}`, token,
    ),
  ));
  return { ...firstPage, data: [firstPage, ...remainingPages].flatMap((page) => page.data) };
}

export function getAdminQuestion(token: string, id: number | string) {
  return adminRequest<Envelope<AdminQuestion>>(`/api/admin/questions/${id}`, token);
}

export function createAdminQuestion(token: string, input: {
  skillId: number;
  text: string;
  type: AdminQuestion['type'];
  difficulty: AdminQuestion['difficulty'];
  options: Array<{ text: string; isCorrect: boolean }>;
}) {
  return adminRequest<Envelope<AdminQuestion>>('/api/admin/questions', token, { method: 'POST', body: JSON.stringify(input) });
}

export function updateAdminQuestion(token: string, id: number | string, input: Partial<{
  skillId: number;
  text: string;
  type: AdminQuestion['type'];
  difficulty: AdminQuestion['difficulty'];
  isActive: boolean;
  options: Array<{ text: string; isCorrect: boolean }>;
}>) {
  return adminRequest<Envelope<AdminQuestion>>(`/api/admin/questions/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function setAdminQuestionActive(token: string, id: number | string, active: boolean) {
  return adminRequest<Envelope<unknown>>(`/api/admin/questions/${id}`, token, {
    method: active ? 'PATCH' : 'DELETE',
    ...(active ? { body: JSON.stringify({ isActive: true }) } : {}),
  });
}
