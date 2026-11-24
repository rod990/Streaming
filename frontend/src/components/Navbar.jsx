import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const location = useLocation();
  const isActive = (path) => (location.pathname === path ? 'nav-link active' : 'nav-link');

  return (
    <header className="navbar">
      <div className="navbar-left">
        <Link to="/" className="brand">
          STREAM<span>GLOBAL</span>
        </Link>
        <nav className="nav-links">
          <Link to="/" className={isActive('/')}>Catálogo</Link>
          <Link to="/buscar-api" className={isActive('/buscar-api')}>Buscador API Videos</Link>
          <Link to="/mi-lista" className={isActive('/mi-lista')}>Mi Lista</Link>
          {user?.rol === 'admin' && (
            <Link to="/admin" className={isActive('/admin')}>Panel Admin</Link>
          )}
        </nav>
      </div>

      <div className="navbar-right">
        <span className={`role-badge ${user?.rol}`}>
          {user?.rol === 'admin' ? 'ADMIN' : 'SUSCRIPTOR'}
        </span>
        <span className="user-email">{user?.email}</span>
        <button onClick={onLogout} className="btn-outline">Cerrar sesión</button>
      </div>
    </header>
  );
}
