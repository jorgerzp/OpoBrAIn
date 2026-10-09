const express = require('express');
const router = express.Router();
const temasController = require('../controllers/temas.controller');

// GET /api/temas - Devuelve la lista completa de temas
router.get('/', temasController.getTemas);

module.exports = router;
