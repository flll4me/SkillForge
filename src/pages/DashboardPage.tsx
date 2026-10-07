import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserSkills, getUserStatistics, type UserSkillProgress, type UserStatistics } from '../api/interviews.js';
import { useAuth } from '../auth/AuthContext.js';

export function DashboardPage() {
  const { user, accessToken, signOut } = useAuth();
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [skills, setSkills] = useState<UserSkillProgress[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    Promise.all([getUserStatistics(accessToken), getUserSkills(accessToken)])
      .then(([summary, skillProgress]) => {
        if (!active) return;
        setStatistics(summary);
        setSkills(skillProgress);
      })
      .catch(() => { if (active) setStatistics(null); });
    return () => { active = false; };
  }, [accessToken]);

  function handleSignOut() {
    signOut();
    navigate('/', { replace: true });
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link className="auth-page__brand" to="/">SkillForge</Link>
        <div className="dashboard-header__actions">
          <Link to="/profile">Профиль</Link>
          <button className="dashboard-header__signout" type="button" onClick={handleSignOut}>Выйти</button>
        </div>
      </header>
      <section className="dashboard-welcome" aria-labelledby="dashboard-title">
        <p className="auth-card__eyebrow">Личный кабинет</p>
        <h1 id="dashboard-title">Привет, {user?.name}</h1>
        <p>{user?.email}</p>
        <div className="dashboard-stats" aria-label="Общая статистика">
          <article><strong>{statistics?.completedInterviews ?? 0}</strong><span>интервью</span></article>
          <article><strong>{statistics?.averageScore ?? 0}%</strong><span>средний результат</span></article>
          <article><strong>{statistics?.bestScore ?? 0}%</strong><span>лучший результат</span></article>
        </div>
        {statistics?.recentInterview && <section className="dashboard-skills" aria-labelledby="dashboard-recent-interview-title">
          <h2 id="dashboard-recent-interview-title">Последнее интервью</h2>
          <p><span>{statistics.recentInterview.skill}</span><strong>{statistics.recentInterview.score}%</strong></p>
          <Link to={`/interview/${statistics.recentInterview.id}/result`}>Открыть результат</Link>
        </section>}
        {skills.length > 0 && <section className="dashboard-skills" aria-labelledby="dashboard-skills-title">
          <h2 id="dashboard-skills-title">Навыки</h2>
          {skills.map((skill) => <p key={skill.id}><span>{skill.name}</span><strong>{skill.score}%</strong></p>)}
        </section>}
        <div className="dashboard-welcome__actions">
          <Link className="auth-form__submit dashboard-welcome__action" to="/interview/new">Начать интервью</Link>
          <Link className="dashboard-welcome__history" to="/history">История попыток</Link>
          <Link className="dashboard-welcome__history" to="/progress">Прогресс</Link>
          {user?.role === 'ADMIN' && <Link className="dashboard-welcome__history" to="/admin/questions">Банк вопросов</Link>}
          {user?.role === 'ADMIN' && <Link className="dashboard-welcome__history" to="/admin">Админ-панель</Link>}
        </div>
      </section>
    </main>
  );
}
