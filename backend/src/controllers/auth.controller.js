const db = require('../config/db');

// Usuarios autorizados solicitados con contraseña "Aprobado"
const USUARIOS_AUTORIZADOS = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    username: 'admin',
    nombre: 'Administrador OpoBrAIn',
    email: 'admin@opobrain.es',
    password: 'Aprobado',
    rol: 'admin',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    username: 'Nemesis',
    nombre: 'Nemesis',
    email: 'nemesis@opobrain.es',
    password: 'Aprobado',
    rol: 'opositor',
  },
];

/**
 * POST /api/auth/login
 * Autentica al usuario admin o Nemesis con contraseña Aprobado
 */
const login = async (req, res) => {
  try {
    const { username, password, usuario } = req.body;
    const nombreUsuario = (username || usuario || '').trim();
    const pass = (password || '').trim();

    if (!nombreUsuario || !pass) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, introduce tu nombre de usuario y contraseña.',
      });
    }

    // Buscar usuario ignorando mayúsculas/minúsculas en el nombre
    const usuarioEncontrado = USUARIOS_AUTORIZADOS.find(
      (u) => u.username.toLowerCase() === nombreUsuario.toLowerCase()
    );

    // Validar contraseña exacta ("Aprobado" o "aprobado")
    if (!usuarioEncontrado || (pass !== usuarioEncontrado.password && pass.toLowerCase() !== usuarioEncontrado.password.toLowerCase())) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas. Comprueba tu usuario y contraseña.',
      });
    }

    // Sincronizar usuario en PostgreSQL Neon si la base de datos está disponible
    try {
      await db.query(
        `INSERT INTO usuarios (id, nombre, email) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre;`,
        [usuarioEncontrado.id, usuarioEncontrado.nombre, usuarioEncontrado.email]
      );
    } catch (dbErr) {
      console.warn('Nota: sincronización DB secundaria omitida:', dbErr.message);
    }

    // Retornar sesión autenticada
    const userData = {
      id: usuarioEncontrado.id,
      username: usuarioEncontrado.username,
      nombre: usuarioEncontrado.nombre,
      email: usuarioEncontrado.email,
      rol: usuarioEncontrado.rol,
    };

    res.json({
      success: true,
      message: `¡Bienvenido/a a OpoBrAIn, ${usuarioEncontrado.nombre}!`,
      user: userData,
      token: `opobrain-token-${usuarioEncontrado.username.toLowerCase()}-${Date.now()}`,
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al iniciar sesión.',
      error: error.message,
    });
  }
};

/**
 * GET /api/auth/me
 * Obtiene los datos del usuario autenticado actual
 */
const getMe = async (req, res) => {
  const usuarioId = req.headers['x-usuario-id'];
  const usuario = USUARIOS_AUTORIZADOS.find((u) => u.id === usuarioId) || USUARIOS_AUTORIZADOS[1];

  res.json({
    success: true,
    user: {
      id: usuario.id,
      username: usuario.username,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    },
  });
};

module.exports = {
  login,
  getMe,
  USUARIOS_AUTORIZADOS,
};
