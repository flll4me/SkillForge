import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInterview, getCurrentInterviewQuestion, getInterviewAnalysis, getInterviewResult, getSkills, submitInterviewAnswer } from '../api/interviews.js';
import { InterviewStartPage } from './InterviewStartPage.js';
import { InterviewPage } from './InterviewPage.js';
import { InterviewResultPage } from './InterviewResultPage.js';

vi.mock('../auth/AuthContext.js', () => ({
  useAuth: () => ({ accessToken: 'access-token' }),
}));
vi.mock('../api/interviews.js', () => ({
  createInterview: vi.fn(),
  getCurrentInterviewQuestion: vi.fn(),
  getSkills: vi.fn(),
  submitInterviewAnswer: vi.fn(),
  getInterviewAnalysis: vi.fn(),
  getInterviewResult: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

describe('interview pages', () => {
  it('loads available skills and starts an interview with selected settings', async () => {
    const actor = userEvent.setup();
    vi.mocked(getSkills).mockResolvedValueOnce([
      { id: '7', name: 'JavaScript', description: '', questionCount: 10 },
      { id: '8', name: 'React', description: '', questionCount: 4 },
    ]);
    vi.mocked(createInterview).mockResolvedValueOnce({ id: '42', status: 'IN_PROGRESS', difficulty: 'HARD', totalQuestions: 10 });

    render(
      <MemoryRouter initialEntries={['/interview/new']}>
        <Routes>
          <Route path="/interview/new" element={<InterviewStartPage />} />
          <Route path="/interview/:id" element={<p>Interview session opened</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await actor.selectOptions(await screen.findByLabelText('Навык'), '7');
    await actor.selectOptions(screen.getByLabelText('Начальная сложность'), 'HARD');
    await actor.click(screen.getByRole('button', { name: 'Начать интервью' }));

    expect(await screen.findByText('Interview session opened')).toBeInTheDocument();
    expect(createInterview).toHaveBeenCalledWith('access-token', 7, 'HARD');
  });

  it('submits an answer and advances to the next question', async () => {
    const actor = userEvent.setup();
    vi.mocked(getCurrentInterviewQuestion).mockResolvedValueOnce({
      questionNumber: 1,
      totalQuestions: 10,
      question: {
        id: 12,
        text: 'What is a closure?',
        type: 'SINGLE_CHOICE',
        difficulty: 'MEDIUM',
        options: [{ id: 1, text: 'A function with its lexical scope' }, { id: 2, text: 'A loop' }],
      },
    });
    vi.mocked(submitInterviewAnswer).mockResolvedValueOnce({
      isCorrect: true, questionScore: 100, nextDifficulty: 'HARD', completed: false, score: null, userLevel: null,
    });
    vi.mocked(getCurrentInterviewQuestion).mockResolvedValueOnce({
      questionNumber: 2,
      totalQuestions: 10,
      question: {
        id: 13,
        text: 'Next question',
        type: 'SINGLE_CHOICE',
        difficulty: 'HARD',
        options: [{ id: 3, text: 'Next answer' }],
      },
    });

    render(
      <MemoryRouter initialEntries={['/interview/42']}>
        <Routes>
          <Route path="/interview/:id" element={<InterviewPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await actor.click(await screen.findByLabelText('A function with its lexical scope'));
    await actor.click(screen.getByRole('button', { name: 'Ответить' }));

    expect(await screen.findByRole('heading', { name: 'Next question' })).toBeInTheDocument();
    expect(submitInterviewAnswer).toHaveBeenCalledWith('access-token', '42', {
      questionId: 12,
      selectedOptionIds: [1],
    });
  });

  it('sends a completed interview to the result route', async () => {
    const actor = userEvent.setup();
    vi.mocked(getCurrentInterviewQuestion).mockResolvedValueOnce({
      questionNumber: 10,
      totalQuestions: 10,
      question: {
        id: 20,
        text: 'Last question',
        type: 'SINGLE_CHOICE',
        difficulty: 'EASY',
        options: [{ id: 4, text: 'Final answer' }],
      },
    });
    vi.mocked(submitInterviewAnswer).mockResolvedValueOnce({
      isCorrect: true, questionScore: 100, nextDifficulty: 'MEDIUM', completed: true, score: 80, userLevel: 'Middle',
    });

    render(
      <MemoryRouter initialEntries={['/interview/42']}>
        <Routes>
          <Route path="/interview/:id" element={<InterviewPage />} />
          <Route path="/interview/:id/result" element={<p>Result page opened</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await actor.click(await screen.findByLabelText('Final answer'));
    await actor.click(screen.getByRole('button', { name: 'Ответить' }));
    expect(await screen.findByText('Result page opened')).toBeInTheDocument();
  });

  it('shows an AI loading state and then the explanation for a wrong answer', async () => {
    vi.mocked(getInterviewResult).mockResolvedValueOnce({
      id: 42, skill: 'JavaScript', difficulty: 'EASY', score: 0, userLevel: 'Junior', correctAnswers: 0, totalQuestions: 1,
      questions: [{ id: 12, order: 1, text: 'Что возвращает then?', score: 0, isCorrect: false, options: [
        { id: 1, text: 'Promise', isCorrect: true, selected: false }, { id: 2, text: 'undefined', isCorrect: false, selected: true },
      ] }],
    });
    let finishAnalysis!: (analysis: { summary: string; explanations: Array<{ questionOrder: number; explanation: string }> }) => void;
    vi.mocked(getInterviewAnalysis).mockReturnValueOnce(new Promise((resolve) => { finishAnalysis = resolve; }));

    render(<MemoryRouter initialEntries={['/interview/42/result']}><Routes>
      <Route path="/interview/:id/result" element={<InterviewResultPage />} />
    </Routes></MemoryRouter>);

    expect(await screen.findByText(/Готовим разбор ошибок/)).toBeInTheDocument();
    finishAnalysis({ summary: 'Повтори работу промисов.', explanations: [{ questionOrder: 1, explanation: 'then создаёт и возвращает новый Promise.' }] });
    expect(await screen.findByText('then создаёт и возвращает новый Promise.')).toBeInTheDocument();
    expect(screen.getByText('Promise · правильный ответ')).toBeInTheDocument();
    expect(screen.getByText('Повтори работу промисов.')).toBeInTheDocument();
  });
});
