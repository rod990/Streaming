import React, { useEffect, useState } from 'react';
import api from '../services/api';
import VideoPlayerModal from '../components/VideoPlayerModal';

const MOVIE_CATEGORIES = [
  'Todas',
  'Marvel',
  'Star Wars',
  'DC / Batman',
  'Acción',
  'Ciencia Ficción',
  'Animación',
  'Terror',
  'Drama',
  'Comedia',
  'Fantasía',
  'Anime',
];

const SERIES_CATEGORIES = [
  'Todas',
  'Marvel',
  'Star Wars',
  'DC / Batman',
  'Acción',
  'Ciencia Ficción',
  'Animación',
  'Drama',
  'Crimen',
  'Fantasía',
  'Anime',
  'Comedia',
];

function makeFallbackPoster(title) {
  const safe = encodeURIComponent((title || 'StreamGlobal').slice(0, 24));
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='600'><rect width='100%' height='100%' fill='%23161b28'/><text x='50%' y='50%' fill='%23e50914' font-family='Arial' font-size='22' font-weight='bold' text-anchor='middle'>${safe}</text></svg>`;
}

export default function CatalogBrowse({ type, user }) {
  const isMovies = type === 'movies';
  const categories = isMovies ? MOVIE_CATEGORIES : SERIES_CATEGORIES;

  const [items, setItems] = useState([]);
  const [savedTitles, setSavedTitles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    api.get('/videos/favorites/me')
      .then(({ data }) => {
        setSavedTitles((data || []).map((v) => v.titulo.toLowerCase()));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSelectedCategory('Todas');
    setSearch('');
  }, [type]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setItems([]);

    const timer = setTimeout(async () => {
      try {
        const endpoint = isMovies ? '/videos/external/movies' : '/videos/external/series';
        const { data } = await api.get(endpoint, {
          params: { q: search, category: selectedCategory },
        });
        if (active) {
          setItems(data.results || []);
        }
      } catch (error) {
        console.error('Error cargando catálogo:', error);
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [type, isMovies, search, selectedCategory]);

  const isSaved = (title) => savedTitles.includes((title || '').toLowerCase());

  const handleToggleFavorite = async (item) => {
    try {
      const { data } = await api.post('/videos/favorites/toggle', {
        titulo: item.titulo,
        descripcion: item.descripcion,
        categoria: item.categoria,
        anio: item.anio,
        duracion: item.duracion,
        thumbnail_url: item.thumbnail_url,
        video_url: item.video_url,
        fuente: item.fuente,
      });

      const key = item.titulo.toLowerCase();
      if (data.saved) {
        setSavedTitles((prev) => (prev.includes(key) ? prev : [...prev, key]));
        setToast(`"${item.titulo}" agregada a Mi Lista.`);
      } else {
        setSavedTitles((prev) => prev.filter((t) => t !== key));
        setToast(`"${item.titulo}" eliminada de Mi Lista.`);
      }
      setTimeout(() => setToast(''), 2500);
    } catch (error) {
      console.error('Error al actualizar Mi Lista:', error);
    }
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
        fuente: item.fuente,
      });
      setToast(`"${item.titulo}" guardada en la base de datos.`);
      setTimeout(() => setToast(''), 3000);
    } catch (error) {
      alert(error.response?.data?.message || 'Error al importar');
    }
  };

  return (
    <div className="container">
      <div className="api-header">
        <div>
          <h1 className="section-title" style={{ margin: 0, fontSize: '1.8rem' }}>
            {isMovies ? 'Catálogo de Películas' : 'Catálogo de Series'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            Selecciona una categoría o escribe para buscar {isMovies ? 'películas' : 'series'} en tiempo real
          </p>
        </div>

        <div className="search-box" style={{ minWidth: '300px' }}>
          <input
            type="text"
            style={{ width: '100%' }}
            placeholder={isMovies ? 'Buscar película en tiempo real...' : 'Buscar serie en tiempo real...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="btn-secondary" onClick={() => setSearch('')}>
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="pills" style={{ marginBottom: '1.5rem' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            className={selectedCategory === cat && !search ? 'pill active' : 'pill'}
            onClick={() => {
              setSearch('');
              setSelectedCategory(cat);
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {toast && <div className="toast-success">{toast}</div>}

      <h2 className="section-title">
        {search
          ? `Buscando "${search}" en tiempo real (${items.length})`
          : `${isMovies ? 'Películas' : 'Series'} • ${selectedCategory} (${items.length})`}
      </h2>

      {loading ? (
        <p className="empty-msg">Cargando {selectedCategory}...</p>
      ) : items.length === 0 ? (
        <p className="empty-msg">No se encontraron resultados para "{search || selectedCategory}".</p>
      ) : (
        <div className="video-grid">
          {items.map((item) => (
            <div key={item.external_id} className="video-card">
              <div className="thumb-box" style={{ height: '330px' }} onClick={() => setSelectedVideo(item)}>
                <img
                  src={item.thumbnail_url}
                  alt={item.titulo}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = makeFallbackPoster(item.titulo);
                  }}
                />
                <div className="play-overlay">▶</div>
              </div>
              <div className="card-body">
                <div className="card-meta">
                  <span>{item.categoria} • {item.anio}</span>
                  <span>⭐ {item.rating}</span>
                </div>
                <h3>{item.titulo}</h3>
                <p>{item.descripcion}</p>
                <div className="card-actions">
                  <button className="btn-primary sm" onClick={() => setSelectedVideo(item)}>
                    ▶ Reproducir
                  </button>
                  <button className="btn-secondary sm" onClick={() => handleToggleFavorite(item)}>
                    {isSaved(item.titulo) ? '✓ En Mi Lista' : '+ Mi Lista'}
                  </button>
                  {user?.rol === 'admin' && (
                    <button className="btn-secondary sm" onClick={() => handleImport(item)}>
                      + BD
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
    </div>
  );
}
