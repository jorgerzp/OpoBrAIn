const db = require('../config/db');

// Lista oficial completa de los 6 Bloques y 45 Temas de la oposición C1 del Estado
const BLOQUES_OFICIALES_C1 = [
  {
    id: 'bloque-1',
    numero: 'I',
    numeroRomano: 'Bloque I',
    nombre: 'Organización del Estado y de la Administración pública',
    temas: [
      { numero: 1, titulo: 'La Constitución Española de 1978: estructura y contenido. Derechos y deberes fundamentales, garantía y suspensión, Tribunal Constitucional, Defensor del Pueblo y reforma' },
      { numero: 2, titulo: 'La Jefatura del Estado. La Corona: funciones constitucionales del Rey. Sucesión y regencia' },
      { numero: 3, titulo: 'Las Cortes Generales: composición, atribuciones y funcionamiento del Congreso de los Diputados y del Senado' },
      { numero: 4, titulo: 'El Poder Judicial. El Consejo General del Poder Judicial. El Tribunal Supremo. La organización judicial española' },
      { numero: 5, titulo: 'El Gobierno y la Administración. El Presidente, el Consejo de Ministros, designación, causas de cese y responsabilidad. Relaciones con las Cortes' },
      { numero: 6, titulo: 'El Gobierno Abierto: concepto y principios. La Agenda 2030 y los Objetivos de Desarrollo Sostenible' },
      { numero: 7, titulo: 'La Ley 19/2013, de 9 de diciembre, de transparencia, acceso a la información pública y buen gobierno' },
      { numero: 8, titulo: 'La Administración General del Estado: órganos centrales, superiores y directivos, órganos territoriales y la Administración del Estado en el Exterior' },
      { numero: 9, titulo: 'La Organización territorial del Estado: las Comunidades Autónomas, distribución de competencias y Estatutos de Autonomía' },
      { numero: 10, titulo: 'La Administración local: entidades que la integran. La provincia, el municipio y la isla' },
      { numero: 11, titulo: 'La organización de la Unión Europea: Consejo Europeo, Consejo, Parlamento, Comisión y Tribunal de Justicia, y efectos de la integración europea sobre el Estado español' },
    ]
  },
  {
    id: 'bloque-2',
    numero: 'II',
    numeroRomano: 'Bloque II',
    nombre: 'Organización de oficinas públicas',
    temas: [
      { numero: 1, titulo: 'Atención al público y atención a personas con discapacidad. Servicios de información administrativa. Iniciativas, reclamaciones, quejas y peticiones' },
      { numero: 2, titulo: 'Concepto de documento, registro y archivo. Funciones del registro y del archivo. Clases de archivo y criterios de ordenación' },
      { numero: 3, titulo: 'Administración electrónica y servicios al ciudadano: servicios telemáticos, oficinas integradas, ventanilla única empresarial y Punto de Acceso General' },
      { numero: 4, titulo: 'La protección de datos personales y su régimen jurídico: responsable y encargado del tratamiento, autoridad de protección de datos y derechos digitales' },
    ]
  },
  {
    id: 'bloque-3',
    numero: 'III',
    numeroRomano: 'Bloque III',
    nombre: 'Derecho administrativo general',
    temas: [
      { numero: 1, titulo: 'Las fuentes del derecho administrativo: jerarquía, la ley, decreto-ley y decreto legislativo, el reglamento' },
      { numero: 2, titulo: 'El acto administrativo: concepto, clases y elementos. Eficacia, validez, motivación y notificación' },
      { numero: 3, titulo: 'Procedimiento administrativo común (Ley 39/2015) y régimen jurídico del sector público (Ley 40/2015): iniciación, ordenación, instrucción y terminación; revisión de oficio, recursos y contencioso-administrativo' },
      { numero: 4, titulo: 'Los contratos del sector público: concepto y clases, preparación, adjudicación, cumplimiento y extinción' },
      { numero: 5, titulo: 'Procedimientos y formas de la actividad administrativa: limitación, arbitral, servicio público y fomento' },
      { numero: 6, titulo: 'La responsabilidad patrimonial de las Administraciones públicas: concepto, clases, requisitos y efectos' },
      { numero: 7, titulo: 'Políticas de igualdad y contra la violencia de género, no discriminación de las personas LGTBI, discapacidad y dependencia' },
    ]
  },
  {
    id: 'bloque-4',
    numero: 'IV',
    numeroRomano: 'Bloque IV',
    nombre: 'Gestión de personal',
    temas: [
      { numero: 1, titulo: 'El personal al servicio de las Administraciones públicas: concepto y clases, EBEP y Registro Central de Personal' },
      { numero: 2, titulo: 'Selección de personal y su conexión con la Oferta de Empleo Público. Acceso al empleo público y provisión de las personas con discapacidad' },
      { numero: 3, titulo: 'Funcionarios de carrera e interinos. La selección de los funcionarios' },
      { numero: 4, titulo: 'Adquisición y pérdida de la condición de funcionario. Situaciones administrativas: supuestos y efectos' },
      { numero: 5, titulo: 'Provisión de puestos de trabajo. Deberes y derechos, carrera administrativa y promoción interna' },
      { numero: 6, titulo: 'Las incompatibilidades. Régimen disciplinario: faltas, sanciones y procedimiento' },
      { numero: 7, titulo: 'El régimen de la Seguridad Social de los funcionarios: la MUFACE y las clases pasivas' },
      { numero: 8, titulo: 'El personal laboral de la AGE: selección, derechos, deberes e incompatibilidades. El IV Convenio único' },
      { numero: 9, titulo: 'El régimen de la Seguridad Social del personal laboral: acción protectora y prestaciones' },
    ]
  },
  {
    id: 'bloque-5',
    numero: 'V',
    numeroRomano: 'Bloque V',
    nombre: 'Gestión financiera',
    temas: [
      { numero: 1, titulo: 'El presupuesto: concepto, principios presupuestarios, ciclo presupuestario y presupuesto por programas' },
      { numero: 2, titulo: 'El presupuesto del Estado: estructura, clasificación de créditos, gastos plurianuales y modificaciones presupuestarias' },
      { numero: 3, titulo: 'Ejecución del presupuesto de gasto y control: fase administrativa y contable, ordenación del pago, control del gasto y Tribunal de Cuentas' },
      { numero: 4, titulo: 'Retribuciones e indemnizaciones. Nóminas: estructura, sueldos, trienios, pagas extraordinarias, devengo y pago' },
      { numero: 5, titulo: 'Gastos, pagos, anticipos de caja fija y pagos «a justificar». Gestión económica y financiera de contratos y subvenciones' },
      { numero: 6, titulo: 'Gestión económica y financiera de los contratos del sector público y de las subvenciones' },
    ]
  },
  {
    id: 'bloque-6',
    numero: 'VI',
    numeroRomano: 'Bloque VI',
    nombre: 'Informática básica y ofimática',
    temas: [
      { numero: 1, titulo: 'Informática básica: hardware y software, almacenamiento, sistemas operativos y seguridad informática' },
      { numero: 2, titulo: 'Introducción al sistema operativo: el entorno Windows, ventanas, iconos, menús y escritorio' },
      { numero: 3, titulo: 'El explorador de Windows: carpetas, archivos, búsqueda y herramientas del sistema' },
      { numero: 4, titulo: 'Procesadores de texto: Word 365' },
      { numero: 5, titulo: 'Hojas de cálculo: Excel 365' },
      { numero: 6, titulo: 'Bases de datos: Access 365' },
      { numero: 7, titulo: 'Correo electrónico: Outlook 365' },
      { numero: 8, titulo: 'La Red Internet: origen, protocolos y navegadores' },
    ]
  },
];

