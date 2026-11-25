import React, { useEffect, useState } from 'react';
import api from '../services/api';

const BACKUP_VIDEO = 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4';

export default function VideoPlayerModal({ video, onClose }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    if (video) {
      setSrc(video.video_url || BACKUP_VIDEO);
      if (video.id && typeof video.id === 'number') {
        api.post(`/videos/${video.id}/view`).catch(() => {});
      }
    }
  }, [video]);

  if (!video) return null;

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
          <video
            key={src}
            src={src}
            poster={video.thumbnail_url}
            controls
            autoPlay
            muted
            playsInline
            onError={() => {
              if (src !== BACKUP_VIDEO) {
                setSrc(BACKUP_VIDEO);
              }
            }}
          />
        </div>

        <p className="modal-desc">{video.descripcion}</p>
      </div>
    </div>
  );
}
