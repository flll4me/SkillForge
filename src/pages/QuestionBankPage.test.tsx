import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getQuestionCatalog, getSkills } from '../api/interviews.js';
import { QuestionBankPage } from './QuestionBankPage.js';

vi.mock('../api/interviews.js', () => ({
  getQuestionCatalog: vi.fn(),
  getSkills: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSkills).mockResolvedValue([
    { id: 2, name: 'JavaScript', description: '', questionCount: 124 },
  ]);
  vi.mocked(getQuestionCatalog).mockResolvedValue({
    data: [{ id: 5, skillId: 2, skill: 'JavaScript', text: 'Тестовый вопрос', difficulty: 'HARD' }],
    meta: { page: 1, limit: 50, total: 1 },
  });
});

describe('question bank filters', () => {
  it('reloads the question bank with selected skill and difficulty', async () => {
    const actor = userEvent.setup();
    render(<MemoryRouter><QuestionBankPage /></MemoryRouter>);

    expect(await screen.findByText('Тестовый вопрос')).toBeInTheDocument();
    await actor.selectOptions(screen.getByRole('combobox', { name: 'Фильтр по навыку' }), '2');
    await actor.selectOptions(screen.getByRole('combobox', { name: 'Фильтр по сложности' }), 'HARD');

    await waitFor(() => expect(getQuestionCatalog).toHaveBeenLastCalledWith({ skillId: '2', difficulty: 'HARD', page: 1, limit: 50 }));
  });
});
