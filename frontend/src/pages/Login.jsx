import React, { useState } from 'react';
import api from '../services/api';

export default function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('usuario@streaming.cl');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister ? { nombre, email, password } : { email, password };
      const { data } = await api.post(endpoint, payload);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail) => {
    setIsRegister(false);
    setEmail(demoEmail);
    setPassword('123456');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>STREAM<span>GLOBAL</span></h1>
        <p className="subtitle">Plataforma Global de Streaming • Evaluación 2</p>

        <div className="demo-buttons">
          <button type="button" onClick={() => fillDemo('admin@streaming.cl')} className="btn-chip">
            Credencial Admin
          </button>
          <button type="button" onClick={() => fillDemo('usuario@streaming.cl')} className="btn-chip">
            Credencial Suscriptor
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label>Nombre completo</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Camila Rojas"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="alert-error">{error}</div>}

          <button type="submit" className="btn-primary full" disabled={loading}>
            {loading ? 'Procesando...' : isRegister ? 'Crear cuenta' : 'Ingresar a la plataforma'}
          </button>
        </form>

        <p className="toggle-auth">
          {isRegister ? '¿Ya tienes cuenta?' : '¿Nuevo en StreamGlobal?'}{' '}
          <span onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? 'Inicia sesión' : 'Regístrate aquí'}
          </span>
        </p>
      </div>
    </div>
  );
}
