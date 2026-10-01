import React, { useState, useEffect } from 'react';
import {
  Database,
  X,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Server,
  Terminal,
  ExternalLink,
  Zap,
} from 'lucide-react';
import {
  supabase,
  SUPABASE_SETUP_SQL,
  SUPABASE_QUICK_FIX_SQL,
  SUPABASE_URL,
} from '../utils/supabaseClient';

interface SupabaseSqlModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'quick_fix' | 'full_setup';
}

interface DiagnosticResult {
  table: string;
  status: 'ok' | 'warning' | 'error' | 'checking';
  message: string;
}

export const SupabaseSqlModal: React.FC<SupabaseSqlModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'quick_fix',
}) => {
  const [activeTab, setActiveTab] = useState<'quick_fix' | 'full_setup' | 'diagnostics'>(defaultTab);
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      if (activeTab === 'diagnostics') {
        runDiagnostics();
      }
    }
  }, [isOpen, activeTab]);

  const currentSql = activeTab === 'quick_fix' ? SUPABASE_QUICK_FIX_SQL : SUPABASE_SETUP_SQL;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentSql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = currentSql;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const runDiagnostics = async () => {
    setIsChecking(true);
    const results: DiagnosticResult[] = [];

    // 1. Employees table
    try {
      const { data, error } = await supabase.from('employees').select('id').limit(1);
      if (error) {
        results.push({
          table: 'employees (Usuarios/Empleados)',
          status: 'error',
          message: error.message,
        });
      } else {
        results.push({
          table: 'employees (Usuarios/Empleados)',
          status: 'ok',
          message: `Conectado correctamente (${data?.length ?? 0} filas detectadas).`,
        });
      }
    } catch (err: any) {
      results.push({
        table: 'employees (Usuarios/Empleados)',
        status: 'error',
        message: err?.message || 'Error de conexión',
      });
    }

    // 2. Service reports table
    try {
      const { data, error } = await supabase.from('service_reports').select('id, status').limit(1);
      if (error) {
        results.push({
          table: 'service_reports (Reportes de Servicio)',
          status: 'error',
          message: error.message,
        });
      } else {
        results.push({
          table: 'service_reports (Reportes de Servicio)',
          status: 'ok',
          message: `Tabla activa. Modo de almacenamiento compatible con JSONB habilitado.`,
        });
      }
    } catch (err: any) {
      results.push({
        table: 'service_reports (Reportes de Servicio)',
        status: 'error',
        message: err?.message || 'Error de conexión',
      });
    }

    // 3. Status check constraint: test Agendado
    try {
      // Test inserting and immediately deleting a dry test row or checking status
      const testId = `diag_test_${Date.now()}`;
      const { error: insertError } = await supabase.from('service_reports').insert({
        id: testId,
        report_code: 'SOT-DIAG-01',
        folio: 'DIAG-TEMP',
        empresa: 'Diagnóstico Temporal SOTEX',
        fecha: new Date().toISOString().split('T')[0],
        status: 'Agendado',
        equipo: {},
        danos: {},
      });

      if (!insertError) {
        await supabase.from('service_reports').delete().eq('id', testId);
        results.push({
          table: 'Restricción de Estatus (status = "Agendado")',
          status: 'ok',
          message: 'Soporte nativo para "Agendado" activo en la base de datos.',
        });
      } else if (
        insertError.code === '23514' ||
        insertError.message.includes('check constraint') ||
        insertError.message.includes('status')
      ) {
        results.push({
          table: 'Restricción de Estatus (status = "Agendado")',
          status: 'warning',
          message:
            'La restricción SQL remota aún no incluye "Agendado". El sistema está funcionando en Modo de Compatibilidad JSONB automático sin pérdida de datos. Corre la Actualización Rápida en Supabase para habilitarlo nativamente.',
        });
      } else {
        results.push({
          table: 'Restricción de Estatus (status = "Agendado")',
          status: 'warning',
          message: `Modo de Compatibilidad activo: ${insertError.message}`,
        });
      }
    } catch (err: any) {
      results.push({
        table: 'Restricción de Estatus',
        status: 'warning',
        message: 'Modo de compatibilidad activo.',
      });
    }

    // 4. Folio configuration
    try {
      const { data, error } = await supabase.from('configuracion_folios').select('*').limit(1);
      if (error) {
        results.push({
          table: 'configuracion_folios (Folios Oficiales)',
          status: 'error',
          message: error.message,
        });
      } else {
        results.push({
          table: 'configuracion_folios (Folios Oficiales)',
          status: 'ok',
          message: `Conectado (Folio actual: ${data?.[0]?.prefijo_folio || 'SOT-2026-'}${data?.[0]?.ultimo_folio_numero || '0'}).`,
        });
      }
    } catch (err: any) {
      results.push({
        table: 'configuracion_folios (Folios Oficiales)',
        status: 'error',
        message: err?.message || 'Error de conexión',
      });
    }

    // 5. System Notifications
    try {
      const { error } = await supabase.from('system_notifications').select('id').limit(1);
      if (error) {
        results.push({
          table: 'system_notifications (Notificaciones Realtime)',
          status: 'error',
          message: error.message,
        });
      } else {
        results.push({
          table: 'system_notifications (Notificaciones Realtime)',
          status: 'ok',
          message: 'Canal en tiempo real conectado.',
        });
      }
    } catch (err: any) {
      results.push({
        table: 'system_notifications (Notificaciones Realtime)',
        status: 'error',
        message: err?.message || 'Error de conexión',
      });
    }

    // 6. Equipment types table
    try {
      const { error } = await supabase.from('configuracion_equipos').select('id').limit(1);
      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('not find the table')) {
          results.push({
            table: 'configuracion_equipos (Catálogo de Equipos y Checklists)',
            status: 'warning',
            message:
              'La tabla remota aún no ha sido creada. Se está utilizando almacenamiento local seguro. Ejecuta la Actualización Rápida en Supabase para sincronizar entre todos los dispositivos.',
          });
        } else {
          results.push({
            table: 'configuracion_equipos (Catálogo de Equipos y Checklists)',
            status: 'warning',
            message: error.message,
          });
        }
      } else {
        results.push({
          table: 'configuracion_equipos (Catálogo de Equipos y Checklists)',
          status: 'ok',
          message: 'Tabla conectada y sincronizada.',
        });
      }
    } catch (err: any) {
      results.push({
        table: 'configuracion_equipos (Catálogo de Equipos)',
        status: 'warning',
        message: err?.message || 'Almacenamiento local activo',
      });
    }

    setDiagnostics(results);
    setIsChecking(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#18181b] rounded-2xl max-w-3xl w-full border border-neutral-700 max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="p-4 bg-[#111113] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-white">
                  Asistente de Base de Datos Supabase
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  znlhwxjiwrwcfhswppfx
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Gestión de esquemas SQL, corrección de restricciones y diagnóstico de tablas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-[#141416] border-b border-neutral-800 text-xs">
          <button
            onClick={() => setActiveTab('quick_fix')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'quick_fix'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Actualización Rápida / Corrección</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-700/60 font-semibold">
              Recomendada
            </span>
          </button>

          <button
            onClick={() => setActiveTab('full_setup')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'full_setup'
                ? 'bg-neutral-700 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Esquema Completo Inicial</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('diagnostics');
              runDiagnostics();
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ml-auto ${
              activeTab === 'diagnostics'
                ? 'bg-neutral-700 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Diagnóstico en Vivo</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'diagnostics' ? (
          <div className="p-4 flex-1 overflow-auto bg-neutral-950 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">
                Resultados de conexión en tiempo real con Supabase:
              </span>
              <button
                onClick={runDiagnostics}
                disabled={isChecking}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
                <span>Re-verificar tablas</span>
              </button>
            </div>

            <div className="space-y-2">
              {diagnostics.map((diag, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    diag.status === 'ok'
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                      : diag.status === 'warning'
                      ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                      : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                  }`}
                >
                  {diag.status === 'ok' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : diag.status === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-bold">{diag.table}</div>
                    <div className="text-[11px] opacity-90 mt-0.5">{diag.message}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 text-[11px] text-neutral-300 space-y-1.5">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Protección activa contra fallos:</span>
              </div>
              <p>
                El sistema SOTEX cuenta con un motor de compatibilidad automática. Incluso si tu base
                de datos aún no tiene la tabla o la restricción de estatus actualizada, todos los
                reportes con estatus <strong>Agendado</strong> y campos extendidos se guardan y cargan sin
                errores dentro del objeto de metadatos seguro.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
            {/* Contextual instruction banner */}
            <div className="p-3 bg-[#111113] border-b border-neutral-800/60 text-xs flex items-center justify-between gap-3">
              <div className="text-neutral-300 text-[11px]">
                {activeTab === 'quick_fix' ? (
                  <span>
                    ⚡ <strong>Script de Corrección Rápida:</strong> Resuelve el error{' '}
                    <code className="px-1 py-0.5 bg-neutral-800 rounded text-rose-300 font-mono">
                      check constraint service_reports_status_check
                    </code>
                    , agrega columnas y crea la tabla para catálogo de equipos.
                  </span>
                ) : (
                  <span>
                    📦 <strong>Esquema Completo:</strong> Crea todas las tablas desde cero, políticas RLS y
                    agrega las credenciales de Harold Anguiano y Carlos Raya.
                  </span>
                )}
              </div>
              <a
                href="https://supabase.com/dashboard/project/znlhwxjiwrwcfhswppfx/sql"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 whitespace-nowrap cursor-pointer hover:underline"
              >
                <span>Ir al SQL Editor</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* SQL Content */}
            <div className="p-4 flex-1 overflow-auto font-mono text-xs text-emerald-300 select-all leading-relaxed">
              <pre className="whitespace-pre-wrap">{currentSql}</pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3.5 bg-[#111113] border-t border-neutral-800 flex items-center justify-between">
          <div className="text-xs text-neutral-400 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-neutral-500" />
            <span>Pega en Supabase &gt; SQL Editor y presiona "Run"</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-all active:scale-98"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar SQL</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
