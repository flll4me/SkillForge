import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCurrentInterviewQuestion, submitInterviewAnswer, type CurrentInterviewQuestion } from '../api/interviews.js';
import { useAuth } from '../auth/AuthContext.js';

export function InterviewPage() {
  const { id = '' } = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState<CurrentInterviewQuestion | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    getCurrentInterviewQuestion(accessToken, id)
      .then((question) => { if (active) setCurrent(question); })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить вопрос.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [accessToken, id]);

  function toggleOption(optionId: number) {
    if (current?.question.type === 'SINGLE_CHOICE') {
      setSelected([optionId]);
      return;
    }
    setSelected((items) => items.includes(optionId)
      ? items.filter((item) => item !== optionId)
      : [...items, optionId]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !current || selected.length === 0) return;
    setError('');
    setIsSubmitting(true);
    try {
      const result = await submitInterviewAnswer(accessToken, id, {
        questionId: current.question.id,
        selectedOptionIds: selected,
      });
      if (result.completed) {
        navigate(`/interview/${id}/result`, { replace: true });
        return;
      }
      setFeedback(result.isCorrect ? 'Верно. Сложность следующего вопроса изменится.' : 'Пока неверно. Следующий вопрос подстроится под ответ.');
      const next = await getCurrentInterviewQuestion(accessToken, id);
      setCurrent(next);
      setSelected([]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось сохранить ответ.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <main className="dashboard-page" aria-live="polite">Загружаем вопрос…</main>;
  if (error && !current) return <main className="dashboard-page"><p role="alert">{error}</p><Link to="/dashboard">В кабинет</Link></main>;
  if (!current) return null;

  const question = current.question;
  const Input = question.type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox';

  return (
    <main className="dashboard-page">
      <header className="dashboard-header"><Link className="auth-page__brand" to="/dashboard">SkillForge</Link></header>
      <section className="quiz-card" aria-labelledby="quiz-title">
        <div className="quiz-card__meta"><span>Вопрос {current.questionNumber} из {current.totalQuestions}</span><span>{question.difficulty}</span></div>
        <progress value={current.questionNumber} max={current.totalQuestions} aria-label="Прогресс интервью" />
        <h1 id="quiz-title">{question.text}</h1>
        <p className="quiz-card__hint">{question.type === 'MULTIPLE_CHOICE' ? 'Выбери все подходящие варианты.' : 'Выбери один вариант.'}</p>
        <form className="quiz-options" onSubmit={handleSubmit}>
          {question.options.map((option) => (
            <label className={`quiz-option${selected.includes(option.id) ? ' quiz-option--selected' : ''}`} key={option.id}>
              <input type={Input} name="answer" checked={selected.includes(option.id)} onChange={() => toggleOption(option.id)} />
              <span>{option.text}</span>
            </label>
          ))}
          {feedback && <p className="quiz-card__feedback" aria-live="polite">{feedback}</p>}
          {error && <p className="auth-form__error" role="alert">{error}</p>}
          <button className="auth-form__submit" type="submit" disabled={isSubmitting || selected.length === 0}>
            {isSubmitting ? 'Сохраняем…' : 'Ответить'}
          </button>
        </form>
      </section>
    </main>
  );
}
