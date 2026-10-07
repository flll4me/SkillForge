import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createInterview, getSkills, type Skill } from '../api/interviews.js';
import { useAuth } from '../auth/AuthContext.js';

const difficulties = [
  { value: 'EASY', label: 'Лёгкий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'HARD', label: 'Сложный' },
];

export function InterviewStartPage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getSkills()
      .then((items) => { if (active) setSkills(items.filter((skill) => skill.questionCount >= (skill.interviewQuestionCount ?? 10))); })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить навыки.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    const form = new FormData(event.currentTarget);
    const skillId = Number(form.get('skillId'));
    setError('');
    setIsStarting(true);
    try {
      const interview = await createInterview(accessToken, skillId, difficulty);
      navigate(`/interview/${interview.id}`);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Не удалось начать интервью.');
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header"><Link className="auth-page__brand" to="/dashboard">SkillForge</Link></header>
      <section className="dashboard-welcome" aria-labelledby="interview-start-title">
        <p className="auth-card__eyebrow">Новая тренировка</p>
        <h1 id="interview-start-title">Настрой интервью</h1>
        {isLoading ? <p aria-live="polite">Загружаем навыки…</p> : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-form__field" htmlFor="skillId">
              <span>Навык</span>
              <select id="skillId" name="skillId" required disabled={skills.length === 0}>
                {skills.length === 0 && <option value="">Пока нет навыков с 10 вопросами</option>}
                {skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name} · {skill.questionCount} вопросов</option>)}
              </select>
            </label>
            <label className="auth-form__field" htmlFor="difficulty">
              <span>Начальная сложность</span>
              <select id="difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                {difficulties.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            {error && <p className="auth-form__error" role="alert">{error}</p>}
            <button className="auth-form__submit" type="submit" disabled={isStarting || skills.length === 0}>
              {isStarting ? 'Создаём интервью…' : 'Начать интервью'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
