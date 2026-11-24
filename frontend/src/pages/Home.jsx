import React, { useEffect, useState } from 'react';
import api from '../services/api';
import VideoPlayerModal from '../components/VideoPlayerModal';

const CATEGORIAS = ['Todas', 'Ciencia Ficción', 'Fantasía', 'Animación', 'Acción', 'Aventura'];

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [favoritesIds, setFavoritesIds] = useState([]);
  const [categoria, setCategoria] = useState('Todas');
  const [search, setSearch] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);

  const loadData = async () => {
    try {
      const [vidRes, favRes] = await Promise.all([
        api.get('/videos', { params: { categoria, search } }),
        api.get('/videos/favorites/me'),
      ]);
      setVideos(vidRes.data);
      setFavoritesIds(favRes.data.map((f) => f.id));
    } catch (error) {
      console.error('Error cargando catálogo:', error);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [categoria]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
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
      console.error('Error guardando favorito:', error);
    }
  };

  const featured = videos[0];

  return (
    <div className="container">
      {featured && (
        <section
          className="hero"
          style={{ backgroundImage: `linear-gradient(to right, #0b0d13 35%, rgba(11,13,19,0.3)), url(${featured.thumbnail_url})` }}
        >
          <div className="hero-content">
            <span className="tag">{featured.categoria} • {featured.fuente}</span>
            <h1>{featured.titulo}</h1>
            <p>{featured.descripcion}</p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => setSelectedVideo(featured)}>
                ▶ Reproducir ahora
              </button>
              <button className="btn-secondary" onClick={() => toggleFavorite(featured.id)}>
                {favoritesIds.includes(featured.id) ? '✓ En Mi Lista' : '+ Mi Lista'}
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="filters-bar">
        <div className="pills">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              className={categoria === cat ? 'pill active' : 'pill'}
              onClick={() => setCategoria(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="search-box">
          <input
            type="text"
            placeholder="Buscar en el catálogo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-primary">Buscar</button>
        </form>
      </div>

      <h2 className="section-title">Catálogo Disponible ({videos.length})</h2>
      <div className="video-grid">
        {videos.map((video) => (
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
                  {favoritesIds.includes(video.id) ? '✓ Guardado' : '+ Mi Lista'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
    </div>
  );
}
