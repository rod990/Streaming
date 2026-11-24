import React, { useState, useEffect } from 'react';
import api from '../services/api';
import VideoPlayerModal from '../components/VideoPlayerModal';

export default function ExternalSearch({ user }) {
  const [query, setQuery] = useState('batman');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [toast, setToast] = useState('');

  const searchExternal = async (searchTerm) => {
    setLoading(true);
    try {
      const { data } = await api.get('/videos/external/search', {
        params: { q: searchTerm },
      });
      setResults(data.results || []);
    } catch (error) {
      console.error('Error en API externa:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchExternal('batman');
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) searchExternal(query);
  };

  const handleImport = async (item) => {
    try {
      await api.post('/videos', {
        titulo: item.titulo,
        descripcion: item.descripcion,
        categoria: item.categoria,
        anio: item.anio,
        duracion: item.duracion,
        thumbnail_url: item.thumbnail_url,
        video_url: item.video_url,
        fuente: 'Importado API',
      });
      setToast(`"${item.titulo}" importado al catálogo PostgreSQL.`);
      setTimeout(() => setToast(''), 3500);
    } catch (error) {
      alert(error.response?.data?.message || 'Error al importar video');
    }
  };

  return (
    <div className="container">
      <div className="api-header">
        <div>
          <h1>Buscador Global de Videos (API Externa)</h1>
          <p>Consulta tráilers y contenido multimedia en tiempo real desde servicios externos.</p>
        </div>

        <form onSubmit={handleSubmit} className="search-box">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: Matrix, Star Wars, Dune, Pixar..."
          />
          <button type="submit" className="btn-primary">
            {loading ? 'Buscando...' : 'Buscar Videos'}
          </button>
        </form>
      </div>

      {toast && <div className="toast-success">{toast}</div>}

      <div className="video-grid">
        {results.map((item) => (
          <div key={item.external_id} className="video-card">
            <div className="thumb-box" onClick={() => setSelectedVideo(item)}>
              <img src={item.thumbnail_url} alt={item.titulo} />
              <div className="play-overlay">▶</div>
            </div>
            <div className="card-body">
              <div className="card-meta">
                <span>{item.categoria} • {item.anio}</span>
                <span>{item.duracion}</span>
              </div>
              <h3>{item.titulo}</h3>
              <p>{item.descripcion}</p>
              <div className="card-actions">
                <button className="btn-primary sm" onClick={() => setSelectedVideo(item)}>
                  ▶ Reproducir
                </button>
                {user?.rol === 'admin' && (
                  <button className="btn-secondary sm" onClick={() => handleImport(item)}>
                    + Importar a BD
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
    </div>
  );
}
