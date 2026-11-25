const express = require('express');
const pool = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

async function fetchExternalMovies(term, limit = 16) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=movie&entity=movie&limit=${limit}`;
  const response = await fetch(url);
  const data = await response.json();

  return (data.results || [])
    .filter((item) => item.previewUrl)
    .map((item) => ({
      id: item.trackId,
      external_id: item.trackId,
      titulo: item.trackName,
      descripcion: item.longDescription || item.shortDescription || `Película recomendada: ${item.trackName}`,
      categoria: item.primaryGenreName || 'Cine',
      anio: item.releaseDate ? new Date(item.releaseDate).getFullYear() : 2025,
      duracion: item.trackTimeMillis
        ? `${Math.round(item.trackTimeMillis / 60000)} min`
        : 'Tráiler HD',
      thumbnail_url: item.artworkUrl100
        ? item.artworkUrl100.replace('100x100bb', '600x600bb')
        : 'https://via.placeholder.com/600x600?text=Sin+Imagen',
      video_url: item.previewUrl,
      fuente: 'API Global',
      isExternal: true,
    }));
}

// GET /api/videos/external/recommended - Peliculas recomendadas al iniciar sesion
router.get('/external/recommended', verifyToken, async (req, res) => {
  try {
    const terms = ['marvel', 'star wars', 'pixar', 'inception'];
    const randomTerm = terms[Math.floor(Math.random() * terms.length)];
    const results = await fetchExternalMovies(randomTerm, 16);
    res.json({ results });
  } catch (error) {
    console.error('Error cargando recomendaciones:', error.message);
    res.json({ results: [] });
  }
});

// GET /api/videos/external/search?q=termino - Busqueda en tiempo real
router.get('/external/search', verifyToken, async (req, res) => {
  const query = (req.query.q || 'avengers').trim();
  try {
    const results = await fetchExternalMovies(query, 20);
    res.json({ query, total: results.length, results });
  } catch (error) {
    console.error('Error consultando API externa:', error.message);
    res.status(500).json({ message: 'Error al buscar películas en la API' });
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
        thumbnail_url || 'https://via.placeholder.com/600x400?text=Streaming',
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
