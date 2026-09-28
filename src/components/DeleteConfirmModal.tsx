import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2, Database, ShieldAlert } from 'lucide-react';
import { ServiceReport, Employee } from '../types';

export type DeleteTarget =
  | { type: 'report'; report: ServiceReport }
  | { type: 'employee'; employee: Employee }
  | { type: 'bulk_reports'; reports: ServiceReport[] };

interface DeleteConfirmModalProps {
  isOpen: boolean;
  target: DeleteTarget | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  target,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !target) return null;

  const handleExecuteDelete = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Error al eliminar registro:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 overflow-y-auto backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-red-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Borrar Registro de Raíz
              </h3>
              <p className="text-xs text-red-100 mt-0.5">
                Eliminación permanente local y en Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-slate-700">
          <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Advertencia de seguridad:</p>
              <p className="text-amber-800 leading-relaxed">
                Esta acción eliminará de forma irreversible el registro de la base de datos de <strong>Supabase</strong> y de la memoria del sistema. No se podrá recuperar ni volverá a mostrarse.
              </p>
            </div>
          </div>

          {/* Target details */}
          {target.type === 'report' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Folio Oficial:</span>
                <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  {target.report.folio}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Empresa:</span>
                <span className="font-bold text-slate-800 text-right truncate max-w-[240px]">
                  {target.report.empresa}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Fecha:</span>
                <span className="font-mono text-slate-700">{target.report.fecha}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Equipo:</span>
                <span className="text-slate-700">
                  {target.report.equipo?.marca} {target.report.equipo?.modelo} (S/N: {target.report.equipo?.noSerie || 'N/D'})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Técnico:</span>
                <span className="text-slate-700">{target.report.tecnicoNombre}</span>
              </div>
            </div>
          )}

          {target.type === 'employee' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Empleado:</span>
                <span className="font-bold text-slate-900">{target.employee.nombre}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Usuario / Login:</span>
                <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  {target.employee.usuario || target.employee.correo}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Correo Electrónico:</span>
                <span className="font-mono text-slate-700">{target.employee.correo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Rol Asignado:</span>
                <span className={`px-2 py-0.5 rounded font-bold capitalize ${
                  target.employee.rol === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {target.employee.rol === 'admin' ? 'Administrador' : 'Técnico'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Sucursal:</span>
                <span className="text-slate-700">{target.employee.sucursal}</span>
              </div>
            </div>
          )}

          {target.type === 'bulk_reports' && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Reportes a eliminar definitivamente:</span>
                <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded font-mono">
                  {target.reports.length} registros
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 divide-y divide-slate-200 text-xs">
                {target.reports.map((r) => (
                  <div key={r.id} className="py-1.5 px-2 flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-red-600">{r.folio}</span>
                    <span className="text-slate-700 truncate max-w-[200px]">{r.empresa}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{r.fecha}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-100 p-2.5 rounded-lg">
            <Database className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Sincronización con tabla <code>service_reports</code> y <code>employees</code> en Supabase (znlhwxjiwrwcfhswppfx).
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleExecuteDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Borrando de Raíz...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Confirmar y Borrar de Raíz</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
