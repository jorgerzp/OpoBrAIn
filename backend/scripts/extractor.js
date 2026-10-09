/**
 * ============================================================================
 * OpoBrAIn - Script Extractor de Exámenes Oficiales con IA (OpenRouter)
 * ============================================================================
 * Flujo:
 * 1. Extrae el texto del PDF del Examen y de la Plantilla de Respuestas (pdf-parse).
 * 2. Cruza preguntas con su respuesta oficial correcta mediante OpenRouter AI.
 * 3. Valida y limpia el formato JSON estricto.
 * 4. Guarda el resultado en 'preguntas_extraidas.json'.
 *
 * Uso:
 *   node scripts/extractor.js <ruta_examen.pdf> <ruta_respuestas.pdf> [salida.json]
 *   node scripts/extractor.js "Examen A 2024.pdf" "Respuesta examen A 2024.pdf"
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

// Cargar .env buscando tanto en backend/ como en la raíz del proyecto
const envBackend = path.resolve(__dirname, '../.env');
const envCwd = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envBackend)) {
  require('dotenv').config({ path: envBackend });
} else if (fs.existsSync(envCwd)) {
  require('dotenv').config({ path: envCwd });
} else {
  require('dotenv').config();
}

// Configuración de OpenRouter
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
// Modelos recomendados: google/gemini-2.5-flash (1M contexto, salida rápida y económica) o openai/gpt-4o-mini
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Lee y extrae el texto plano de un archivo PDF
 */
async function extraerTextoPDF(rutaArchivo, etiqueta) {
  if (!fs.existsSync(rutaArchivo)) {
    throw new Error(`El archivo de ${etiqueta} no existe en la ruta: "${rutaArchivo}"`);
  }

  console.log(`📄 Leyendo ${etiqueta}: ${path.basename(rutaArchivo)}...`);
  const dataBuffer = fs.readFileSync(rutaArchivo);
  const data = await pdf(dataBuffer);

  console.log(`   ✓ ${etiqueta} leído con éxito (${data.numpages} páginas, ${data.text.length} caracteres)`);
  return data.text;
}

/**
 * Limpia y parsea la respuesta de la IA para obtener un array JSON válido
 */
