import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://znlhwxjiwrwcfhswppfx.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGh3eGppd3J3Y2Zoc3dwcGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNTM2MzcsImV4cCI6MjEwNTgyOTYzN30.hC42UwtrkyiboLLSgf6Xjj4CUYiKTCqo4b1DXh2NxWo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Script de Actualización Rápida y Corrección de Restricciones en Supabase:
 * Corrige el error "violates check constraint service_reports_status_check" agregando 'Agendado',
 * agrega las columnas necesarias a service_reports y crea la tabla configuracion_equipos.
 */
export const SUPABASE_QUICK_FIX_SQL = `-- ========================================================
-- SOTEX: ACTUALIZACIÓN Y CORRECCIÓN INMEDIATA DE SUPABASE
-- Proyecto: znlhwxjiwrwcfhswppfx
-- Ejecutar en: Supabase Dashboard > SQL Editor > Run
-- ========================================================

-- 1. Actualizar la restricción de estatus para admitir 'Agendado'
ALTER TABLE public.service_reports DROP CONSTRAINT IF EXISTS service_reports_status_check;
ALTER TABLE public.service_reports ADD CONSTRAINT service_reports_status_check 
    CHECK (status IN ('Agendado', 'En Revisión', 'Pendiente Refacción', 'Garantía', 'Completado'));

-- 2. Asegurar columnas avanzadas en service_reports
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS tipo_servicio TEXT DEFAULT 'campo';
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS evidencias_fotos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS aceptada_por_tecnico BOOLEAN DEFAULT false;
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS fecha_aceptada TIMESTAMPTZ;
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS tecnico_id TEXT;
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS fecha_agenda DATE;
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS contacto_nombre TEXT DEFAULT '';
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS servicios_realizar JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS tipo_equipo_nombre TEXT DEFAULT '';
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS foto_antes TEXT;
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS foto_despues TEXT;
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS danos_dinamicos JSONB DEFAULT '{}'::jsonb;

-- 3. Crear tabla para catálogo dinámico de equipos y checklists
CREATE TABLE IF NOT EXISTS public.configuracion_equipos (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    checklists JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
ALTER TABLE public.configuracion_equipos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en configuracion_equipos" ON public.configuracion_equipos;
CREATE POLICY "Permitir todo en configuracion_equipos" ON public.configuracion_equipos FOR ALL USING (true) WITH CHECK (true);

-- 4. Habilitar sincronización en tiempo real (de forma segura e idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'service_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.service_reports;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'configuracion_equipos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.configuracion_equipos;
  END IF;
END $$;
`;

/**
 * SQL Schema completo para ejecutar en el Editor SQL de Supabase:
 * Incluye tablas de empleados/usuarios y reportes de servicio,
 * políticas de seguridad y las 2 credenciales de Administrador solicitadas.
 */
