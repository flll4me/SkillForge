import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { updateUserProfile } from '../api/auth.js';
import { useAuth } from '../auth/AuthContext.js';

export function ProfilePage() {
  const { accessToken, user, updateUser } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !user) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    setError('');
    setMessage('');
    setIsSaving(true);
    try {
      const updated = await updateUserProfile(accessToken, { name, email });
      updateUser(updated);
      setMessage('Профиль сохранён.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Не удалось обновить профиль.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header"><Link className="auth-page__brand" to="/dashboard">SkillForge</Link></header>
      <section className="dashboard-welcome" aria-labelledby="profile-title">
        <p className="auth-card__eyebrow">Учётная запись</p>
        <h1 id="profile-title">Профиль</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-form__field" htmlFor="profile-name"><span>Имя</span><input id="profile-name" name="name" defaultValue={user?.name} minLength={2} maxLength={100} required /></label>
          <label className="auth-form__field" htmlFor="profile-email"><span>Email</span><input id="profile-email" name="email" type="email" defaultValue={user?.email} maxLength={320} required /></label>
          {error && <p className="auth-form__error" role="alert">{error}</p>}
          {message && <p role="status">{message}</p>}
          <button className="auth-form__submit" type="submit" disabled={isSaving}>{isSaving ? 'Сохраняем…' : 'Сохранить профиль'}</button>
        </form>
      </section>
    </main>
  );
}
