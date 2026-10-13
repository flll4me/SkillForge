import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const routes = await readFile(new URL('../src/routes/interviews.ts', import.meta.url), 'utf8');

describe('interview question selection', () => {
  it('varies question sets while preferring the requested difficulty', () => {
    expect(routes).toMatch(/ORDER BY CASE question\.difficulty[\s\S]*?RANDOM\(\)[\s\S]*?LIMIT \$5/);
    expect(routes).toContain('PARTITION BY question.difficulty ORDER BY RANDOM()');
    expect(routes).toContain('CEIL($5::numeric / 3)');
  });

  it('limits each interview to the configured count and stores unique questions', () => {
    expect(routes).toContain('LIMIT $5');
    expect(routes).toContain('questionCount');
    expect(routes).toContain('This skill does not have ${questionCount} active questions yet.');
  });
});
