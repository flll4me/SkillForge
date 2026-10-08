import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getInterviewAnalysis, getInterviewResult, type InterviewAnalysis, type InterviewResult } from '../api/interviews.js';
import { useAuth } from '../auth/AuthContext.js';

export function InterviewResultPage() {
  const { id = '' } = useParams();
  const { accessToken } = useAuth();
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    setAnalysisLoading(true);
    getInterviewResult(accessToken, id)
      .then(async (data) => {
        if (!active) return;
        setResult(data);
        if (data.correctAnswers === data.totalQuestions) {
          setAnalysis({ summary: 'Отличная работа — ошибок нет. Все ответы верны!', explanations: [] });
          setAnalysisLoading(false);
          return;
        }
        try {
          const feedback = await getInterviewAnalysis(accessToken, id);
          if (active) setAnalysis(feedback);
        } catch (analysisLoadError) {
          if (active) setAnalysisError(analysisLoadError instanceof Error ? analysisLoadError.message : 'AI-разбор временно недоступен.');
        } finally {
          if (active) setAnalysisLoading(false);
        }
      })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить результат.'); });
    return () => { active = false; };
  }, [accessToken, id]);

  if (error) return <main className="dashboard-page"><p role="alert">{error}</p><Link to="/dashboard">В кабинет</Link></main>;
  if (!result) return <main className="dashboard-page" aria-live="polite">Подсчитываем результат…</main>;

  const retryAnalysis = async () => {
    if (!accessToken) return;
    setAnalysisError('');
    setAnalysisLoading(true);
    try {
      setAnalysis(await getInterviewAnalysis(accessToken, id));
    } catch (analysisLoadError) {
      setAnalysisError(analysisLoadError instanceof Error ? analysisLoadError.message : 'AI-разбор временно недоступен.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <main className="dashboard-page">
      <header className="dashboard-header"><Link className="auth-page__brand" to="/dashboard">SkillForge</Link></header>
      <section className="dashboard-welcome" aria-labelledby="result-title">
        <p className="auth-card__eyebrow">Интервью завершено · {result.skill}</p>
        <h1 id="result-title">Результат: {result.score}%</h1>
        <p>Уровень: {result.userLevel}</p>
        <p>Правильных ответов: {result.correctAnswers} из {result.totalQuestions}</p>
        <section className="ai-review" aria-labelledby="ai-review-title" aria-live="polite">
          <p className="auth-card__eyebrow">Персональный разбор</p>
          <h2 id="ai-review-title">AI-помощник</h2>
          {analysisLoading && <div className="ai-review__loading"><span className="ai-review__spinner" aria-hidden="true" />Готовим разбор ошибок и объяснения правильных ответов…</div>}
          {analysis && <p className="ai-review__summary">{analysis.summary}</p>}
          {analysisError && <div className="ai-review__error" role="status"><p>{analysisError}</p><button type="button" onClick={() => void retryAnalysis()}>Повторить разбор</button></div>}
        </section>
        <div className="result-list">
          {result.questions.map((question) => (
            <article className="result-question" key={question.id}>
              <p className="result-question__score">Вопрос {question.order} · {question.isCorrect ? 'Верно' : 'Неверно'}</p>
              <h2>{question.text}</h2>
              {analysis?.explanations.find((item) => item.questionOrder === question.order) && (
                <p className="result-question__explanation">{analysis.explanations.find((item) => item.questionOrder === question.order)?.explanation}</p>
              )}
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
