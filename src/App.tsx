import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext.js';
import { AuthPage } from './pages/AuthPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { InterviewStartPage } from './pages/InterviewStartPage.js';
import { InterviewPage } from './pages/InterviewPage.js';
import { InterviewResultPage } from './pages/InterviewResultPage.js';
import { HistoryPage } from './pages/HistoryPage.js';
import { ProgressPage } from './pages/ProgressPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { AdminDashboardPage, AdminQuestionsPage, AdminSkillsPage, AdminUsersPage } from './pages/AdminPages.js';
import PracticeApp from './PracticeApp.js';
import { ActivityTracker } from './analytics/ActivityTracker.js';

function AnimatedNumber({ value, duration = 1100 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setCount(value);
      return;
    }

    let frame = 0;
    let startTime: number | undefined;
    const animate = (time: number) => {
      startTime ??= time;
      const progress = Math.min((time - startTime) / duration, 1);
      setCount(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, value]);

  return <>{count}</>;
}

function LandingPage() {
  return (
    <main className="landing-page">
      <header className="dashboard-header">
        <Link className="auth-page__brand" to="/">SkillForge</Link>
        <nav className="landing-page__nav" aria-label="Главная навигация">
          <Link to="/login">Войти</Link>
          <Link className="landing-page__nav-cta" to="/register">Создать аккаунт</Link>
        </nav>
      </header>
      <section className="landing-hero">
        <div className="landing-hero__copy">
          <p className="auth-card__eyebrow"><span className="landing-hero__status-dot" /> Тренажёр технических интервью</p>
          <h1>Готовься к интервью <span>с понятным планом</span></h1>
          <p className="landing-hero__lead">Выбирай направление, тренируйся на адаптивных вопросах и отслеживай, как растут навыки.</p>
          <div className="landing-hero__actions">
            <Link className="auth-form__submit landing-hero__primary" to="/register">Начать бесплатно <span aria-hidden="true">↗</span></Link>
            <Link className="landing-hero__secondary" to="/practice">Попробовать без аккаунта <span aria-hidden="true">→</span></Link>
          </div>
          <div className="landing-hero__trust"><span aria-hidden="true">✦</span> Тренируйся в своём темпе · Прогресс сохраняется</div>
        </div>
        <aside className="landing-preview" aria-label="Пример прогресса в SkillForge">
          <div className="landing-preview__top"><span className="landing-preview__mark">S</span><span>ТВОЯ ПОДГОТОВКА</span><span className="landing-preview__live"><i /> В РАБОТЕ</span></div>
          <div className="landing-preview__summary"><div><span>Средний результат</span><strong aria-label="76 процентов"><span aria-hidden="true"><AnimatedNumber value={76} /><small>%</small></span></strong></div><span className="landing-preview__change" aria-label="Рост на 12 процентов за месяц">↗ +<AnimatedNumber value={12} />% за месяц</span></div>
          <div className="landing-preview__chart" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>
          <div className="landing-preview__skills"><div><span className="landing-preview__skill-icon">JS</span><span><strong>JavaScript</strong><small>Последняя тренировка · сегодня</small></span><b aria-label="82 процента"><span aria-hidden="true"><AnimatedNumber value={82} />%</span></b></div><div><span className="landing-preview__skill-icon landing-preview__skill-icon--api">API</span><span><strong>Backend</strong><small>Следующая цель · 80%</small></span><b aria-label="68 процентов"><span aria-hidden="true"><AnimatedNumber value={68} />%</span></b></div></div>
          <div className="landing-preview__footer"><span>АДАПТИВНЫЙ ПЛАН</span><span>12 тренировок <b>→</b></span></div>
        </aside>
        <div className="landing-metrics" aria-label="Возможности тренажёра"><div><strong>3</strong><span>направления</span></div><div><strong>124+</strong><span>вопроса по технологиям</span></div><div><strong>3 уровня</strong><span>от Junior до Middle</span></div></div>
      </section>
    </main>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <main className="auth-page" aria-live="polite">Загружаем профиль…</main>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <main className="auth-page" aria-live="polite">Загружаем профиль…</main>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/questions" element={<AdminRoute><Navigate to="/admin/questions" replace /></AdminRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
      <Route path="/admin/statistics" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
      <Route path="/admin/skills" element={<AdminRoute><AdminSkillsPage /></AdminRoute>} />
      <Route path="/admin/questions" element={<AdminRoute><AdminQuestionsPage /></AdminRoute>} />
      <Route path="/interview/new" element={<ProtectedRoute><InterviewStartPage /></ProtectedRoute>} />
      <Route path="/interview/:id/result" element={<ProtectedRoute><InterviewResultPage /></ProtectedRoute>} />
      <Route path="/interview/:id" element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} />
      <Route path="/practice" element={<PracticeApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  const savedTheme = window.localStorage.getItem('skillforge-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function ThemeControl() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('skillforge-theme', theme);
  }, [theme]);

  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={`Переключить на ${nextTheme === 'light' ? 'светлую' : 'тёмную'} тему`}
      title={`Переключить на ${nextTheme === 'light' ? 'светлую' : 'тёмную'} тему`}
      aria-pressed={theme === 'dark'}
      onClick={() => setTheme(nextTheme)}
    >
      <svg className="theme-toggle__icon" viewBox="0 0 24 24" aria-hidden="true">
        {theme === 'dark'
          ? <path d="M12 3v2m0 14v2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42M3 12h2m14 0h2M5.64 18.36l1.42-1.42m9.88-9.88 1.42-1.42M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
          : <path d="M20.4 15.2A8.5 8.5 0 0 1 8.8 3.6 8.5 8.5 0 1 0 20.4 15.2Z" />}
      </svg>
      <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
    </button>
  );
}

export default function App() {
  return <AuthProvider><ActivityTracker /><AppRoutes /><ThemeControl /></AuthProvider>;
}
