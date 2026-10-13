import { describe, expect, it } from 'vitest';
import { shuffleOptionsForQuestion } from '../src/services/option-order.js';

describe('answer option order', () => {
  const options = [
    { id: 1, text: 'A' },
    { id: 2, text: 'B' },
    { id: 3, text: 'C' },
    { id: 4, text: 'D' },
  ];

  it('returns a stable permutation for the same interview and question', () => {
    const first = shuffleOptionsForQuestion(options, 17, 42);

    expect(shuffleOptionsForQuestion(options, 17, 42)).toEqual(first);
    expect(first).toHaveLength(options.length);
    expect(first.map(({ id }) => id).sort()).toEqual([1, 2, 3, 4]);
  });

  it('changes order between interview questions so option position cannot be guessed', () => {
    const first = shuffleOptionsForQuestion(options, 17, 42);
    const otherQuestion = shuffleOptionsForQuestion(options, 17, 43);
    const otherInterview = shuffleOptionsForQuestion(options, 18, 42);

    expect(otherQuestion.map(({ id }) => id)).not.toEqual(first.map(({ id }) => id));
    expect(otherInterview.map(({ id }) => id)).not.toEqual(first.map(({ id }) => id));
  });

  it('keeps option IDs attached to their original answer text', () => {
    const shuffled = shuffleOptionsForQuestion(options, 17, 42);

    expect(shuffled.map(({ id, text }) => `${id}:${text}`).sort()).toEqual(['1:A', '2:B', '3:C', '4:D']);
  });
});