// Lista aplanada para compatibilidad
const TEMAS_OFICIALES_C1 = BLOQUES_OFICIALES_C1.flatMap((b) =>
  b.temas.map((t) => ({
    id: `${b.id}-t${t.numero}`,
    bloqueId: b.id,
    bloque: `${b.numeroRomano}: ${b.nombre}`,
    bloqueNumero: b.numero,
    numero: t.numero,
    titulo: `Tema ${t.numero}: ${t.titulo}`,
    tituloCorto: t.titulo,
  }))
);

/**
 * GET /api/temas
 * Devuelve la lista oficial agrupada por bloques y la lista plana
 */
const getTemas = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT numero, titulo_tema, bloque FROM temas ORDER BY numero ASC');

    if (rows && rows.length > 0) {
      const temasFormateados = rows.map((r) => ({
        numero: r.numero,
        titulo: `Tema ${r.numero}: ${r.titulo_tema.replace(/^Tema \d+:\s*/i, '')}`,
        bloque: r.bloque || 'Temario General C1',
      }));

      return res.json({
        success: true,
        data: temasFormateados,
        bloques: BLOQUES_OFICIALES_C1,
      });
    }

    res.json({
      success: true,
      data: TEMAS_OFICIALES_C1,
      bloques: BLOQUES_OFICIALES_C1,
    });
  } catch (error) {
    res.json({
      success: true,
      data: TEMAS_OFICIALES_C1,
      bloques: BLOQUES_OFICIALES_C1,
    });
  }
};

module.exports = {
  getTemas,
  BLOQUES_OFICIALES_C1,
  TEMAS_OFICIALES_C1,
};
