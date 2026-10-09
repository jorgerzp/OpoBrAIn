const db = require('../config/db');

const DEMO_USER_ID = 'a0000000-0000-0000-0000-000000000001';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * GET /api/test/oficiales
 * Devuelve una batería de exactamente 10 preguntas aleatorias de la tabla preguntas_oficiales
 */
const getTestOficiales = async (req, res) => {
  try {
    let query = `
      SELECT 
        id, 
        numero, 
        anio_examen, 
        enunciado, 
        opcion_a, 
        opcion_b, 
        opcion_c, 
        opcion_d, 
        respuesta_correcta, 
        COALESCE(explicacion, 'Pregunta extraída del examen oficial del INAP.') AS explicacion
      FROM preguntas_oficiales
      ORDER BY RANDOM()
      LIMIT 10;
    `;

    let { rows } = await db.query(query);

    // Si la tabla preguntas_oficiales aún no tiene filas, consultar preguntas generales o fallback
    if (!rows || rows.length === 0) {
      const fallbackQuery = `
        SELECT 
          id, 
          enunciado, 
          opcion_a, 
          opcion_b, 
          opcion_c, 
          opcion_d, 
          respuesta_correcta, 
          explicacion
        FROM preguntas
        ORDER BY RANDOM()
        LIMIT 10;
      `;
      const fallbackResult = await db.query(fallbackQuery);
      rows = fallbackResult.rows;
    }

    // Si la base de datos no estuviera conectada en local
    if (!rows || rows.length === 0) {
      rows = getMockOficiales();
    }

    res.json({
      success: true,
      tipo: 'oficiales',
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.warn('Advertencia DB al obtener oficiales, usando banco local:', error.message);
    res.json({
      success: true,
      tipo: 'oficiales',
      total: 10,
      data: getMockOficiales(),
    });
  }
};

/**
 * POST /api/test/generar-tema
 * Genera dinámicamente con IA (OpenRouter / Llama 3) un test de 10 preguntas para un tema y bloque dados
 */
const generarTestTema = async (req, res) => {
  const { tema, bloque, nombre_tema } = req.body;
  const temaFinal = tema || nombre_tema;
  const bloqueFinal = bloque || 'Bloque correspondiente del C1';

  if (!temaFinal) {
    return res.status(400).json({
      success: false,
      message: 'El campo "tema" o "nombre_tema" es obligatorio en el body.',
    });
  }

  console.log(`\n🧠 Generando test con IA para el tema: "${temaFinal}" (Bloque: "${bloqueFinal}")...`);

  // Si no hay API KEY configurada todavía, devolver un set contextual simulado para no bloquear
  if (!OPENROUTER_API_KEY) {
    console.warn('⚠️ OPENROUTER_API_KEY no detectada en .env. Devolviendo test generado de respaldo.');
    return res.json({
      success: true,
      tema: temaFinal,
      bloque: bloqueFinal,
      fuente: 'mock_local',
      total: 10,
      data: generarPreguntasMockTema(temaFinal),
    });
  }

  try {
    const promptSistema = `Eres un redactor de tribunales de oposición para el Cuerpo General Administrativo de la Administración del Estado (C1) de España.

Genera 10 preguntas tipo test rigurosas, basadas estrictamente en la legislación española vigente correspondiente al tema solicitado.

Cada pregunta debe tener 4 opciones (A, B, C, D), una única respuesta válida, y una explicación citando el artículo y ley exacta.

Devuelve EXCLUSIVAMENTE un array JSON válido sin texto adicional: [{ enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, explicacion }].`;

    const promptUsuario = `Tema: ${temaFinal}
Bloque temático: ${bloqueFinal}

Genera las 10 preguntas tipo test cumpliendo rigurosamente las instrucciones.`;

    const payload = {
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'system',
          content: promptSistema,
        },
        {
          role: 'user',
          content: promptUsuario,
        },
      ],
      temperature: 0.2,
      max_tokens: 8000,
    };

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://opobrain.es',
        'X-Title': 'OpoBrAIn Dynamic Topic Generator',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter error (${response.status}): ${errText}`);
    }

    const dataAI = await response.json();
    const contenido = dataAI.choices?.[0]?.message?.content;

    if (!contenido) {
      throw new Error('Respuesta vacía desde OpenRouter.');
    }

    // Limpieza de formato JSON
    let limpio = contenido.trim();
    if (limpio.startsWith('```json')) limpio = limpio.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    if (limpio.startsWith('```')) limpio = limpio.replace(/^```\s*/, '').replace(/\s*```$/, '');

    const pInicio = limpio.indexOf('[');
    const pFin = limpio.lastIndexOf(']');
    if (pInicio !== -1 && pFin !== -1 && pFin > pInicio) {
      limpio = limpio.substring(pInicio, pFin + 1);
    }

    const preguntasGeneradas = JSON.parse(limpio);

    // Mapear con id único generado en memoria
    const preguntasConId = preguntasGeneradas.map((p, index) => ({
      id: `gen-${Date.now()}-${index + 1}`,
      numero: index + 1,
      tema_nombre: nombre_tema,
      enunciado: p.enunciado,
      opcion_a: p.opcion_a,
      opcion_b: p.opcion_b,
      opcion_c: p.opcion_c,
      opcion_d: p.opcion_d,
      respuesta_correcta: String(p.respuesta_correcta).trim().toUpperCase(),
      explicacion: p.explicacion,
    }));

    res.json({
      success: true,
      tema: nombre_tema,
      fuente: 'openrouter',
      total: preguntasConId.length,
      data: preguntasConId,
    });
  } catch (error) {
    console.error('Error al llamar a OpenRouter en generar-tema:', error.message);
    // Fallback de contingencia para garantizar fluidez
    res.json({
      success: true,
      tema: nombre_tema,
      fuente: 'fallback_error',
      total: 10,
      data: generarPreguntasMockTema(nombre_tema),
    });
  }
};

/**
 * GET /api/test/oficial/:anio (Mantenido para compatibilidad)
 */
const getTestOficial = async (req, res) => {
  try {
    const anio = parseInt(req.params.anio || req.params.año, 10);
    const query = `
      SELECT p.*, t.numero AS tema_numero, t.titulo_tema
      FROM preguntas p
      LEFT JOIN temas t ON t.id = p.tema_id
      WHERE p.anio_examen = $1
      ORDER BY RANDOM()
      LIMIT 50;
    `;
    const { rows } = await db.query(query, [anio]);
    res.json({ success: true, anio, total: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/test/tema/:tema_id (Mantenido para compatibilidad)
 */
const getTestPorTema = async (req, res) => {
  try {
    const { tema_id } = req.params;
    const query = `
      SELECT p.*, t.numero AS tema_numero, t.titulo_tema
      FROM preguntas p
      JOIN temas t ON t.id = p.tema_id
      WHERE p.tema_id = $1
      ORDER BY RANDOM()
      LIMIT 30;
    `;
    const { rows } = await db.query(query, [tema_id]);
    res.json({ success: true, tema_id, total: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/test/repaso (Batería de Errores)
 */
const getTestRepaso = async (req, res) => {
  try {
    const usuarioId = req.headers['x-usuario-id'] || req.query.usuario_id || DEMO_USER_ID;
    const query = `
      SELECT 
        p.id, 
        p.enunciado, 
        p.opcion_a, 
        p.opcion_b, 
        p.opcion_c, 
        p.opcion_d, 
        p.respuesta_correcta, 
        p.explicacion,
        h.veces_fallada,
        h.fecha_ultimo_fallo
      FROM historial_errores h
      JOIN preguntas p ON p.id = h.pregunta_id
      WHERE h.usuario_id = $1 AND h.superado = FALSE
      ORDER BY h.veces_fallada DESC, h.fecha_ultimo_fallo DESC
      LIMIT 50;
    `;
    const { rows } = await db.query(query, [usuarioId]);
    res.json({ success: true, tipo: 'repaso_errores', total: rows.length, data: rows });
  } catch (error) {
    res.json({ success: true, tipo: 'repaso_errores', total: 3, data: getMockOficiales().slice(0, 3) });
  }
};

/**
 * POST /api/test/responder (UPSERT si falla / actualiza si acierta)
 */
const responderPregunta = async (req, res) => {
  try {
    const {
      pregunta_id,
      respuesta_seleccionada,
      usuario_id = DEMO_USER_ID,
    } = req.body;

    if (!pregunta_id || !respuesta_seleccionada) {
      return res.status(400).json({
        success: false,
        message: 'pregunta_id y respuesta_seleccionada son obligatorios.',
      });
    }

    // Buscar en preguntas o preguntas_oficiales
    let respuesta_correcta = 'A';
    let explicacion = 'Fundamento oficial.';

    const qPreguntas = await db.query('SELECT respuesta_correcta, explicacion FROM preguntas WHERE id::text = $1 UNION SELECT respuesta_correcta, explicacion FROM preguntas_oficiales WHERE id::text = $1', [String(pregunta_id)]);

    if (qPreguntas.rows.length > 0) {
      respuesta_correcta = qPreguntas.rows[0].respuesta_correcta;
      explicacion = qPreguntas.rows[0].explicacion;
    }

    const esCorrecta = respuesta_correcta.trim().toUpperCase() === respuesta_seleccionada.trim().toUpperCase();

    res.json({
      success: true,
      es_correcta: esCorrecta,
      respuesta_seleccionada,
      respuesta_correcta,
      explicacion,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Datos simulados de alta calidad para cuando la DB esté desconectada en local
function getMockOficiales() {
  return [
    {
      id: 'of-01',
      numero: 1,
      enunciado: 'Según el artículo 1.2 de la Constitución Española de 1978, ¿en quién reside la soberanía nacional?',
      opcion_a: 'En el Rey como Jefe del Estado',
      opcion_b: 'En las Cortes Generales',
      opcion_c: 'En el pueblo español, del que emanan los poderes del Estado',
      opcion_d: 'En el Presidente del Gobierno',
      respuesta_correcta: 'C',
      explicacion: 'El art. 1.2 de la CE consagra que la soberanía nacional reside en el pueblo español.',
    },
    {
      id: 'of-02',
      numero: 2,
      enunciado: 'Según la Ley 39/2015 (LPAC), ¿cuál es el plazo general máximo para notificar una resolución expresa cuando las normas reguladoras no fijen plazo?',
      opcion_a: '1 mes',
      opcion_b: '3 meses',
      opcion_c: '6 meses',
      opcion_d: '20 días hábiles',
      respuesta_correcta: 'B',
      explicacion: 'Art. 21.3 LPAC: El plazo general supletorio es de tres meses.',
    },
    {
      id: 'of-03',
      numero: 3,
      enunciado: 'De acuerdo con el artículo 47 de la Ley 39/2015, los actos de las Administraciones Públicas que lesionen los derechos y libertades susceptibles de amparo constitucional son:',
      opcion_a: 'Anulables',
      opcion_b: 'Nulos de pleno derecho',
      opcion_c: 'Convalidables',
      opcion_d: 'Válidos si no se recurren en 10 días',
      respuesta_correcta: 'B',
      explicacion: 'Art. 47.1.a) LPAC: Nulidad radical de pleno derecho.',
    },
    {
      id: 'of-04',
      numero: 4,
      enunciado: 'Conforme al Estatuto Básico del Empleado Público (TREBEP), ¿cuál de los siguientes NO es una clase reconocida de personal empleado público?',
      opcion_a: 'Funcionarios de carrera',
      opcion_b: 'Personal laboral',
      opcion_c: 'Personal eventual',
      opcion_d: 'Personal becario directivo',
      respuesta_correcta: 'D',
      explicacion: 'Art. 8 TREBEP: Clases reconocidas son carrera, interinos, laboral y eventual.',
    },
    {
      id: 'of-05',
      numero: 5,
      enunciado: 'Según el artículo 68 de la Constitución Española, el Congreso de los Diputados se compone de un número de diputados entre:',
      opcion_a: '250 y 350',
      opcion_b: '300 y 400',
      opcion_c: '350 y 450',
      opcion_d: '300 y 350',
      respuesta_correcta: 'B',
      explicacion: 'Art. 68.1 CE: La horquilla constitucional oscila entre 300 y 400 Diputados.',
    },
    {
      id: 'of-06',
      numero: 6,
      enunciado: 'De acuerdo con la Ley 40/2015, ¿mediante qué instrumento se determina el número, denominación y ámbito de competencia de los Ministerios y Secretarías de Estado?',
      opcion_a: 'Ley Orgánica de Cortes Generales',
      opcion_b: 'Real Decreto del Presidente del Gobierno',
      opcion_c: 'Orden Ministerial conjunta',
      opcion_d: 'Acuerdo del Consejo de Ministros',
      respuesta_correcta: 'B',
      explicacion: 'Art. 57.1 de la Ley 40/2015 de Régimen Jurídico del Sector Público.',
    },
    {
      id: 'of-07',
      numero: 7,
      enunciado: 'Según la Ley 9/2017 de Contratos del Sector Público, los contratos menores de obras tienen un umbral de valor estimado inferior a:',
      opcion_a: '15.000 euros',
      opcion_b: '40.000 euros',
      opcion_c: '50.000 euros',
      opcion_d: '18.000 euros',
      respuesta_correcta: 'B',
      explicacion: 'Art. 118 LCSP: Obras inferiores a 40.000 € y suministros/servicios inferiores a 15.000 €.',
    },
    {
      id: 'of-08',
      numero: 8,
      enunciado: 'Conforme a la Ley General Presupuestaria, el ejercicio presupuestario:',
      opcion_a: 'Coincide con el año natural',
      opcion_b: 'Comienza el 1 de marzo y finaliza el 28 de febrero',
      opcion_c: 'Es fijado anualmente por las Cortes',
      opcion_d: 'Dura 2 años en ejercicios ordinarios',
      respuesta_correcta: 'A',
      explicacion: 'Art. 34 LGP: El ejercicio presupuestario coincide exactamente con el año natural.',
    },
    {
      id: 'of-09',
      numero: 9,
      enunciado: 'Según el artículo 14 de la Ley 39/2015, ¿quiénes están obligados a relacionarse electrónicamente con la Administración?',
      opcion_a: 'Las personas físicas en cualquier circunstancia',
      opcion_b: 'Las personas jurídicas y entidades sin personalidad jurídica',
      opcion_c: 'Únicamente los empleados públicos en sus trámites personales',
      opcion_d: 'Solo los ciudadanos mayores de edad',
      respuesta_correcta: 'B',
      explicacion: 'Art. 14.2 LPAC: Obligación para personas jurídicas, entidades sin personalidad, etc.',
    },
    {
      id: 'of-10',
      numero: 10,
      enunciado: 'El recurso administrativo de alzada contra un acto expreso se interpondrá en el plazo de:',
      opcion_a: '1 mes',
      opcion_b: '15 días hábiles',
      opcion_c: '2 meses',
      opcion_d: '3 meses',
      respuesta_correcta: 'A',
      explicacion: 'Art. 122.1 LPAC: 1 mes si el acto fuera expreso.',
    },
  ];
}

function generarPreguntasMockTema(nombreTema) {
  return Array.from({ length: 10 }).map((_, i) => ({
    id: `mock-tema-${i + 1}`,
    numero: i + 1,
    tema_nombre: nombreTema,
    enunciado: `[${nombreTema}] Pregunta ${i + 1} de nivel C1 sobre aspectos avanzados de la regulación aplicable: ¿Cuál es el requisito preceptivo conforme a la ley?`,
    opcion_a: 'Requiere autorización previa del Consejo de Ministros',
    opcion_b: 'Se formaliza en el plazo legal de tres meses desde su iniciación',
    opcion_c: 'Basta con comunicación fehaciente en el registro electrónico',
    opcion_d: 'Constituye causa de abstención y recusación tipificada',
    respuesta_correcta: ['A', 'B', 'C', 'D'][i % 4],
    explicacion: `Fundamento legal correspondiente al bloque de ${nombreTema} conforme a la normativa estatal vigente.`,
  }));
}

module.exports = {
  getTestOficiales,
  generarTestTema,
  getTestOficial,
  getTestPorTema,
  getTestRepaso,
  responderPregunta,
};
