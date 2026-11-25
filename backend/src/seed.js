const bcrypt = require('bcryptjs');
const pool = require('./config/db');
require('dotenv').config();

async function seed() {
  try {
    console.log('Creando tablas y cargando pósteres reales en streaming_db...');

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

    const videosData = [
      [
        'Stranger Things',
        'Cuando un niño desaparece, un pequeño pueblo descubre un misterio que involucra experimentos secretos y fuerzas sobrenaturales.',
        'Ciencia Ficción',
        2022,
        '55 min',
        'https://static.tvmaze.com/uploads/images/original_untouched/396/991288.jpg',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        'Catálogo Oficial',
        2450
      ],
      [
        'The Last of Us',
        'Veinte años después de la destrucción de la civilización moderna, Joel es contratado para sacar a Ellie de una zona de cuarentena.',
        'Drama',
        2023,
        '60 min',
        'https://static.tvmaze.com/uploads/images/original_untouched/444/1111710.jpg',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        'Catálogo Oficial',
        1980
      ],
      [
        'Breaking Bad',
        'Un profesor de química diagnosticado con cáncer de pulmón se asocia con un exalumno para asegurar el futuro de su familia.',
        'Crimen',
        2013,
        '48 min',
        'https://static.tvmaze.com/uploads/images/original_untouched/0/2400.jpg',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'Catálogo Oficial',
        3120
      ],
      [
        'The Mandalorian',
        'Un cazarrecompensas solitario en los confines de la galaxia protege a una misteriosa criatura perseguida por remanentes imperiales.',
        'Aventura',
        2023,
        '45 min',
        'https://static.tvmaze.com/uploads/images/original_untouched/448/1121792.jpg',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        'Catálogo Oficial',
        1760
      ],
      [
        'The Witcher',
        'Geralt de Rivia, un cazador de monstruos mutado, lucha por encontrar su lugar en un mundo donde las personas son más perversas que las bestias.',
        'Fantasía',
        2023,
        '58 min',
        'https://static.tvmaze.com/uploads/images/original_untouched/463/1158625.jpg',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        'Catálogo Oficial',
        1540
      ],
      [
        'Arcane',
        'En medio del conflicto entre las ciudades gemelas de Piltover y Zaun, dos hermanas luchan en bandos opuestos de una guerra tecnológica.',
        'Animación',
        2024,
        '42 min',
        'https://static.tvmaze.com/uploads/images/original_untouched/542/1356295.jpg',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        'Catálogo Oficial',
        2890
      ]
    ];

    for (const v of videosData) {
      await pool.query(
        `INSERT INTO videos (titulo, descripcion, categoria, anio, duracion, thumbnail_url, video_url, fuente, vistas)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        v
      );
    }

    const subUser = usersResult.rows.find((u) => u.rol === 'suscriptor');
    if (subUser) {
      await pool.query('INSERT INTO favorites (user_id, video_id) VALUES ($1, 1), ($1, 3)', [subUser.id]);
    }

    console.log('Base de datos actualizada con pósteres reales.');
    process.exit(0);
  } catch (error) {
    console.error('Error ejecutando seeder:', error);
    process.exit(1);
  }
}

seed();
