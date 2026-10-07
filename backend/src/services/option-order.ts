import { createHash } from 'node:crypto';

/** Return a repeatable, interview-specific permutation without detaching option IDs from their text. */
export function shuffleOptionsForQuestion<T>(
  options: readonly T[],
  interviewId: number | string,
  questionId: number | string,
): T[] {
  const shuffled = [...options];
  const digest = createHash('sha256').update(`${interviewId}:${questionId}`).digest();
  let state = digest.readUInt32BE(0) || 1;

  // Fisher–Yates with a per-interview/per-question pseudorandom stream.
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const otherIndex = (state >>> 0) % (index + 1);
    [shuffled[index], shuffled[otherIndex]] = [shuffled[otherIndex], shuffled[index]];
  }

  return shuffled;
}
