import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App.js';
import { getCurrentUser, loginAccount, registerAccount } from '../api/auth.js';

vi.mock('../api/auth.js', () => ({
  ApiError: class ApiError extends Error { constructor(message: string, readonly status: number) { super(message); } },
  getCurrentUser: vi.fn(),
  loginAccount: vi.fn(),
  registerAccount: vi.fn(),
}));

const currentUser = { id: 7, name: 'Ada Lovelace', email: 'ada@example.com', role: 'USER' as const, status: 'ACTIVE' as const };

function renderAt(path: string) {
  window.history.replaceState({}, '', path);
  return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
}

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  vi.clearAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue(currentUser);
});

describe('authentication pages', () => {
  it('prevents registration when password confirmation does not match', async () => {
    const actor = userEvent.setup();
    renderAt('/register');

    await actor.type(screen.getByLabelText('Имя'), 'Ada Lovelace');
    await actor.type(screen.getByLabelText('Email'), 'ada@example.com');
    await actor.type(screen.getByLabelText('Пароль'), 'correct horse');
    await actor.type(screen.getByLabelText('Повтори пароль'), 'different password');
    await actor.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Пароли не совпадают.');
    expect(registerAccount).not.toHaveBeenCalled();
    expect(loginAccount).not.toHaveBeenCalled();
  });

  it('registers, signs in, and opens the protected dashboard', async () => {
    const actor = userEvent.setup();
    vi.mocked(registerAccount).mockResolvedValueOnce(currentUser);
    vi.mocked(loginAccount).mockResolvedValueOnce({ accessToken: 'signed-token' });
    renderAt('/register');

    await actor.type(screen.getByLabelText('Имя'), 'Ada Lovelace');
    await actor.type(screen.getByLabelText('Email'), 'ada@example.com');
    await actor.type(screen.getByLabelText('Пароль'), 'correct horse');
    await actor.type(screen.getByLabelText('Повтори пароль'), 'correct horse');
    await actor.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));

    expect(await screen.findByRole('heading', { name: 'Привет, Ada Lovelace' })).toBeInTheDocument();
    expect(registerAccount).toHaveBeenCalledWith({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'correct horse' });
    expect(loginAccount).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'correct horse' });
    expect(localStorage.getItem('skillforge.accessToken')).toBe('signed-token');
  });

  it('restores the signed-in account after a full page reload', async () => {
    localStorage.setItem('skillforge.accessToken', 'persisted-token');
    localStorage.setItem('skillforge.user', JSON.stringify(currentUser));
    const firstLoad = renderAt('/dashboard');
    expect(await screen.findByRole('heading', { name: 'Привет, Ada Lovelace' })).toBeInTheDocument();
    firstLoad.unmount();

    renderAt('/dashboard');

    expect(await screen.findByRole('heading', { name: 'Привет, Ada Lovelace' })).toBeInTheDocument();
    expect(getCurrentUser).toHaveBeenCalledWith('persisted-token');
  });

  it('redirects an already signed-in user away from the login page', async () => {
    localStorage.setItem('skillforge.accessToken', 'persisted-token');
    localStorage.setItem('skillforge.user', JSON.stringify(currentUser));

    renderAt('/login');

    expect(await screen.findByRole('heading', { name: 'Привет, Ada Lovelace' })).toBeInTheDocument();
  });

  it('keeps the saved session when the profile request fails temporarily', async () => {
    localStorage.setItem('skillforge.accessToken', 'persisted-token');
    localStorage.setItem('skillforge.user', JSON.stringify(currentUser));
    vi.mocked(getCurrentUser).mockRejectedValueOnce(new TypeError('Network unavailable'));

    renderAt('/dashboard');

    expect(await screen.findByRole('heading', { name: 'Привет, Ada Lovelace' })).toBeInTheDocument();
    expect(localStorage.getItem('skillforge.accessToken')).toBe('persisted-token');
  });

  it('returns an unauthenticated visitor to login when opening the dashboard', async () => {
    renderAt('/dashboard');
    expect(await screen.findByRole('heading', { name: 'Войти в SkillForge' })).toBeInTheDocument();
  });
});
