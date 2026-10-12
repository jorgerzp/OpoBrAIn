import { getPreguntasPorTema } from './temasBanco';
import { BLOQUES_TEMARIO, BANCO_PREGUNTAS_REALES, getPreguntasPorSeleccion } from './temarioData';
import { statsService } from './statsService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const DEMO_USER_ID = 'a0000000-0000-0000-0000-000000000001';

export const api = {
  getPreguntasPorTema,
  getPreguntasPorSeleccion,
  getBloques() {
    return BLOQUES_TEMARIO;
  },
  // Autenticación de usuarios (admin y Nemesis con contraseña Aprobado)
  async login({ username, password }) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Credenciales inválidas');
      }
      return data;
    } catch (err) {
      console.warn('Usando validación de autenticación local:', err.message);
      const userLower = (username || '').trim().toLowerCase();
      const passTrim = (password || '').trim();

      if ((userLower === 'admin' || userLower === 'nemesis') && (passTrim === 'Aprobado' || passTrim.toLowerCase() === 'aprobado')) {
        const u = userLower === 'admin' 
          ? { id: 'a0000000-0000-0000-0000-000000000001', username: 'admin', nombre: 'Administrador OpoBrAIn', rol: 'admin' }
          : { id: 'a0000000-0000-0000-0000-000000000002', username: 'Nemesis', nombre: 'Nemesis', rol: 'opositor' };
        return {
          success: true,
          message: `¡Bienvenido/a a OpoBrAIn, ${u.nombre}!`,
          user: u,
          token: `token-local-${u.username}`,
        };
      }
      throw new Error(err.message || 'Usuario o contraseña incorrectos.');
    }
  },
  // Obtener lista de bloques y temas oficiales C1
  async getTemas() {
    try {
      const res = await fetch(`${API_BASE_URL}/temas`);
      if (!res.ok) throw new Error('Error al conectar con la API de temas');
      const data = await res.json();
      if (data.bloques) return data.bloques;
      return Array.isArray(data.data) ? data.data : data;
    } catch (err) {
      console.warn('API no disponible, usando temario estructurado oficial:', err.message);
      return BLOQUES_TEMARIO;
    }
  },

  // Obtener batería de 10 preguntas oficiales (consulta a DB preguntas_oficiales)
  async getTestOficiales() {
    try {
      const res = await fetch(`${API_BASE_URL}/test/oficiales`);
      if (!res.ok) throw new Error('Error al obtener preguntas oficiales');
      const data = await res.json();
      return data.data;
    } catch (err) {
      console.warn('Usando banco de respaldo de preguntas oficiales:', err.message);
      return getFallbackOficiales();
    }
  },

  // Generar test dinámico con IA para un tema específico (OpenRouter / Llama 3)
  async generarTestTema(tema, bloque = 'Temario Oficial C1 AGE') {
    const nombreTema = typeof tema === 'object' ? (tema.titulo || tema.nombre || 'Tema') : (tema || 'Tema');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout max para no dejar al usuario esperando

      const res = await fetch(`${API_BASE_URL}/test/generar-tema`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ 
          tema: nombreTema, 
          bloque,
          nombre_tema: nombreTema 
        }),
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error('Error en el servidor al generar test con IA');
      const data = await res.json();
      if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
        throw new Error('Formato de datos no válido');
      }
      return data.data;
    } catch (err) {
      console.warn('Usando generador contextual de contingencia para tema:', nombreTema, err.message);
      return getPreguntasPorTema(nombreTema);
    }
  },

  // Obtener batería de errores (repaso real)
  async getTestRepaso(usuarioId = DEMO_USER_ID) {
    // 1. Priorizar preguntas reales falladas por el usuario
    const realErrors = statsService.getDashboardSummary().preguntasParaRepaso;
    if (realErrors && realErrors.length > 0) {
      return realErrors;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/test/repaso`, {
        headers: { 'x-usuario-id': usuarioId },
      });
      if (!res.ok) throw new Error('Error al obtener batería de errores');
      const data = await res.json();
      if (data.data && data.data.length > 0) return data.data;
    } catch (err) {}
    return getFallbackOficiales().slice(0, 5);
  },

  // Enviar respuesta
  async responderPregunta({ preguntaId, respuestaSeleccionada, usuarioId = DEMO_USER_ID }) {
    try {
      const res = await fetch(`${API_BASE_URL}/test/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pregunta_id: preguntaId,
          respuesta_seleccionada: respuestaSeleccionada,
          usuario_id: usuarioId,
        }),
      });
      if (!res.ok) throw new Error('Error en el servidor al responder');
      return await res.json();
    } catch (err) {
      const q = getFallbackOficiales().find((item) => item.id === preguntaId);
      const esCorrecta = q ? q.respuesta_correcta === respuestaSeleccionada : true;
      return {
        success: true,
        es_correcta: esCorrecta,
        respuesta_correcta: q?.respuesta_correcta || 'A',
        explicacion: q?.explicacion || 'Explicación del artículo correspondiente.',
      };
    }
  },
};

function getFallbackOficiales() {
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
