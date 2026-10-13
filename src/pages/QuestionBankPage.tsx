import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getQuestionCatalog, getSkills, type CatalogQuestion, type QuestionDifficulty, type Skill } from '../api/interviews.js';

const difficultyLabels: Record<QuestionDifficulty, string> = {
  EASY: 'Начальный',
  MEDIUM: 'Средний',
  HARD: 'Сложный',
};

export function QuestionBankPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillId, setSkillId] = useState('');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | ''>('');
  const [questions, setQuestions] = useState<CatalogQuestion[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const pageSize = 50;

  useEffect(() => {
    let active = true;
    getSkills()
      .then((items) => { if (active) setSkills(items); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Не удалось загрузить навыки.'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    getQuestionCatalog({
      ...(skillId ? { skillId } : {}),
      ...(difficulty ? { difficulty } : {}),
      page,
      limit: pageSize,
    })
      .then((result) => {
        if (!active) return;
        setQuestions(result.data);
        setTotal(result.meta.total);
        setError('');
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Не удалось загрузить вопросы.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [skillId, difficulty, page]);

  function updateSkill(value: string) {
    setSkillId(value);
    setPage(1);
  }

  function updateDifficulty(value: string) {
    setDifficulty(value as QuestionDifficulty | '');
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link className="auth-page__brand" to="/dashboard">SkillForge</Link>
        <Link to="/interview/new">Начать интервью</Link>
      </header>
      <section className="dashboard-welcome" aria-labelledby="question-bank-title">
        <p className="auth-card__eyebrow">Банк вопросов</p>
        <h1 id="question-bank-title">Практика по темам</h1>
        <form className="auth-form admin-create-form" onSubmit={(event) => event.preventDefault()}>
          <label className="auth-form__field">
            <span>Навык</span>
            <select aria-label="Фильтр по навыку" value={skillId} onChange={(event) => updateSkill(event.target.value)}>
              <option value="">Все навыки</option>
              {skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
            </select>
          </label>
          <label className="auth-form__field">
            <span>Сложность</span>
            <select aria-label="Фильтр по сложности" value={difficulty} onChange={(event) => updateDifficulty(event.target.value)}>
              <option value="">Любая сложность</option>
              {Object.entries(difficultyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </form>
        <p aria-live="polite">{isLoading ? 'Загружаем вопросы…' : `Найдено вопросов: ${total}`}</p>
        {error && <p role="alert">{error}</p>}
        {!isLoading && !error && questions.length === 0 && <p>По выбранным фильтрам вопросов пока нет.</p>}
        <div className="admin-list">
          {questions.map((question) => (
            <article className="admin-row" key={question.id}>
              <div><strong>{question.skill} · {difficultyLabels[question.difficulty]}</strong><span>{question.text}</span></div>
            </article>
          ))}
        </div>
        {pageCount > 1 && <nav aria-label="Страницы банка вопросов" className="question-bank__pagination">
          <button type="button" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)}>Назад</button>
          <span>Страница {page} из {pageCount}</span>
          <button type="button" disabled={page >= pageCount || isLoading} onClick={() => setPage((current) => current + 1)}>Дальше</button>
        </nav>}
      </section>
    </main>
  );
}
