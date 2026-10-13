import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getInterviewHistory, type InterviewHistoryItem } from '../api/interviews.js';
import { useAuth } from '../auth/AuthContext.js';

export function HistoryPage() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<InterviewHistoryItem[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    getInterviewHistory(accessToken)
      .then((history) => { if (active) setItems(history); })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить историю.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [accessToken]);

  return (
    <main className="dashboard-page">
      <header className="dashboard-header"><Link className="auth-page__brand" to="/dashboard">SkillForge</Link></header>
      <section className="dashboard-welcome" aria-labelledby="history-title">
        <p className="auth-card__eyebrow">Твои попытки</p>
        <h1 id="history-title">История интервью</h1>
        {isLoading && <p aria-live="polite">Загружаем историю…</p>}
        {error && <p className="auth-form__error" role="alert">{error}</p>}
        {!isLoading && !error && items.length === 0 && <p>Здесь появятся завершённые интервью.</p>}
        <div className="history-list">
          {items.map((item) => (
            <article className="history-item" key={item.id}>
              <div><strong>{item.skill}</strong><span>{item.difficulty}</span></div>
              <p>{item.status === 'COMPLETED' ? `Результат: ${item.score}%` : 'Не завершено'}</p>
              {item.status === 'COMPLETED' && <Link to={`/interview/${item.id}/result`}>Посмотреть результат</Link>}
            </article>
          ))}
        </div>
        <Link className="auth-form__submit dashboard-welcome__action" to="/interview/new">Начать интервью</Link>
      </section>
    </main>
  );
}
