import React, { useEffect, useState } from 'react';
import api from '../services/api';
import VideoPlayerModal from '../components/VideoPlayerModal';

export default function MyList() {
  const [favorites, setFavorites] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const loadFavorites = async () => {
    const { data } = await api.get('/videos/favorites/me');
    setFavorites(data);
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const removeFavorite = async (id) => {
    await api.post(`/videos/favorites/${id}`);
    setFavorites(favorites.filter((v) => v.id !== id));
  };

  return (
    <div className="container">
      <h1 className="section-title">Mi Lista Personal ({favorites.length})</h1>
      {favorites.length === 0 ? (
        <p className="empty-msg">Aún no has guardado títulos en tu lista.</p>
      ) : (
        <div className="video-grid">
          {favorites.map((video) => (
            <div key={video.id} className="video-card">
              <div className="thumb-box" onClick={() => setSelectedVideo(video)}>
                <img src={video.thumbnail_url} alt={video.titulo} />
                <div className="play-overlay">▶</div>
              </div>
              <div className="card-body">
                <h3>{video.titulo}</h3>
                <p>{video.descripcion}</p>
                <div className="card-actions">
                  <button className="btn-primary sm" onClick={() => setSelectedVideo(video)}>
                    Ver ahora
                  </button>
                  <button className="btn-danger sm" onClick={() => removeFavorite(video.id)}>
                    Quitar
                  </button>
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
