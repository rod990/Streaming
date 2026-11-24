const bcrypt = require('bcryptjs');
const pool = require('./config/db');
require('dotenv').config();

async function seed() {
  try {
    console.log('Creando tablas en streaming_db...');

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
        'Tears of Steel',
        'En un futuro distópico en Ámsterdam, un grupo de guerreros y científicos intenta salvar el mundo de robots gigantes.',
        'Ciencia Ficción',
        2024,
        '12 min',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Tears_of_Steel_poster.jpg/640px-Tears_of_Steel_poster.jpg',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        'Blender Studios',
        1420
      ],
      [
        'Sintel',
        'Una joven guerrera emprende un peligroso viaje por tierras heladas para rescatar a Scales, su pequeño dragón amigo.',
        'Fantasía',
        2023,
        '15 min',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Sintel_poster.jpg/640px-Sintel_poster.jpg',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        'Blender Studios',
        980
      ],
      [
        'Big Buck Bunny',
        'Un conejo gigante y pacífico decide darle una lección inolvidable a tres roedores que molestan a los animales del bosque.',
        'Animación',
        2023,
        '10 min',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/640px-Big_buck_bunny_poster_big.jpg',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'Blender Studios',
        2150
      ],
      [
        'Elephants Dream',
        'Dos personajes exploran una máquina surrealista e infinita donde cada habitación desafía la lógica.',
        'Ciencia Ficción',
        2022,
        '11 min',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Elephants_Dream_s5_both.jpg/640px-Elephants_Dream_s5_both.jpg',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        'Orange Open Movie',
        640
      ],
      [
        'For Bigger Blazes',
        'Acción de alta velocidad y cinematografía extrema en escenarios naturales.',
        'Acción',
        2025,
        '15 seg',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        'Catálogo Oficial',
        510
      ],
      [
        'For Bigger Escapes',
        'Una aventura cinematográfica pensada para pantallas de alta definición.',
        'Aventura',
        2025,
        '15 seg',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        'Catálogo Oficial',
        430
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

    console.log('Base de datos poblada correctamente.');
    console.log('Admin: admin@streaming.cl / 123456');
    console.log('Suscriptor: usuario@streaming.cl / 123456');
    process.exit(0);
  } catch (error) {
    console.error('Error ejecutando seeder:', error);
    process.exit(1);
  }
}

seed();
