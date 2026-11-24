import React, { useEffect, useState } from 'react';
import api from '../services/api';

const EMPTY_FORM = {
  titulo: '',
  descripcion: '',
  categoria: 'Ciencia Ficción',
  anio: 2025,
  duracion: '1h 45m',
  thumbnail_url: '',
  video_url: '',
};

export default function AdminPanel() {
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState({ totalVideos: 0, totalUsers: 0, totalViews: 0, totalFavorites: 0 });
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const loadAdminData = async () => {
    const [vidRes, statRes] = await Promise.all([
      api.get('/videos'),
      api.get('/videos/admin/stats'),
    ]);
    setVideos(vidRes.data);
    setStats(statRes.data);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await api.put(`/videos/${editingId}`, form);
    } else {
      await api.post('/videos', form);
    }
    setForm(EMPTY_FORM);
    setEditingId(null);
    loadAdminData();
  };

  const handleEdit = (video) => {
    setEditingId(video.id);
    setForm({
      titulo: video.titulo,
      descripcion: video.descripcion,
      categoria: video.categoria,
      anio: video.anio,
      duracion: video.duracion,
      thumbnail_url: video.thumbnail_url,
      video_url: video.video_url,
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este título del catálogo?')) {
      await api.delete(`/videos/${id}`);
      loadAdminData();
    }
  };

  return (
    <div className="container">
      <h1 className="section-title">Panel de Administración (JWT Rol Admin)</h1>

      <div className="stats-grid">
        <div className="stat-card"><span>Títulos en Catálogo</span><strong>{stats.totalVideos}</strong></div>
        <div className="stat-card"><span>Usuarios Registrados</span><strong>{stats.totalUsers}</strong></div>
        <div className="stat-card"><span>Reproducciones Totales</span><strong>{stats.totalViews}</strong></div>
        <div className="stat-card"><span>Guardados en Listas</span><strong>{stats.totalFavorites}</strong></div>
      </div>

      <div className="admin-layout">
        <form onSubmit={handleSubmit} className="admin-form">
          <h3>{editingId ? 'Editar Video' : 'Agregar Nuevo Video'}</h3>
          <input
            type="text"
            placeholder="Título"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Categoría (Ej: Acción, Animación)"
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            required
          />
          <div className="row-2">
            <input
              type="number"
              placeholder="Año"
              value={form.anio}
              onChange={(e) => setForm({ ...form, anio: Number(e.target.value) })}
            />
            <input
              type="text"
              placeholder="Duración (Ej: 1h 50m)"
              value={form.duracion}
              onChange={(e) => setForm({ ...form, duracion: e.target.value })}
            />
          </div>
          <input
            type="url"
            placeholder="URL Miniatura / Póster (https://...)"
            value={form.thumbnail_url}
            onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
            required
          />
          <input
            type="url"
            placeholder="URL Stream Video MP4 o Embed (https://...)"
            value={form.video_url}
            onChange={(e) => setForm({ ...form, video_url: e.target.value })}
            required
          />
          <textarea
            rows="3"
            placeholder="Sinopsis / Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
          <div className="card-actions">
            <button type="submit" className="btn-primary">
              {editingId ? 'Guardar Cambios' : 'Publicar en Catálogo'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Categoría</th>
                <th>Vistas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((v) => (
                <tr key={v.id}>
                  <td>{v.id}</td>
                  <td>{v.titulo}</td>
                  <td>{v.categoria}</td>
                  <td>{v.vistas}</td>
                  <td className="actions-cell">
                    <button className="btn-secondary sm" onClick={() => handleEdit(v)}>Editar</button>
                    <button className="btn-danger sm" onClick={() => handleDelete(v.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
