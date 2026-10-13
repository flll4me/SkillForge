export function parseInterviewQuestionCount(value: string | undefined): number {
  if (value === undefined || value === '') return 10;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new Error('INTERVIEW_QUESTION_COUNT must be an integer between 1 and 100.');
  }
  return parsed;
}

export const userLevelThresholds = [
  { minimumScore: 90, level: 'Advanced' },
  { minimumScore: 75, level: 'Middle' },
  { minimumScore: 60, level: 'Junior+' },
  { minimumScore: 40, level: 'Junior' },
  { minimumScore: 0, level: 'Beginner' },
] as const;
