import React, { useState, useMemo } from 'react';
import { UserRole } from '../types';
import { generateManualPDF } from '../utils/manualPdfExport';
import {
  BookOpen,
  Download,
  Printer,
  Search,
  ShieldCheck,
  Wrench,
  CheckCircle,
  AlertTriangle,
  FileText,
  Users,
  Database,
  Trash2,
  KeyRound,
  Eye,
  MessageSquare,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
  Info,
  Check,
  Copy,
} from 'lucide-react';
import { SUPABASE_SETUP_SQL } from '../utils/supabaseClient';

interface UserManualViewProps {
  currentRole: UserRole;
  onOpenSqlModal?: () => void;
}

export const UserManualView: React.FC<UserManualViewProps> = ({
  currentRole,
  onOpenSqlModal,
}) => {
  // Allow admins to switch between admin manual and technical manual
  const [activeManualRole, setActiveManualRole] = useState<UserRole>(currentRole);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>('intro');

  const isAdminManual = activeManualRole === 'admin';

  const handleDownload = () => {
    try {
      setIsDownloading(true);
      generateManualPDF(activeManualRole, true);
    } catch (err) {
      console.error('Error generando PDF del manual:', err);
    } finally {
      setTimeout(() => setIsDownloading(false), 1200);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Filter sections by search term
  const matchesSearch = (text: string) => {
    if (!searchTerm.trim()) return true;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-12 max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-neutral-900 via-[#1f1f1f] to-neutral-900 text-white rounded-2xl p-5 sm:p-7 shadow-lg border border-neutral-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-[#D60000] text-white text-[11px] font-mono font-bold px-2.5 py-0.5 rounded shadow-2xs">
                {isAdminManual ? 'SOT-MAN-ADM-01' : 'SOT-MAN-TEC-01'}
              </span>
              <span className="bg-white/10 text-neutral-200 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-red-400" />
                Manual Oficial de Operación
              </span>
              <span className="text-neutral-400 text-xs font-mono">v2.4</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {isAdminManual
                ? 'Manual del Administrador General SOTEX'
                : 'Manual Operativo del Técnico de Servicio en Campo'}
            </h1>

            <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
              {isAdminManual
                ? 'Guía completa de gobierno del sistema: administración de usuarios y roles, altas de empleados, control de contraseñas, auditoría de reportes y borrado de raíz en Supabase.'
                : 'Guía técnica paso a paso para el levantamiento de reportes SOT-REP-CLG-01, diagnóstico de cabezales térmicos, captura de firmas táctiles y operación fuera de línea.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D60000] hover:bg-[#b50000] text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Generando PDF...' : 'Descargar Manual PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer border border-white/10"
              title="Imprimir manual"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </div>

        {/* Role Toggle Selector (Exclusively accessible when admin is logged in) */}
        {currentRole === 'admin' && (
          <div className="mt-6 pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-neutral-300">
              <span className="font-semibold text-neutral-400">Ver versión del manual:</span>
              <div className="bg-neutral-800 p-1 rounded-xl flex items-center gap-1 border border-neutral-700">
                <button
                  type="button"
                  onClick={() => setActiveManualRole('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    isAdminManual
                      ? 'bg-[#D60000] text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Manual Administrador</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveManualRole('tecnico')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    !isAdminManual
                      ? 'bg-[#D60000] text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Manual Técnico</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-neutral-500" />
              <span>Como Administrador puedes consultar y descargar ambos manuales.</span>
            </div>
          </div>
        )}
      </div>

      {/* Search & Quick Navigator Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar tema (ej. cabezal, borrar de raíz, contraseñas, whatsapp)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 w-full sm:w-auto justify-end">
          <span className="font-semibold text-slate-700">Formato:</span>
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[11px]">
            PDF Oficial A4/Carta
          </span>
          <button
            type="button"
            onClick={handleDownload}
            className="text-[#D60000] font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar ahora
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. MANUAL DE ADMINISTRADOR */}
      {/* ======================================================== */}
      {isAdminManual ? (
        <div className="space-y-6">
          {/* Chapter 1: Credenciales y Roles */}
          {matchesSearch('acceso login credenciales roles usuario correo harold carlos contraseña ojito') && (
            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 text-[#D60000] flex items-center justify-center font-black text-sm">
                    1
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Acceso Dual, Credenciales y Cambio de Roles en Supabase
                    </h2>
                    <p className="text-xs text-slate-500">
                      Identificación con Usuario o Correo y gestión de accesos
                    </p>
                  </div>
                </div>
                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  Seguridad
                </span>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed space-y-3">
                <p>
                  El sistema cuenta con un motor de autenticación dual que permite ingresar indistintamente con el <strong>Nombre de Usuario</strong> (ej. <code className="font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded">haroldo90</code> o <code className="font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded">carlos_raya</code>) o con el <strong>Correo Electrónico</strong> registrado.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                      <KeyRound className="w-4 h-4 text-[#D60000]" />
                      <span>Icono del Ojito en Contraseñas</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      En todos los formularios de acceso y registro de empleados se incluye el botón del ojo para alternar la visibilidad de la contraseña y evitar errores de tipografía.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                      <Database className="w-4 h-4 text-emerald-600" />
                      <span>Cambio de Rol desde Supabase</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Si se modifica la columna <code className="font-mono font-bold">rol</code> de un usuario directamente en la tabla <code className="font-mono">employees</code> de Supabase (cambiando entre <code className="font-mono">'admin'</code> y <code className="font-mono">'tecnico'</code>), el sistema actualizará dinámicamente sus permisos en el siguiente inicio de sesión.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-[11px]">
                    <span className="font-bold">Credenciales Administrador Preconfiguradas:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                      <li><strong>Harold Anguiano Morales:</strong> Usuario: <code className="font-mono font-bold">haroldo90</code> | Correo: <code className="font-mono">haroldo90@hotmail.com</code></li>
                      <li><strong>Carlos Raya:</strong> Usuario: <code className="font-mono font-bold">carlos_raya</code> | Correo: <code className="font-mono">carlos_raya@sotex.com.mx</code></li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Chapter 2: Gestión de Empleados */}
          {matchesSearch('empleados técnicos alta contraseña segura whatsapp rol registrar cedula') && (
            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 text-[#D60000] flex items-center justify-center font-black text-sm">
                    2
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Gestión de Empleados, Asignación de Rol y Envío WhatsApp
                    </h2>
                    <p className="text-xs text-slate-500">
                      Altas con contraseñas seguras y notificación instantánea
                    </p>
                  </div>
                </div>
                <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  Administración
                </span>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed space-y-3">
                <p>
                  Como Administrador, tienes el control de todo el personal operativo de SOTEX. Puedes crear nuevos empleados, definir si tendrán acceso como <strong>Administrador</strong> o <strong>Técnico</strong>, y generar contraseñas seguras de grado industrial.
                </p>

                <div className="space-y-2">
                  <span className="font-bold text-slate-900 block">Flujo de Alta de Nuevo Empleado:</span>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <li>Entra al módulo <strong>"Empleados"</strong> y haz clic en <strong>"+ Dar de Alta Empleado"</strong>.</li>
                    <li>Llena los campos obligatorios: Nombre completo, Usuario único de acceso, Correo electrónico y Teléfono.</li>
                    <li>
                      <strong>Asigna el Rol:</strong> Selecciona en el menú desplegable si el usuario será <em>"Técnico de Servicio"</em> o <em>"Administrador"</em>.
                    </li>
                    <li>
                      <strong>Generador de Contraseña Segura:</strong> Haz clic en el botón <em>"Generar Contraseña Segura"</em> con icono de varita mágica para crear automáticamente una clave alfanumérica de alta robustez.
                    </li>
                    <li>Guarda el registro. El empleado se sincronizará de forma automática con la tabla <code className="font-mono text-red-600">employees</code> de Supabase.</li>
                    <li>
                      <strong>Envío por WhatsApp en un toque:</strong> Haz clic en el botón verde <em>"WhatsApp"</em> de la tarjeta del empleado para abrir una conversación con el mensaje de bienvenida y sus credenciales formateadas listas para enviar.
                    </li>
                  </ol>
                </div>
              </div>
            </section>
          )}

          {/* Chapter 3: Borrado de Raíz */}
          {matchesSearch('borrar raíz eliminar registros supabase permanente blacklist seguridad') && (
            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 text-[#D60000] flex items-center justify-center font-black text-sm">
                    3
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Función de Borrado de Raíz en Registros y Empleados
                    </h2>
                    <p className="text-xs text-slate-500">
                      Eliminación permanente local y en Supabase sin reapariciones
                    </p>
                  </div>
                </div>
                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  Operación Crítica
                </span>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed space-y-3">
                <p>
                  El sistema incorpora una arquitectura de <strong>borrado de raíz definitivo</strong> para asegurar que ningún registro eliminado vuelva a manifestarse, incluso si se refresca la página, se recupera el almacenamiento en caché o se resincroniza con Supabase.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">1. Borrado Individual</span>
                    <p className="text-[11px] text-slate-600">
                      En la tabla de reportes o tarjetas de empleados, pulsa el icono de papelera. Se abrirá el modal de confirmación de raíz.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">2. Borrado Masivo</span>
                    <p className="text-[11px] text-slate-600">
                      Marca las casillas de varios reportes en la tabla. Aparecerá la barra negra con el botón rojo <em>"Borrar de Raíz (N)"</em>.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">3. Lista Negra Persistente</span>
                    <p className="text-[11px] text-slate-600">
                      El ID y folio quedan bloqueados permanentemente para garantizar que no vuelvan a cargarse desde ninguna fuente.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-[11px]">
                  <strong>Importante:</strong> Esta acción ejecuta la sentencia <code className="font-mono font-bold">DELETE FROM service_reports WHERE id = ...</code> o <code className="font-mono font-bold">DELETE FROM employees WHERE id = ...</code> directamente en Supabase. No se puede deshacer.
                </div>
              </div>
            </section>
          )}

          {/* Chapter 4: Script SQL y Supabase */}
          {matchesSearch('sql supabase base de datos esquema script tablas rls znlhwxjiwrwcfhswppfx') && (
            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 text-[#D60000] flex items-center justify-center font-black text-sm">
                    4
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Esquema de Base de Datos y Script SQL en Supabase
                    </h2>
                    <p className="text-xs text-slate-500">
                      Proyecto: znlhwxjiwrwcfhswppfx | Tablas employees y service_reports
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? '¡SQL Copiado!' : 'Copiar Script SQL'}</span>
                </button>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed space-y-3">
                <p>
                  Si necesitas verificar o regenerar las tablas en tu consola de Supabase, puedes copiar el código SQL completo y correrlo en <strong>Supabase &gt; SQL Editor &gt; New query</strong>:
                </p>

                <div className="bg-neutral-900 text-emerald-400 font-mono text-[11px] p-4 rounded-xl max-h-48 overflow-y-auto border border-neutral-800 select-all">
                  <pre>{SUPABASE_SETUP_SQL.slice(0, 1200)}...</pre>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Incluye Row Level Security (RLS) habilitado para lectura, inserción, actualización y borrado.</span>
                  {onOpenSqlModal && (
                    <button
                      type="button"
                      onClick={onOpenSqlModal}
                      className="text-[#D60000] font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Database className="w-3.5 h-3.5" />
                      Ver SQL completo en modal
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Chapter 5: Reportes Oficiales SOT-REP-CLG-01 */}
          {matchesSearch('reportes excel pdf visitas sotorclg01 exportar auditoria') && (
            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 text-[#D60000] flex items-center justify-center font-black text-sm">
                    5
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Supervisión de Reportes y Exportación Masiva (Excel / PDF)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Formato físico oficial SOT-REP-CLG-01 y compilados
                    </p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  Formatos
                </span>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed space-y-3">
                <p>
                  Desde el módulo <strong>Reportes</strong>, el Administrador puede supervisar cada visita técnica registrada en las plantas de clientes:
                </p>

                <ul className="list-disc list-inside space-y-1.5 text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <li><strong>Vista Previa Física:</strong> Al hacer clic en el ojo de cada reporte, se despliega la réplica exacta de la hoja física oficial con sellos, logotipos y firmas digitales.</li>
                  <li><strong>Descarga en PDF Individual:</strong> Genera al instante el archivo PDF oficial listo para archivar o imprimir.</li>
                  <li><strong>Compilado Total en PDF:</strong> Con el botón superior <em>"PDF (Todos)"</em> se genera un solo documento con todos los reportes del sistema ordenados.</li>
                  <li><strong>Exportación a Microsoft Excel (.xlsx):</strong> Descarga la base de datos de servicios para informes gerenciales, métricas de fallas de cabezal y facturación.</li>
                </ul>
              </div>
            </section>
          )}
        </div>
      ) : (
        /* ======================================================== */
        /* 2. MANUAL DEL TÉCNICO DE SERVICIO EN CAMPO               */
        /* ======================================================== */
        <div className="space-y-6">
          {/* Chapter 1: Inicio de Sesión y Perfil */}
          {matchesSearch('tecnico inicio sesion perfil firma digital cedula contraseña') && (
            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 text-[#D60000] flex items-center justify-center font-black text-sm">
                    1
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Acceso Técnico y Configuración de Firma Digital
                    </h2>
                    <p className="text-xs text-slate-500">
                      Credenciales de campo y firma para validez de reportes
                    </p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  Paso Inicial
                </span>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed space-y-3">
                <p>
                  Como técnico de SOTEX, cuentas con un usuario y contraseña asignados por la Dirección. Al ingresar:
                </p>

                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <li>Selecciona la opción <strong>"Técnico"</strong> en la pantalla de bienvenida.</li>
                  <li>Escribe tu usuario o correo electrónico y tu contraseña segura.</li>
                  <li>Dirígete al módulo <strong>"Perfil"</strong> para verificar tu nombre, teléfono de guardia y cédula técnica (ej. <code className="font-mono font-bold">TEC-SOT-01</code>).</li>
                  <li>
                    <strong>Firma Digital:</strong> Traza tu firma sobre el panel táctil y presiona <em>"Guardar Perfil"</em>. Tu firma se incrustará automáticamente en todos los reportes de servicio que generes.
                  </li>
                </ol>
              </div>
            </section>
          )}

          {/* Chapter 2: Levantamiento de Reporte SOT-REP-CLG-01 */}
          {matchesSearch('reporte nuevo folio visita equipo zebra sato serie dpi cabezal') && (
            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 text-[#D60000] flex items-center justify-center font-black text-sm">
                    2
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Levantamiento de Reporte Oficial SOT-REP-CLG-01
                    </h2>
                    <p className="text-xs text-slate-500">
                      Registro de visita, datos del cliente e impresora industrial
                    </p>
                  </div>
                </div>
                <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  Campo
                </span>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed space-y-3">
                <p>
                  Al atender a un cliente en planta o taller, el reporte técnico oficial debe completarse minuciosamente:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block text-xs">Datos de la Visita y Cliente</span>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1">
                      <li><strong>Número de Visita:</strong> Visita 1 (Revisión), Visita 2 (Mantenimiento), Visita 3 (Pruebas) o Visita 4 (Entrega final).</li>
                      <li><strong>Empresa y Contacto:</strong> Nombre de la empresa, dirección de la nave y teléfono del encargado.</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block text-xs">Especificaciones del Equipo</span>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1">
                      <li><strong>Marca y Modelo:</strong> Zebra (ZT411, ZT230, etc.), SATO, Honeywell, TSC, Datamax.</li>
                      <li><strong>Resolución DPI:</strong> 203 DPI, 300 DPI o 600 DPI.</li>
                      <li><strong>Número de Serie:</strong> Indispensable para trazabilidad y garantía.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Chapter 3: Diagnóstico y Prueba de Cabezal */}
          {matchesSearch('cabezal prueba diagnóstico foto imagen daños rodillo sensor cutter') && (
            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 text-[#D60000] flex items-center justify-center font-black text-sm">
                    3
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Checklist de Daños y Fotografía de Prueba de Cabezal
                    </h2>
                    <p className="text-xs text-slate-500">
                      Evaluación de puntos térmicos muertos y evidencia gráfica
                    </p>
                  </div>
                </div>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  Diagnóstico
                </span>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed space-y-3">
                <p>
                  El cabezal de impresión térmica es la pieza de mayor desgaste y costo. Es fundamental documentar su estado:
                </p>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-bold text-slate-900 block">Checklist de Daños:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <span className="bg-white p-2 rounded border border-slate-200 font-medium">Cabezal térmico</span>
                    <span className="bg-white p-2 rounded border border-slate-200 font-medium">Rodillo principal</span>
                    <span className="bg-white p-2 rounded border border-slate-200 font-medium">Sensor de papel</span>
                    <span className="bg-white p-2 rounded border border-slate-200 font-medium">Sensor de ribbon</span>
                    <span className="bg-white p-2 rounded border border-slate-200 font-medium">Display / Pantalla</span>
                    <span className="bg-white p-2 rounded border border-slate-200 font-medium">Bandas de tracción</span>
                    <span className="bg-white p-2 rounded border border-slate-200 font-medium">Cutter / Cuchilla</span>
                    <span className="bg-white p-2 rounded border border-slate-200 font-medium">Rebobinador</span>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1.5 text-[11px]">
                  <span className="font-bold block flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Fotografía de Prueba de Cabezal:
                  </span>
                  <p className="text-emerald-800">
                    Realiza una prueba de impresión con patrón de barra negra total. Toma una fotografía o adjunta la imagen en el formulario. La imagen quedará anexada al documento legal para certificar si el cabezal tiene líneas blancas (puntos quemados) o si está 100% operativo.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Chapter 4: Firmas y Entrega */}
          {matchesSearch('firmas cliente entrega tactil pdf completado garantia') && (
            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 text-[#D60000] flex items-center justify-center font-black text-sm">
                    4
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Firma de Conformidad del Cliente y Cierre del Servicio
                    </h2>
                    <p className="text-xs text-slate-500">
                      Validación legal, descarga de PDF y entrega
                    </p>
                  </div>
                </div>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  Cierre Oficial
                </span>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed space-y-3">
                <p>
                  Antes de retirarte de las instalaciones del cliente:
                </p>

                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <li>Registra el Nombre completo y Correo electrónico del encargado de planta.</li>
                  <li>Solicítale que firme en el recuadro digital directamente en tu pantalla o tablet.</li>
                  <li>Establece el estado del servicio según el flujo oficial: <em>1. "En Revisión"</em>, <em>2. "Pendiente Refacción"</em>, <em>3. "Garantía"</em> o <em>4. "Completado"</em>.</li>
                  <li>
                    Haz clic en <strong>"Guardar y Descargar PDF"</strong>. Se generará de inmediato el formato físico oficial SOT-REP-CLG-01 en formato PDF.
                  </li>
                  <li>Puedes enviarle el PDF al cliente por correo electrónico o WhatsApp.</li>
                </ol>
              </div>
            </section>
          )}

          {/* Chapter 5: Modo Offline */}
          {matchesSearch('offline sin conexion internet sincronizacion automatica celular') && (
            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 text-[#D60000] flex items-center justify-center font-black text-sm">
                    5
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Operación Fuera de Línea (Offline) en Naves Industriales
                    </h2>
                    <p className="text-xs text-slate-500">
                      Disponibilidad garantizada sin cobertura de telefonía o WiFi
                    </p>
                  </div>
                </div>
                <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  PWA Offline
                </span>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed space-y-3">
                <p>
                  Las naves industriales frecuentemente carecen de cobertura celular o acceso a red externa. El sistema SOTEX está preparado para operar al 100%:
                </p>

                <ul className="list-disc list-inside space-y-1.5 text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <li>Puedes crear reportes, guardar firmas y descargar PDFs sin conexión activa.</li>
                  <li>Los datos se resguardan de forma segura en la memoria interna del navegador del dispositivo.</li>
                  <li>En cuanto salgas de la planta y tu dispositivo recupere señal, la aplicación sincronizará automáticamente los nuevos reportes con la base de datos de Supabase.</li>
                </ul>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Bottom Download Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D60000] flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">
              ¿Deseas tener este manual impreso o en tu teléfono?
            </h3>
            <p className="text-xs text-slate-400">
              Descarga el documento oficial formateado en PDF con sellos, código oficial y numeración.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D60000] hover:bg-[#b50000] text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{isDownloading ? 'Generando PDF...' : 'Descargar Manual en PDF'}</span>
        </button>
      </div>
    </div>
  );
};
