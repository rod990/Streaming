const express = require('express');
const pool = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

const REAL_STREAMS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://media.w3.org/2010/05/sintel/trailer_hd.mp4',
  'https://media.w3.org/2010/05/bunny/trailer.mp4'
];

const MOVIE_CATEGORY_TERMS = {
  Todas: 'spider-man',
  Marvel: 'avengers',
  'Star Wars': 'star wars',
  'DC / Batman': 'batman',
  Acción: 'john wick',
  'Ciencia Ficción': 'interstellar',
  Animación: 'toy story',
  Terror: 'conjuring',
  Drama: 'oppenheimer',
  Comedia: 'deadpool',
  Fantasía: 'harry potter',
  Anime: 'spirited away'
};

const SERIES_CATEGORY_TERMS = {
  Todas: 'stranger things',
  Marvel: 'daredevil',
  'Star Wars': 'mandalorian',
  'DC / Batman': 'gotham',
  Acción: 'the boys',
  'Ciencia Ficción': 'black mirror',
  Animación: 'arcane',
  Drama: 'breaking bad',
  Crimen: 'peaky blinders',
  Fantasía: 'the witcher',
  Anime: 'attack on titan',
  Comedia: 'the office'
};

const SERIES_FALLBACK_BY_CAT = {
  Todas: [
    { id: 's-all-1', titulo: 'Stranger Things', cat: 'Ciencia Ficción', anio: 2016, rating: '8.7', img: 'https://static.tvmaze.com/uploads/images/original_untouched/396/991288.jpg', desc: 'Un grupo de amigos descubre experimentos secretos y fuerzas sobrenaturales en Hawkins.' },
    { id: 's-all-2', titulo: 'The Last of Us', cat: 'Drama', anio: 2023, rating: '8.8', img: 'https://static.tvmaze.com/uploads/images/original_untouched/444/1111710.jpg', desc: 'Joel y Ellie cruzan un país devastado por una pandemia fúngica.' },
    { id: 's-all-3', titulo: 'Breaking Bad', cat: 'Crimen', anio: 2008, rating: '9.5', img: 'https://static.tvmaze.com/uploads/images/original_untouched/0/2400.jpg', desc: 'Un profesor de química se transforma en un imperio del crimen en Nuevo México.' },
    { id: 's-all-4', titulo: 'The Mandalorian', cat: 'Star Wars', anio: 2019, rating: '8.7', img: 'https://static.tvmaze.com/uploads/images/original_untouched/448/1121792.jpg', desc: 'Un cazarrecompensas solitario protege a Grogu en los confines de la galaxia.' }
  ],
  Marvel: [
    { id: 's-mar-1', titulo: 'Daredevil', cat: 'Marvel', anio: 2015, rating: '8.6', img: 'https://static.tvmaze.com/uploads/images/original_untouched/168/420420.jpg', desc: 'Matt Murdock lucha contra el crimen en Hell’s Kitchen de día como abogado y de noche como vigilante.' },
    { id: 's-mar-2', titulo: 'Loki', cat: 'Marvel', anio: 2021, rating: '8.2', img: 'https://static.tvmaze.com/uploads/images/original_untouched/480/1200478.jpg', desc: 'El Dios del Engaño altera la línea temporal tras escapar con el Teseracto.' },
    { id: 's-mar-3', titulo: 'WandaVision', cat: 'Marvel', anio: 2021, rating: '7.9', img: 'https://static.tvmaze.com/uploads/images/original_untouched/291/728748.jpg', desc: 'Wanda Maximoff y Vision viven una vida ideal en los suburbios que esconde un misterio.' },
    { id: 's-mar-4', titulo: 'The Punisher', cat: 'Marvel', anio: 2017, rating: '8.5', img: 'https://static.tvmaze.com/uploads/images/original_untouched/179/448935.jpg', desc: 'Frank Castle busca justicia implacable tras el asesinato de su familia.' }
  ],
  'Star Wars': [
    { id: 's-sw-1', titulo: 'The Mandalorian', cat: 'Star Wars', anio: 2019, rating: '8.7', img: 'https://static.tvmaze.com/uploads/images/original_untouched/448/1121792.jpg', desc: 'Aventuras de Din Djarin tras la caída del Imperio Galáctico.' },
    { id: 's-sw-2', titulo: 'Andor', cat: 'Star Wars', anio: 2022, rating: '8.4', img: 'https://static.tvmaze.com/uploads/images/original_untouched/421/1054032.jpg', desc: 'El origen de la Alianza Rebelde contado a través de Cassian Andor.' },
    { id: 's-sw-3', titulo: 'Ahsoka', cat: 'Star Wars', anio: 2023, rating: '7.6', img: 'https://static.tvmaze.com/uploads/images/original_untouched/473/1183948.jpg', desc: 'La ex caballero Jedi investiga una amenaza emergente para la Nueva República.' },
    { id: 's-sw-4', titulo: 'Obi-Wan Kenobi', cat: 'Star Wars', anio: 2022, rating: '7.1', img: 'https://static.tvmaze.com/uploads/images/original_untouched/406/1016455.jpg', desc: 'Diez años después de La Venganza de los Sith, Kenobi vela por el joven Luke Skywalker.' }
  ],
  Crimen: [
    { id: 's-cr-1', titulo: 'Peaky Blinders', cat: 'Crimen', anio: 2013, rating: '8.8', img: 'https://static.tvmaze.com/uploads/images/original_untouched/48/122213.jpg', desc: 'La familia Shelby lidera una banda criminal en Birmingham tras la Primera Guerra Mundial.' },
    { id: 's-cr-2', titulo: 'Narcos', cat: 'Crimen', anio: 2015, rating: '8.8', img: 'https://static.tvmaze.com/uploads/images/original_untouched/166/415313.jpg', desc: 'La historia real del ascenso y caída de los cárteles de la droga en Colombia.' },
    { id: 's-cr-3', titulo: 'Better Call Saul', cat: 'Crimen', anio: 2015, rating: '9.0', img: 'https://static.tvmaze.com/uploads/images/original_untouched/404/1010539.jpg', desc: 'La transformación del abogado Jimmy McGill en el astuto Saul Goodman.' },
    { id: 's-cr-4', titulo: 'Mindhunter', cat: 'Crimen', anio: 2017, rating: '8.6', img: 'https://static.tvmaze.com/uploads/images/original_untouched/207/519904.jpg', desc: 'Agentes del FBI entrevistan asesinos en serie para crear perfiles psicológicos.' }
  ],
  Fantasía: [
    { id: 's-fa-1', titulo: 'The Witcher', cat: 'Fantasía', anio: 2019, rating: '8.0', img: 'https://static.tvmaze.com/uploads/images/original_untouched/463/1158625.jpg', desc: 'Geralt de Rivia caza monstruos en un continente dividido por la guerra y la magia.' },
    { id: 's-fa-2', titulo: 'House of the Dragon', cat: 'Fantasía', anio: 2022, rating: '8.4', img: 'https://static.tvmaze.com/uploads/images/original_untouched/521/1304453.jpg', desc: 'La guerra civil dentro de la Casa Targaryen doscientos años antes de Game of Thrones.' },
    { id: 's-fa-3', titulo: 'Game of Thrones', cat: 'Fantasía', anio: 2011, rating: '9.2', img: 'https://static.tvmaze.com/uploads/images/original_untouched/190/476117.jpg', desc: 'Nueve familias nobles luchan por el control de las tierras de Poniente.' },
    { id: 's-fa-4', titulo: 'Shadow and Bone', cat: 'Fantasía', anio: 2021, rating: '7.6', img: 'https://static.tvmaze.com/uploads/images/original_untouched/449/1123446.jpg', desc: 'Una joven cartógrafa descubre un poder mágico capaz de unir su mundo.' }
  ],
  Anime: [
    { id: 's-an-1', titulo: 'Attack on Titan', cat: 'Anime', anio: 2013, rating: '9.1', img: 'https://static.tvmaze.com/uploads/images/original_untouched/314/786875.jpg', desc: 'La humanidad lucha por sobrevivir dentro de murallas gigantes frente a los titanes.' },
    { id: 's-an-2', titulo: 'Death Note', cat: 'Anime', anio: 2006, rating: '8.9', img: 'https://static.tvmaze.com/uploads/images/original_untouched/1/2826.jpg', desc: 'Un estudiante encuentra un cuaderno sobrenatural capaz de acabar con la vida de quien sea escrito en él.' },
    { id: 's-an-3', titulo: 'Jujutsu Kaisen', cat: 'Anime', anio: 2020, rating: '8.6', img: 'https://static.tvmaze.com/uploads/images/original_untouched/467/1169546.jpg', desc: 'Yuji Itadori se une a una organización secreta de hechiceros para eliminar maldiciones.' },
    { id: 's-an-4', titulo: 'Demon Slayer', cat: 'Anime', anio: 2019, rating: '8.6', img: 'https://static.tvmaze.com/uploads/images/original_untouched/514/1285459.jpg', desc: 'Tanjiro Kamado emprende un viaje para salvar a su hermana y derrotar demonios.' }
  ]
};

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>?/gm, '').trim();
}

