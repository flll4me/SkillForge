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
        <p className="auth-card__eyebrow">Тренажёр технических интервью</p>
        <h1>Готовься к интервью<br />с понятным планом</h1>
        <p>Выбирай навык, отвечай на вопросы и следи за прогрессом подготовки.</p>
        <div className="landing-hero__actions">
          <Link className="auth-form__submit" to="/register">Начать бесплатно</Link>
          <Link className="landing-hero__secondary" to="/practice">Попробовать без аккаунта</Link>
        </div>
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

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
