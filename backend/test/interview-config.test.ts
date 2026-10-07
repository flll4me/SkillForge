import { describe, expect, it } from 'vitest';
import { parseInterviewQuestionCount, userLevelThresholds } from '../src/config/interview.js';

describe('interview configuration', () => {
  it('defaults to ten questions and accepts a positive integer override', () => {
    expect(parseInterviewQuestionCount(undefined)).toBe(10);
    expect(parseInterviewQuestionCount('12')).toBe(12);
  });

  it.each(['0', '-2', '1.5', 'not-a-number'])('rejects invalid question count %s', (value) => {
    expect(() => parseInterviewQuestionCount(value)).toThrow('INTERVIEW_QUESTION_COUNT');
  });

  it('keeps level cutoffs in backend configuration', () => {
    expect(userLevelThresholds).toEqual([
      { minimumScore: 90, level: 'Advanced' },
      { minimumScore: 75, level: 'Middle' },
      { minimumScore: 60, level: 'Junior+' },
      { minimumScore: 40, level: 'Junior' },
      { minimumScore: 0, level: 'Beginner' },
    ]);
  });
});
