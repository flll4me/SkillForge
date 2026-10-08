import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { getAdminStatistics, type AdminStatistics } from '../api/admin.js';
import { AdminDashboardPage } from './AdminOverview.js';
vi.mock('../auth/AuthContext.js', () => ({ useAuth: () => ({ accessToken: 'admin-token' }) }));
vi.mock('../api/admin.js', () => ({ getAdminStatistics: vi.fn() }));
const data: AdminStatistics = { users: 12, questions: 25, skills: 3, interviews: 10, averageScore: null, newUsers: 2, periodInterviews: 0, completedInterviews: 0, averageInterviewSeconds: null, activeUsers: 0, onlineUsers: 0, trackedSessions: 0, averageSessionSeconds: null, trackingSince: null, days: 30, daily: [], topics: [], difficulty: [] };
beforeEach(() => { vi.mocked(getAdminStatistics).mockResolvedValue({ data }); });
it('distinguishes missing measurements from zero and switches the reporting period', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><AdminDashboardPage /></MemoryRouter>);
  expect(await screen.findByText('Ожидаем первые посещения')).toBeInTheDocument();
  expect(screen.getByText('За этот период ещё нет регистраций и интервью.')).toBeInTheDocument();
  await user.selectOptions(screen.getByRole('combobox', { name: 'Период' }), '7');
  await waitFor(() => expect(getAdminStatistics).toHaveBeenLastCalledWith('admin-token', 7));
});
it('shows a recoverable error when statistics cannot be loaded', async () => {
  vi.mocked(getAdminStatistics).mockRejectedValueOnce(new Error('offline'));
  render(<MemoryRouter><AdminDashboardPage /></MemoryRouter>);
  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить статистику');
  expect(screen.getByRole('button', { name: /Обновить/ })).toBeEnabled();
});
it('does not crash when an older server returns statistics without the new widgets', async () => {
  vi.mocked(getAdminStatistics).mockResolvedValueOnce({ data: { users: 1 } as AdminStatistics });
  render(<MemoryRouter><AdminDashboardPage /></MemoryRouter>);
  expect(await screen.findByRole('alert')).toHaveTextContent('Новый формат статистики пока недоступен');
});
