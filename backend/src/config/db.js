const { Pool } = require('pg');
require('dotenv').config();

// Configuración de conexión optimizada para PostgreSQL en Neon Serverless
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('neon.tech') || process.env.NODE_ENV === 'production')
    ? { rejectUnauthorized: false }
    : false,
  max: 10, // Límite de conexiones para mantenerse en el Free Tier de Neon / Render
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  console.log(' Conectado exitosamente a PostgreSQL (Neon)');
});

pool.on('error', (err) => {
  console.error(' Error imprevisto en el Pool de PostgreSQL:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
