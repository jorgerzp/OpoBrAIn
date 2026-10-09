-- ============================================================================
-- OpoBrAIn - Datos de Prueba Semilla (seed.sql)
-- Preguntas Reales Oposiciones Administrativo del Estado (C1)
-- ============================================================================

-- Usuario demo inicial
INSERT INTO usuarios (id, nombre, email)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Opositora C1 Demo', 'demo@opobrain.es')
ON CONFLICT (email) DO NOTHING;

-- Temas representativos del temario C1 AGE
INSERT INTO temas (id, numero, titulo_tema, bloque) VALUES
('b0000000-0000-0000-0000-000000000001', 1, 'La Constitución Española de 1978: Características, principios y valores superiores', 'I. Organización del Estado'),
('b0000000-0000-0000-0000-000000000002', 2, 'La Corona y las Cortes Generales: Composición, atribuciones y funcionamiento', 'I. Organización del Estado'),
('b0000000-0000-0000-0000-000000000003', 11, 'Ley 39/2015 del Procedimiento Administrativo Común: Fases, interesados y derechos', 'II. Actividad Administrativa'),
('b0000000-0000-0000-0000-000000000004', 12, 'Los actos administrativos: Eficacia, validez, nulidad y anulabilidad', 'II. Actividad Administrativa'),
('b0000000-0000-0000-0000-000000000005', 18, 'El Estatuto Básico del Empleado Público (TREBEP): Clases de personal y derechos', 'III. Organización de la AGE')
ON CONFLICT (numero) DO NOTHING;

-- Preguntas oficiales reales y explicadas
INSERT INTO preguntas (id, tema_id, anio_examen, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, explicacion) VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    2023,
    'Según el artículo 1.2 de la Constitución Española de 1978, ¿en quién reside la soberanía nacional?',
    'En el Rey como Jefe del Estado',
    'En las Cortes Generales',
    'En el pueblo español, del que emanan los poderes del Estado',
    'En el Presidente del Gobierno',
    'C',
    'El art. 1.2 CE establece expresamente: "La soberanía nacional reside en el pueblo español, del que emanan los poderes del Estado".'
),
(
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000003',
    2023,
    'Según la Ley 39/2015 (LPAC), ¿cuál es el plazo general máximo para notificar una resolución expresa cuando las normas reguladoras no fijen plazo?',
    '1 mes',
    '3 meses',
    '6 meses',
    '20 días hábiles',
    'B',
    'Según el art. 21.3 LPAC, cuando las normas reguladoras de los procedimientos no fijen el plazo máximo, este será de tres meses contado según las reglas del precepto.'
),
(
    'c0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000004',
    2022,
    'De acuerdo con el artículo 47 de la Ley 39/2015, los actos de las Administraciones Públicas que lesionen derechos y libertades susceptibles de amparo constitucional son:',
    'Anulables de pleno derecho',
    'Nulos de pleno derecho',
    'Convalidables en el plazo de 1 mes',
    'Válidos si no se recurren en 10 días',
    'B',
    'El art. 47.1.a) LPAC dispone que son nulos de pleno derecho los actos de las Administraciones Públicas que lesionen los derechos y libertades susceptibles de amparo constitucional.'
),
(
    'c0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000005',
    2022,
    'Conforme al TREBEP (Real Decreto Legislativo 5/2015), ¿cuál de los siguientes NO es una clase de personal empleado público?',
    'Funcionarios de carrera',
    'Personal laboral',
    'Personal eventual',
    'Personal becario directivo',
    'D',
    'El art. 8 del TREBEP clasifica a los empleados públicos en: Funcionarios de carrera, funcionarios interinos, personal laboral y personal eventual. El "personal becario directivo" no existe como categoría.'
),
(
    'c0000000-0000-0000-0000-000000000005',
    'b0000000-0000-0000-0000-000000000002',
    2021,
    'Según el artículo 68 de la Constitución Española, el Congreso de los Diputados se compone de un mínimo y un máximo de diputados de:',
    '250 y 350 diputados',
    '300 y 400 diputados',
    '350 y 450 diputados',
    '300 y 350 diputados',
    'B',
    'El art. 68.1 CE señala: "El Congreso se compone de un mínimo de 300 y un máximo de 400 Diputados, elegidos por sufragio universal, libre, igual, directo y secreto".'
)
ON CONFLICT (id) DO NOTHING;