async function fetchJsonWithTimeout(url, timeoutMs = 6000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'StreamGlobal/2.0' }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  } finally {
    clearTimeout(id);
  }
}

async function queryMoviesFromApis(term, categoryLabel) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=us&media=movie&entity=movie&limit=20`;
  const itunesData = await fetchJsonWithTimeout(url);

  const results = [];
  const seenTitles = new Set();

  if (itunesData && Array.isArray(itunesData.results)) {
    itunesData.results.forEach((item, idx) => {
      if (!item.trackName || !item.artworkUrl100) return;
      // Filtrar clips demasiado cortos o paquetes raros
      if (item.trackTimeMillis && item.trackTimeMillis < 3600000) return;

      const key = item.trackName.toLowerCase();
      if (seenTitles.has(key)) return;
      seenTitles.add(key);

      results.push({
        id: `mov-${categoryLabel}-${item.trackId}`,
        external_id: `mov-${categoryLabel}-${item.trackId}`,
        tipo: 'Película',
        titulo: item.trackName,
        descripcion: item.longDescription || item.shortDescription || `Película disponible en StreamGlobal: ${item.trackName}.`,
        categoria: categoryLabel !== 'Todas' ? categoryLabel : (item.primaryGenreName || 'Cine'),
        anio: item.releaseDate ? new Date(item.releaseDate).getFullYear() : 2024,
        duracion: item.trackTimeMillis ? `${Math.round(item.trackTimeMillis / 60000)} min` : 'HD',
        thumbnail_url: item.artworkUrl100.replace('100x100bb', '600x600bb'),
        video_url: item.previewUrl || REAL_STREAMS[idx % REAL_STREAMS.length],
        rating: (7.6 + ((idx % 18) / 10)).toFixed(1),
        fuente: 'API Películas'
      });
    });
  }

  return results;
}

async function querySeriesFromApis(term, categoryLabel) {
  const url = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(term)}`;
  const tvmazeData = await fetchJsonWithTimeout(url);

  const results = [];
  const seenTitles = new Set();

  if (Array.isArray(tvmazeData)) {
    tvmazeData.forEach((entry, idx) => {
      const show = entry.show;
      if (!show || !show.name || !show.image) return;
      const poster = show.image.original || show.image.medium;
      if (!poster) return;

      const key = show.name.toLowerCase();
      if (seenTitles.has(key)) return;
      seenTitles.add(key);

      results.push({
        id: `ser-${categoryLabel}-${show.id}`,
        external_id: `ser-${categoryLabel}-${show.id}`,
        tipo: 'Serie',
        titulo: show.name,
        descripcion: stripHtml(show.summary) || `Serie destacada en StreamGlobal: ${show.name}.`,
        categoria: categoryLabel !== 'Todas' ? categoryLabel : (show.genres?.[0] || 'Serie'),
        anio: show.premiered ? Number(show.premiered.slice(0, 4)) : 2024,
        duracion: show.runtime ? `${show.runtime} min/ep` : 'Temporadas HD',
        thumbnail_url: poster,
        video_url: REAL_STREAMS[idx % REAL_STREAMS.length],
        rating: show.rating?.average || (8.1 + ((idx % 14) / 10)).toFixed(1),
        fuente: 'TVmaze API'
      });
    });
  }

  if (results.length === 0) {
    const fallbackList = SERIES_FALLBACK_BY_CAT[categoryLabel] || SERIES_FALLBACK_BY_CAT.Todas;
    return fallbackList.map((s, idx) => ({
      id: s.id,
      external_id: s.id,
      tipo: 'Serie',
      titulo: s.titulo,
      descripcion: s.desc,
      categoria: s.cat,
      anio: s.anio,
      duracion: 'Temporadas HD',
      thumbnail_url: s.img,
      video_url: REAL_STREAMS[idx % REAL_STREAMS.length],
      rating: s.rating,
      fuente: 'Catálogo Series'
    }));
  }

  return results;
}