export const SUPABASE_SETUP_SQL = `-- ========================================================
-- SISTEMA SOTEX - ESQUEMA DE BASE DE DATOS SUPABASE
-- Proyecto: znlhwxjiwrwcfhswppfx
-- ========================================================

-- 1. CREACIÓN DE LA TABLA DE EMPLEADOS / USUARIOS
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    usuario TEXT UNIQUE NOT NULL,
    correo TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'tecnico' CHECK (rol IN ('admin', 'tecnico')),
    telefono TEXT DEFAULT '',
    puesto TEXT DEFAULT 'Técnico de Servicio',
    sucursal TEXT DEFAULT 'Guadalajara (Matriz)',
    cedula_tecnica TEXT DEFAULT '',
    activo BOOLEAN DEFAULT true,
    foto_url TEXT,
    firma_digital TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para API pública/anon
DROP POLICY IF EXISTS "Permitir lectura publica de empleados" ON public.employees;
CREATE POLICY "Permitir lectura publica de empleados"
ON public.employees FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion de empleados" ON public.employees;
CREATE POLICY "Permitir insercion de empleados"
ON public.employees FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizacion de empleados" ON public.employees;
CREATE POLICY "Permitir actualizacion de empleados"
ON public.employees FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir eliminacion de empleados" ON public.employees;
CREATE POLICY "Permitir eliminacion de empleados"
ON public.employees FOR DELETE USING (true);


-- 2. CREACIÓN DE LA TABLA DE REPORTES DE SERVICIO (SOT-REP-CLG-01)
CREATE TABLE IF NOT EXISTS public.service_reports (
    id TEXT PRIMARY KEY,
    report_code TEXT NOT NULL DEFAULT 'SOT-REP-CLG-01',
    folio TEXT NOT NULL,
    tipo_servicio TEXT NOT NULL DEFAULT 'campo' CHECK (tipo_servicio IN ('campo', 'sotex')),
    empresa TEXT NOT NULL,
    fecha DATE NOT NULL,
    direccion TEXT DEFAULT '',
    telefono TEXT DEFAULT '',
    num_visita INTEGER NOT NULL DEFAULT 1,
    equipo JSONB NOT NULL DEFAULT '{}'::jsonb,
    danos JSONB NOT NULL DEFAULT '{}'::jsonb,
    descripcion_danos TEXT DEFAULT '',
    prueba_cabezal_resultado TEXT DEFAULT '',
    prueba_cabezal_imagen TEXT,
    evidencias_fotos JSONB DEFAULT '[]'::jsonb,
    cliente_nombre TEXT DEFAULT '',
    cliente_email TEXT DEFAULT '',
    cliente_firma TEXT,
    tecnico_nombre TEXT DEFAULT '',
    tecnico_firma TEXT,
    tecnico_id TEXT,
    aceptada_por_tecnico BOOLEAN DEFAULT false,
    fecha_aceptada TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'En Revisión',
    fecha_agenda DATE,
    contacto_nombre TEXT DEFAULT '',
    servicios_realizar JSONB DEFAULT '[]'::jsonb,
    tipo_equipo_nombre TEXT DEFAULT '',
    foto_antes TEXT,
    foto_despues TEXT,
    danos_dinamicos JSONB DEFAULT '{}'::jsonb,
    observaciones_generales TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Si la tabla ya existía, agregar columnas nuevas y actualizar check de estatus de forma idempotente:
ALTER TABLE public.service_reports DROP CONSTRAINT IF EXISTS service_reports_status_check;
ALTER TABLE public.service_reports ADD CONSTRAINT service_reports_status_check CHECK (status IN ('Agendado', 'En Revisión', 'Pendiente Refacción', 'Garantía', 'Completado'));
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS tipo_servicio TEXT DEFAULT 'campo';
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS evidencias_fotos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS aceptada_por_tecnico BOOLEAN DEFAULT false;
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS fecha_aceptada TIMESTAMPTZ;
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS tecnico_id TEXT;
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS fecha_agenda DATE;
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS contacto_nombre TEXT DEFAULT '';
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS servicios_realizar JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS tipo_equipo_nombre TEXT DEFAULT '';
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS foto_antes TEXT;
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS foto_despues TEXT;
ALTER TABLE public.service_reports ADD COLUMN IF NOT EXISTS danos_dinamicos JSONB DEFAULT '{}'::jsonb;

-- Tabla para catálogo dinámico de equipos y checklists:
CREATE TABLE IF NOT EXISTS public.configuracion_equipos (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    checklists JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
ALTER TABLE public.configuracion_equipos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en configuracion_equipos" ON public.configuracion_equipos;
CREATE POLICY "Permitir todo en configuracion_equipos" ON public.configuracion_equipos FOR ALL USING (true) WITH CHECK (true);

-- Habilitar RLS en reportes con permisos totales (SELECT, INSERT, UPDATE, DELETE)
ALTER TABLE public.service_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo en reportes" ON public.service_reports;
CREATE POLICY "Permitir todo en reportes"
ON public.service_reports FOR ALL USING (true) WITH CHECK (true);


-- 3. TABLA DE CONFIGURACIÓN DE FOLIO OFICIAL Y CÓDIGO CONSECUTIVO
CREATE TABLE IF NOT EXISTS public.configuracion_folios (
    id TEXT PRIMARY KEY DEFAULT 'config_principal',
    prefijo_folio TEXT DEFAULT 'SOT-2026-',
    ultimo_folio_numero INTEGER DEFAULT 5,
    codigo_formato_actual TEXT DEFAULT 'SOT-REP-CLG-01',
    ceros_padding INTEGER DEFAULT 3,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.configuracion_folios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo en configuracion_folios" ON public.configuracion_folios;
CREATE POLICY "Permitir todo en configuracion_folios"
ON public.configuracion_folios FOR ALL USING (true);

INSERT INTO public.configuracion_folios (id, prefijo_folio, ultimo_folio_numero, codigo_formato_actual, ceros_padding)
VALUES ('config_principal', 'SOT-2026-', 5, 'SOT-REP-CLG-01', 3)
ON CONFLICT (id) DO NOTHING;


-- 4. TABLA DE NOTIFICACIONES EN TIEMPO REAL
CREATE TABLE IF NOT EXISTS public.system_notifications (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    tipo TEXT NOT NULL,
    orden_id TEXT,
    folio TEXT,
    destinatario_rol TEXT NOT NULL,
    destinatario_tecnico TEXT,
    remitente_nombre TEXT,
    leida BOOLEAN DEFAULT false,
    accion_requerida BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo en system_notifications" ON public.system_notifications;
CREATE POLICY "Permitir todo en system_notifications"
ON public.system_notifications FOR ALL USING (true);


-- 5. INSERTAR CREDENCIALES SOLICITADAS (ROLES ADMIN)
-- Credencial 1: Harold Anguiano Morales
INSERT INTO public.employees (
    id,
    nombre,
    usuario,
    correo,
    password,
    rol,
    telefono,
    puesto,
    sucursal,
    cedula_tecnica,
    activo
) VALUES (
    'emp-haroldo-01',
    'Harold Anguiano Morales',
    'haroldo90',
    'haroldo90@hotmail.com',
    'Chevropar#1970',
    'admin',
    '3312345678',
    'Director / Administrador General',
    'Guadalajara (Matriz)',
    'SOT-DIR-01',
    true
) ON CONFLICT (id) DO NOTHING;

-- Credencial 2: Carlos Raya (Juan Carlos Rayo Vargas)
INSERT INTO public.employees (
    id,
    nombre,
    usuario,
    correo,
    password,
    rol,
    telefono,
    puesto,
    sucursal,
    cedula_tecnica,
    activo
) VALUES (
    'emp-carlos-raya-02',
    'Juan Carlos Rayo Vargas',
    'c.rayo@sotex.com.mx',
    'c.rayo@sotex.com.mx',
    'Sotex#Raya2024*9X',
    'admin',
    '3336158920',
    'Administrador de Operaciones',
    'Guadalajara (Matriz)',
    'SOT-ADM-02',
    true
) ON CONFLICT (id) DO NOTHING;

-- Verificación de usuarios insertados
SELECT id, nombre, usuario, correo, rol, puesto, activo FROM public.employees;

-- 6. HABILITAR REALTIME EN TODAS LAS TABLAS DE SOTEX (De forma segura e idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'system_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.system_notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'service_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.service_reports;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'employees'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'configuracion_folios'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.configuracion_folios;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'configuracion_equipos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.configuracion_equipos;
  END IF;
END $$;
`;
