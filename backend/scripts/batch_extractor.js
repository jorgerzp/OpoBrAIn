/**
 * ============================================================================
 * OpoBrAIn - Procesador por Lotes de Exámenes Oficiales (batch_extractor.js)
 * ============================================================================
 * Flujo:
 * 1. Recorre recursivamente la carpeta local /examenes.
 * 2. Por cada archivo con el patrón 'examen_{AÑO}_{MODELO}.pdf', busca su
 *    correspondiente 'respuestas_{AÑO}_{MODELO}.pdf'.
 * 3. Extrae el texto con pdf-parse.
 * 4. Cruza cada pregunta con su respuesta oficial por número mediante IA (OpenRouter).
 * 5. Inserta el lote en Neon (PostgreSQL) en la tabla 'preguntas_oficiales' con:
 *    enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, año (anio), modelo.
 *
 * Uso:
 *   node scripts/batch_extractor.js [ruta_carpeta_examenes]
 *   node scripts/batch_extractor.js ./examenes
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { Pool } = require('pg');

// Cargar variables de entorno desde backend/.env o la raíz
const envBackend = path.resolve(__dirname, '../.env');
const envCwd = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envBackend)) {
  require('dotenv').config({ path: envBackend });
} else if (fs.existsSync(envCwd)) {
  require('dotenv').config({ path: envCwd });
} else {
  require('dotenv').config();
}

// Configuración OpenRouter y PostgreSQL
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('neon.tech') || process.env.NODE_ENV === 'production')
    ? { rejectUnauthorized: false }
    : false,
});

/**
 * Recorre recursivamente un directorio y devuelve todas las rutas de archivos
 */
function obtenerArchivosRecursivo(dir, lista = []) {
  if (!fs.existsSync(dir)) return lista;
  const entradas = fs.readdirSync(dir, { withFileTypes: true });

  for (const entrada of entradas) {
    const rutaCompleta = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      obtenerArchivosRecursivo(rutaCompleta, lista);
    } else if (entrada.isFile()) {
      lista.push(rutaCompleta);
    }
  }
  return lista;
}

/**
 * Busca parejas examen_{AÑO}_{MODELO}.pdf y respuestas_{AÑO}_{MODELO}.pdf
 */
function encontrarParejasExamenes(carpetaExamenes) {
  const todosLosArchivos = obtenerArchivosRecursivo(carpetaExamenes);
  const regexExamen = /^examen_(\d{4})_([A-Za-z0-9_-]+)\.pdf$/i;

  const parejas = [];

  for (const rutaExamen of todosLosArchivos) {
    const nombreArchivo = path.basename(rutaExamen);
    const coincidencia = nombreArchivo.match(regexExamen);

    if (coincidencia) {
      const anio = parseInt(coincidencia[1], 10);
      const modelo = coincidencia[2].toUpperCase();
      const directorio = path.dirname(rutaExamen);

      // Posibles variantes del nombre de la plantilla de respuestas
      const nombresPosiblesRespuestas = [
        `respuestas_${anio}_${modelo}.pdf`,
        `respuestas_${anio}_${coincidencia[2]}.pdf`,
        `respuesta_${anio}_${modelo}.pdf`,
        `respuesta_${anio}_${coincidencia[2]}.pdf`,
        `plantilla_${anio}_${modelo}.pdf`,
      ];

      let rutaRespuestas = null;
      for (const nombreResp of nombresPosiblesRespuestas) {
        const rutaCandidata = path.join(directorio, nombreResp);
        if (fs.existsSync(rutaCandidata)) {
          rutaRespuestas = rutaCandidata;
          break;
        }
      }

      // Si no está en el mismo directorio, buscar en todos los archivos escaneados
      if (!rutaRespuestas) {
        rutaRespuestas = todosLosArchivos.find((f) => {
          const base = path.basename(f).toLowerCase();
          return (
            base === `respuestas_${anio}_${modelo.toLowerCase()}.pdf` ||
            base === `respuesta_${anio}_${modelo.toLowerCase()}.pdf`
          );
        });
      }

      parejas.push({
        anio,
        modelo,
        rutaExamen,
        rutaRespuestas,
      });
    }
  }

  return parejas;
}

/**
 * Extrae texto plano de un PDF
 */
async function extraerTextoPDF(ruta) {
  const buffer = fs.readFileSync(ruta);
  const data = await pdf(buffer);
  return data.text;
}

