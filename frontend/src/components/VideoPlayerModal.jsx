import React, { useEffect } from 'react';
import api from '../services/api';

export default function VideoPlayerModal({ video, onClose }) {
  useEffect(() => {
    if (video?.id) {
      api.post(`/videos/${video.id}/view`).catch(() => {});
    }
  }, [video]);

  if (!video) return null;

  const isYouTube =
    video.video_url.includes('youtube.com') || video.video_url.includes('youtu.be');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-player" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{video.titulo}</h3>
            <small>{video.categoria} • {video.anio} • {video.duracion}</small>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="player-wrapper">
          {isYouTube ? (
            <iframe
              src={video.video_url}
              title={video.titulo}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <video src={video.video_url} controls autoPlay playsInline />
          )}
        </div>

        <p className="modal-desc">{video.descripcion}</p>
      </div>
    </div>
  );
}
