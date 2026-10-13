import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getInterviewHistory, getUserSkills, getUserStatistics } from '../api/interviews.js';
import { DashboardPage } from './DashboardPage.js';

vi.mock('../auth/AuthContext.js', () => ({
  useAuth: () => ({ user: { name: 'Test User', email: 'test@example.com' }, accessToken: 'user-token', signOut: vi.fn() }),
}));
vi.mock('../api/interviews.js', () => ({
  getUserSkills: vi.fn(),
  getUserStatistics: vi.fn(),
  getInterviewHistory: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(getUserStatistics).mockResolvedValue({
    completedInterviews: 1,
    averageScore: 80,
    bestScore: 80,
    lastInterviewAt: '2026-10-06T10:00:00Z',
    recentInterview: { id: 42, skill: 'JavaScript', difficulty: 'MEDIUM', score: 80, status: 'COMPLETED', completedAt: '2026-10-06T10:00:00Z' },
  });
  vi.mocked(getUserSkills).mockResolvedValue([
    { id: 1, name: 'JavaScript', score: 82, completedInterviews: 1, updatedAt: '2026-10-06T10:00:00Z' },
  ]);
  vi.mocked(getInterviewHistory).mockResolvedValue([
    { id: 42, skill: 'JavaScript', difficulty: 'MEDIUM', score: 80, status: 'COMPLETED', startedAt: '2026-10-06T09:00:00Z', completedAt: '2026-10-06T10:00:00Z' },
  ]);
});

describe('personal dashboard', () => {
  it('shows progress widgets, latest interview, and a link to its result', async () => {
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    expect(await screen.findByRole('heading', { name: 'Динамика результатов' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Навыки' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'JavaScript' })).toHaveAttribute('aria-valuenow', '82');
    expect(screen.getByRole('img', { name: 'Результаты последних интервью' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Результат интервью по теме JavaScript: 80%' })).toHaveAttribute('href', '/interview/42/result');
  });
});
