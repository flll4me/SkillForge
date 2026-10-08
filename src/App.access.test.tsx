import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.js';

const { useAuthMock, getUserStatisticsMock, getUserSkillsMock, getAdminSkillsMock, getAdminQuestionsMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  getUserStatisticsMock: vi.fn(),
  getUserSkillsMock: vi.fn(),
  getAdminSkillsMock: vi.fn(),
  getAdminQuestionsMock: vi.fn(),
}));

vi.mock('./auth/AuthContext.js', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: useAuthMock,
}));

vi.mock('./api/interviews.js', async (importOriginal) => ({
  ...await importOriginal<typeof import('./api/interviews.js')>(),
  getUserStatistics: getUserStatisticsMock,
  getUserSkills: getUserSkillsMock,
}));

vi.mock('./api/admin.js', () => ({
  createAdminQuestion: vi.fn(),
  createAdminSkill: vi.fn(),
  getAdminQuestion: vi.fn(),
  getAdminQuestions: getAdminQuestionsMock,
  getAdminSkills: getAdminSkillsMock,
  getAdminStatistics: vi.fn(),
  getAdminUsers: vi.fn(),
  setAdminQuestionActive: vi.fn(),
  setAdminSkillActive: vi.fn(),
  setAdminUserStatus: vi.fn(),
  updateAdminQuestion: vi.fn(),
  updateAdminSkill: vi.fn(),
}));

const user = { id: 7, name: 'Ada Lovelace', email: 'ada@example.com', role: 'USER', status: 'ACTIVE' };
const admin = { ...user, role: 'ADMIN' };

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  getUserStatisticsMock.mockResolvedValue({ completedInterviews: 0, averageScore: 0, bestScore: 0, recentInterview: null });
  getUserSkillsMock.mockResolvedValue([]);
  getAdminSkillsMock.mockResolvedValue({ data: [{ id: 2, name: 'JavaScript', description: '', isActive: true }] });
  getAdminQuestionsMock.mockResolvedValue({
    data: [{ id: 5, skillId: 2, skill: 'JavaScript', text: 'Вопрос только для администраторов', type: 'SINGLE_CHOICE', difficulty: 'EASY', isActive: true }],
    meta: { page: 1, limit: 50, total: 1 },
  });
});

describe('question bank access', () => {
  it('hides the question bank from users and redirects its old route to the dashboard', async () => {
    useAuthMock.mockReturnValue({ user, accessToken: 'user-token', isLoading: false, signOut: vi.fn() });

    render(<MemoryRouter initialEntries={['/questions']}><App /></MemoryRouter>);

    expect(await screen.findByRole('heading', { name: 'Привет, Ada Lovelace' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Банк вопросов' })).not.toBeInTheDocument();
    expect(screen.queryByText('Вопрос только для администраторов')).not.toBeInTheDocument();
  });

  it('keeps the question bank available to admins from the old route', async () => {
    useAuthMock.mockReturnValue({ user: admin, accessToken: 'admin-token', isLoading: false, signOut: vi.fn() });

    render(<MemoryRouter initialEntries={['/questions']}><App /></MemoryRouter>);

    expect(await screen.findByRole('heading', { name: 'Банк вопросов' })).toBeInTheDocument();
    expect(await screen.findByText(/Вопрос только для администраторов/)).toBeInTheDocument();
    expect(getAdminQuestionsMock).toHaveBeenCalledWith('admin-token');
  });
});

describe('appearance theme', () => {
  it('applies the saved theme and persists a new selection', async () => {
    window.localStorage.setItem('skillforge-theme', 'light');
    const user = userEvent.setup();

    render(<MemoryRouter><App /></MemoryRouter>);

    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    const themeButton = screen.getByRole('button', { name: 'Переключить на тёмную тему' });
    await user.click(themeButton);

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(window.localStorage.getItem('skillforge-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Переключить на светлую тему' })).toBeInTheDocument();
  });
});
