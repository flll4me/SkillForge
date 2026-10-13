export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
export type UserLevel = 'Beginner' | 'Junior' | 'Junior+' | 'Middle' | 'Advanced';
import { userLevelThresholds } from '../config/interview.js';

export function scoreAnswer(
  type: QuestionType,
  selectedOptionIds: number[],
  correctOptionIds: number[],
): number {
  if (selectedOptionIds.length === 0 || correctOptionIds.length === 0) return 0;
  if (type === 'SINGLE_CHOICE' && selectedOptionIds.length !== 1) return 0;

  const selected = new Set(selectedOptionIds);
  const correct = new Set(correctOptionIds);
  if (selected.size !== correct.size) return 0;
  for (const optionId of correct) {
    if (!selected.has(optionId)) return 0;
  }
  return 100;
}

export function getNextDifficulty(current: Difficulty, isCorrect: boolean): Difficulty {
  if (isCorrect) {
    if (current === 'EASY') return 'MEDIUM';
    return 'HARD';
  }
  if (current === 'HARD') return 'MEDIUM';
  return 'EASY';
}

export function getUserLevel(score: number): UserLevel {
  return userLevelThresholds.find(({ minimumScore }) => score >= minimumScore)?.level ?? 'Beginner';
}
