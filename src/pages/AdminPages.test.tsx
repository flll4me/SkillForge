import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAdminQuestion, getAdminQuestion, getAdminQuestions, getAdminSkills, updateAdminQuestion } from '../api/admin.js';
import { AdminQuestionsPage } from './AdminPages.js';

vi.mock('../auth/AuthContext.js', () => ({ useAuth: () => ({ accessToken: 'admin-token' }) }));
vi.mock('../api/admin.js', () => ({
  createAdminQuestion: vi.fn(),
  getAdminQuestion: vi.fn(),
  createAdminSkill: vi.fn(),
  getAdminQuestions: vi.fn(),
  getAdminSkills: vi.fn(),
  getAdminStatistics: vi.fn(),
  getAdminUsers: vi.fn(),
  setAdminQuestionActive: vi.fn(),
  setAdminSkillActive: vi.fn(),
  setAdminUserStatus: vi.fn(),
  updateAdminQuestion: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAdminSkills).mockResolvedValue({ data: [{ id: 3, name: 'JavaScript', description: '', isActive: true }] });
  vi.mocked(getAdminQuestions).mockResolvedValue({ data: [], meta: { page: 1, limit: 100, total: 0 } });
});

describe('admin question management', () => {
  it('creates a single-choice question with its correct option', async () => {
    const actor = userEvent.setup();
    render(<MemoryRouter><AdminQuestionsPage /></MemoryRouter>);

    await actor.type(await screen.findByLabelText('Текст вопроса'), 'What does const prevent?');
    await actor.type(screen.getByLabelText('Вариант 1'), 'Reassignment of the binding');
    await actor.type(screen.getByLabelText('Вариант 2'), 'Mutation of every nested property');
    await actor.click(screen.getByRole('button', { name: 'Добавить вопрос' }));

    expect(createAdminQuestion).toHaveBeenCalledWith('admin-token', {
      skillId: 3,
      text: 'What does const prevent?',
      type: 'SINGLE_CHOICE',
      difficulty: 'EASY',
      options: [
        { text: 'Reassignment of the binding', isCorrect: true },
        { text: 'Mutation of every nested property', isCorrect: false },
      ],
    });
  });

  it('edits a question and its answer options', async () => {
    const actor = userEvent.setup();
    vi.mocked(getAdminQuestions).mockResolvedValue({
      data: [{ id: 12, skillId: 3, skill: 'JavaScript', text: 'Old question text', type: 'SINGLE_CHOICE', difficulty: 'MEDIUM', isActive: true }],
      meta: { page: 1, limit: 100, total: 1 },
    });
    vi.mocked(getAdminQuestion).mockResolvedValue({
      data: {
        id: 12, skillId: 3, skill: 'JavaScript', text: 'Old question text', type: 'SINGLE_CHOICE', difficulty: 'MEDIUM', isActive: true,
        options: [
          { id: 1, text: 'Old correct answer', isCorrect: true },
          { id: 2, text: 'Distractor two', isCorrect: false },
          { id: 3, text: 'Distractor three', isCorrect: false },
          { id: 4, text: 'Distractor four', isCorrect: false },
        ],
      },
    });
    render(<MemoryRouter><AdminQuestionsPage /></MemoryRouter>);

    await actor.click(await screen.findByRole('button', { name: 'Edit question 12' }));
    await actor.clear(await screen.findByLabelText('Option 1'));
    await actor.type(screen.getByLabelText('Option 1'), 'Updated correct answer');
    await actor.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(updateAdminQuestion).toHaveBeenCalledWith('admin-token', 12, expect.objectContaining({
      skillId: 3,
      text: 'Old question text',
      type: 'SINGLE_CHOICE',
      difficulty: 'MEDIUM',
      options: [
        { text: 'Updated correct answer', isCorrect: true },
        { text: 'Distractor two', isCorrect: false },
        { text: 'Distractor three', isCorrect: false },
        { text: 'Distractor four', isCorrect: false },
      ],
    }));
  });
});
