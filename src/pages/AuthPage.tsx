import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginAccount, registerAccount } from '../api/auth.js';
import { useAuth } from '../auth/AuthContext.js';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const { authenticate, user, isLoading } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) navigate('/dashboard', { replace: true });
  }, [isLoading, navigate, user]);

  if (isLoading) return <main className="auth-page" aria-live="polite">Проверяем сессию…</main>;
  if (user) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');

    try {
      if (isRegister) {
        const confirmation = String(form.get('passwordConfirmation') ?? '');
        if (password !== confirmation) {
          setError('Пароли не совпадают.');
          return;
        }
        await registerAccount({ name, email, password });
      }

      const { accessToken } = await loginAccount({ email, password });
      await authenticate(accessToken);
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Не удалось выполнить запрос.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <Link className="auth-page__brand" to="/">SkillForge</Link>
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="auth-card__eyebrow">{isRegister ? 'Начни тренироваться' : 'С возвращением'}</p>
        <h1 className="auth-card__title" id="auth-title">{isRegister ? 'Создать аккаунт' : 'Войти в SkillForge'}</h1>
        <p className="auth-card__lead">
          {isRegister ? 'Сохраняй интервью и отслеживай свой прогресс.' : 'Продолжи подготовку с того места, где остановился.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <label className="auth-form__field">
              <span>Имя</span>
              <input name="name" autoComplete="name" minLength={2} maxLength={100} required />
            </label>
          )}
          <label className="auth-form__field">
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" maxLength={320} required />
          </label>
          <label className="auth-form__field">
            <span>Пароль</span>
            <input name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 8 : undefined} required />
          </label>
          {isRegister && (
            <label className="auth-form__field">
              <span>Повтори пароль</span>
              <input name="passwordConfirmation" type="password" autoComplete="new-password" minLength={8} required />
            </label>
          )}
          {error && <p className="auth-form__error" role="alert">{error}</p>}
          <button className="auth-form__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Подожди…' : isRegister ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>

        <p className="auth-card__switch">
          {isRegister ? 'Уже есть аккаунт?' : 'Впервые здесь?'}{' '}
          <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Войти' : 'Создать аккаунт'}</Link>
        </p>
      </section>
    </main>
  );
}
