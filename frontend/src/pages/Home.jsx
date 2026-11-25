import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import VideoPlayerModal from '../components/VideoPlayerModal';

const HOME_CATEGORIES = ['Todas', 'Marvel', 'Star Wars', 'DC / Batman', 'Acción', 'Ciencia Ficción', 'Animación', 'Drama', 'Fantasía', 'Anime'];

function makeFallbackPoster(title) {
  const safe = encodeURIComponent((title || 'StreamGlobal').slice(0, 24));
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='600'><rect width='100%' height='100%' fill='%23161b28'/><text x='50%' y='50%' fill='%23e50914' font-family='Arial' font-size='22' font-weight='bold' text-anchor='middle'>${safe}</text></svg>`;
}

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [savedTitles, setSavedTitles] = useState([]);
  const [category, setCategory] = useState('Todas');
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
    let active = true;
    setLoading(true);
    setMovies([]);
    setSeries([]);

    const timer = setTimeout(async () => {
      try {
        const [movRes, serRes] = await Promise.all([
          api.get('/videos/external/movies', { params: { q: search, category } }),
          api.get('/videos/external/series', { params: { q: search, category } }),
        ]);
        if (active) {
          setMovies((movRes.data.results || []).slice(0, 8));
          setSeries((serRes.data.results || []).slice(0, 8));
        }
      } catch (error) {
        console.error('Error cargando inicio:', error);
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, category]);

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

  const featured = movies[0] || series[0];

  return (
    <div className="container">
      {featured && (
        <section
          className="hero"
          style={{
            backgroundImage: `linear-gradient(to right, #0b0d13 42%, rgba(11,13,19,0.2)), url(${featured.thumbnail_url})`,
          }}
        >
          <div className="hero-content">
            <span className="tag">Destacado • {featured.tipo} • {featured.categoria}</span>
            <h1>{featured.titulo}</h1>
            <p>{featured.descripcion}</p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => setSelectedVideo(featured)}>
                ▶ Reproducir ahora
              </button>
              <button className="btn-secondary" onClick={() => handleToggleFavorite(featured)}>
                {isSaved(featured.titulo) ? '✓ En Mi Lista' : '+ Mi Lista'}
              </button>
              <Link to="/peliculas" className="btn-secondary" style={{ textDecoration: 'none' }}>
                Películas
              </Link>
              <Link to="/series" className="btn-secondary" style={{ textDecoration: 'none' }}>
                Series
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="filters-bar">
        <div className="pills">
          {HOME_CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={category === cat && !search ? 'pill active' : 'pill'}
              onClick={() => {
                setSearch('');
                setCategory(cat);
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="search-box" style={{ minWidth: '290px' }}>
          <input
            type="text"
            style={{ width: '100%' }}
            placeholder="Buscar películas o series en tiempo real..."
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

      {toast && <div className="toast-success">{toast}</div>}

      {loading ? (
        <p className="empty-msg">Cargando {category === 'Todas' ? 'recomendaciones' : category}...</p>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="section-title">
              {search ? `Películas: "${search}"` : `Películas • ${category}`} ({movies.length})
            </h2>
            <Link to="/peliculas" style={{ color: '#f87171', textDecoration: 'none', fontSize: '0.9rem' }}>
              Ver todas las películas →
            </Link>
          </div>
          <div className="video-grid">
            {movies.map((movie) => (
              <div key={movie.external_id} className="video-card">
                <div className="thumb-box" style={{ height: '320px' }} onClick={() => setSelectedVideo(movie)}>
                  <img
                    src={movie.thumbnail_url}
                    alt={movie.titulo}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = makeFallbackPoster(movie.titulo);
                    }}
                  />
                  <div className="play-overlay">▶</div>
                </div>
                <div className="card-body">
                  <div className="card-meta">
                    <span>{movie.categoria} • {movie.anio}</span>
                    <span>⭐ {movie.rating}</span>
                  </div>
                  <h3>{movie.titulo}</h3>
                  <p>{movie.descripcion}</p>
                  <div className="card-actions">
                    <button className="btn-primary sm" onClick={() => setSelectedVideo(movie)}>
                      ▶ Reproducir
                    </button>
                    <button className="btn-secondary sm" onClick={() => handleToggleFavorite(movie)}>
                      {isSaved(movie.titulo) ? '✓ En Mi Lista' : '+ Mi Lista'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.5rem' }}>
            <h2 className="section-title">
              {search ? `Series: "${search}"` : `Series • ${category}`} ({series.length})
            </h2>
            <Link to="/series" style={{ color: '#f87171', textDecoration: 'none', fontSize: '0.9rem' }}>
              Ver todas las series →
            </Link>
          </div>
          <div className="video-grid">
            {series.map((serie) => (
              <div key={serie.external_id} className="video-card">
                <div className="thumb-box" style={{ height: '320px' }} onClick={() => setSelectedVideo(serie)}>
                  <img
                    src={serie.thumbnail_url}
                    alt={serie.titulo}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = makeFallbackPoster(serie.titulo);
                    }}
                  />
                  <div className="play-overlay">▶</div>
                </div>
                <div className="card-body">
                  <div className="card-meta">
                    <span>{serie.categoria} • {serie.anio}</span>
                    <span>⭐ {serie.rating}</span>
                  </div>
                  <h3>{serie.titulo}</h3>
                  <p>{serie.descripcion}</p>
                  <div className="card-actions">
                    <button className="btn-primary sm" onClick={() => setSelectedVideo(serie)}>
                      ▶ Reproducir
                    </button>
                    <button className="btn-secondary sm" onClick={() => handleToggleFavorite(serie)}>
                      {isSaved(serie.titulo) ? '✓ En Mi Lista' : '+ Mi Lista'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
    </div>
  );
}