/**
 * Limpia y parsea la respuesta JSON devuelta por la IA
 */
function parsearJSONSeguro(textoCrudo) {
  let limpio = textoCrudo.trim();
  if (limpio.startsWith('```json')) limpio = limpio.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (limpio.startsWith('```')) limpio = limpio.replace(/^```\s*/, '').replace(/\s*```$/, '');

  const primerCorchete = limpio.indexOf('[');
  const ultimoCorchete = limpio.lastIndexOf(']');
  if (primerCorchete !== -1 && ultimoCorchete !== -1 && ultimoCorchete > primerCorchete) {
    limpio = limpio.substring(primerCorchete, ultimoCorchete + 1);
  }

  return JSON.parse(limpio);
}

/**
 * Cruza examen y respuestas usando OpenRouter (Llama 3)
 */
async function procesarExamenConIA(textoExamen, textoRespuestas, anio, modelo) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('No se detectó OPENROUTER_API_KEY en .env');
  }

  const promptSistema = `Eres un procesador de datos para oposiciones al Cuerpo General Administrativo del Estado (C1) de España.
Tu tarea es extraer preguntas del texto de un examen en PDF y sus respuestas oficiales de otro PDF.
Debes buscar el número de la pregunta en el examen, extraer su enunciado y sus 4 opciones (A, B, C, D).
Luego, busca ESE MISMO NÚMERO exacto en la plantilla de respuestas para determinar la letra correcta (A, B, C o D).
Descarta preguntas anuladas.
Devuelve EXCLUSIVAMENTE un array JSON válido sin texto adicional con los campos:
numero, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, explicacion`;

  const promptUsuario = `Año: ${anio} | Modelo: ${modelo}

=== TEXTO DE LA PLANTILLA DE RESPUESTAS ===
${textoRespuestas}

=== TEXTO DEL EXAMEN ===
${textoExamen}

Devuelve el array JSON con cada pregunta emparejada.`;

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://opobrain.es',
      'X-Title': 'OpoBrAIn Batch Extractor',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: promptSistema },
        { role: 'user', content: promptUsuario },
      ],
      temperature: 0.1,
      max_tokens: 16000,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter HTTP ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const contenido = data.choices?.[0]?.message?.content;
  if (!contenido) throw new Error('Respuesta vacía desde OpenRouter');

  return parsearJSONSeguro(contenido);
}

/**
 * Inserta el lote de preguntas en la tabla preguntas_oficiales de PostgreSQL Neon
 */
