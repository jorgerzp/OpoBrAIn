-- ============================================================================
-- OpoBrAIn - Base de Datos PostgreSQL (Optimizada para Neon Serverless)
-- Oposiciones Cuerpo General Administrativo del Estado (C1)
-- ============================================================================

-- Habilitar extensión para generación de UUIDs (PostgreSQL 13+ incluye gen_random_uuid por defecto)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABLA: usuarios
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. TABLA: temas
-- Estructura del temario oficial C1 (Organización del Estado, Procedimiento, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS temas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero INT NOT NULL UNIQUE,
    titulo_tema VARCHAR(255) NOT NULL,
    bloque VARCHAR(100) DEFAULT 'I. Organización del Estado y de la Administración Pública'
);

-- ----------------------------------------------------------------------------
-- 3. TABLA: preguntas
-- Banco de preguntas oficiales y por temario
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preguntas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tema_id UUID REFERENCES temas(id) ON DELETE SET NULL,
    anio_examen INT, -- Año del examen oficial (ej. 2023, 2022) o NULL si es de refuerzo
    enunciado TEXT NOT NULL,
    opcion_a TEXT NOT NULL,
    opcion_b TEXT NOT NULL,
    opcion_c TEXT NOT NULL,
    opcion_d TEXT NOT NULL,
    respuesta_correcta CHAR(1) NOT NULL CHECK (respuesta_correcta IN ('A', 'B', 'C', 'D')),
    explicacion TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. TABLA: historial_errores (Batería de Errores)
-- Registra los fallos de cada usuario. Se actualiza mediante UPSERT.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historial_errores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    pregunta_id UUID NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
    veces_fallada INT DEFAULT 1 CHECK (veces_fallada >= 0),
    fecha_ultimo_fallo TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    superado BOOLEAN DEFAULT FALSE,
    CONSTRAINT uq_usuario_pregunta UNIQUE (usuario_id, pregunta_id)
);

-- ----------------------------------------------------------------------------
-- ÍNDICES PARA ALTO RENDIMIENTO (Neon Free Tier Index Optimization)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_preguntas_tema_id ON preguntas(tema_id);
CREATE INDEX IF NOT EXISTS idx_preguntas_anio_examen ON preguntas(anio_examen);
CREATE INDEX IF NOT EXISTS idx_historial_errores_usuario ON historial_errores(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_errores_superado ON historial_errores(usuario_id, superado);

-- ----------------------------------------------------------------------------
-- 5. TABLA: preguntas_oficiales
-- Banco de preguntas extraídas de exámenes oficiales del INAP
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preguntas_oficiales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero INT,
    anio INT, -- Año del examen oficial (ej. 2024, 2023)
    modelo VARCHAR(50) DEFAULT 'A', -- Modelo de examen (ej. A, B)
    enunciado TEXT NOT NULL,
    opcion_a TEXT NOT NULL,
    opcion_b TEXT NOT NULL,
    opcion_c TEXT NOT NULL,
    opcion_d TEXT NOT NULL,
    respuesta_correcta CHAR(1) NOT NULL CHECK (respuesta_correcta IN ('A', 'B', 'C', 'D')),
    explicacion TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_preguntas_oficiales_anio_modelo ON preguntas_oficiales(anio, modelo);
