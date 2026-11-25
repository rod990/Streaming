import React, { useEffect, useState } from 'react';
import api from '../services/api';
import VideoPlayerModal from '../components/VideoPlayerModal';

const TEMAS_RAPIDOS = ['Recomendadas', 'Marvel', 'Star Wars', 'Pixar', 'Batman', 'Dune', 'Harry Potter'];

export default function Home({ user }) {
  const [movies, setMovies] = useState([]);
  const [localVideos, setLocalVideos] = useState([]);
  const [favoritesIds, setFavoritesIds] = useState([]);
  const [activeTopic, setActiveTopic] = useState('Recomendadas');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [toast, setToast] = useState('');

  const loadRecommended = async () => {
    setLoading(true);
    try {
      const [recRes, localRes, favRes] = await Promise.all([
        api.get('/videos/external/recommended'),
        api.get('/videos'),
        api.get('/videos/favorites/me'),
      ]);
      setMovies(recRes.data.results || []);
      setLocalVideos(localRes.data || []);
      setFavoritesIds((favRes.data || []).map((f) => f.id));
    } catch (error) {
      console.error('Error cargando películas:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchMoviesApi = async (term) => {
    if (!term.trim()) {
      setActiveTopic('Recomendadas');
      loadRecommended();
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/videos/external/search', {
        params: { q: term },
      });
      setMovies(data.results || []);
    } catch (error) {
      console.error('Error buscando en API:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommended();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveTopic(search.trim() ? `Resultados: "${search}"` : 'Recomendadas');
    searchMoviesApi(search);
  };

  const handleTopicClick = (topic) => {
    setActiveTopic(topic);
    if (topic === 'Recomendadas') {
      setSearch('');
      loadRecommended();
    } else {
      setSearch(topic);
      searchMoviesApi(topic);
    }
  };

  const handleSaveToCatalog = async (movie) => {
    try {
      await api.post('/videos', {
        titulo: movie.titulo,
        descripcion: movie.descripcion,
        categoria: movie.categoria,
        anio: movie.anio,
        duracion: movie.duracion,
        thumbnail_url: movie.thumbnail_url,
        video_url: movie.video_url,
        fuente: 'API Películas',
      });
      setToast(`"${movie.titulo}" agregada al catálogo de la plataforma.`);
      setTimeout(() => setToast(''), 3000);
      const localRes = await api.get('/videos');
      setLocalVideos(localRes.data || []);
    } catch (error) {
      alert(error.response?.data?.message || 'Error al guardar película');
    }
  };

  const toggleFavorite = async (videoId) => {
    try {
      const { data } = await api.post(`/videos/favorites/${videoId}`);
      if (data.saved) {
        setFavoritesIds([...favoritesIds, videoId]);
      } else {
        setFavoritesIds(favoritesIds.filter((id) => id !== videoId));
      }
    } catch (error) {
      console.error('Error en Mi Lista:', error);
    }
  };

  const featured = movies[0];

  return (
    <div className="container">
      {featured && (
        <section
          className="hero"
          style={{
            backgroundImage: `linear-gradient(to right, #0b0d13 38%, rgba(11,13,19,0.25)), url(${featured.thumbnail_url})`,
          }}
        >
          <div className="hero-content">
            <span className="tag">Destacada • {featured.categoria} ({featured.anio})</span>
            <h1>{featured.titulo}</h1>
            <p>{featured.descripcion}</p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => setSelectedVideo(featured)}>
                ▶ Ver tráiler ahora
              </button>
              {user?.rol === 'admin' && (
                <button className="btn-secondary" onClick={() => handleSaveToCatalog(featured)}>
                  + Guardar en Catálogo BD
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="filters-bar">
        <div className="pills">
          {TEMAS_RAPIDOS.map((topic) => (
            <button
              key={topic}
              className={activeTopic === topic ? 'pill active' : 'pill'}
              onClick={() => handleTopicClick(topic)}
            >
              {topic}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="search-box">
          <input
            type="text"
            placeholder="Buscar películas en la API..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-primary">Buscar</button>
        </form>
      </div>

      {toast && <div className="toast-success">{toast}</div>}

      <h2 className="section-title">
        {activeTopic === 'Recomendadas' ? 'Películas Recomendadas para Ti' : activeTopic} ({movies.length})
      </h2>

      {loading ? (
        <p className="empty-msg">Cargando películas desde la API...</p>
      ) : movies.length === 0 ? (
        <p className="empty-msg">No se encontraron películas para "{search}".</p>
      ) : (
        <div className="video-grid">
          {movies.map((movie) => (
            <div key={movie.external_id} className="video-card">
              <div className="thumb-box poster-box" onClick={() => setSelectedVideo(movie)}>
                <img src={movie.thumbnail_url} alt={movie.titulo} />
                <div className="play-overlay">▶</div>
              </div>
              <div className="card-body">
                <div className="card-meta">
                  <span>{movie.categoria} • {movie.anio}</span>
                  <span>{movie.duracion}</span>
                </div>
                <h3>{movie.titulo}</h3>
                <p>{movie.descripcion}</p>
                <div className="card-actions">
                  <button className="btn-primary sm" onClick={() => setSelectedVideo(movie)}>
                    ▶ Reproducir
                  </button>
                  {user?.rol === 'admin' && (
                    <button className="btn-secondary sm" onClick={() => handleSaveToCatalog(movie)}>
                      + Importar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {localVideos.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginTop: '2.8rem' }}>
            Catálogo Guardado en Base de Datos ({localVideos.length})
          </h2>
          <div className="video-grid">
            {localVideos.map((video) => (
              <div key={video.id} className="video-card">
                <div className="thumb-box" onClick={() => setSelectedVideo(video)}>
                  <img src={video.thumbnail_url} alt={video.titulo} />
                  <div className="play-overlay">▶</div>
                </div>
                <div className="card-body">
                  <div className="card-meta">
                    <span>{video.categoria}</span>
                    <span>👁 {video.vistas}</span>
                  </div>
                  <h3>{video.titulo}</h3>
                  <p>{video.descripcion}</p>
                  <div className="card-actions">
                    <button className="btn-primary sm" onClick={() => setSelectedVideo(video)}>
                      Ver ahora
                    </button>
                    <button className="btn-secondary sm" onClick={() => toggleFavorite(video.id)}>
                      {favoritesIds.includes(video.id) ? '✓ En Mi Lista' : '+ Mi Lista'}
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
