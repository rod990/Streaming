const bcrypt = require('bcryptjs');
const pool = require('./config/db');
require('dotenv').config();

async function seed() {
  try {
    console.log('Poblando base de datos streaming_db con películas y videos funcionales...');

    await pool.query(`
      DROP TABLE IF EXISTS favorites CASCADE;
      DROP TABLE IF EXISTS videos CASCADE;
      DROP TABLE IF EXISTS users CASCADE;

      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(20) NOT NULL DEFAULT 'suscriptor' CHECK (rol IN ('admin', 'suscriptor')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE videos (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(200) NOT NULL,
        descripcion TEXT,
        categoria VARCHAR(80) NOT NULL,
        anio INTEGER DEFAULT 2025,
        duracion VARCHAR(30) DEFAULT '1h 45m',
        thumbnail_url TEXT NOT NULL,
        video_url TEXT NOT NULL,
        fuente VARCHAR(50) DEFAULT 'Catálogo Oficial',
        vistas INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, video_id)
      );
    `);

    const hashedPassword = await bcrypt.hash('123456', 10);

    const usersResult = await pool.query(
      `INSERT INTO users (nombre, email, password, rol) VALUES
        ($1, $2, $3, $4),
        ($5, $6, $7, $8)
       RETURNING id, email, rol`,
      [
        'Administrador Global', 'admin@streaming.cl', hashedPassword, 'admin',
        'Suscriptor Demo', 'usuario@streaming.cl', hashedPassword, 'suscriptor'
      ]
    );

    const titles = [
      { q: 'Avengers Endgame', cat: 'Marvel', video: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4' },
      { q: 'Spider-Man No Way Home', cat: 'Marvel', video: 'https://media.w3.org/2010/05/bunny/trailer.mp4' },
      { q: 'The Batman', cat: 'DC / Batman', video: 'https://media.w3.org/2010/05/video/movie_300.mp4' },
      { q: 'Interstellar', cat: 'Ciencia Ficción', video: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4' },
      { q: 'Dune', cat: 'Ciencia Ficción', video: 'https://media.w3.org/2010/05/bunny/trailer.mp4' },
      { q: 'Toy Story', cat: 'Animación', video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' }
    ];

    for (const item of titles) {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(item.q)}&country=us&media=movie&entity=movie&limit=1`);
      const json = await res.json();
      const m = json.results && json.results[0];

      const titulo = m ? m.trackName : item.q;
      const descripcion = m ? (m.longDescription || m.shortDescription || item.q) : `Película destacada: ${item.q}`;
      const anio = m && m.releaseDate ? new Date(m.releaseDate).getFullYear() : 2024;
      const thumb = m && m.artworkUrl100 ? m.artworkUrl100.replace('100x100bb', '600x600bb') : 'https://static.tvmaze.com/uploads/images/original_untouched/0/2400.jpg';
      const videoUrl = (m && m.previewUrl) ? m.previewUrl : item.video;

      await pool.query(
        `INSERT INTO videos (titulo, descripcion, categoria, anio, duracion, thumbnail_url, video_url, fuente, vistas)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [titulo, descripcion, item.cat, anio, '2h 15m', thumb, videoUrl, 'Catálogo Oficial', Math.floor(Math.random() * 2000) + 500]
      );
    }

    const subUser = usersResult.rows.find((u) => u.rol === 'suscriptor');
    if (subUser) {
      await pool.query('INSERT INTO favorites (user_id, video_id) VALUES ($1, 1), ($1, 2)', [subUser.id]);
    }

    console.log('Base de datos poblada con éxito.');
    process.exit(0);
  } catch (error) {
    console.error('Error ejecutando seeder:', error);
    process.exit(1);
  }
}

seed();
