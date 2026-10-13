import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './PracticeApp.js';
import { getInterviewQuestions } from './api/interviews.js';

vi.mock('./api/interviews.js', () => ({
  getInterviewQuestions: vi.fn(),
}));

const questionSets = {
  Frontend: [
    { topic: 'JavaScript', prompt: 'What is the difference between let, const, and var?' },
    { topic: 'Async', prompt: 'How does the event loop work?' },
    { topic: 'React', prompt: 'Why does React need keys for lists?' },
  ],
  Backend: [
    { topic: 'HTTP and API', prompt: 'How do GET, POST, PUT, and PATCH differ?' },
    { topic: 'Database', prompt: 'What is a database index?' },
    { topic: 'Security', prompt: 'What is authentication?' },
  ],
  Fullstack: [
    { topic: 'Client and server', prompt: 'How does a request reach a server?' },
    { topic: 'REST API', prompt: 'How would you design a tasks API?' },
    { topic: 'Architecture', prompt: 'How would you split app responsibilities?' },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  getInterviewQuestions.mockImplementation(async (track, level) => ({
    track,
    level,
    questions: questionSets[track],
  }));
});

describe('SkillForge interview flow', () => {
  it('lets the user choose a track and difficulty', async () => {
    const user = userEvent.setup();
    render(<App />);

    const backendTrack = screen.getByRole('radio', { name: /backend/i });
    await user.click(backendTrack);
    await user.selectOptions(screen.getByLabelText(/уровень сложности/i), 'Middle');

    expect(backendTrack).toBeChecked();
    expect(screen.getByLabelText(/уровень сложности/i)).toHaveValue('Middle');
  });

  it('starts an interview using the selected track and shows its first question', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('radio', { name: /backend/i }));
    await user.selectOptions(screen.getByLabelText(/уровень сложности/i), 'Middle');
    await user.click(screen.getByRole('button', { name: /начать интервью/i }));

    expect(screen.getByText(/Backend · Middle/i)).toBeInTheDocument();
    expect(screen.getByText(/Вопрос 1 из 3/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /GET, POST, PUT, and PATCH/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /твой ответ/i })).toBeInTheDocument();
  });

  it('requires an answer and advances while keeping the previous answer', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /начать интервью/i }));
    const answerField = screen.getByRole('textbox', { name: /твой ответ/i });
    await user.type(answerField, 'const нельзя переназначить, let можно.');
    await user.click(screen.getByRole('button', { name: /следующий вопрос/i }));

    expect(screen.getByText(/Вопрос 2 из 3/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /назад/i }));
    expect(screen.getByRole('textbox', { name: /твой ответ/i })).toHaveValue('const нельзя переназначить, let можно.');
  });

  it('shows all submitted answers on the result screen', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /начать интервью/i }));

    for (const answer of ['Ответ про let и const', 'Ответ про event loop', 'Ответ про ключи React']) {
      await user.type(screen.getByRole('textbox', { name: /твой ответ/i }), answer);
      const nextButton = screen.queryByRole('button', { name: /следующий вопрос/i });
      await user.click(nextButton ?? screen.getByRole('button', { name: /завершить интервью/i }));
    }

    expect(screen.getByRole('heading', { name: /интервью завершено/i })).toBeInTheDocument();
    const answers = screen.getByRole('region', { name: /твои ответы/i });
    expect(within(answers).getByText('Ответ про let и const')).toBeInTheDocument();
    expect(within(answers).getByText('Ответ про event loop')).toBeInTheDocument();
    expect(within(answers).getByText('Ответ про ключи React')).toBeInTheDocument();
  });
});
