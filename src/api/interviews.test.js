import { afterEach, describe, expect, it, vi } from 'vitest';
import { getInterviewQuestions, getQuestionCatalog } from './interviews.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getInterviewQuestions', () => {
  it('requests a question set for the selected track and level', async () => {
    const questionSet = {
      track: 'Backend',
      level: 'Middle',
      questions: [{ topic: 'HTTP', prompt: 'Question returned by the API' }],
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(questionSet),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getInterviewQuestions('Backend', 'Middle')).resolves.toEqual(questionSet);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/interviews/questions?track=Backend&level=Middle',
    );
  });

  it('throws when the API responds with an error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    await expect(getInterviewQuestions('Frontend', 'Junior')).rejects.toThrow(
      'Unable to load interview questions (503)',
    );
  });
});

describe('getQuestionCatalog', () => {
  it('requests only the questions matching selected skill and difficulty', async () => {
    const catalog = { data: [], meta: { page: 1, limit: 50, total: 0 } };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(catalog) });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getQuestionCatalog({ skillId: 4, difficulty: 'HARD' })).resolves.toEqual(catalog);
    expect(fetchMock).toHaveBeenCalledWith('/api/questions?skillId=4&difficulty=HARD');
  });
});
