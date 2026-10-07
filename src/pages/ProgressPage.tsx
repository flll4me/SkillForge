import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserProgress, type ProgressPoint } from '../api/interviews.js';
import { useAuth } from '../auth/AuthContext.js';

export function ProgressPage() {
  const { accessToken } = useAuth();
  const [points, setPoints] = useState<ProgressPoint[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    getUserProgress(accessToken)
      .then((data) => { if (active) setPoints(data); })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить прогресс.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [accessToken]);

  return (
    <main className="dashboard-page">
      <header className="dashboard-header"><Link className="auth-page__brand" to="/dashboard">SkillForge</Link></header>
      <section className="dashboard-welcome" aria-labelledby="progress-title">
        <p className="auth-card__eyebrow">Рост навыков</p>
        <h1 id="progress-title">Прогресс</h1>
        {isLoading && <p aria-live="polite">Загружаем результаты…</p>}
        {error && <p className="auth-form__error" role="alert">{error}</p>}
        {!isLoading && !error && points.length === 0 && <p>Заверши первое интервью, чтобы увидеть динамику.</p>}
        <ol className="progress-timeline">
          {points.map((point) => (
            <li key={point.id}>
              <time>{point.completedAt ? new Date(point.completedAt).toLocaleDateString('ru-RU') : '—'}</time>
              <span>{point.skill}</span>
              <strong>{point.score}%</strong>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
