const express = require('express');
const router = express.Router();
const testController = require('../controllers/test.controller');

// GET /api/test/oficiales - Batería de 10 preguntas aleatorias de exámenes oficiales
router.get('/oficiales', testController.getTestOficiales);

// POST /api/test/generar-tema - Generación dinámica con IA (OpenRouter) de 10 preguntas por tema
router.post('/generar-tema', testController.generarTestTema);

// GET /api/test/oficial/:año (soporta :anio y :año)
router.get('/oficial/:anio', testController.getTestOficial);

// GET /api/test/tema/:tema_id
router.get('/tema/:tema_id', testController.getTestPorTema);

// GET /api/test/repaso - Batería de Errores
router.get('/repaso', testController.getTestRepaso);

// POST /api/test/responder - Valida respuesta y actualiza historial_errores
router.post('/responder', testController.responderPregunta);

module.exports = router;
