import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  createAdminQuestion,
  createAdminSkill,
  getAdminQuestion,
  getAdminQuestions,
  getAdminSkills,
  getAdminStatistics,
  getAdminUsers,
  setAdminQuestionActive,
  setAdminSkillActive,
  setAdminUserStatus,
  updateAdminQuestion,
  updateAdminSkill,
  type AdminQuestion,
  type AdminSkill,
} from '../api/admin.js';
import { useAuth } from '../auth/AuthContext.js';

function AdminHeader() {
  return <header className="dashboard-header"><Link className="auth-page__brand" to="/admin">SkillForge Admin</Link><nav className="admin-nav"><Link to="/admin/users">Пользователи</Link><Link to="/admin/skills">Навыки</Link><Link to="/admin/questions">Вопросы</Link></nav></header>;
}

export function AdminDashboardPage() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<{ users: number; questions: number; skills: number; interviews: number; averageScore: number } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!accessToken) return;
    getAdminStatistics(accessToken).then((result) => setStats(result.data)).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Ошибка загрузки.'));
  }, [accessToken]);
  return <main className="dashboard-page"><AdminHeader /><section className="dashboard-welcome"><p className="auth-card__eyebrow">Управление</p><h1>Панель администратора</h1>{error && <p role="alert">{error}</p>}<div className="dashboard-stats">{stats && Object.entries({Пользователи:stats.users,Вопросы:stats.questions,Навыки:stats.skills,Интервью:stats.interviews,'Средний балл':`${stats.averageScore}%`}).map(([label,value])=><article key={label}><strong>{value}</strong><span>{label}</span></article>)}</div><div className="admin-links"><Link to="/admin/users">Управление пользователями</Link><Link to="/admin/skills">Управление навыками</Link><Link to="/admin/questions">Банк вопросов</Link></div></section></main>;
}

