import { useEffect, useState, type FormEvent } from 'react';

import {
  createAdminQuestion,
  createAdminSkill,
  getAdminQuestion,
  getAdminQuestions,
  getAdminSkills,
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
import { AdminHeader } from '../components/AdminHeader.js';
export { AdminDashboardPage } from './AdminOverview.js';

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
  const [entryMode, setEntryMode] = useState<'single' | 'bulk'>('single');
  const [bulkText, setBulkText] = useState('');
  const [bulkSkillId, setBulkSkillId] = useState('');
  const [bulkType, setBulkType] = useState<AdminQuestion['type']>('SINGLE_CHOICE');
  const [bulkFeedback, setBulkFeedback] = useState('');
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
  async function importBulk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    const form = new FormData(event.currentTarget);
    const selectedSkillId = String(form.get('skillId') ?? '');
    const lines = bulkText.split(/\r?\n/);
    const rows: Array<{ line: number; input: Parameters<typeof createAdminQuestion>[1] }> = [];
    const validationErrors: string[] = [];

    lines.forEach((line, index) => {
      if (!line.trim()) return;
      const columns = line.split('|').map((column) => column.trim());
      const lineNumber = index + 1;
      if (columns.length !== 7) {
        validationErrors.push(`Строка ${lineNumber}: ожидается 7 полей, разделённых символом |.`);
        return;
      }

      const [difficulty, text, ...rest] = columns;
      const optionTexts = rest.slice(0, 4);
      const correctNumbers = rest[4].split(',').map((number) => Number(number.trim()));
      const validDifficulty = ['EASY', 'MEDIUM', 'HARD'].includes(difficulty.toUpperCase());
      const options = optionTexts.flatMap((optionText, optionIndex) => optionText
        ? [{ text: optionText, isCorrect: correctNumbers.includes(optionIndex + 1) }]
        : []);
      const validCorrectNumbers = correctNumbers.length > 0
        && correctNumbers.every((number) => Number.isInteger(number) && number >= 1 && number <= 4)
        && new Set(correctNumbers).size === correctNumbers.length;
      const correctCount = options.filter((option) => option.isCorrect).length;

      if (text.length < 10 || text.length > 4000) validationErrors.push(`Строка ${lineNumber}: текст вопроса должен содержать от 10 до 4000 символов.`);
      if (!validDifficulty) validationErrors.push(`Строка ${lineNumber}: сложность должна быть EASY, MEDIUM или HARD.`);
      if (options.length < 2) validationErrors.push(`Строка ${lineNumber}: укажите минимум два варианта ответа.`);
      if (!validCorrectNumbers || correctCount !== correctNumbers.length || (bulkType === 'SINGLE_CHOICE' && correctNumbers.length !== 1)) {
        validationErrors.push(`Строка ${lineNumber}: проверьте номера правильных ответов${bulkType === 'SINGLE_CHOICE' ? ' (для одного варианта укажите только один номер)' : ''}.`);
      }

      if (text.length >= 10 && text.length <= 4000 && validDifficulty && options.length >= 2 && validCorrectNumbers && correctCount === correctNumbers.length && (bulkType !== 'SINGLE_CHOICE' || correctNumbers.length === 1)) {
        rows.push({
          line: lineNumber,
          input: {
            skillId: Number(selectedSkillId),
            text,
            type: bulkType,
            difficulty: difficulty.toUpperCase() as AdminQuestion['difficulty'],
            options,
          },
        });
      }
    });

    if (!selectedSkillId) validationErrors.push('Выбери навык для загружаемых вопросов.');
    if (rows.length === 0 && validationErrors.length === 0) validationErrors.push('Добавь хотя бы одну непустую строку вопроса.');
    if (validationErrors.length > 0) {
      setError(validationErrors.join(' '));
      setBulkFeedback('');
      return;
    }

    setError('');
    setBulkFeedback('Добавляем вопросы…');
    const failedLines: number[] = [];
    const failures: string[] = [];
    let addedCount = 0;
    for (const row of rows) {
      try {
        await createAdminQuestion(accessToken, row.input);
        addedCount += 1;
      } catch (cause) {
        failedLines.push(row.line);
        failures.push(`строка ${row.line}${cause instanceof Error ? `: ${cause.message}` : ''}`);
      }
    }

    if (addedCount > 0) await refresh();
    if (failedLines.length === 0) {
      setBulkText('');
      setBulkFeedback(`Готово: добавлено вопросов — ${addedCount}.`);
    } else {
      setBulkText((current) => current.split(/\r?\n/).filter((_, index) => failedLines.includes(index + 1)).join('\n'));
      setBulkFeedback(`Добавлено ${addedCount} из ${rows.length}. Остались ${failures.join('; ')}. В поле оставлены только строки с ошибками.`);
    }
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
      setEntryMode('single');
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
  return <main className="dashboard-page"><AdminHeader /><section className="dashboard-welcome admin-question-bank"><h1>Банк вопросов</h1>
    {!editingQuestion && <div className="question-bank__modes" role="group" aria-label="Способ добавления вопросов"><button type="button" aria-pressed={entryMode === 'single'} onClick={() => { setEntryMode('single'); setError(''); }}>Один вопрос</button><button type="button" aria-pressed={entryMode === 'bulk'} onClick={() => { setEntryMode('bulk'); setError(''); }}>Списком</button></div>}
    {entryMode === 'bulk' && !editingQuestion ? <form className="auth-form admin-create-form question-bulk-form" onSubmit={(event) => void importBulk(event)}>
      <label className="auth-form__field"><span>Навык для всех вопросов</span><select name="skillId" value={bulkSkillId || String(skills[0]?.id ?? '')} onChange={(event) => setBulkSkillId(event.target.value)} required><option value="" disabled>Выбери навык</option>{skills.map((skill)=><option value={skill.id} key={skill.id}>{skill.name}</option>)}</select></label>
      <label className="auth-form__field"><span>Тип ответов</span><select value={bulkType} onChange={(event) => setBulkType(event.target.value as AdminQuestion['type'])}><option value="SINGLE_CHOICE">Один правильный ответ</option><option value="MULTIPLE_CHOICE">Несколько правильных ответов</option></select></label>
      <div className="question-bulk-form__help"><strong>Одна строка — один вопрос.</strong><span>Поля через |: сложность | текст вопроса | вариант 1 | вариант 2 | вариант 3 | вариант 4 | номера правильных ответов.</span><code>EASY | Что такое DOM-модель документа? | Дерево страницы | База данных | Протокол | Операционная система | 1</code><span>Пустые варианты можно пропустить. Сложность: EASY, MEDIUM или HARD. Для нескольких верных ответов укажи, например: 1,3.</span></div>
      <label className="auth-form__field"><span>Список вопросов</span><textarea aria-label="Список вопросов для импорта" rows={8} value={bulkText} onChange={(event) => setBulkText(event.target.value)} placeholder="Вставь сюда список вопросов — каждый с новой строки" required /></label>
      {error && <p className="auth-form__error" role="alert">{error}</p>}{bulkFeedback && <p className="question-bulk-form__feedback" role="status">{bulkFeedback}</p>}
      <button className="auth-form__submit" type="submit" disabled={skills.length === 0 || !bulkText.trim()}>Добавить списком</button>
    </form> : <form key={editingQuestion?.id ?? 'new-question'} className="auth-form admin-create-form" onSubmit={create}>
    <label className="auth-form__field"><span>Навык</span><select name="skillId" defaultValue={editingQuestion?.skillId ?? skills[0]?.id} required>{skills.map((skill)=><option value={skill.id} key={skill.id}>{skill.name}</option>)}</select></label>
    <label className="auth-form__field"><span>Текст вопроса</span><textarea name="text" rows={3} minLength={10} maxLength={4000} defaultValue={editingQuestion?.text ?? ''} required /></label>
    <label className="auth-form__field"><span>Тип</span><select value={type} onChange={(event)=>{setType(event.target.value as AdminQuestion['type']);setCorrect([]);}}><option value="SINGLE_CHOICE">Один вариант</option><option value="MULTIPLE_CHOICE">Несколько вариантов</option></select></label>
    <label className="auth-form__field"><span>Сложность</span><select name="difficulty" defaultValue={editingQuestion?.difficulty ?? 'EASY'}><option value="EASY">Лёгкая</option><option value="MEDIUM">Средняя</option><option value="HARD">Сложная</option></select></label>
    {options.map((option,index)=><div className="admin-option-editor" key={index}><label className="auth-form__field"><span>Вариант {index+1}</span><input aria-label={`Option ${index + 1}`} value={option} onChange={(event)=>setOptions((current)=>current.map((item,i)=>i===index?event.target.value:item))} /></label><label><input type={type==='SINGLE_CHOICE'?'radio':'checkbox'} name="correctOption" checked={correct.includes(index)} onChange={()=>setCorrect((current)=>type==='SINGLE_CHOICE'?[index]:current.includes(index)?current.filter((i)=>i!==index):[...current,index])} /> Правильный</label></div>)}
    {error && <p className="auth-form__error" role="alert">{error}</p>}<div className="question-form__actions"><button className="auth-form__submit" type="submit" disabled={skills.length===0}>{editingQuestion ? 'Сохранить изменения' : 'Добавить вопрос'}</button>
    {editingQuestion && <button className="question-form__cancel" type="button" onClick={cancelEdit}>Отменить</button>}</div>
  </form>}
  <div className="admin-list">{questions.map((question)=><article className="admin-row admin-row--question" key={question.id}><div><strong>{question.skill} · {question.difficulty}</strong><span>{question.text} · {question.isActive?'Активен':'Неактивен'}</span></div><div className="admin-row__actions"><button type="button" aria-label={`Edit question ${question.id}`} onClick={()=>void edit(question)}>Изменить</button><button type="button" onClick={()=>void toggle(question)}>{question.isActive?'Отключить':'Включить'}</button></div></article>)}</div></section></main>;
}
