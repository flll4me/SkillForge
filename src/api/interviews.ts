export interface InterviewQuestion {
  topic: string;
  prompt: string;
}

export interface InterviewQuestionSet {
  track: string;
  level: string;
  questions: InterviewQuestion[];
}

export interface Skill {
  id: number | string;
  name: string;
  description: string;
  questionCount: number;
  interviewQuestionCount?: number;
}

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface CatalogQuestion {
  id: number | string;
  skillId: number | string;
  skill: string;
  text: string;
  difficulty: QuestionDifficulty;
}

export interface QuestionCatalogPage {
  data: CatalogQuestion[];
  meta: { page: number; limit: number; total: number };
}

export async function getQuestionCatalog(filters: {
  skillId?: number | string;
  difficulty?: QuestionDifficulty;
  page?: number;
  limit?: number;
} = {}): Promise<QuestionCatalogPage> {
  const query = new URLSearchParams();
  if (filters.skillId !== undefined) query.set('skillId', String(filters.skillId));
  if (filters.difficulty) query.set('difficulty', filters.difficulty);
  if (filters.page !== undefined) query.set('page', String(filters.page));
  if (filters.limit !== undefined) query.set('limit', String(filters.limit));
  const suffix = query.size ? `?${query.toString()}` : '';
  const response = await fetch(`/api/questions${suffix}`);
  const body = await response.json() as QuestionCatalogPage | { error?: { message?: string } };
  if (!response.ok) {
    throw new Error('error' in body ? body.error?.message ?? 'Unable to load questions.' : 'Unable to load questions.');
  }
  return body as QuestionCatalogPage;
}

export interface InterviewQuestionView {
  id: number;
  text: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  options: Array<{ id: number; text: string }>;
}

export interface CurrentInterviewQuestion {
  questionNumber: number;
  totalQuestions: number;
  question: InterviewQuestionView;
}

interface ApiEnvelope<T> {
  data: T;
}

async function authorizedRequest<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });
  const body = await response.json() as ApiEnvelope<T> | { error?: { message?: string } };
  if (!response.ok) {
    throw new Error('error' in body ? body.error?.message ?? 'Request failed.' : 'Request failed.');
  }
  return (body as ApiEnvelope<T>).data;
}

export async function getSkills(): Promise<Skill[]> {
  const response = await fetch('/api/skills');
  const body = await response.json() as ApiEnvelope<Skill[]>;
  if (!response.ok) throw new Error('Не удалось загрузить список навыков.');
  return body.data;
}

export function createInterview(accessToken: string, skillId: number, difficulty: string) {
  return authorizedRequest<{ id: number | string; status: string; difficulty: string; totalQuestions: number }>(
    '/api/interviews',
    accessToken,
    { method: 'POST', body: JSON.stringify({ skillId, difficulty }) },
  );
}

export function getCurrentInterviewQuestion(accessToken: string, interviewId: string) {
  return authorizedRequest<CurrentInterviewQuestion>(
    `/api/interviews/${encodeURIComponent(interviewId)}/current-question`,
    accessToken,
  );
}

export function submitInterviewAnswer(
  accessToken: string,
  interviewId: string,
  answer: { questionId: number; selectedOptionIds: number[] },
) {
  return authorizedRequest<{
    isCorrect: boolean;
    questionScore: number;
    nextDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
    completed: boolean;
    score: number | null;
    userLevel: string | null;
  }>(`/api/interviews/${encodeURIComponent(interviewId)}/answer`, accessToken, {
    method: 'POST',
    body: JSON.stringify(answer),
  });
}

export interface InterviewResult {
  id: number;
  skill: string;
  difficulty: string;
  score: number;
  userLevel: string;
  correctAnswers: number;
  totalQuestions: number;
  questions: Array<{
    id: number;
    order: number;
    text: string;
    score: number;
    isCorrect: boolean;
    options: Array<{ id: number; text: string; isCorrect: boolean; selected: boolean }>;
  }>;
}

export interface InterviewAnalysis {
  summary: string;
  explanations: Array<{ questionOrder: number; explanation: string }>;
}

export function getInterviewResult(accessToken: string, interviewId: string) {
  return authorizedRequest<InterviewResult>(
    `/api/interviews/${encodeURIComponent(interviewId)}/result`,
    accessToken,
  );
}

export function getInterviewAnalysis(accessToken: string, interviewId: string) {
  return authorizedRequest<InterviewAnalysis>(
    `/api/interviews/${encodeURIComponent(interviewId)}/analysis`,
    accessToken,
    { method: 'POST', body: JSON.stringify({}) },
  );
}

export interface InterviewHistoryItem {
  id: number | string;
  skill: string;
  difficulty: string;
  status: string;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
}

export function getInterviewHistory(accessToken: string) {
  return authorizedRequest<InterviewHistoryItem[]>(
    '/api/interviews',
    accessToken,
  );
}

export interface UserStatistics {
  completedInterviews: number;
  averageScore: number;
  bestScore: number;
  lastInterviewAt: string | null;
  recentInterview: Pick<InterviewHistoryItem, 'id' | 'skill' | 'difficulty' | 'score' | 'status' | 'completedAt'> | null;
}

export interface UserSkillProgress {
  id: number | string;
  name: string;
  score: number;
  completedInterviews: number;
  updatedAt: string;
}

export function getUserStatistics(accessToken: string) {
  return authorizedRequest<UserStatistics>('/api/users/me/statistics', accessToken);
}

export function getUserSkills(accessToken: string) {
  return authorizedRequest<UserSkillProgress[]>('/api/users/me/skills', accessToken);
}

export interface ProgressPoint {
  id: number | string;
  skillId: number | string;
  skill: string;
  score: number;
  completedAt: string;
}

export function getUserProgress(accessToken: string, skillId?: number | string) {
  const query = skillId === undefined ? '' : `?skillId=${encodeURIComponent(skillId)}`;
  return authorizedRequest<ProgressPoint[]>(
    `/api/users/me/progress${query}`,
    accessToken,
  );
}

export async function getInterviewQuestions(track: string, level: string): Promise<InterviewQuestionSet> {
  const query = new URLSearchParams({ track, level });
  const response = await fetch(`/api/interviews/questions?${query}`);

  if (!response.ok) {
    throw new Error(`Unable to load interview questions (${response.status})`);
  }

  return response.json() as Promise<InterviewQuestionSet>;
}