// GET /api/videos/external/movies?q=&category=
router.get('/external/movies', verifyToken, async (req, res) => {
  const { q = '', category = 'Todas' } = req.query;
  const searchTerm = q.trim() ? q.trim() : (MOVIE_CATEGORY_TERMS[category] || category);
  const results = await queryMoviesFromApis(searchTerm, category);
  res.json({ results });
});

// GET /api/videos/external/series?q=&category=
router.get('/external/series', verifyToken, async (req, res) => {
  const { q = '', category = 'Todas' } = req.query;
  const searchTerm = q.trim() ? q.trim() : (SERIES_CATEGORY_TERMS[category] || category);
  const results = await querySeriesFromApis(searchTerm, category);
  res.json({ results });
});

// GET /api/videos/favorites/me
router.get('/favorites/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.* FROM videos v
       INNER JOIN favorites f ON f.video_id = v.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener favoritos' });
  }
});

// POST /api/videos/favorites/:videoId
router.post('/favorites/:videoId', verifyToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    const exists = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND video_id = $2',
      [req.user.id, videoId]
    );

    if (exists.rows.length > 0) {
      await pool.query('DELETE FROM favorites WHERE user_id = $1 AND video_id = $2', [req.user.id, videoId]);
      return res.json({ saved: false, message: 'Eliminado de Mi Lista' });
    } else {
      await pool.query('INSERT INTO favorites (user_id, video_id) VALUES ($1, $2)', [req.user.id, videoId]);
      return res.json({ saved: true, message: 'Agregado a Mi Lista' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar Mi Lista' });
  }
});

