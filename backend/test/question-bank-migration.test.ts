import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const migration = await readFile(
  new URL('../migrations/002_expand_question_bank.sql', import.meta.url),
  'utf8',
);
const coreQuestionMigration = await readFile(
  new URL('../migrations/006_expand_core_question_bank.sql', import.meta.url),
  'utf8',
);
const skillDescriptionMigration = await readFile(
  new URL('../migrations/007_fix_skill_descriptions.sql', import.meta.url),
  'utf8',
);
const russianQuestionMigration = await readFile(
  new URL('../migrations/008_russian_question_bank.sql', import.meta.url),
  'utf8',
);
const expandedCatalogMigration = await readFile(
  new URL('../migrations/009_question_catalog_and_expansion.sql', import.meta.url),
  'utf8',
);
const backendFullstackPromptMigration = await readFile(
  new URL('../migrations/010_expand_backend_fullstack_prompts.sql', import.meta.url),
  'utf8',
);

describe('question bank migration', () => {
  it('adds positions 4 through 10 for every track and level', () => {
    const rows = [...migration.matchAll(
      /^\s+\('([^']+)', '([^']+)', '([^']+)', '([^']+)', (\d+)\),?$/gm,
    )].map(([, track, level, topic, prompt, position]) => ({
      track,
      level,
      topic,
      prompt,
      position: Number(position),
    }));

    expect(rows).toHaveLength(63);
    expect(new Set(rows.map(({ track, level, position }) => `${track}/${level}/${position}`)).size).toBe(63);
    expect(new Set(rows.map(({ prompt }) => prompt)).size).toBe(63);

    for (const track of ['Frontend', 'Backend', 'Fullstack']) {
      for (const level of ['Junior', 'Junior+', 'Middle']) {
        const positions = rows
          .filter((row) => row.track === track && row.level === level)
          .map((row) => row.position)
          .sort((left, right) => left - right);

        expect(positions, `${track} ${level}`).toEqual([4, 5, 6, 7, 8, 9, 10]);
      }
    }
  });
});

describe('core interview question bank migration', () => {
  it('seeds ten distinct questions for every remaining active skill', () => {
    const rows = [...coreQuestionMigration.matchAll(
      /^\s+\('([^']+)', '(?:EASY|MEDIUM|HARD)', '([^']+)', '[^']+',/gm,
    )].map(([, skill, question]) => ({ skill, question }));
    const expectedSkills = ['TypeScript', 'React', 'Node.js', 'HTML', 'CSS', 'SQL', 'Git'];

    expect(rows).toHaveLength(70);
    expect(new Set(rows.map(({ skill, question }) => `${skill}/${question}`)).size).toBe(70);
    for (const skill of expectedSkills) {
      expect(rows.filter((row) => row.skill === skill), skill).toHaveLength(10);
    }
  });

  it('adds four answer options and at least one correct option per seeded question', () => {
    expect(coreQuestionMigration).toContain('jsonb_to_recordset');
    expect(coreQuestionMigration).toContain('option.is_correct');
    expect(coreQuestionMigration).toContain('question_options');
    expect(coreQuestionMigration).toContain('jsonb_array_length(seed.options) = 4');
  });

  it('repairs all seeded skill descriptions using clean UTF-8 text', () => {
    for (const skill of ['JavaScript', 'TypeScript', 'React', 'Node.js', 'HTML', 'CSS', 'SQL', 'Git']) {
      expect(skillDescriptionMigration).toContain(`WHEN '${skill}'`);
    }
    expect(skillDescriptionMigration).not.toContain('\uFFFD');
  });

  it('adds twenty Russian JavaScript questions covering DOM and asynchronous code', () => {
    const rows = [...russianQuestionMigration.matchAll(
      /^\s+\('([^']+)', '(?:SINGLE_CHOICE|MULTIPLE_CHOICE)', '(?:EASY|MEDIUM|HARD)',/gm,
    )].map(([, question]) => question);

    expect(rows).toHaveLength(20);
    expect(rows.some((question) => question.includes('DOM'))).toBe(true);
    expect(rows.some((question) => question.includes('Promise'))).toBe(true);
    expect(rows.some((question) => question.includes('async/await'))).toBe(true);
    expect(rows.some((question) => question.includes('event loop'))).toBe(true);
  });

  it('translates old question and option text before adding the new bank', () => {
    const translations = [...russianQuestionMigration.matchAll(
      /^  \('([^']+)', '([^']+)', jsonb_build_array\(/gm,
    )];
    expect(translations).toHaveLength(80);
    expect(russianQuestionMigration).toContain('UPDATE question_options');
    expect(russianQuestionMigration).toContain('UPDATE questions');
    expect(russianQuestionMigration).toContain('DOMContentLoaded');
    expect(russianQuestionMigration).toContain('Promise');
  });

  it('adds 24 more Russian JavaScript questions evenly split by difficulty and cites the MIT source', () => {
    const rows = [...expandedCatalogMigration.matchAll(
      /^\s+\('([^']+)', '(EASY|MEDIUM|HARD)', (\d+), ARRAY\[/gm,
    )].map(([, question, difficulty, correctOption]) => ({ question, difficulty, correctOption: Number(correctOption) }));

    expect(rows).toHaveLength(24);
    expect(rows.filter((row) => row.difficulty === 'EASY')).toHaveLength(8);
    expect(rows.filter((row) => row.difficulty === 'MEDIUM')).toHaveLength(8);
    expect(rows.filter((row) => row.difficulty === 'HARD')).toHaveLength(8);
    expect(rows.every((row) => row.correctOption >= 1 && row.correctOption <= 4)).toBe(true);
    expect(expandedCatalogMigration).toContain('MIT-licensed Front End Interview Handbook');
    expect(expandedCatalogMigration).toContain('Promise.allSettled');
    expect(expandedCatalogMigration).toContain('MutationObserver');
  });

  it('adds thirty prompts to each existing Backend and Fullstack track', () => {
    const rows = [...backendFullstackPromptMigration.matchAll(
      /^\s+\('(Backend|Fullstack)', '(Junior|Junior\+|Middle)', '([^']+)', '([^']+)', (\d+)\),?$/gm,
    )].map(([, track, level, topic, prompt, position]) => ({ track, level, topic, prompt, position: Number(position) }));

    expect(rows).toHaveLength(60);
    for (const track of ['Backend', 'Fullstack']) {
      expect(rows.filter((row) => row.track === track)).toHaveLength(30);
      for (const level of ['Junior', 'Junior+', 'Middle']) {
        const levelRows = rows.filter((row) => row.track === track && row.level === level);
        expect(levelRows, `${track} ${level}`).toHaveLength(10);
        expect(levelRows.map((row) => row.position).sort((a, b) => a - b)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
      }
    }
    expect(new Set(rows.map((row) => `${row.track}/${row.level}/${row.prompt}`)).size).toBe(60);
    expect(backendFullstackPromptMigration).toContain('surajvsk/nodejs-interview-prep');
  });

});
