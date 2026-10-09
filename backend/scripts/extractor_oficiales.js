/**
 * ============================================================================
 * OpoBrAIn - Script Extractor de Exámenes Oficiales C1 (extractor_oficiales.js)
 * ============================================================================
 * Flujo:
 * 1. Lee el PDF de preguntas y el PDF de la plantilla de respuestas con pdf-parse.
 * 2. Cruza por número exacto de pregunta usando OpenRouter (Llama 3).
 * 3. Valida y limpia el JSON resultante.
 * 4. Guarda el resultado en 'preguntas_oficiales.json' para poblar la DB en Neon.
 *
 * Ejecución:
 *   node scripts/extractor_oficiales.js <examen.pdf> <respuestas.pdf> [salida.json]
 *   node scripts/extractor_oficiales.js "Examen A 2024.pdf" "Respuesta examen A 2024.pdf"
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

// Cargar variables de entorno desde backend/.env o desde la raíz
const envBackend = path.resolve(__dirname, '../.env');
const envCwd = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envBackend)) {
  require('dotenv').config({ path: envBackend });
} else if (fs.existsSync(envCwd)) {
  require('dotenv').config({ path: envCwd });
} else {
  require('dotenv').config();
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
// Usamos Meta Llama 3.3 70B Instruct por defecto en OpenRouter, o el configurado en .env
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Lee y extrae el texto plano de un PDF
 */
async function extraerTexto(rutaArchivo, nombreDocumento) {
  if (!fs.existsSync(rutaArchivo)) {
    throw new Error(`No se encontró el archivo de ${nombreDocumento}: "${rutaArchivo}"`);
  }

  console.log(`📄 Leyendo ${nombreDocumento}: ${path.basename(rutaArchivo)}...`);
  const buffer = fs.readFileSync(rutaArchivo);
  const data = await pdf(buffer);
  console.log(`   ✓ ${nombreDocumento} leído (${data.numpages} páginas, ${data.text.length} caracteres)`);
  return data.text;
}

/**
 * Limpia bloques markdown y parsea el array JSON
 */
function limpiarYParsearJSON(textoCrudo) {
  let limpio = textoCrudo.trim();

  // Eliminar bloques ```json ... ```
  if (limpio.startsWith('```json')) {
    limpio = limpio.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (limpio.startsWith('```')) {
    limpio = limpio.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  // Extraer el contenido entre el primer '[' y el último ']'
  const inicio = limpio.indexOf('[');
  const fin = limpio.lastIndexOf(']');
  if (inicio !== -1 && fin !== -1 && fin > inicio) {
    limpio = limpio.substring(inicio, fin + 1);
  }

  try {
    const datos = JSON.parse(limpio);
    if (!Array.isArray(datos)) {
      throw new Error('La respuesta devuelta no es un array JSON.');
    }
    return datos;
  } catch (err) {
    console.error('\n❌ Error al parsear JSON devuelto por OpenRouter.');
    console.error('Fragmento de texto recibido (500 chars):\n', limpio.slice(0, 500));
    throw new Error(`Fallo en el parseo JSON: ${err.message}`);
  }
}

/**
 * Llama a OpenRouter (Llama 3) para cruzar los textos de examen y plantilla
 */
async function cruzarConOpenRouter(textoExamen, textoRespuestas) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('Falta OPENROUTER_API_KEY en tu archivo .env. Añádela para poder ejecutar el extractor.');
  }

  console.log(`\n🤖 Procesando cruce en OpenRouter con el modelo [${OPENROUTER_MODEL}]...`);

  // Prompt estricto solicitado
  const promptSistema = `Eres un procesador de datos. Tu tarea es extraer preguntas de un texto crudo de un examen en PDF y sus respuestas de otro PDF. Debes buscar el número de la pregunta en el texto del examen, extraer su enunciado y las opciones (A, B, C, D), y luego buscar ESE MISMO NÚMERO exacto en el texto de las respuestas para asignarle su letra correcta. Devuelve un array JSON con los campos: numero, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta.`;

  const promptUsuario = `=== TEXTO DE LA PLANTILLA DE RESPUESTAS ===
${textoRespuestas}

=== TEXTO DEL EXAMEN OFICIAL ===
${textoExamen}

Instrucciones:
- Cruza cada número de pregunta del examen con su letra oficial de la plantilla de respuestas (A, B, C o D).
- Descarta preguntas que figuren como anuladas en la plantilla.
- Devuelve ÚNICAMENTE el array JSON con: numero, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta.`;

  const payload = {
    model: OPENROUTER_MODEL,
    messages: [
      { role: 'system', content: promptSistema },
      { role: 'user', content: promptUsuario },
    ],
    temperature: 0.1,
    max_tokens: 16000,
  };

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://opobrain.es',
      'X-Title': 'OpoBrAIn Official Exam Extractor',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(`Error en la API de OpenRouter (${response.status} ${response.statusText}): ${errorMsg}`);
  }

  const data = await response.json();
  const contenido = data.choices?.[0]?.message?.content;

  if (!contenido) {
    throw new Error('Respuesta vacía recibida desde OpenRouter.');
  }

  return contenido;
}