function parsearJSONSeguro(textoRespuesta) {
  let limpio = textoRespuesta.trim();

  // Eliminar bloques de código markdown ```json ... ```
  if (limpio.startsWith('```json')) {
    limpio = limpio.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (limpio.startsWith('```')) {
    limpio = limpio.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  // Si aún hay texto alrededor, extraer desde el primer '[' hasta el último ']'
  const primerCorchete = limpio.indexOf('[');
  const ultimoCorchete = limpio.lastIndexOf(']');

  if (primerCorchete !== -1 && ultimoCorchete !== -1 && ultimoCorchete > primerCorchete) {
    limpio = limpio.substring(primerCorchete, ultimoCorchete + 1);
  }

  try {
    const datos = JSON.parse(limpio);
    if (!Array.isArray(datos)) {
      throw new Error('La respuesta de la IA no es un Array JSON.');
    }
    return datos;
  } catch (error) {
    console.error('\n❌ Error al parsear JSON devuelto por la IA.');
    console.error('Fragmento de texto recibido (primeros 500 caracteres):\n', limpio.slice(0, 500));
    throw new Error(`Fallo en el parseo JSON: ${error.message}`);
  }
}

/**
 * Llama a la API de OpenRouter con ambos textos
 */
async function procesarConOpenRouter(textoExamen, textoRespuestas) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('Falta OPENROUTER_API_KEY en tu archivo .env. Por favor, añádela para continuar.');
  }

  console.log(`\n🤖 Enviando datos a OpenRouter usando el modelo: [${OPENROUTER_MODEL}]...`);

  const promptSistema = `Eres un asistente experto en digitalización de oposiciones al Cuerpo General Administrativo del Estado (C1) de España.
Tu tarea es analizar el texto extraído de un examen oficial y cruzarlo con la plantilla oficial de respuestas provisional o definitiva.

REGLAS ESTRICTAS DE EXTRACCIÓN:
1. Extrae cada pregunta con su número original.
2. Identifica el enunciado completo (eliminando cabeceras de página, números de página o avisos del tribunal).
3. Separa rigurosamente las 4 opciones de respuesta (opcion_a, opcion_b, opcion_c, opcion_d) sin incluir las letras "a)", "A.", etc. dentro del texto.
4. Cruza el número de cada pregunta con la plantilla de respuestas para determinar la "respuesta_correcta". Debe ser exclusivamente una sola letra mayúscula: "A", "B", "C" o "D".
5. Si una pregunta está anulada en la plantilla de respuestas, descártala del listado.
6. Proporciona una "explicacion" jurídica concisa citando el artículo o norma aplicable si es deducible (ej. Constitución Española, Ley 39/2015 LPAC, Ley 40/2015, TREBEP, Ley 9/2017 de Contratos, Ley General Presupuestaria).
7. Asigna un "tema" temático aproximado del temario C1 (ej. "Tema 1: Constitución", "Tema 11: Ley 39/2015 LPAC", "Tema 15: TREBEP", "Gestión Financiera", "Informática Básica", etc.).
8. FORMATO DE SALIDA OBLIGATORIO:
   Devuelve ÚNICAMENTE un array JSON válido sin texto previo ni posterior, sin explicaciones, sin saludos.
   Estructura exacta por elemento:
   {
     "enunciado": "Texto completo del enunciado",
     "opcion_a": "Texto de la opción A",
     "opcion_b": "Texto de la opción B",
     "opcion_c": "Texto de la opción C",
     "opcion_d": "Texto de la opción D",
     "respuesta_correcta": "A",
     "explicacion": "Fundamento legal conciso",
     "tema": "Tema o bloque temático asignado"
   }`;

  const promptUsuario = `A continuación tienes los dos textos extraídos de los PDFs:

=== PLANTILLA OFICIAL DE RESPUESTAS ===
${textoRespuestas}

=== TEXTO DEL EXAMEN OFICIAL ===
${textoExamen}

Por favor, cruza las preguntas con sus respuestas y devuelve el array JSON con la estructura solicitada.`;

  const payload = {
    model: OPENROUTER_MODEL,
    messages: [
      { role: 'system', content: promptSistema },
      { role: 'user', content: promptUsuario },
    ],
    temperature: 0.1, // Baja temperatura para máxima precisión determinista
    max_tokens: 16000,
  };

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://opobrain.es',
      'X-Title': 'OpoBrAIn Exam Extractor',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error (${response.status} ${response.statusText}): ${errorBody}`);
  }

  const data = await response.json();
  const contenido = data.choices?.[0]?.message?.content;

  if (!contenido) {
    throw new Error('La API de OpenRouter devolvió una respuesta vacía.');
  }

  return contenido;
}

/**
 * Valida la estructura de cada objeto del array
 */
function validarPreguntas(preguntas) {
  const camposObligatorios = [
    'enunciado',
    'opcion_a',
    'opcion_b',
    'opcion_c',
    'opcion_d',
    'respuesta_correcta',
    'explicacion',
    'tema',
  ];

  const validas = [];
  const invalidas = [];

  preguntas.forEach((p, index) => {
    const faltantes = camposObligatorios.filter((campo) => !p[campo]);
    const respuestaValida = ['A', 'B', 'C', 'D'].includes(String(p.respuesta_correcta).trim().toUpperCase());

    if (faltantes.length === 0 && respuestaValida) {
      validas.push({
        ...p,
        respuesta_correcta: p.respuesta_correcta.trim().toUpperCase(),
      });
    } else {
      invalidas.push({ index: index + 1, faltantes, respuesta: p.respuesta_correcta });
    }
  });

  if (invalidas.length > 0) {
    console.warn(`⚠️ Se encontraron ${invalidas.length} preguntas con formato incompleto o descartadas.`);
  }

  return validas;
}

/**
 * Función principal del flujo
 */
async function main() {
  console.log('===============================================================');
  console.log('   OpoBrAIn • Extractor Inteligente de Exámenes C1 a JSON      ');
  console.log('===============================================================\n');

  // Argumentos de línea de comandos
  // node extractor.js <examen.pdf> <respuestas.pdf> [salida.json]
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Modo de uso:');
    console.log('  node scripts/extractor.js <ruta_examen.pdf> <ruta_respuestas.pdf> [salida.json]\n');
    console.log('Ejemplos:');
    console.log('  node scripts/extractor.js "Examen A 2024.pdf" "Respuesta examen A 2024.pdf"');
    console.log('  node scripts/extractor.js "./pdfs/c1_2023.pdf" "./pdfs/respuestas_2023.pdf" "./datos/preguntas_2023.json"\n');
    console.log('Opciones de entorno (.env):');
    console.log('  OPENROUTER_API_KEY   Tu clave de API de OpenRouter (obligatoria)');
    console.log('  OPENROUTER_MODEL     Modelo a usar (por defecto: google/gemini-2.5-flash)\n');
    process.exit(0);
  }

  const rutaExamen = args[0] ? path.resolve(process.cwd(), args[0]) : path.resolve(process.cwd(), 'Examen A 2024.pdf');
  const rutaRespuestas = args[1] ? path.resolve(process.cwd(), args[1]) : path.resolve(process.cwd(), 'Respuesta examen A 2024.pdf');
  const rutaSalida = args[2] ? path.resolve(process.cwd(), args[2]) : path.resolve(process.cwd(), 'preguntas_extraidas.json');

  console.log(`• Archivo de examen:     ${rutaExamen}`);
  console.log(`• Archivo de respuestas: ${rutaRespuestas}`);
  console.log(`• Archivo de destino:    ${rutaSalida}\n`);

  try {
    // 1. Lectura y extracción de texto de ambos PDFs
    const textoExamen = await extraerTextoPDF(rutaExamen, 'Examen');
    const textoRespuestas = await extraerTextoPDF(rutaRespuestas, 'Plantilla de Respuestas');

    // 2. Procesamiento y cruce con la IA
    const respuestaIA = await procesarConOpenRouter(textoExamen, textoRespuestas);

    // 3. Limpieza y parseo de JSON
    console.log('🧹 Limpiando formato y validando estructura JSON...');
    const preguntasCrudas = parsearJSONSeguro(respuestaIA);

    // 4. Validación de campos requeridos
    const preguntasFinales = validarPreguntas(preguntasCrudas);

    if (preguntasFinales.length === 0) {
      throw new Error('No se pudo extraer ninguna pregunta válida.');
    }

    // 5. Guardado en archivo local
    fs.writeFileSync(rutaSalida, JSON.stringify(preguntasFinales, null, 2), 'utf-8');

    console.log('\n===============================================================');
    console.log(`🎉 ¡Extracción completada con éxito!`);
    console.log(`📊 Total de preguntas extraídas y validadas: ${preguntasFinales.length}`);
    console.log(`💾 Guardadas en: ${rutaSalida}`);
    console.log('===============================================================\n');

    // Previsualización de la primera pregunta
    console.log('🔍 Muestra de la primera pregunta extraída:');
    console.log(JSON.stringify(preguntasFinales[0], null, 2));

  } catch (error) {
    console.error('\n❌ ERROR durante la ejecución:');
    console.error(error.message);
    process.exit(1);
  }
}

main();
