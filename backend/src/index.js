const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const videoRoutes = require('./routes/videoRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    proyecto: 'Plataforma Global de Streaming (Caso 8)',
    estado: 'Servidor corriendo correctamente',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT} -> http://localhost:${PORT}`);
});
