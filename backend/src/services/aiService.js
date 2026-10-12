/**
 * OpoBrAIn - Servicio de Inteligencia Artificial (OpenRouter)
 * Conexión y generación de preguntas tipo test para Oposiciones C1 AGE.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'meta-llama/llama-3-8b-instruct:free';

/**
 * Realiza la petición a la API de OpenRouter con las cabeceras requeridas
 * y maneja las respuestas y errores específicos de red/cuota.
 * 
 * @param {Array} messages - Historial de mensajes (system, user)
 * @param {Object} options - Parámetros opcionales (model, temperature, etc.)
 * @returns {Promise<string>} Contenido del mensaje devuelto por la IA
 */
async function callOpenRouter(messages, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    const error = new Error('OPENROUTER_API_KEY no está configurada en las variables de entorno del servidor.');
    error.status = 500;
    error.code = 'MISSING_API_KEY';
    throw error;
  }

  const model = options.model || process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const siteUrl = process.env.SITE_URL || 'https://opobrain.es';
  const appTitle = 'OpoBrAIn';

  const payload = {
    model,
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.max_tokens ?? 6000,
  };

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 40000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': siteUrl,
        'X-Title': appTitle,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorJson = await response.json();
        errorDetails = errorJson?.error?.message || JSON.stringify(errorJson);
      } catch (_) {
        errorDetails = await response.text();
      }

      const error = new Error();
      error.status = response.status;

      if (response.status === 401) {
        error.message = 'Clave de API de OpenRouter inválida o caducada.';
        error.code = 'UNAUTHORIZED';
      } else if (response.status === 429) {
        error.message = 'El servicio de IA de OpenRouter está saturado o se ha alcanzado la cuota de peticiones. Por favor, inténtalo de nuevo en unos momentos.';
        error.code = 'RATE_LIMIT_EXCEEDED';
      } else if (response.status === 402) {
        error.message = 'Créditos insuficientes en la cuenta de OpenRouter.';
        error.code = 'INSUFFICIENT_CREDITS';
      } else if (response.status >= 500) {
        error.message = `El proveedor de IA en OpenRouter no está disponible temporalmente (${response.status}).`;
        error.code = 'AI_PROVIDER_ERROR';
      } else {
        error.message = `Error en OpenRouter (${response.status}): ${errorDetails}`;
        error.code = 'OPENROUTER_ERROR';
      }

      throw error;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      const error = new Error('OpenRouter devolvió una respuesta vacía.');
      error.status = 502;
      error.code = 'EMPTY_RESPONSE';
      throw error;
    }

    return content;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      const timeoutError = new Error('Tiempo de espera agotado al conectar con OpenRouter (Timeout de 40s).');
      timeoutError.status = 504;
      timeoutError.code = 'GATEWAY_TIMEOUT';
      throw timeoutError;
    }

    throw err;
  }
}

/**
 * Extrae y parsea de forma segura el JSON devuelto por la IA,
 * eliminando bloques de Markdown o texto explicativo sobrante.
 * 
 * @param {string} rawContent - Texto crudo devuelto por el modelo
 * @returns {Array<Object>} Array de preguntas parseadas
 */
function parseAndValidateQuestionsJSON(rawContent) {
  let cleaned = rawContent.trim();

  // Eliminar bloques ```json ... ``` si la IA los incluyó
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  // Localizar el array JSON [ ... ] en caso de que haya texto antes o después
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');

  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (parseError) {
    console.error('Error al parsear JSON devuelto por la IA:', parseError.message);
    console.error('Contenido recibido:', rawContent.substring(0, 500));
    const error = new Error('La IA no devolvió un JSON con el formato estructurado requerido.');
    error.status = 502;
    error.code = 'INVALID_JSON_RESPONSE';
    throw error;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    const error = new Error('El JSON devuelto por la IA no contiene una lista de preguntas válida.');
    error.status = 502;
    error.code = 'INVALID_STRUCTURE';
    throw error;
  }

  // Sanitizar y validar los campos requeridos de cada pregunta
  return parsed.map((item, index) => {
    // Normalizar respuesta correcta: extraer solo letra A, B, C o D
    let respuesta = String(item.respuesta_correcta || item.correcta || '').trim().toUpperCase();
    const matchRespuesta = respuesta.match(/[A-D]/);
    if (matchRespuesta) {
      respuesta = matchRespuesta[0];
    } else {
      respuesta = 'A'; // Valor seguro por defecto si no es concluyente
    }

    return {
      numero: index + 1,
      enunciado: String(item.enunciado || '').trim(),
      opcion_a: String(item.opcion_a || item.opcionA || '').trim(),
      opcion_b: String(item.opcion_b || item.opcionB || '').trim(),
      opcion_c: String(item.opcion_c || item.opcionC || '').trim(),
      opcion_d: String(item.opcion_d || item.opcionD || '').trim(),
      respuesta_correcta: respuesta,
      explicacion: String(item.explicacion || 'Explicación legal oficial conforme al temario C1.').trim(),
    };
  });
}

