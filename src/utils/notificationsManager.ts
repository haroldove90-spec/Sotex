import { SystemNotification, UserRole } from '../types';
import { playNotificationSound } from './notificationSound';
import { supabase } from './supabaseClient';

export const NOTIFICATIONS_STORAGE_KEY = 'sotex_notifications_v2';
export const NOTIFICATIONS_CHANNEL_NAME = 'sotex_notifications_channel';

// Default initial demo notifications
export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-init-1',
    titulo: 'Nueva Orden de Trabajo Asignada',
    mensaje: 'Se ha asignado la orden SOT-2026-004 (FlexiTech del Bajío) para revisión de cabezal térmico.',
    fecha: new Date(Date.now() - 3600000 * 2).toISOString(),
    tipo: 'nueva_orden',
    ordenId: 'rep-004',
    folio: 'SOT-2026-004',
    destinatarioRol: 'tecnico',
    destinatarioTecnico: 'Tec. Carlos Mendoza',
    remitenteNombre: 'Harold Anguiano Morales',
    leida: false,
    accionRequerida: true,
    detalles: {
      empresa: 'FlexiTech del Bajío S.A. de C.V.',
      tipoServicio: 'campo',
      estatusNuevo: 'En Revisión',
    },
  },
  {
    id: 'notif-init-2',
    titulo: 'Orden de Trabajo Aceptada',
    mensaje: 'El técnico Carlos Mendoza ha aceptado la orden SOT-2026-002 (Empaques y Cajas de Occidente).',
    fecha: new Date(Date.now() - 3600000 * 8).toISOString(),
    tipo: 'orden_aceptada',
    ordenId: 'rep-002',
    folio: 'SOT-2026-002',
    destinatarioRol: 'admin',
    remitenteNombre: 'Tec. Carlos Mendoza',
    leida: true,
    accionRequerida: false,
  },
  {
    id: 'notif-init-3',
    titulo: 'Actualización de Estatus: Completado',
    mensaje: 'La orden SOT-2026-001 (Logística & Distribución Monterrey) ha sido marcada como Completada.',
    fecha: new Date(Date.now() - 3600000 * 24).toISOString(),
    tipo: 'cambio_estatus',
    ordenId: 'rep-001',
    folio: 'SOT-2026-001',
    destinatarioRol: 'admin',
    remitenteNombre: 'Tec. Carlos Mendoza',
    leida: true,
    accionRequerida: false,
    detalles: {
      estatusAnterior: 'En Revisión',
      estatusNuevo: 'Completado',
      empresa: 'Logística & Distribución Monterrey S.A. de C.V.',
    },
  },
];

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(NOTIFICATIONS_CHANNEL_NAME);
  } catch {}
}

export const loadStoredNotifications = (): SystemNotification[] => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return INITIAL_NOTIFICATIONS;
};

export const saveNotifications = (notifications: SystemNotification[]) => {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (err) {
    console.warn('Error al guardar notificaciones:', err);
  }
};

/**
 * Dispatches a notification across local storage, BroadcastChannel, and Supabase
 */
export const dispatchNotification = async (
  notification: Omit<SystemNotification, 'id' | 'fecha'> & { id?: string; fecha?: string }
): Promise<SystemNotification> => {
  const fullNotif: SystemNotification = {
    id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    fecha: notification.fecha || new Date().toISOString(),
    titulo: notification.titulo,
    mensaje: notification.mensaje,
    tipo: notification.tipo,
    ordenId: notification.ordenId,
    folio: notification.folio,
    destinatarioRol: notification.destinatarioRol,
    destinatarioTecnico: notification.destinatarioTecnico,
    remitenteNombre: notification.remitenteNombre,
    leida: notification.leida ?? false,
    accionRequerida: notification.accionRequerida ?? false,
    detalles: notification.detalles,
  };

  // 1. Play alert sound
  playNotificationSound();

  // 2. Save in localStorage
  const existing = loadStoredNotifications();
  const updated = [fullNotif, ...existing.filter((n) => n.id !== fullNotif.id)];
  saveNotifications(updated);

  // 3. Broadcast to other open tabs/windows
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'NEW_NOTIFICATION', notification: fullNotif });
    } catch {}
  }

  // 4. Also trigger window storage event dispatch for same-window or cross-window
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sotex_new_notification', { detail: fullNotif })
    );
  }

  // 5. Sync to Supabase table system_notifications (async, non-blocking)
  try {
    await supabase.from('system_notifications').insert({
      id: fullNotif.id,
      titulo: fullNotif.titulo,
      mensaje: fullNotif.mensaje,
      fecha: fullNotif.fecha,
      tipo: fullNotif.tipo,
      orden_id: fullNotif.ordenId || null,
      folio: fullNotif.folio || null,
      destinatario_rol: fullNotif.destinatarioRol,
      destinatario_tecnico: fullNotif.destinatarioTecnico || null,
      remitente_nombre: fullNotif.remitenteNombre || null,
      leida: fullNotif.leida,
      accion_requerida: fullNotif.accionRequerida,
    });
  } catch (err) {
    console.log('Nota: Notificación local registrada. Supabase sinc pendiente:', err);
  }

  return fullNotif;
};
