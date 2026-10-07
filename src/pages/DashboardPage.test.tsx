import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getUserSkills, getUserStatistics } from '../api/interviews.js';
import { DashboardPage } from './DashboardPage.js';

vi.mock('../auth/AuthContext.js', () => ({
  useAuth: () => ({ user: { name: 'Test User', email: 'test@example.com' }, accessToken: 'user-token', signOut: vi.fn() }),
}));
vi.mock('../api/interviews.js', () => ({
  getUserSkills: vi.fn(),
  getUserStatistics: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(getUserStatistics).mockResolvedValue({
    completedInterviews: 1,
    averageScore: 80,
    bestScore: 80,
    lastInterviewAt: '2026-10-06T10:00:00Z',
    recentInterview: { id: 42, skill: 'JavaScript', difficulty: 'MEDIUM', score: 80, status: 'COMPLETED', completedAt: '2026-10-06T10:00:00Z' },
  });
  vi.mocked(getUserSkills).mockResolvedValue([]);
});

describe('dashboard recent interview', () => {
  it('shows the latest interview and links to its result', async () => {
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    expect(await screen.findByRole('heading', { name: 'Последнее интервью' })).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Последнее интервью' })).getByText('80%')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Открыть результат' })).toHaveAttribute('href', '/interview/42/result');
  });
});
