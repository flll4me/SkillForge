import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStatistics, type AdminStatistics } from '../api/admin.js';
import { useAuth } from '../auth/AuthContext.js';
import { AdminHeader } from '../components/AdminHeader.js';
import '../../css/admin-overview.css';

function duration(seconds: number | null) {
  if (seconds === null) return '—';
  const value = Math.round(seconds);
  if (value < 60) return `${value} сек`;
  if (value < 3600) return `${Math.floor(value / 60)} мин ${value % 60} с`;
  return `${Math.floor(value / 3600)} ч ${Math.floor(value % 3600 / 60)} мин`;
}

function ActivityChart({ daily }: { daily: AdminStatistics['daily'] }) {
  const maximum = Math.max(1, ...daily.flatMap((day) => [day.interviews, day.registrations]));
  const points = (field: 'interviews' | 'registrations') => daily.map((day, index) =>
    `${44 + index * 580 / Math.max(1, daily.length - 1)},${186 - day[field] / maximum * 158}`).join(' ');
  const hasData = daily.some((day) => day.interviews || day.registrations);
  if (!hasData) return <div className="admin-overview__empty">За этот период ещё нет регистраций и интервью.</div>;
  return <>
    <svg className="admin-activity-chart" viewBox="0 0 650 215" role="img" aria-label="Динамика регистраций и начатых интервью по дням">
      <defs><linearGradient id="admin-chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--color-accent)" stopOpacity=".25" /><stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" /></linearGradient></defs>
      {[0, 0.5, 1].map((fraction) => <g key={fraction}><line x1="44" x2="624" y1={186 - fraction * 158} y2={186 - fraction * 158} className="admin-activity-chart__grid" /><text x="32" y={190 - fraction * 158} textAnchor="end">{Number((maximum * fraction).toFixed(1))}</text></g>)}
      <polygon points={`44,186 ${points('interviews')} 624,186`} fill="url(#admin-chart-fill)" />
      <polyline points={points('interviews')} className="admin-activity-chart__line" />
      <polyline points={points('registrations')} className="admin-activity-chart__line admin-activity-chart__line--users" />
      <text x="44" y="210">{daily[0]?.date.split('-').reverse().slice(0, 2).join('.')}</text>
      <text x="624" y="210" textAnchor="end">{daily.at(-1)?.date.split('-').reverse().slice(0, 2).join('.')}</text>
    </svg>
    <details className="admin-chart-data"><summary>Данные по дням</summary><div><table><caption>Активность по дням (UTC)</caption><thead><tr><th>Дата</th><th>Регистрации</th><th>Интервью</th></tr></thead><tbody>{daily.map((day) => <tr key={day.date}><td>{day.date}</td><td>{day.registrations}</td><td>{day.interviews}</td></tr>)}</tbody></table></div></details>
  </>;
}

