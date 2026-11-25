const express = require('express');
const pool = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

const SAMPLE_STREAMS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
];

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>?/gm, '').trim();
}

function mapTvMazeItem(show, index) {
  const poster =
    show.image?.original ||
    show.image?.medium ||
    'https://static.tvmaze.com/uploads/images/original_untouched/425/1064746.jpg';

  return {
    id: show.id,
    external_id: show.id,
    titulo: show.name,
    descripcion: stripHtml(show.summary) || `Título destacado de ${show.name} disponible en StreamGlobal.`,
    categoria: (show.genres && show.genres.length > 0) ? show.genres[0] : 'Cine y Series',
    anio: show.premiered ? Number(show.premiered.slice(0, 4)) : 2025,
    duracion: show.runtime ? `${show.runtime} min` : 'HD 1080p',
    thumbnail_url: poster,
    video_url: SAMPLE_STREAMS[index % SAMPLE_STREAMS.length],
    fuente: 'API Catálogo Real',
    rating: show.rating?.average || 8.4,
    isExternal: true,
  };
}

// GET /api/videos/external/recommended - Títulos reales recomendados al entrar
router.get('/external/recommended', verifyToken, async (req, res) => {
  try {
    const response = await fetch('https://api.tvmaze.com/shows?page=0', {
      headers: { 'User-Agent': 'StreamGlobalApp/1.0' }
    });
    const data = await response.json();

    const results = (data || [])
      .filter((item) => item.image && (item.image.original || item.image.medium))
      .slice(0, 16)
      .map((item, idx) => mapTvMazeItem(item, idx));

    res.json({ results });
  } catch (error) {
    console.error('Error cargando recomendaciones:', error.message);
    res.json({ results: [] });
  }
});

// GET /api/videos/external/search?q=termino - Búsqueda real por nombre
router.get('/external/search', verifyToken, async (req, res) => {
  const query = (req.query.q || 'avengers').trim();
  try {
    const url = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'StreamGlobalApp/1.0' }
    });
    const data = await response.json();

    const results = (data || [])
      .map((entry) => entry.show)
      .filter((show) => show && (show.image?.original || show.image?.medium))
      .map((show, idx) => mapTvMazeItem(show, idx));

    res.json({ query, total: results.length, results });
  } catch (error) {
    console.error('Error buscando en API:', error.message);
    res.status(500).json({ message: 'Error al buscar títulos en la API' });
  }
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
        thumbnail_url || 'https://static.tvmaze.com/uploads/images/original_untouched/425/1064746.jpg',
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
