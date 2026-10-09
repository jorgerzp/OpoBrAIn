const db = require('../config/db');

// Lista oficial completa de temas de la oposición C1 del Estado con su número exacto
const TEMAS_OFICIALES_C1 = [
  { numero: 1, titulo: "Tema 1: La Constitución Española de 1978: Principios y Valores Superiores", bloque: "I. Organización del Estado" },
  { numero: 2, titulo: "Tema 2: La Corona, las Cortes Generales y el Poder Judicial", bloque: "I. Organización del Estado" },
  { numero: 3, titulo: "Tema 3: El Gobierno y la Administración General del Estado (AGE)", bloque: "I. Organización del Estado" },
  { numero: 4, titulo: "Tema 4: Organización Territorial del Estado: Comunidades Autónomas y Administración Local", bloque: "I. Organización del Estado" },
  { numero: 5, titulo: "Tema 5: La Unión Europea: Tratados, Competencias e Instituciones Comunitarias", bloque: "I. Organización del Estado" },
  { numero: 6, titulo: "Tema 6: El Procedimiento Administrativo Común (I): Fases, Interesados y Plazos (Ley 39/2015)", bloque: "II. Actividad Administrativa" },
  { numero: 7, titulo: "Tema 7: El Procedimiento Administrativo Común (II): Actos Administrativos, Eficacia y Nulidad", bloque: "II. Actividad Administrativa" },
  { numero: 8, titulo: "Tema 8: Los Recursos Administrativos y la Revisión de Actos en Vía Administrativa", bloque: "II. Actividad Administrativa" },
  { numero: 9, titulo: "Tema 9: Régimen Jurídico del Sector Público y Funcionamiento Electrónico (Ley 40/2015)", bloque: "II. Actividad Administrativa" },
  { numero: 10, titulo: "Tema 10: Estatuto Básico del Empleado Público (TREBEP): Clases de Personal y Selección", bloque: "III. Recursos Humanos" },
  { numero: 11, titulo: "Tema 11: Derechos, Deberes, Régimen Disciplinario e Incompatibilidades del Empleado Público", bloque: "III. Recursos Humanos" },
  { numero: 12, titulo: "Tema 12: Situaciones Administrativas y Provisión de Puestos de Trabajo en la AGE", bloque: "III. Recursos Humanos" },
  { numero: 13, titulo: "Tema 13: Contratos del Sector Público: Tipos, Procedimientos y Adjudicación (Ley 9/2017)", bloque: "IV. Gestión Financiera" },
  { numero: 14, titulo: "Tema 14: Gestión Presupuestaria y Fases del Gasto Público en la AGE (Ley General Presupuestaria)", bloque: "IV. Gestión Financiera" },
  { numero: 15, titulo: "Tema 15: Políticas de Igualdad de Género, Diversidad y Contra la Violencia Machista", bloque: "I. Organización del Estado" },
  { numero: 16, titulo: "Tema 16: Protección de Datos Personales (RGPD y LOPDGDD), Transparencia y Buen Gobierno", bloque: "V. Administración Digital" },
  { numero: 17, titulo: "Tema 17: Informática Básica, Ofimática, Ciberseguridad y Administración Electrónica", bloque: "V. Administración Digital" },
];

/**
 * GET /api/temas
 * Devuelve la lista oficial con cada tema numerado (Tema 1, Tema 2, etc.)
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
      });
    }

    res.json({
      success: true,
      data: TEMAS_OFICIALES_C1,
    });
  } catch (error) {
    res.json({
      success: true,
      data: TEMAS_OFICIALES_C1,
    });
  }
};

module.exports = {
  getTemas,
  TEMAS_OFICIALES_C1,
};
