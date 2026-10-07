import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getInterviewResult, type InterviewResult } from '../api/interviews.js';
import { useAuth } from '../auth/AuthContext.js';

export function InterviewResultPage() {
  const { id = '' } = useParams();
  const { accessToken } = useAuth();
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    getInterviewResult(accessToken, id)
      .then((data) => { if (active) setResult(data); })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить результат.'); });
    return () => { active = false; };
  }, [accessToken, id]);

  if (error) return <main className="dashboard-page"><p role="alert">{error}</p><Link to="/dashboard">В кабинет</Link></main>;
  if (!result) return <main className="dashboard-page" aria-live="polite">Подсчитываем результат…</main>;

  return (
    <main className="dashboard-page">
      <header className="dashboard-header"><Link className="auth-page__brand" to="/dashboard">SkillForge</Link></header>
      <section className="dashboard-welcome" aria-labelledby="result-title">
        <p className="auth-card__eyebrow">Интервью завершено · {result.skill}</p>
        <h1 id="result-title">Результат: {result.score}%</h1>
        <p>Уровень: {result.userLevel}</p>
        <p>Правильных ответов: {result.correctAnswers} из {result.totalQuestions}</p>
        <div className="result-list">
          {result.questions.map((question) => (
            <article className="result-question" key={question.id}>
              <p className="result-question__score">Вопрос {question.order} · {question.isCorrect ? 'Верно' : 'Неверно'}</p>
              <h2>{question.text}</h2>
              <ul>
                {question.options.map((option) => (
                  <li className={option.isCorrect ? 'result-option--correct' : option.selected ? 'result-option--selected' : ''} key={option.id}>
                    {option.text}{option.isCorrect ? ' · правильный ответ' : option.selected ? ' · твой выбор' : ''}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <Link className="auth-form__submit dashboard-welcome__action" to="/interview/new">Ещё одна тренировка</Link>
      </section>
    </main>
  );
}