export function AdminDashboardPage() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<AdminStatistics | null>(null);
  const [days, setDays] = useState(30);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    let pending = false;
    setStats(null);
    setLoading(true);
    async function load() {
      if (pending) return;
      pending = true;
      try {
        const result = await getAdminStatistics(accessToken!, days);
        if (!active) return;
        if (!Array.isArray(result.data.daily) || !Array.isArray(result.data.topics) || !Array.isArray(result.data.difficulty)) {
          throw new Error('OUTDATED_STATISTICS');
        }
        setStats(result.data);
        setUpdatedAt(new Date());
        setError('');
      } catch (cause) {
        if (active) setError(cause instanceof Error && cause.message === 'OUTDATED_STATISTICS'
          ? 'Новый формат статистики пока недоступен. Перезапусти сервер и обнови панель.'
          : 'Не удалось загрузить статистику. Проверь подключение к серверу и попробуй обновить.');
      } finally {
        pending = false;
        if (active) setLoading(false);
      }
    }
    void load();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 60000);
    return () => { active = false; window.clearInterval(timer); };
  }, [accessToken, days, revision]);
  const completion = stats?.periodInterviews ? Math.round(stats.completedInterviews / stats.periodInterviews * 100) : null;
  const cards = stats ? [
    { label: 'Пользователи', value: stats.users.toLocaleString('ru-RU'), detail: `+${stats.newUsers} за период`, icon: '01' },
    { label: 'Интервью за период', value: stats.periodInterviews, detail: `${stats.interviews} за всё время`, icon: '02' },
    { label: 'Среднее время на сайте', value: duration(stats.averageSessionSeconds), detail: stats.trackedSessions ? `Активное время · ${stats.trackedSessions} посещений` : 'Ожидаем первые посещения', icon: '03' },
    { label: 'Средний результат', value: stats.averageScore === null ? '—' : `${stats.averageScore}%`, detail: `${stats.completedInterviews} завершённых интервью`, icon: '04' },
    { label: 'Активные пользователи', value: stats.activeUsers, detail: 'Уникальные посетители за период', icon: '05' },
    { label: 'Сейчас на сайте', value: stats.onlineUsers, detail: 'Активность за последние 90 секунд', icon: '06' },
  ] : [];

  return <main className="dashboard-page admin-overview"><AdminHeader />
    <section className="admin-overview__intro">
      <div><h1>Обзор платформы</h1><p>Пользователи, обучение и контент — в одном месте.</p></div>
      <div className="admin-overview__controls"><label>Период<select value={days} onChange={(event) => setDays(Number(event.target.value))}><option value={7}>7 дней</option><option value={30}>30 дней</option><option value={90}>90 дней</option></select></label><button type="button" onClick={() => setRevision((value) => value + 1)} disabled={loading}>Обновить <span aria-hidden="true">↻</span></button></div>
    </section>
    <div className="admin-overview__status"><span className="admin-overview__live-dot" aria-hidden="true" />{updatedAt ? `Обновлено в ${updatedAt.toLocaleTimeString('ru-RU')}` : 'Подключаем статистику'}<span>Автообновление · 60 сек</span></div>
    {error && <p className="admin-overview__error" role="alert">{error}</p>}
    {loading && <p role="status">Загружаем статистику…</p>}
    {stats && <>
      <section className="admin-metrics" aria-label="Показатели платформы">{cards.map((card) => <article className="admin-metrics__card" key={card.label}><span className="admin-metrics__number" aria-hidden="true">{card.icon}</span><h2>{card.label}</h2><strong>{card.value}</strong><p>{card.detail}</p></article>)}</section>
      <div className="admin-overview__grid">
        <section className="admin-widget admin-widget--activity" aria-labelledby="admin-activity-title"><div className="admin-widget__heading"><div><p className="auth-card__eyebrow">Динамика</p><h2 id="admin-activity-title">Активность платформы</h2></div><span>По дням · UTC</span></div><div className="admin-widget__legend"><span>Интервью</span><span>Регистрации</span></div><ActivityChart daily={stats.daily} /></section>
        <section className="admin-widget" aria-labelledby="admin-completion-title"><div className="admin-widget__heading"><div><p className="auth-card__eyebrow">Вовлечённость</p><h2 id="admin-completion-title">Завершение интервью</h2></div></div><div className="admin-completion"><div className="admin-completion__ring" style={{ background: `conic-gradient(var(--color-highlight) ${completion ?? 0}%, var(--color-subtle) 0)` }}><div><strong>{completion === null ? '—' : `${completion}%`}</strong><span>завершено</span></div></div><p>{stats.completedInterviews} из {stats.periodInterviews} начатых за период</p></div><div className="admin-widget__foot"><span>Средняя длительность интервью</span><strong>{duration(stats.averageInterviewSeconds)}</strong></div></section>
        <section className="admin-widget" aria-labelledby="admin-topics-title"><div className="admin-widget__heading"><div><p className="auth-card__eyebrow">Интерес пользователей</p><h2 id="admin-topics-title">Популярные темы</h2></div><Link to="/admin/skills">Навыки →</Link></div>{stats.topics.length ? <ol className="admin-topics">{stats.topics.map((topic, index) => <li key={topic.name}><span className="admin-topics__rank">{String(index + 1).padStart(2, '0')}</span><div><strong>{topic.name}</strong><progress value={topic.interviews} max={Math.max(1, stats.topics[0].interviews)} aria-label={`Интервью по теме ${topic.name}`} /><small>{topic.completed} завершено · средний балл {topic.averageScore === null ? '—' : `${topic.averageScore}%`}</small></div><b>{topic.interviews}</b></li>)}</ol> : <p className="admin-overview__empty">Темы появятся после первого интервью за выбранный период.</p>}</section>
        <section className="admin-widget" aria-labelledby="admin-content-title"><div className="admin-widget__heading"><div><p className="auth-card__eyebrow">База знаний</p><h2 id="admin-content-title">Банк вопросов</h2></div><Link to="/admin/questions">Управлять →</Link></div><div className="admin-content-total"><strong>{stats.questions}</strong><span><span>активных вопросов</span><span>в {stats.skills} навыках</span></span></div><div className="admin-difficulty">{([['EASY', 'Лёгкие'], ['MEDIUM', 'Средние'], ['HARD', 'Сложные']] as const).map(([key, label]) => <div key={key}><span>{label}</span><strong>{stats.difficulty.find((item) => item.difficulty === key)?.count ?? 0}</strong></div>)}</div><p className="admin-widget__note">Текущее состояние банка · за всё время</p></section>
      </div>
      <aside className="admin-overview__method"><strong>Как считается время</strong><p>Приблизительное активное время одного посещения: вкладка открыта и в фокусе, перерыв без действий не дольше 2 минут. Учитываются вошедшие пользователи, без гостей и администраторов. Перерыв более 30 минут или перезагрузка страницы начинает новое посещение.</p><p>{stats.trackingSince ? `Сбор данных начат ${new Date(stats.trackingSince).toLocaleDateString('ru-RU')}.` : 'Данные начнут появляться после первых активных посещений.'} В статистику периода входят посещения, начатые в выбранные дни; пустые посещения исключены.</p></aside>
    </>}
  </main>;
}