export function AdminUsersPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<Array<{ id: number | string; name: string; email: string; role: string; status: string }>>([]);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [error, setError] = useState('');
  async function refresh() {
    if (!accessToken) return;
    try { setUsers((await getAdminUsers(accessToken, appliedSearch)).data); setError(''); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load users.'); }
  }
  useEffect(() => { void refresh(); }, [accessToken, appliedSearch]);
  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedSearch(search.trim());
  }
  async function toggle(user: typeof users[number]) {
    if (!accessToken) return;
    try { await setAdminUserStatus(accessToken, user.id, user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось изменить статус.'); }
  }
  return <main className="dashboard-page"><AdminHeader /><section className="dashboard-welcome"><h1>Пользователи</h1><form className="auth-form admin-create-form" onSubmit={submitSearch}><label className="auth-form__field"><span>Поиск по имени или email</span><input aria-label="Search users" value={search} onChange={(event) => setSearch(event.target.value)} /></label><button className="auth-form__submit" type="submit">Найти</button></form>{error && <p role="alert">{error}</p>}<div className="admin-list">{users.map((user)=><article className="admin-row" key={user.id}><div><strong>{user.name}</strong><span>{user.email} · {user.role} · {user.status}</span></div><button type="button" onClick={()=>void toggle(user)}>{user.status === 'ACTIVE' ? 'Заблокировать' : 'Разблокировать'}</button></article>)}</div></section></main>;
}

export function AdminSkillsPage() {
  const { accessToken } = useAuth();
  const [skills, setSkills] = useState<AdminSkill[]>([]);
  const [error, setError] = useState('');
  async function refresh() {
    if (!accessToken) return;
    try { setSkills((await getAdminSkills(accessToken)).data); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось загрузить навыки.'); }
  }
  useEffect(() => { void refresh(); }, [accessToken]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!accessToken) return;
    const form = new FormData(event.currentTarget);
    try { await createAdminSkill(accessToken, { name: String(form.get('name')), description: String(form.get('description') ?? '') }); event.currentTarget.reset(); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось создать навык.'); }
  }
  async function toggle(skill: AdminSkill) {
    if (!accessToken) return;
    try { await setAdminSkillActive(accessToken, skill.id, !skill.isActive); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось изменить навык.'); }
  }
  async function edit(skill: AdminSkill) {
    if (!accessToken) return;
    const name = window.prompt('Новое название навыка', skill.name)?.trim();
    if (!name || name === skill.name) return;
    try { await updateAdminSkill(accessToken, skill.id, { name }); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось переименовать навык.'); }
  }
  return <main className="dashboard-page"><AdminHeader /><section className="dashboard-welcome"><h1>Навыки</h1><form className="auth-form admin-create-form" onSubmit={create}><label className="auth-form__field"><span>Название навыка</span><input name="name" minLength={2} maxLength={80} required /></label><label className="auth-form__field"><span>Описание</span><input name="description" maxLength={1000} /></label><button className="auth-form__submit" type="submit">Добавить навык</button></form>{error && <p role="alert">{error}</p>}<div className="admin-list">{skills.map((skill)=><article className="admin-row" key={skill.id}><div><strong>{skill.name}</strong><span>{skill.description} · {skill.questionCount ?? 0} вопросов · {skill.isActive ? 'Активен':'Неактивен'}</span></div><button type="button" onClick={()=>void edit(skill)}>Переименовать</button><button type="button" onClick={()=>void toggle(skill)}>{skill.isActive ? 'Отключить':'Включить'}</button></article>)}</div></section></main>;
}

const emptyOptions = ['', '', '', ''];

export function AdminQuestionsPage() {
  const { accessToken } = useAuth();
  const [skills, setSkills] = useState<AdminSkill[]>([]);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [options, setOptions] = useState(emptyOptions);
  const [correct, setCorrect] = useState<number[]>([0]);
  const [type, setType] = useState<AdminQuestion['type']>('SINGLE_CHOICE');
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(null);
  const [error, setError] = useState('');
  async function refresh() {
    if (!accessToken) return;
    try {
      const [skillResult, questionResult] = await Promise.all([getAdminSkills(accessToken), getAdminQuestions(accessToken)]);
      setSkills(skillResult.data.filter((skill) => skill.isActive));
      setQuestions(questionResult.data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось загрузить банк вопросов.'); }
  }
  useEffect(() => { void refresh(); }, [accessToken]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!accessToken) return;
    const formElement = event.currentTarget;
    const form = new FormData(event.currentTarget);
    const selectedOptions = options.map((text, index) => ({ text: text.trim(), isCorrect: correct.includes(index) })).filter((option) => option.text);
    try {
      const input = {
        skillId: Number(form.get('skillId')),
        text: String(form.get('text')),
        type,
        difficulty: String(form.get('difficulty')) as AdminQuestion['difficulty'],
        options: selectedOptions,
      };
      if (editingQuestion) await updateAdminQuestion(accessToken, editingQuestion.id, input);
      else await createAdminQuestion(accessToken, input);
      formElement.reset(); setEditingQuestion(null); setOptions(emptyOptions); setCorrect([0]); setType('SINGLE_CHOICE'); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось создать вопрос.'); }
  }
  async function toggle(question: AdminQuestion) {
    if (!accessToken) return;
    try { await setAdminQuestionActive(accessToken, question.id, !question.isActive); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось изменить вопрос.'); }
  }
  async function edit(question: AdminQuestion) {
    if (!accessToken) return;
    try {
      const result = await getAdminQuestion(accessToken, question.id);
      setEditingQuestion(result.data);
      setType(result.data.type);
      const currentOptions = result.data.options ?? [];
      setOptions([...currentOptions.map((option) => option.text), ...emptyOptions].slice(0, 4));
      setCorrect(currentOptions.flatMap((option, index) => option.isCorrect ? [index] : []));
      setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось загрузить вопрос.'); }
  }
  function cancelEdit() {
    setEditingQuestion(null); setType('SINGLE_CHOICE'); setOptions(emptyOptions); setCorrect([0]); setError('');
  }
  return <main className="dashboard-page"><AdminHeader /><section className="dashboard-welcome"><h1>Банк вопросов</h1><form key={editingQuestion?.id ?? 'new-question'} className="auth-form admin-create-form" onSubmit={create}>
    <label className="auth-form__field"><span>Навык</span><select name="skillId" defaultValue={editingQuestion?.skillId ?? skills[0]?.id} required>{skills.map((skill)=><option value={skill.id} key={skill.id}>{skill.name}</option>)}</select></label>
    <label className="auth-form__field"><span>Текст вопроса</span><textarea name="text" rows={3} minLength={10} maxLength={4000} defaultValue={editingQuestion?.text ?? ''} required /></label>
    <label className="auth-form__field"><span>Тип</span><select value={type} onChange={(event)=>{setType(event.target.value as AdminQuestion['type']);setCorrect([]);}}><option value="SINGLE_CHOICE">Один вариант</option><option value="MULTIPLE_CHOICE">Несколько вариантов</option></select></label>
    <label className="auth-form__field"><span>Сложность</span><select name="difficulty" defaultValue={editingQuestion?.difficulty ?? 'EASY'}><option value="EASY">Лёгкая</option><option value="MEDIUM">Средняя</option><option value="HARD">Сложная</option></select></label>
    {options.map((option,index)=><div className="admin-option-editor" key={index}><label className="auth-form__field"><span>Вариант {index+1}</span><input aria-label={`Option ${index + 1}`} value={option} onChange={(event)=>setOptions((current)=>current.map((item,i)=>i===index?event.target.value:item))} /></label><label><input type={type==='SINGLE_CHOICE'?'radio':'checkbox'} name="correctOption" checked={correct.includes(index)} onChange={()=>setCorrect((current)=>type==='SINGLE_CHOICE'?[index]:current.includes(index)?current.filter((i)=>i!==index):[...current,index])} /> Правильный</label></div>)}
    {error && <p className="auth-form__error" role="alert">{error}</p>}<button className="auth-form__submit" type="submit" disabled={skills.length===0}>{editingQuestion ? 'Save changes' : 'Добавить вопрос'}</button>
    {editingQuestion && <button type="button" onClick={cancelEdit}>Cancel edit</button>}
  </form><div className="admin-list">{questions.map((question)=><article className="admin-row" key={question.id}><div><strong>{question.skill} · {question.difficulty}</strong><span>{question.text} · {question.isActive?'Активен':'Неактивен'}</span></div><button type="button" aria-label={`Edit question ${question.id}`} onClick={()=>void edit(question)}>Изменить</button><button type="button" onClick={()=>void toggle(question)}>{question.isActive?'Отключить':'Включить'}</button></article>)}</div></section></main>;
}
