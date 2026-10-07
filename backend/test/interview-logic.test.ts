import { describe, expect, it } from 'vitest';
import { getNextDifficulty, getUserLevel, scoreAnswer } from '../src/services/interview-logic.js';

describe('interview scoring', () => {
  it('scores a single-choice answer as all-or-nothing', () => {
    expect(scoreAnswer('SINGLE_CHOICE', [4], [4])).toBe(100);
    expect(scoreAnswer('SINGLE_CHOICE', [3], [4])).toBe(0);
    expect(scoreAnswer('SINGLE_CHOICE', [4, 5], [4])).toBe(0);
  });

  it('requires an exact option set for multiple-choice answers', () => {
    expect(scoreAnswer('MULTIPLE_CHOICE', [1, 3], [3, 1])).toBe(100);
    expect(scoreAnswer('MULTIPLE_CHOICE', [1], [1, 3])).toBe(0);
    expect(scoreAnswer('MULTIPLE_CHOICE', [1, 2, 3], [1, 3])).toBe(0);
  });

  it.each([
    ['EASY', true, 'MEDIUM'],
    ['MEDIUM', true, 'HARD'],
    ['HARD', true, 'HARD'],
    ['HARD', false, 'MEDIUM'],
    ['MEDIUM', false, 'EASY'],
    ['EASY', false, 'EASY'],
  ] as const)('moves from %s after correct=%s to %s', (difficulty, correct, next) => {
    expect(getNextDifficulty(difficulty, correct)).toBe(next);
  });

  it.each([
    [0, 'Beginner'], [39, 'Beginner'], [40, 'Junior'], [59, 'Junior'],
    [60, 'Junior+'], [74, 'Junior+'], [75, 'Middle'], [89, 'Middle'],
    [90, 'Advanced'], [100, 'Advanced'],
  ] as const)('classifies score %s as %s', (score, level) => {
    expect(getUserLevel(score)).toBe(level);
  });
});
