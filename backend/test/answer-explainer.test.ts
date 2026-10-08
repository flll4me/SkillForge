import { describe, expect, it, vi } from 'vitest';
import { explainAnswersWithGroq } from '../src/services/answer-explainer.js';

describe('AI answer explanations', () => {
  it('requires an API key instead of silently pretending the AI ran', async () => {
    await expect(explainAnswersWithGroq([], { apiKey: '' })).rejects.toMatchObject({ code: 'AI_NOT_CONFIGURED' });
  });

  it('sends only quiz answers to the model and parses the explanation response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: JSON.stringify({ summary: 'Повтори основы.', explanations: [{ questionOrder: 1, explanation: 'Promise.then возвращает новый Promise.' }] }) } }] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const input = [{ questionOrder: 1, question: 'Что возвращает then?', difficulty: 'EASY', correctAnswer: 'Promise', selectedAnswer: 'undefined' }];

    await expect(explainAnswersWithGroq(input, { apiKey: 'secret', model: 'openai/gpt-oss-20b' })).resolves.toEqual({
      summary: 'Повтори основы.',
      explanations: [{ questionOrder: 1, explanation: 'Promise.then возвращает новый Promise.' }],
    });
    expect(fetchMock).toHaveBeenCalledWith('https://api.groq.com/openai/v1/chat/completions', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ authorization: 'Bearer secret' }),
    }));
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(requestBody.model).toBe('openai/gpt-oss-20b');
    expect(requestBody.messages[1].content).toContain('JSON quiz answers');
    expect(fetchMock.mock.calls[0][1].body).not.toContain('email');
    vi.unstubAllGlobals();
  });

  it('reports an empty API balance clearly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    await expect(explainAnswersWithGroq([], { apiKey: 'secret' }))
      .rejects.toMatchObject({ code: 'AI_QUOTA_EXCEEDED' });
    vi.unstubAllGlobals();
  });
});
