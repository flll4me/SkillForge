import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getInterviewHistory,
  getUserSkills,
  getUserStatistics,
  type InterviewHistoryItem,
  type UserSkillProgress,
  type UserStatistics,
} from '../api/interviews.js';
import { useAuth } from '../auth/AuthContext.js';

function formatShortDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(value));
}

export function DashboardPage() {
  const { user, accessToken, signOut } = useAuth();
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [skills, setSkills] = useState<UserSkillProgress[]>([]);
  const [history, setHistory] = useState<InterviewHistoryItem[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    Promise.all([getUserStatistics(accessToken), getUserSkills(accessToken), getInterviewHistory(accessToken)])
      .then(([summary, skillProgress, attempts]) => {
        if (!active) return;
        setStatistics(summary);
        setSkills(skillProgress);
        setHistory(attempts);
      })
      .catch(() => { if (active) setStatistics(null); });
    return () => { active = false; };
  }, [accessToken]);

  const completedHistory = useMemo(
    () => history.filter((attempt) => attempt.status === 'COMPLETED' && attempt.score !== null),
    [history],
  );
  const chartItems = completedHistory.slice(0, 7).reverse();
  const recentAttempts = history.slice(0, 3);

  function handleSignOut() {
    signOut();
    navigate('/', { replace: true });
  }

  return (
    <main className="dashboard-page dashboard-page--home">
      <header className="dashboard-header">
        <Link className="auth-page__brand" to="/">SkillForge</Link>
        <nav className="dashboard-header__actions" aria-label="Навигация кабинета">
          <Link to="/progress">Прогресс</Link>
          <Link to="/profile">Профиль</Link>
          <button className="dashboard-header__signout" type="button" onClick={handleSignOut}>Выйти</button>
        </nav>
      </header>

      <section className="dashboard-hero" aria-labelledby="dashboard-title">
        <div>
          <p className="auth-card__eyebrow">Личный кабинет</p>
          <h1 id="dashboard-title">Привет, {user?.name}</h1>
          <p>Продолжай подготовку — каждый ответ приближает тебя к цели.</p>
        </div>
        <Link className="auth-form__submit dashboard-hero__action" to="/interview/new">
          Начать интервью <span aria-hidden="true">↗</span>
        </Link>
      </section>

      <section className="dashboard-stats dashboard-stats--cards" aria-label="Твоя статистика">
        <article className="dashboard-stat-card dashboard-stat-card--primary">
          <span className="dashboard-stat-card__icon" aria-hidden="true">✦</span>
          <span>Завершено интервью</span>
          <strong>{statistics?.completedInterviews ?? 0}</strong>
          <small>попыток всего</small>
        </article>
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-card__icon" aria-hidden="true">◉</span>
          <span>Средний результат</span>
          <strong>{statistics?.averageScore ?? 0}<small>%</small></strong>
          <small>по всем завершённым</small>
        </article>
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-card__icon" aria-hidden="true">↗</span>
          <span>Лучший результат</span>
          <strong>{statistics?.bestScore ?? 0}<small>%</small></strong>
          <small>личный рекорд</small>
        </article>
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-panel dashboard-panel--activity" aria-labelledby="dashboard-activity-title">
          <div className="dashboard-panel__heading">
            <div><p className="auth-card__eyebrow">Твой рост</p><h2 id="dashboard-activity-title">Динамика результатов</h2></div>
            <Link to="/history">Вся история <span aria-hidden="true">→</span></Link>
          </div>
          {chartItems.length > 0 ? (
            <div className="dashboard-chart" role="img" aria-label="Результаты последних интервью">
              <div className="dashboard-chart__scale" aria-hidden="true"><span>100%</span><span>50%</span><span>0%</span></div>
              <div className="dashboard-chart__bars">
                {chartItems.map((attempt) => (
                  <div className="dashboard-chart__item" key={attempt.id}>
                    <div className="dashboard-chart__track"><span style={{ height: `${Math.max(attempt.score ?? 0, 3)}%` }} /></div>
                    <strong>{attempt.score}%</strong>
                    <time dateTime={attempt.completedAt ?? attempt.startedAt}>{formatShortDate(attempt.completedAt ?? attempt.startedAt)}</time>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="dashboard-empty-state"><span aria-hidden="true">▥</span><p>Здесь появится график результатов после первого интервью.</p><Link to="/interview/new">Пройти первое интервью</Link></div>
          )}
          <div className="dashboard-panel__footer"><span>Последнее интервью</span><strong>{formatShortDate(statistics?.lastInterviewAt ?? null)}</strong></div>
        </section>

        <section className="dashboard-panel dashboard-panel--skills" aria-labelledby="dashboard-skills-title">
          <div className="dashboard-panel__heading">
            <div><p className="auth-card__eyebrow">Подготовка</p><h2 id="dashboard-skills-title">Навыки</h2></div>
            <Link to="/progress" aria-label="Подробный прогресс навыков">→</Link>
          </div>
          {skills.length > 0 ? (
            <ul className="dashboard-skill-list">
              {skills.slice(0, 5).map((skill) => (
                <li key={skill.id}>
                  <div className="dashboard-skill-list__label"><strong>{skill.name}</strong><span>{skill.score}%</span></div>
                  <div className="dashboard-skill-list__track" role="progressbar" aria-label={skill.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={skill.score}><span style={{ width: `${Math.min(100, Math.max(0, skill.score))}%` }} /></div>
                  <small>{skill.completedInterviews} {skill.completedInterviews === 1 ? 'интервью' : 'интервью'}</small>
                </li>
              ))}
            </ul>
          ) : (
            <div className="dashboard-empty-state dashboard-empty-state--compact"><span aria-hidden="true">◎</span><p>Навыки появятся после завершения интервью.</p></div>
          )}
        </section>

        <section className="dashboard-panel dashboard-panel--recent" aria-labelledby="dashboard-recent-title">
          <div className="dashboard-panel__heading">
            <div><p className="auth-card__eyebrow">Активность</p><h2 id="dashboard-recent-title">Последние интервью</h2></div>
            <Link to="/history">История <span aria-hidden="true">→</span></Link>
          </div>
          {recentAttempts.length > 0 ? (
            <div className="dashboard-recent-list">
              {recentAttempts.map((attempt) => (
                <article key={attempt.id}>
                  <span className="dashboard-recent-list__icon" aria-hidden="true">{attempt.skill.slice(0, 2).toUpperCase()}</span>
                  <div><strong>{attempt.skill}</strong><small>{formatShortDate(attempt.completedAt ?? attempt.startedAt)} · {attempt.difficulty}</small></div>
                  {attempt.status === 'COMPLETED' && attempt.score !== null
                    ? <Link to={`/interview/${attempt.id}/result`} aria-label={`Результат интервью по теме ${attempt.skill}: ${attempt.score}%`}>{attempt.score}%</Link>
                    : <span className="dashboard-recent-list__pending">Не завершено</span>}
                </article>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-state dashboard-empty-state--compact"><p>Пока нет попыток. Начни с короткого интервью.</p><Link to="/interview/new">Выбрать тему</Link></div>
          )}
        </section>

        {user?.role === 'ADMIN' && <nav className="dashboard-admin-links" aria-label="Инструменты администратора"><Link to="/admin/questions">Банк вопросов</Link><Link to="/admin">Админ-панель</Link></nav>}
      </div>
    </main>
  );
}
