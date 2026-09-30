import React from 'react';
import { ServiceReport, UserRole, SystemNotification } from '../types';
import {
  Bell,
  CheckCircle2,
  Clock,
  MapPin,
  Building,
  Printer,
  ChevronRight,
  X,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface FloatingNotificationAlertProps {
  report: ServiceReport;
  notification?: SystemNotification | null;
  currentRole: UserRole | null;
  onAccept?: (report: ServiceReport) => void;
  onView: (report: ServiceReport) => void;
  onDismiss: () => void;
  technicianName: string;
}

export const FloatingNotificationAlert: React.FC<FloatingNotificationAlertProps> = ({
  report,
  notification,
  currentRole,
  onAccept,
  onView,
  onDismiss,
  technicianName,
}) => {
  const isAdmin = currentRole === 'admin';
  const isStatusChange = notification?.tipo === 'cambio_estatus';
  const isOrderAccepted = notification?.tipo === 'orden_aceptada';

  // Status badge styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En Revisión':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Pendiente Refacción':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Garantía':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Completado':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <aside
      aria-label="Notificación flotante en tiempo real"
      className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-55 max-w-md w-[calc(100vw-2rem)] animate-bounce-short"
    >
      <div className={`bg-neutral-900 text-white rounded-2xl border-2 shadow-2xl overflow-hidden backdrop-blur-md ring-4 ${
        isAdmin ? 'border-amber-500/80 ring-amber-500/20' : 'border-emerald-500/80 ring-emerald-500/20'
      }`}>
        {/* Glowing Top Banner */}
        <div className={`px-4 py-2.5 flex items-center justify-between text-white ${
          isAdmin
            ? isStatusChange
              ? 'bg-gradient-to-r from-amber-600 to-orange-600'
              : 'bg-gradient-to-r from-sky-600 to-indigo-600'
            : 'bg-gradient-to-r from-emerald-600 to-teal-600'
        }`}>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 fill-white" />
              {isAdmin
                ? isStatusChange
                  ? 'Actualización de Estatus'
                  : isOrderAccepted
                  ? 'Orden Aceptada por Técnico'
                  : 'Monitoreo de Servicio'
                : 'Nueva Orden de Trabajo Asignada'}
            </span>
          </div>

          <button
            onClick={onDismiss}
            title="Cerrar alerta flotante"
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-black/20 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-base font-black font-mono text-emerald-400">
                  {report.folio}
                </span>
                <span className="bg-neutral-800 text-neutral-300 text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-700">
                  {report.reportCode || 'SOT-REP-CLG-01'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${getStatusColor(report.status)}`}>
                  <Clock className="w-3 h-3" />
                  {report.status || 'En Revisión'}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white line-clamp-1">
                {report.empresa || 'Cliente SOTEX'}
              </h4>
            </div>

            {/* Service Location Tag */}
            <div className="shrink-0">
              {report.tipoServicio === 'sotex' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/80 text-blue-300 border border-blue-600/40 text-[11px] font-bold">
                  <Building className="w-3.5 h-3.5 text-blue-400" />
                  En Sotex
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 text-[11px] font-bold">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  En Campo
                </span>
              )}
            </div>
          </div>

          {/* Equipment Info Snippet */}
          <div className="bg-neutral-800/80 rounded-xl p-2.5 border border-neutral-700/60 flex items-center justify-between text-xs text-neutral-300">
            <div className="flex items-center gap-2 truncate">
              <Printer className="w-4 h-4 text-neutral-400 shrink-0" />
              <span className="truncate">
                {report.equipo?.marca} {report.equipo?.modelo} (DPI {report.equipo?.dpi})
              </span>
            </div>
            <span className="font-mono text-[11px] text-neutral-400 shrink-0 ml-2">
              S/N: {report.equipo?.noSerie || 'N/D'}
            </span>
          </div>

          {/* Message for Tech vs Admin */}
          {isAdmin ? (
            <p className="text-[11px] text-neutral-300 leading-relaxed bg-neutral-800/50 p-2.5 rounded-lg border border-neutral-700/50">
              {notification?.mensaje ||
                `El técnico asignado actualizó el estatus de la orden ${report.folio} a "${report.status}". Monitoreo en tiempo real activo.`}
            </p>
          ) : (
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Hola <strong className="text-neutral-200">{technicianName}</strong>, se te ha asignado
              esta orden para diagnóstico y reparación. Al presionar{' '}
              <strong className="text-emerald-300">Aceptada</strong>, el administrador será
              notificado al instante con sonido y alerta en su pantalla.
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            {!isAdmin && !report.aceptadaPorTecnico && onAccept && (
              <button
                onClick={() => onAccept(report)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer ring-2 ring-emerald-400/40"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Aceptar Orden</span>
              </button>
            )}

            <button
              onClick={() => onView(report)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 transition-colors cursor-pointer"
            >
              <span>Ver Detalle de Orden</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onDismiss}
              className="py-2.5 px-3 text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
