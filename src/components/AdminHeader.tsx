import { NavLink, Link } from 'react-router-dom';

export function AdminHeader() {
  return <header className="dashboard-header admin-header">
    <Link className="auth-page__brand" to="/admin">SkillForge <span className="admin-header__badge">ADMIN</span></Link>
    <nav className="admin-nav" aria-label="Навигация администратора">
      <NavLink to="/admin" end>Обзор</NavLink><NavLink to="/admin/users">Пользователи</NavLink>
      <NavLink to="/admin/skills">Навыки</NavLink><NavLink to="/admin/questions">Вопросы</NavLink>
      <Link to="/dashboard">В кабинет ↗</Link>
    </nav>
  </header>;
}