/**
 * Genera un test de preguntas tipo test para un tema y bloques específicos (epígrafes)
 * de las oposiciones C1 del Estado usando OpenRouter.
 * 
 * @param {Object} params
 * @param {string} params.tema - Título o materia del tema
 * @param {string} [params.bloque] - Bloque temático (opcional)
 * @param {Array<string>|string} [params.epigrafes] - Apartados o bloques específicos seleccionados dentro del tema
 * @param {number} [params.cantidad=10] - Número de preguntas a generar
 * @returns {Promise<Array<Object>>} Array con las preguntas generadas
 */
async function generarPreguntasTest({ tema, bloque, epigrafes, cantidad = 10 }) {
  if (!tema) {
    const error = new Error('El parámetro "tema" es obligatorio.');
    error.status = 400;
    throw error;
  }

  const bloqueTexto = bloque ? `Pertenece al bloque general: "${bloque}".` : 'Temario oficial del Cuerpo General Administrativo de la Administración del Estado (C1).';

  let epigrafesTexto = '';
  if (Array.isArray(epigrafes) && epigrafes.length > 0) {
    epigrafesTexto = `\nAPARTADOS Y BLOQUES ESPECÍFICOS DEL TEMA A EVALUAR:\nEl usuario ha seleccionado estudiar EXCLUSIVAMENTE los siguientes apartados concretos del tema:\n${epigrafes.map((e, idx) => `  ${idx + 1}. ${typeof e === 'object' ? (e.nombre || e.titulo) : e}`).join('\n')}\nIMPORTANTE: Centra las ${cantidad} preguntas de forma precisa y rigurosa ÚNICAMENTE en estos apartados específicos seleccionados.`;
  } else if (typeof epigrafes === 'string' && epigrafes.trim()) {
    epigrafesTexto = `\nAPARTADO O BLOQUE ESPECÍFICO DEL TEMA A EVALUAR:\nEl usuario ha seleccionado estudiar EXCLUSIVAMENTE el apartado: "${epigrafes.trim()}".\nIMPORTANTE: Centra las ${cantidad} preguntas de forma precisa y rigurosa ÚNICAMENTE en este apartado específico.`;
  }

  const systemPrompt = `Eres un Tribunal Calificador oficial para las oposiciones al Cuerpo General Administrativo de la Administración del Estado (C1) de España.
Tu tarea es redactar exactamente ${cantidad} preguntas tipo test rigurosas, objetivas y de máxima dificultad técnica oficial.

REGLAS ESTRICTAS DE CONTENIDO:
1. Basadas estrictamente en la normativa legal española vigente (Constitución Española, Ley 39/2015 LPAC, Ley 40/2015 LRJSP, TREBEP RDL 5/2015, Ley 9/2017 LCSP, Ley 47/2003 LGP, etc.).
2. Si se especifican apartados o bloques concretos del tema, TODAS las preguntas deben corresponder obligatoriamente a dichos apartados sin salirse de su ámbito.
3. Cada pregunta debe tener exactamente 4 opciones de respuesta (opcion_a, opcion_b, opcion_c, opcion_d) y una sola opción correcta indubitada.
4. El campo "respuesta_correcta" debe contener ÚNICAMENTE la letra mayúscula: "A", "B", "C" o "D".
5. El campo "explicacion" debe detallar el fundamento jurídico riguroso, citando textualmente el artículo y la ley correspondiente.

FORMATO DE SALIDA OBLIGATORIO:
Devuelve ÚNICAMENTE un array JSON válido sin bloques de texto introductorio, ni conclusiones, ni comentarios fuera del array.
Estructura exacta:
[
  {
    "enunciado": "Texto de la pregunta...",
    "opcion_a": "Texto de la opción A",
    "opcion_b": "Texto de la opción B",
    "opcion_c": "Texto de la opción C",
    "opcion_d": "Texto de la opción D",
    "respuesta_correcta": "A",
    "explicacion": "Artículo X de la Ley Y/ZZZZ..."
  }
]`;

  const userPrompt = `Genera un examen tipo test de exactamente ${cantidad} preguntas con máxima rigurosidad C1:
Tema: "${tema}"
${bloqueTexto}
${epigrafesTexto}

Recuerda: Devuelve EXCLUSIVAMENTE el array JSON con las ${cantidad} preguntas.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const rawResponse = await callOpenRouter(messages);
  const preguntas = parseAndValidateQuestionsJSON(rawResponse);

  return preguntas;
}

module.exports = {
  callOpenRouter,
  generarPreguntasTest,
  parseAndValidateQuestionsJSON,
  DEFAULT_MODEL,
};