async function guardarEnBaseDeDatos(preguntas, anio, modelo) {
  const client = await pool.connect();
  let insertadas = 0;

  try {
    await client.query('BEGIN');

    // Asegurar que la tabla existe con los campos requeridos
    await client.query(`
      CREATE TABLE IF NOT EXISTS preguntas_oficiales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        numero INT,
        anio INT,
        modelo VARCHAR(50),
        enunciado TEXT NOT NULL,
        opcion_a TEXT NOT NULL,
        opcion_b TEXT NOT NULL,
        opcion_c TEXT NOT NULL,
        opcion_d TEXT NOT NULL,
        respuesta_correcta CHAR(1) NOT NULL CHECK (respuesta_correcta IN ('A', 'B', 'C', 'D')),
        explicacion TEXT,
        fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const insertQuery = `
      INSERT INTO preguntas_oficiales 
        (enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, anio, modelo, numero, explicacion)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id;
    `;

    for (const p of preguntas) {
      const letra = String(p.respuesta_correcta || '').trim().toUpperCase();
      if (!['A', 'B', 'C', 'D'].includes(letra)) continue;

      await client.query(insertQuery, [
        String(p.enunciado).trim(),
        String(p.opcion_a).trim(),
        String(p.opcion_b).trim(),
        String(p.opcion_c).trim(),
        String(p.opcion_d).trim(),
        letra,
        anio,
        modelo,
        parseInt(p.numero, 10) || null,
        p.explicacion || null,
      ]);
      insertadas++;
    }

    await client.query('COMMIT');
    return insertadas;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Función Principal
 */
async function main() {
  console.log('========================================================================');
  console.log('   OpoBrAIn • Procesador por Lotes de Exámenes Oficiales (Neon DB)      ');
  console.log('========================================================================\n');

  // Carpeta destino (por defecto /examenes relativa a la raíz o backend)
  const args = process.argv.slice(2);
  let carpetaExamenes = args[0]
    ? path.resolve(process.cwd(), args[0])
    : path.resolve(process.cwd(), 'examenes');

  // Si no existe en process.cwd(), revisar en la raíz del proyecto
  if (!fs.existsSync(carpetaExamenes)) {
    const rutaAlternativa = path.resolve(__dirname, '../../examenes');
    if (fs.existsSync(rutaAlternativa)) {
      carpetaExamenes = rutaAlternativa;
    }
  }

  console.log(`📁 Buscando exámenes recursivamente en: "${carpetaExamenes}"\n`);

  if (!fs.existsSync(carpetaExamenes)) {
    console.log(`⚠️ La carpeta "${carpetaExamenes}" no existe aún.`);
    console.log(`💡 Creando carpeta de ejemplo para que puedas colocar tus PDFs:`);
    fs.mkdirSync(carpetaExamenes, { recursive: true });
    console.log(`   Directorio listo: ${carpetaExamenes}`);
    console.log(`   Coloca tus archivos con el patrón: examen_{AÑO}_{MODELO}.pdf y respuestas_{AÑO}_{MODELO}.pdf\n`);
    process.exit(0);
  }

  const parejas = encontrarParejasExamenes(carpetaExamenes);

  if (parejas.length === 0) {
    console.log(`⚠️ No se encontraron archivos con el formato "examen_{AÑO}_{MODELO}.pdf" en "${carpetaExamenes}".`);
    console.log('Ejemplo de nombres válidos:');
    console.log('  - examen_2024_A.pdf  con  respuestas_2024_A.pdf');
    console.log('  - examen_2023_B.pdf  con  respuestas_2023_B.pdf\n');
    process.exit(0);
  }

  console.log(`🔎 Se encontraron ${parejas.length} exámenes para procesar:\n`);
  parejas.forEach((p, idx) => {
    console.log(` [${idx + 1}] Examen: Año ${p.anio} | Modelo ${p.modelo}`);
    console.log(`     Examen PDF:     ${path.basename(p.rutaExamen)}`);
    console.log(`     Respuestas PDF: ${p.rutaRespuestas ? path.basename(p.rutaRespuestas) : '❌ NO ENCONTRADA'}`);
  });
  console.log('\n------------------------------------------------------------------------\n');

  let totalPreguntasIngestadas = 0;

  for (const pareja of parejas) {
    const { anio, modelo, rutaExamen, rutaRespuestas } = pareja;

    if (!rutaRespuestas) {
      console.warn(`⏭️ Omitiendo examen_${anio}_${modelo}.pdf porque falta su archivo de respuestas.`);
      continue;
    }

    console.log(`⚙️ Procesando: Examen ${anio} (Modelo ${modelo})...`);

    try {
      // 1. Extraer texto plano de ambos PDFs
      const textoExamen = await extraerTextoPDF(rutaExamen);
      const textoRespuestas = await extraerTextoPDF(rutaRespuestas);
      console.log(`   ✓ Textos leídos con éxito. Enviando a OpenRouter (${OPENROUTER_MODEL})...`);

      // 2. Procesar cruce de preguntas y respuestas con IA
      const preguntas = await procesarExamenConIA(textoExamen, textoRespuestas, anio, modelo);
      console.log(`   ✓ IA procesó ${preguntas.length} preguntas correctamente.`);

      // 3. Guardar copia de seguridad en JSON local
      const backupPath = path.join(path.dirname(rutaExamen), `extraido_${anio}_${modelo}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(preguntas, null, 2), 'utf-8');

      // 4. Ingestar en la base de datos PostgreSQL Neon
      if (process.env.DATABASE_URL) {
        console.log(`   📥 Insertando lote en Neon (tabla: preguntas_oficiales)...`);
        const insertadas = await guardarEnBaseDeDatos(preguntas, anio, modelo);
        totalPreguntasIngestadas += insertadas;
        console.log(`   ✅ Guardadas ${insertadas} preguntas en la base de datos.`);
      } else {
        console.warn('   ⚠️ DATABASE_URL no configurada en .env. Lote guardado únicamente en JSON local.');
      }
    } catch (err) {
      console.error(`   ❌ Error procesando examen_${anio}_${modelo}.pdf:`, err.message);
    }
    console.log('');
  }

  console.log('========================================================================');
  console.log(`🎉 Proceso finalizado. Total preguntas agregadas a Neon: ${totalPreguntasIngestadas}`);
  console.log('========================================================================\n');

  await pool.end();
}

main();
