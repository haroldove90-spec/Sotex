import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://znlhwxjiwrwcfhswppfx.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGh3eGppd3J3Y2Zoc3dwcGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNTM2MzcsImV4cCI6MjEwNTgyOTYzN30.hC42UwtrkyiboLLSgf6Xjj4CUYiKTCqo4b1DXh2NxWo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    cliente_nombre TEXT DEFAULT '',
    cliente_email TEXT DEFAULT '',
    cliente_firma TEXT,
    tecnico_nombre TEXT DEFAULT '',
    tecnico_firma TEXT,
    status TEXT NOT NULL DEFAULT 'Completado',
    observaciones_generales TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS en reportes
ALTER TABLE public.service_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo en reportes" ON public.service_reports;
CREATE POLICY "Permitir todo en reportes"
ON public.service_reports FOR ALL USING (true);


-- 3. INSERTAR CREDENCIALES SOLICITADAS (ROLES ADMIN)
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
) ON CONFLICT (usuario) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    correo = EXCLUDED.correo,
    password = EXCLUDED.password,
    rol = EXCLUDED.rol;

-- Credencial 2: Carlos Raya (con contraseña segura generada)
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
    'Carlos Raya',
    'carlos_raya',
    'carlos_raya@sotex.com.mx',
    'Sotex#Raya2024*9X',
    'admin',
    '3336158920',
    'Administrador de Operaciones',
    'Guadalajara (Matriz)',
    'SOT-ADM-02',
    true
) ON CONFLICT (usuario) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    correo = EXCLUDED.correo,
    password = EXCLUDED.password,
    rol = EXCLUDED.rol;

-- Verificación de usuarios insertados
SELECT id, nombre, usuario, correo, rol, puesto, activo FROM public.employees;
`;
