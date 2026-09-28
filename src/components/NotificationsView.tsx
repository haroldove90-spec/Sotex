import React, { useState, useMemo } from 'react';
import { SystemNotification, UserRole, ServiceReport } from '../types';
import { playNotificationSound } from '../utils/notificationSound';
import {
  Bell,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  Check,
  Trash2,
  Volume2,
  Filter,
  FileText,
  Search,
  ChevronRight,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface NotificationsViewProps {
  notifications: SystemNotification[];
  currentRole: UserRole;
  currentUserName: string;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectOrder?: (folio: string) => void;
  onAcceptOrder?: (folio: string) => void;
  reports?: ServiceReport[];
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  currentRole,
  currentUserName,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSelectOrder,
  onAcceptOrder,
  reports = [],
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter notifications relevant to the current user and active role
  const roleFiltered = useMemo(() => {
    return notifications.filter((notif) => {
      // Admin sees notifications targeted to admin or 'todos'
      if (currentRole === 'admin') {
        return notif.destinatarioRol === 'admin' || notif.destinatarioRol === 'todos';
      }
      // Technician sees notifications targeted to technician role or specific name or 'todos'
      if (currentRole === 'tecnico') {
        const matchesName =
          !notif.destinatarioTecnico ||
          notif.destinatarioTecnico.toLowerCase().includes(currentUserName.toLowerCase()) ||
          currentUserName.toLowerCase().includes(notif.destinatarioTecnico.toLowerCase());
        return (notif.destinatarioRol === 'tecnico' || notif.destinatarioRol === 'todos') && matchesName;
      }
      return true;
    });
  }, [notifications, currentRole, currentUserName]);

  // Apply search and category filter
  const displayedNotifications = useMemo(() => {
    return roleFiltered.filter((notif) => {
      // Category filter
      if (filterType === 'unread' && notif.leida) return false;
      if (filterType === 'ordenes' && notif.tipo !== 'nueva_orden') return false;
      if (filterType === 'aceptadas' && notif.tipo !== 'orden_aceptada') return false;
      if (filterType === 'estatus' && notif.tipo !== 'cambio_estatus') return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matches =
          notif.titulo.toLowerCase().includes(term) ||
          notif.mensaje.toLowerCase().includes(term) ||
          (notif.folio && notif.folio.toLowerCase().includes(term)) ||
          (notif.remitenteNombre && notif.remitenteNombre.toLowerCase().includes(term));
        if (!matches) return false;
      }

      return true;
    });
  }, [roleFiltered, filterType, searchTerm]);

  const unreadCount = roleFiltered.filter((n) => !n.leida).length;

  const formatNotificationDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const today = new Date();
      const isToday =
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();

      const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) {
        return `Hoy a las ${time}`;
      }
      return `${d.toLocaleDateString([], { day: '2-digit', month: 'short' })} • ${time}`;
    } catch {
      return dateStr;
    }
  };

  const getNotificationIcon = (tipo: SystemNotification['tipo']) => {
    switch (tipo) {
      case 'nueva_orden':
        return <Bell className="w-5 h-5 text-amber-500" />;
      case 'orden_aceptada':
        return <UserCheck className="w-5 h-5 text-emerald-500" />;
      case 'cambio_estatus':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <Wrench className="w-5 h-5 text-neutral-400" />;
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#D60000]" />
              Historial de Notificaciones
            </h2>
            {unreadCount > 0 && (
              <span className="bg-[#D60000] text-white text-[11px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                {unreadCount} nuevas
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentRole === 'admin'
              ? 'Monitoreo en tiempo real de recepciones, asignaciones y avance de reparaciones'
              : 'Alertas en tiempo real de órdenes de trabajo asignadas y actualizaciones de taller'}
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => playNotificationSound()}
            title="Probar sonido de notificación oficial"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#D60000]" />
            <span>Probar Sonido</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Marcar Leídas</span>
            </button>
          )}

          {roleFiltered.length > 0 && (
            <button
              onClick={onClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Todas ({roleFiltered.length})
          </button>

          <button
            onClick={() => setFilterType('unread')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'unread'
                ? 'bg-[#D60000] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            No leídas ({unreadCount})
          </button>

          <button
            onClick={() => setFilterType('ordenes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'ordenes'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Órdenes Asignadas
          </button>

          <button
            onClick={() => setFilterType('aceptadas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'aceptadas'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Aceptadas
          </button>

          <button
            onClick={() => setFilterType('estatus')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'estatus'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Estatus
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por folio, cliente, mensaje..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {displayedNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Bell className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">Sin notificaciones para mostrar</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Cuando se asignen órdenes de trabajo o los técnicos actualicen su estatus, las
              notificaciones aparecerán aquí al instante con sonido de alerta.
            </p>
          </div>
        ) : (
          displayedNotifications.map((notif) => {
            const isUnread = !notif.leida;
            return (
              <div
                key={notif.id}
                onClick={() => isUnread && onMarkAsRead(notif.id)}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs ${
                  isUnread
                    ? 'bg-white border-l-4 border-l-[#D60000] border-slate-300 ring-1 ring-red-500/10'
                    : 'bg-white/70 border-slate-200 opacity-90 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isUnread ? 'bg-red-50' : 'bg-slate-100'
                    }`}
                  >
                    {getNotificationIcon(notif.tipo)}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-xs sm:text-sm font-bold tracking-tight ${
                          isUnread ? 'text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        {notif.titulo}
                      </h4>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#D60000] shrink-0" />
                      )}
                      {notif.folio && (
                        <span className="font-mono text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          {notif.folio}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{notif.mensaje}</p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span>{formatNotificationDate(notif.fecha)}</span>
                      {notif.remitenteNombre && (
                        <>
                          <span>•</span>
                          <span>De: {notif.remitenteNombre}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Quick Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* If technician action required: Accept Order */}
                  {currentRole === 'tecnico' && notif.accionRequerida && notif.folio && onAcceptOrder && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcceptOrder(notif.folio!);
                        onMarkAsRead(notif.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aceptada</span>
                    </button>
                  )}

                  {/* View Order */}
                  {notif.folio && onSelectOrder && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOrder(notif.folio!);
                        if (isUnread) onMarkAsRead(notif.id);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ver Orden</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </button>
                  )}

                  {isUnread && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(notif.id);
                      }}
                      title="Marcar como leída"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