-- Registro de error demo en historial_errores
INSERT INTO historial_errores (usuario_id, pregunta_id, veces_fallada, superado)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000003',
    2,
    FALSE
)
ON CONFLICT (usuario_id, pregunta_id) DO NOTHING;

-- Banco de preguntas oficiales iniciales
INSERT INTO preguntas_oficiales (numero, anio_examen, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, explicacion) VALUES
(1, 2024, 'Según el artículo 1.2 de la Constitución Española de 1978, ¿en quién reside la soberanía nacional?', 'En el Rey como Jefe del Estado', 'En las Cortes Generales', 'En el pueblo español, del que emanan los poderes del Estado', 'En el Presidente del Gobierno', 'C', 'El art. 1.2 CE establece: "La soberanía nacional reside en el pueblo español, del que emanan los poderes del Estado".'),
(2, 2024, 'Según la Ley 39/2015 (LPAC), ¿cuál es el plazo general máximo para notificar una resolución expresa cuando las normas reguladoras no fijen plazo?', '1 mes', '3 meses', '6 meses', '20 días hábiles', 'B', 'Según el art. 21.3 LPAC, cuando las normas no fijen plazo, será de tres meses.'),
(3, 2024, 'De acuerdo con el artículo 47 de la Ley 39/2015, los actos de las Administraciones Públicas que lesionen los derechos y libertades susceptibles de amparo constitucional son:', 'Anulables', 'Nulos de pleno derecho', 'Convalidables', 'Válidos provisionalmente', 'B', 'El art. 47.1.a LPAC dispone la nulidad de pleno derecho de estos actos.'),
(4, 2024, 'Conforme al Estatuto Básico del Empleado Público (TREBEP), ¿cuál de los siguientes NO es una clase de empleado público?', 'Funcionarios de carrera', 'Personal laboral', 'Personal eventual', 'Personal becario directivo', 'D', 'El art. 8 del TREBEP no contempla al personal becario directivo.'),
(5, 2024, 'Según el artículo 68 de la Constitución Española, el Congreso de los Diputados se compone de un mínimo y un máximo de diputados de:', '250 y 350', '300 y 400', '350 y 450', '300 y 350', 'B', 'El art. 68.1 de la CE fija la horquilla entre 300 y 400 Diputados.'),
(6, 2024, 'De acuerdo con la Ley 40/2015, ¿cuál es el órgano competente para la creación, modificación y supresión de los Departamentos Ministeriales?', 'El Consejo de Ministros', 'El Rey a propuesta de las Cortes', 'El Presidente del Gobierno mediante Real Decreto', 'El Ministro de Hacienda', 'C', 'Art. 57.1 Ley 40/2015: Se determinan por Real Decreto del Presidente del Gobierno.'),
(7, 2024, 'Según la Ley 9/2017 de Contratos del Sector Público, los contratos menores de obras son aquellos cuyo valor estimado es inferior a:', '15.000 euros', '40.000 euros', '50.000 euros', '18.000 euros', 'B', 'Art. 118 Ley 9/2017: Contratos menores de obras inferiores a 40.000 euros.'),
(8, 2024, 'Conforme a la Ley General Presupuestaria, el ejercicio presupuestario coincidirá con:', 'El año natural', 'El período legislativo', 'El curso escolar', 'El ejercicio fiscal bianual', 'A', 'Art. 34 LGP: El ejercicio presupuestario coincidirá con el año natural.'),
(9, 2024, 'Según el artículo 14 de la Ley 39/2015, están obligados a relacionarse a través de medios electrónicos con las Administraciones Públicas para efectuar cualquier trámite:', 'Las personas físicas en cualquier caso', 'Las personas jurídicas y entidades sin personalidad jurídica', 'Solo los funcionarios públicos', 'Exclusivamente las empresas cotizadas en bolsa', 'B', 'Art. 14.2.a LPAC: Las personas jurídicas están obligadas en todo caso.'),
(10, 2024, 'El recurso de alzada ante el superior jerárquico regulado en la LPAC se interpondrá en el plazo de:', '1 mes si el acto es expreso', '15 días hábiles', '2 meses en todo caso', '3 meses improrrogables', 'A', 'Art. 122.1 LPAC: 1 mes si el acto es expreso.')
ON CONFLICT DO NOTHING;
