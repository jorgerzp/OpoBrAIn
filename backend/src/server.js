require('dotenv').config();
const express = require('express');
const cors = require('cors');

const temasRoutes = require('./routes/temas.routes');
const testRoutes = require('./routes/test.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de Middlewares
app.use(cors({
  origin: '*', // En producción en Render/Vercel puedes restringirlo al dominio de Vercel
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-usuario-id'],
}));

app.use(express.json());

// Endpoint de verificación (Health Check) para Render Free Tier
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'OpoBrAIn API',
    oposicion: 'Cuerpo General Administrativo del Estado (C1)',
    timestamp: new Date().toISOString(),
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/temas', temasRoutes);
app.use('/api/test', testRoutes);

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error(' Error en la aplicación:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  OpoBrAIn Backend Activo en Puerto: ${PORT}`);
  console.log(`  URL Health Check: http://localhost:${PORT}/api/health`);
  console.log(`  Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log(`===============================================`);
});