/**
 * Valida que cada pregunta tenga los campos requeridos
 */
function validarPreguntas(preguntas) {
  const campos = ['numero', 'enunciado', 'opcion_a', 'opcion_b', 'opcion_c', 'opcion_d', 'respuesta_correcta'];
  return preguntas.filter((p) => {
    const todosCampos = campos.every((c) => p[c] !== undefined && p[c] !== null && String(p[c]).trim() !== '');
    const letraValida = ['A', 'B', 'C', 'D'].includes(String(p.respuesta_correcta).trim().toUpperCase());
    return todosCampos && letraValida;
  }).map((p) => ({
    numero: parseInt(p.numero, 10) || p.numero,
    enunciado: String(p.enunciado).trim(),
    opcion_a: String(p.opcion_a).trim(),
    opcion_b: String(p.opcion_b).trim(),
    opcion_c: String(p.opcion_c).trim(),
    opcion_d: String(p.opcion_d).trim(),
    respuesta_correcta: String(p.respuesta_correcta).trim().toUpperCase(),
  }));
}

/**
 * Flujo principal
 */
async function main() {
  console.log('=================================================================');
  console.log('   OpoBrAIn • Extractor de Exámenes Oficiales (Llama 3 / OpenRouter)');
  console.log('=================================================================\n');

  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Uso:');
    console.log('  node scripts/extractor_oficiales.js <examen.pdf> <respuestas.pdf> [salida.json]\n');
    console.log('Ejemplo:');
    console.log('  node scripts/extractor_oficiales.js "Examen A 2024.pdf" "Respuesta examen A 2024.pdf"\n');
    process.exit(0);
  }

  const rutaExamen = args[0] ? path.resolve(process.cwd(), args[0]) : path.resolve(process.cwd(), 'Examen A 2024.pdf');
  const rutaRespuestas = args[1] ? path.resolve(process.cwd(), args[1]) : path.resolve(process.cwd(), 'Respuesta examen A 2024.pdf');
  const rutaSalida = args[2] ? path.resolve(process.cwd(), args[2]) : path.resolve(process.cwd(), 'preguntas_oficiales.json');

  console.log(`• Examen:     ${rutaExamen}`);
  console.log(`• Plantilla:  ${rutaRespuestas}`);
  console.log(`• Salida:     ${rutaSalida}\n`);

  try {
    // 1. Extraer texto crudo con pdf-parse
    const textoExamen = await extraerTexto(rutaExamen, 'Examen');
    const textoRespuestas = await extraerTexto(rutaRespuestas, 'Plantilla de Respuestas');

    // 2. Procesar con Llama 3 en OpenRouter
    const respuestaIA = await cruzarConOpenRouter(textoExamen, textoRespuestas);

    // 3. Limpiar y parsear JSON
    console.log('🧹 Limpiando formato y validando campos obligatorios...');
    const datosCrudos = limpiarYParsearJSON(respuestaIA);
    const preguntasValidas = validarPreguntas(datosCrudos);

    if (preguntasValidas.length === 0) {
      throw new Error('No se encontraron preguntas válidas con los campos requeridos.');
    }

    // 4. Guardar en archivo local para poblar Neon
    fs.writeFileSync(rutaSalida, JSON.stringify(preguntasValidas, null, 2), 'utf-8');

    console.log('\n=================================================================');
    console.log(`🎉 ¡Extracción completada con éxito!`);
    console.log(`📊 Total preguntas extraídas: ${preguntasValidas.length}`);
    console.log(`💾 Guardadas en: ${rutaSalida}`);
    console.log('=================================================================\n');

    console.log('🔍 Muestra de la primera pregunta extraída:');
    console.log(JSON.stringify(preguntasValidas[0], null, 2));

  } catch (error) {
    console.error('\n❌ ERROR durante la ejecución:');
    console.error(error.message);
    process.exit(1);
  }
}

main();
