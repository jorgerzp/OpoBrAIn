const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// POST /api/auth/login - Iniciar sesión (admin / Nemesis con contraseña Aprobado)
router.post('/login', authController.login);

// GET /api/auth/me - Obtener información del usuario autenticado
router.get('/me', authController.getMe);

module.exports = router;
