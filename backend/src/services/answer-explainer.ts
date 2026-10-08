export interface AnswerForExplanation {
  questionOrder: number;
  question: string;
  difficulty: string;
  correctAnswer: string;
  selectedAnswer: string;
}

export interface AnswerExplanationResult {
  summary: string;
  explanations: Array<{ questionOrder: number; explanation: string }>;
}

export class AnswerExplainerError extends Error {
  constructor(readonly code: 'AI_NOT_CONFIGURED' | 'AI_UNAVAILABLE' | 'AI_QUOTA_EXCEEDED' | 'AI_INVALID_RESPONSE') {
    super(code);
  }
}

function extractOutputText(response: Record<string, unknown>): string {
  const choices = response.choices;
  if (Array.isArray(choices)) {
    const firstChoice = choices[0];
    if (firstChoice && typeof firstChoice === 'object' && 'message' in firstChoice) {
      const message = firstChoice.message;
      if (message && typeof message === 'object' && 'content' in message && typeof message.content === 'string') return message.content;
    }
  }
  throw new AnswerExplainerError('AI_INVALID_RESPONSE');
}

export async function explainAnswersWithGroq(
  answers: AnswerForExplanation[],
  settings: { apiKey?: string; model?: string } = {},
): Promise<AnswerExplanationResult> {
  const apiKey = settings.apiKey ?? process.env.GROQ_API_KEY;
  if (!apiKey) throw new AnswerExplainerError('AI_NOT_CONFIGURED');

  let raw: string;
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: settings.model ?? process.env.GROQ_MODEL ?? 'openai/gpt-oss-20b',
        messages: [
          {
            role: 'system',
            content: 'Ты русскоязычный преподаватель JavaScript и веб-разработки. Объясняй кратко, доброжелательно и по существу. Используй только данные вопроса и верного ответа. Верни только JSON-объект с полями summary (строка с общим советом) и explanations (массив объектов questionOrder, explanation). Для каждого переданного вопроса верни ровно одно объяснение.',
          },
          { role: 'user', content: `JSON quiz answers: ${JSON.stringify(answers)}` },
        ],
        response_format: { type: 'json_object' },
        reasoning_effort: 'low',
        max_completion_tokens: 2500,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (response.status === 429) throw new AnswerExplainerError('AI_QUOTA_EXCEEDED');
    if (!response.ok) throw new AnswerExplainerError('AI_UNAVAILABLE');
    raw = extractOutputText(await response.json() as Record<string, unknown>);
  } catch (error) {
    if (error instanceof AnswerExplainerError) throw error;
    throw new AnswerExplainerError('AI_UNAVAILABLE');
  }

  try {
    const parsed = JSON.parse(raw) as AnswerExplanationResult;
    if (typeof parsed.summary !== 'string' || !Array.isArray(parsed.explanations)) throw new Error('Invalid shape');
    const explanations = parsed.explanations.filter((item) =>
      Number.isInteger(item?.questionOrder) && typeof item.explanation === 'string',
    );
    return { summary: parsed.summary, explanations };
  } catch {
    throw new AnswerExplainerError('AI_INVALID_RESPONSE');
  }
}