// GET /api/videos/admin/stats
router.get('/admin/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const totalVideos = await pool.query('SELECT COUNT(*) FROM videos');
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const totalViews = await pool.query('SELECT COALESCE(SUM(vistas), 0) AS sum FROM videos');
    const totalFavs = await pool.query('SELECT COUNT(*) FROM favorites');

    res.json({
      totalVideos: Number(totalVideos.rows[0].count),
      totalUsers: Number(totalUsers.rows[0].count),
      totalViews: Number(totalViews.rows[0].sum),
      totalFavorites: Number(totalFavs.rows[0].count),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
});

// GET /api/videos
router.get('/', verifyToken, async (req, res) => {
  try {
    const { categoria, search } = req.query;
    let query = 'SELECT * FROM videos WHERE 1=1';
    const params = [];

    if (categoria && categoria !== 'Todas') {
      params.push(categoria);
      query += ` AND categoria = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (titulo ILIKE $${params.length} OR descripcion ILIKE $${params.length})`;
    }

    query += ' ORDER BY id DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al listar videos' });
  }
});

// POST /api/videos
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { titulo, descripcion, categoria, anio, duracion, thumbnail_url, video_url, fuente } = req.body;
    if (!titulo || !video_url) {
      return res.status(400).json({ message: 'Título y URL del video son obligatorios' });
    }

    const result = await pool.query(
      `INSERT INTO videos (titulo, descripcion, categoria, anio, duracion, thumbnail_url, video_url, fuente)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        titulo,
        descripcion || '',
        categoria || 'General',
        anio || 2025,
        duracion || '1h 30m',
        thumbnail_url,
        video_url,
        fuente || 'Panel Admin',
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear video' });
  }
});

// PUT /api/videos/:id
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, categoria, anio, duracion, thumbnail_url, video_url } = req.body;

    const result = await pool.query(
      `UPDATE videos
       SET titulo=$1, descripcion=$2, categoria=$3, anio=$4, duracion=$5, thumbnail_url=$6, video_url=$7
       WHERE id=$8 RETURNING *`,
      [titulo, descripcion, categoria, anio, duracion, thumbnail_url, video_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Video no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar video' });
  }
});

// DELETE /api/videos/:id
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM videos WHERE id = $1', [id]);
    res.json({ message: 'Video eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar video' });
  }
});

// POST /api/videos/:id/view
router.post('/:id/view', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!Number.isInteger(Number(id))) {
      return res.json({ vistas: 1 });
    }
    const result = await pool.query(
      'UPDATE videos SET vistas = vistas + 1 WHERE id = $1 RETURNING vistas',
      [id]
    );
    res.json(result.rows[0] || { vistas: 0 });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar vista' });
  }
});

module.exports = router;
