/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ServiceReport,
  VisitNumber,
  ActiveModule,
  AdminProfile,
  UserRole,
  Employee,
  FolioConfig,
  SystemNotification,
  ServiceStatus,
} from './types';
import { INITIAL_REPORTS } from './data/mockReports';
import { INITIAL_EMPLOYEES } from './data/mockEmployees';
import { RoleHomeView } from './components/RoleHomeView';
import { LoginModal } from './components/LoginModal';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { StatsCards } from './components/StatsCards';
import { ReportsTable } from './components/ReportsTable';
import { MetricsView } from './components/MetricsView';
import { EmployeesView } from './components/EmployeesView';
import { AdminProfileView } from './components/AdminProfileView';
import { UserManualView } from './components/UserManualView';
import { WorkOrdersHistoryView } from './components/WorkOrdersHistoryView';
import { NotificationsView } from './components/NotificationsView';
import { FolioConfigModal } from './components/FolioConfigModal';
import { FloatingNotificationAlert } from './components/FloatingNotificationAlert';
import { ReportFormModal } from './components/ReportFormModal';
import { ReportDetailModal } from './components/ReportDetailModal';
import { DeleteConfirmModal, DeleteTarget } from './components/DeleteConfirmModal';
import { exportReportsToExcel } from './utils/excelExport';
import { generateAllReportsPDF, generateServiceReportPDF } from './utils/pdfExport';
import { supabase, SUPABASE_SETUP_SQL } from './utils/supabaseClient';
import {
  saveReportToSupabase,
  fetchReportsFromSupabase,
  deleteReportFromSupabase,
  normalizeSupabaseReportRow,
} from './utils/supabaseReports';
import {
  saveReportsSafely,
  loadReportsFromIndexedDB,
  deleteReportFromIndexedDB,
  STORAGE_KEY,
} from './utils/reportsStorage';
import {
  loadFolioConfig,
  saveFolioConfig,
  advanceFolioNumber,
  FOLIO_CONFIG_KEY,
} from './utils/folioManager';
import {
  loadStoredNotifications,
  saveNotifications,
  dispatchNotification,
  NOTIFICATIONS_CHANNEL_NAME,
} from './utils/notificationsManager';
import { playNotificationSound } from './utils/notificationSound';
import {
  loadActiveSession,
  saveActiveSession,
  ROLE_STORAGE_KEY,
  USER_STORAGE_KEY,
} from './utils/sessionManager';
import {
  FileText,
  FileSpreadsheet,
  Plus,
  RotateCcw,
  Check,
  AlertTriangle,
  FileSearch,
  Database,
  X,
  Copy,
  Trash2,
} from 'lucide-react';

const ADMIN_PROFILE_KEY = 'sotex_admin_profile_v2';
const TECH_PROFILE_KEY = 'sotex_tech_profile_v2';
const EMPLOYEES_STORAGE_KEY = 'sotex_employees_v2';
const DELETED_REPORTS_KEY = 'sotex_permanently_deleted_reports_v3';
const DELETED_EMPLOYEES_KEY = 'sotex_permanently_deleted_employees_v3';
const HAS_INITIALIZED_KEY = 'sotex_has_seeded_v3';

export const getPermanentlyDeletedReportKeys = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_REPORTS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

export const addPermanentlyDeletedReportKeys = (...keys: (string | undefined)[]) => {
  try {
    const current = getPermanentlyDeletedReportKeys();
    keys.forEach((k) => {
      if (k && k.trim()) current.add(k.trim().toLowerCase());
    });
    localStorage.setItem(DELETED_REPORTS_KEY, JSON.stringify(Array.from(current)));
  } catch (err) {
    console.error('Error saving deleted report keys:', err);
  }
};

export const getPermanentlyDeletedEmployeeKeys = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_EMPLOYEES_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

export const addPermanentlyDeletedEmployeeKeys = (...keys: (string | undefined)[]) => {
  try {
    const current = getPermanentlyDeletedEmployeeKeys();
    keys.forEach((k) => {
      if (k && k.trim()) current.add(k.trim().toLowerCase());
    });
    localStorage.setItem(DELETED_EMPLOYEES_KEY, JSON.stringify(Array.from(current)));
  } catch (err) {
    console.error('Error saving deleted employee keys:', err);
  }
};

const DEFAULT_ADMIN_PROFILE: AdminProfile = {
  nombre: 'Harold Anguiano Morales',
  correo: 'haroldo90@hotmail.com',
  cargo: 'Director / Administrador General',
  telefono: '+52 (33) 1234-5678',
  sucursal: 'Guadalajara (Matriz)',
  cedulaTecnica: 'SOT-DIR-01',
  bio: 'Administración central de servicio técnico, gestión de empleados y diagnóstico de cabezales térmicos.',
};

const DEFAULT_TECH_PROFILE: AdminProfile = {
  nombre: 'Tec. Carlos Mendoza',
  correo: 'carlos.mendoza@sotex.com.mx',
  cargo: 'Técnico Especialista en Cabezales',
  telefono: '+52 (33) 3610-8820',
  sucursal: 'Guadalajara (Matriz)',
  cedulaTecnica: 'TEC-SOT-01',
  bio: 'Especialista en mantenimiento preventivo, correctivo y calibración de impresoras térmicas industriales.',
};

const normalizeReport = (raw: any): ServiceReport => {
  return normalizeSupabaseReportRow(raw);
};

export default function App() {
  // Load persistent session and exact screen where user was
  const initialSession = useMemo(() => loadActiveSession(), []);

  // Current active role: null (Home view) | 'admin' | 'tecnico'
  const [currentRole, setCurrentRole] = useState<UserRole | null>(() => initialSession.role);

  // Current logged in user object
  const [currentUser, setCurrentUser] = useState<Employee | null>(() => initialSession.user);

  // Active module navigation: 'metricas' | 'reportes' | 'historial' | 'notificaciones' | 'empleados' | 'perfil' | 'manual'
  const [activeModule, setActiveModule] = useState<ActiveModule>(() => initialSession.module);

  // Login Modal state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [targetRoleHint, setTargetRoleHint] = useState<UserRole | null>(null);

  // Global SQL viewer modal state
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Reports state (shared, synchronized, and permanently deletable)
  const [reports, setReports] = useState<ServiceReport[]>(() => {
    const deletedKeys = getPermanentlyDeletedReportKeys();
    const isNotDeleted = (r: any) =>
      r &&
      !deletedKeys.has(String(r.id || '').toLowerCase()) &&
      !deletedKeys.has(String(r.folio || '').toLowerCase());

    const hasInitialized = typeof window !== 'undefined' && localStorage.getItem(HAS_INITIALIZED_KEY) === 'true';

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // If the user deleted all reports, parsed is [], so return []!
          return parsed.filter(isNotDeleted).map(normalizeReport);
        }
      }
    } catch {
      // Fallback
    }

    if (hasInitialized) {
      return [];
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(HAS_INITIALIZED_KEY, 'true');
      } catch {}
    }
    return INITIAL_REPORTS.filter(isNotDeleted).map(normalizeReport);
  });

  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Admin Profile state
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(() => {
    try {
      const saved = localStorage.getItem(ADMIN_PROFILE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return DEFAULT_ADMIN_PROFILE;
  });

  // Technician Profile state
  const [techProfile, setTechProfile] = useState<AdminProfile>(() => {
    try {
      const saved = localStorage.getItem(TECH_PROFILE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return DEFAULT_TECH_PROFILE;
  });

  // Employees state (Managed by Admin & synced with Supabase)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const deletedKeys = getPermanentlyDeletedEmployeeKeys();
    const isNotDeleted = (e: any) =>
      e &&
      !deletedKeys.has(String(e.id || '').toLowerCase()) &&
      (!e.usuario || !deletedKeys.has(String(e.usuario).toLowerCase())) &&
      (!e.correo || !deletedKeys.has(String(e.correo).toLowerCase()));

    try {
      const saved = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(isNotDeleted);
        }
      }
    } catch {}
    return INITIAL_EMPLOYEES.filter(isNotDeleted);
  });

  // Folio Configuration & Consecutives State
  const [folioConfig, setFolioConfig] = useState<FolioConfig>(() => loadFolioConfig());
  const [isFolioConfigOpen, setIsFolioConfigOpen] = useState(false);

  // Real-time Notifications state
  const [notifications, setNotifications] = useState<SystemNotification[]>(() =>
    loadStoredNotifications()
  );
  const [floatingAlertOrder, setFloatingAlertOrder] = useState<ServiceReport | null>(null);
  const [floatingAlertNotification, setFloatingAlertNotification] = useState<SystemNotification | null>(null);

  // Active technician names list
  const techniciansList = useMemo(() => {
    return employees
      .filter((e) => e.rol === 'tecnico' && e.activo)
      .map((e) => e.nombre);
  }, [employees]);

  // Unread notification badge count for active role
  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => {
      if (n.leida) return false;
      if (currentRole === 'admin') {
        return n.destinatarioRol === 'admin' || n.destinatarioRol === 'todos';
      }
      if (currentRole === 'tecnico') {
        const userName = currentUser?.nombre || techProfile.nombre;
        const matchesName =
          !n.destinatarioTecnico ||
          n.destinatarioTecnico.toLowerCase().includes(userName.toLowerCase()) ||
          userName.toLowerCase().includes(n.destinatarioTecnico.toLowerCase());
        return (n.destinatarioRol === 'tecnico' || n.destinatarioRol === 'todos') && matchesName;
      }
      return false;
    }).length;
  }, [notifications, currentRole, currentUser, techProfile]);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ServiceReport | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<ServiceReport | null>(null);

  // Delete Confirm Modal State
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info' | 'error' } | null>(null);

  // Auto-persist active session and screen location across refreshes
  useEffect(() => {
    saveActiveSession(currentRole, currentUser, activeModule);
  }, [currentRole, currentUser, activeModule]);

  // Synchronize active module with browser history / hash (back & forward buttons)
  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash.replace('#', '') as ActiveModule;
      if (['metricas', 'reportes', 'historial', 'notificaciones', 'empleados', 'perfil', 'manual'].includes(hash)) {
        if (currentRole === 'tecnico' && hash === 'empleados') {
          setActiveModule('reportes');
        } else {
          setActiveModule(hash);
        }
      }
    };
    window.addEventListener('hashchange', handleHashSync);
    return () => window.removeEventListener('hashchange', handleHashSync);
  }, [currentRole]);

  // Unified Handler for Incoming Real-Time Notifications
  const handleIncomingNotification = (notif: SystemNotification) => {
    if (!notif || !notif.id) return;

    // 1. Play official alert sound
    playNotificationSound();

    // 2. Insert into notifications state (avoid duplicates)
    setNotifications((prev) => {
      if (prev.some((n) => n.id === notif.id)) return prev;
      const updated = [notif, ...prev];
      saveNotifications(updated);
      return updated;
    });

    // 3. Floating Window Logic:
    // CASE A: Technician receives new work order assigned to them
    if (currentRole === 'tecnico' && notif.tipo === 'nueva_orden') {
      const currentTechName = currentUser?.nombre || techProfile.nombre;
      const matchesTech =
        !notif.destinatarioTecnico ||
        notif.destinatarioTecnico.toLowerCase().includes(currentTechName.toLowerCase()) ||
        currentTechName.toLowerCase().includes(notif.destinatarioTecnico.toLowerCase()) ||
        currentTechName.toLowerCase().includes('carlos');

      if (matchesTech) {
        const orderMatch =
          reports.find((r) => r.id === notif.ordenId || r.folio === notif.folio) || {
            id: notif.ordenId || `rep-${Date.now()}`,
            reportCode: 'SOT-REP-CLG-01',
            folio: notif.folio || 'SOT-2026-NUEVA',
            empresa: notif.detalles?.empresa || 'Cliente SOTEX',
            fecha: new Date().toISOString().split('T')[0],
            direccion: '',
            telefono: '',
            numVisita: 1,
            tipoServicio: notif.detalles?.tipoServicio || 'campo',
            equipo: {
              equipo: 'Impresora Térmica Industrial',
              marca: 'Zebra',
              modelo: 'ZT411',
              dpi: '203',
              noSerie: 'N/D',
            },
            danos: {
              cabezal: false,
              rodilloPrincipal: false,
              display: false,
              sensorPapel: false,
              sensorRibbon: false,
              bandas: false,
              cutter: false,
              rebobinador: false,
              otro: false,
            },
            descripcionDanos: 'Orden asignada para diagnóstico y mantenimiento.',
            clienteNombre: 'Cliente SOTEX',
            clienteEmail: '',
            tecnicoNombre: currentTechName,
            status: (notif.detalles?.estatusNuevo as ServiceStatus) || 'En Revisión',
            createdAt: notif.fecha,
          };

        setFloatingAlertOrder(orderMatch as ServiceReport);
        setFloatingAlertNotification(notif);
      }
    }

    // CASE B: Admin receives status update or order accepted from technician
    if (
      currentRole === 'admin' &&
      (notif.tipo === 'cambio_estatus' || notif.tipo === 'orden_aceptada' || notif.destinatarioRol === 'admin')
    ) {
      const orderMatch =
        reports.find((r) => r.id === notif.ordenId || r.folio === notif.folio) || {
          id: notif.ordenId || `rep-${Date.now()}`,
          reportCode: 'SOT-REP-CLG-01',
          folio: notif.folio || 'SOT-2026-NUEVA',
          empresa: notif.detalles?.empresa || 'Cliente SOTEX',
          fecha: new Date().toISOString().split('T')[0],
          direccion: '',
          telefono: '',
          numVisita: 1,
          tipoServicio: notif.detalles?.tipoServicio || 'campo',
          equipo: {
            equipo: 'Impresora Térmica Industrial',
            marca: 'Zebra',
            modelo: 'ZT411',
            dpi: '203',
            noSerie: 'N/D',
          },
          danos: {
            cabezal: false,
            rodilloPrincipal: false,
            display: false,
            sensorPapel: false,
            sensorRibbon: false,
            bandas: false,
            cutter: false,
            rebobinador: false,
            otro: false,
          },
          descripcionDanos: '',
          clienteNombre: 'Cliente SOTEX',
          clienteEmail: '',
          tecnicoNombre: notif.remitenteNombre || 'Técnico de Servicio',
          status: (notif.detalles?.estatusNuevo as ServiceStatus) || 'En Revisión',
          createdAt: notif.fecha,
        };

      setFloatingAlertOrder(orderMatch as ServiceReport);
      setFloatingAlertNotification(notif);
      showToast(notif.mensaje, 'info');
    }
  };

  // Real-time cross-tab, cross-window & Supabase Realtime notification listener
  useEffect(() => {
    // 1. Same-window and cross-window custom events
    const handleCustomEvent = (e: any) => {
      if (e.detail) handleIncomingNotification(e.detail);
    };
    window.addEventListener('sotex_new_notification', handleCustomEvent);

    // 2. BroadcastChannel for multiple tabs
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(NOTIFICATIONS_CHANNEL_NAME);
      channel.onmessage = (ev) => {
        if (ev.data?.type === 'NEW_NOTIFICATION' && ev.data.notification) {
          handleIncomingNotification(ev.data.notification);
        }
      };
    } catch {}

    // 3. Supabase Realtime channel for system_notifications table
    const realtimeNotifs = supabase
      .channel('sotex_realtime_notifications_stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_notifications' },
        (payload) => {
          const row: any = payload.new;
          if (row) {
            const notif: SystemNotification = {
              id: row.id,
              titulo: row.titulo,
              mensaje: row.mensaje,
              fecha: row.fecha || row.created_at,
              tipo: row.tipo,
              ordenId: row.orden_id,
              folio: row.folio,
              destinatarioRol: row.destinatario_rol,
              destinatarioTecnico: row.destinatario_tecnico,
              remitenteNombre: row.remitente_nombre,
              leida: Boolean(row.leida),
              accionRequerida: Boolean(row.accion_requerida),
              detalles: row.detalles,
            };
            handleIncomingNotification(notif);
          }
        }
      )
      .subscribe();

    // 4. Supabase Realtime channel for service_reports table (status changes, insertions, deletions)
    const realtimeReports = supabase
      .channel('sotex_realtime_reports_stream')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_reports' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            const deletedFolio = payload.old?.folio;
            if (deletedId || deletedFolio) {
              addPermanentlyDeletedReportKeys(deletedId, deletedFolio);
              setReports((prev) =>
                prev.filter(
                  (r) =>
                    (!deletedId || r.id !== deletedId) &&
                    (!deletedFolio || r.folio !== deletedFolio)
                )
              );
            }
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row: any = payload.new;
            if (row) {
              const deletedKeys = getPermanentlyDeletedReportKeys();
              if (
                !deletedKeys.has(String(row.id || '').toLowerCase()) &&
                !deletedKeys.has(String(row.folio || '').toLowerCase())
              ) {
                const normalized = normalizeReport(row);
                setReports((prev) => {
                  const existsIndex = prev.findIndex(
                    (r) => r.id === normalized.id || r.folio === normalized.folio
                  );
                  if (existsIndex >= 0) {
                    const copy = [...prev];
                    copy[existsIndex] = normalized;
                    return copy;
                  }
                  return [normalized, ...prev];
                });
              }
            }
          }
        }
      )
      .subscribe();

    // 5. Fallback polling every 5 seconds to guarantee instant notifications even if Postgres publications aren't enabled yet
    const fallbackPoll = setInterval(async () => {
      try {
        const { data: latestNotifs } = await supabase
          .from('system_notifications')
          .select('*')
          .order('fecha', { ascending: false })
          .limit(8);

        if (latestNotifs && latestNotifs.length > 0) {
          setNotifications((prev) => {
            const knownIds = new Set(prev.map((n) => n.id));
            let hasNew = false;
            const newOnes: SystemNotification[] = [];

            for (const row of latestNotifs) {
              if (!knownIds.has(row.id)) {
                hasNew = true;
                const notif: SystemNotification = {
                  id: row.id,
                  titulo: row.titulo,
                  mensaje: row.mensaje,
                  fecha: row.fecha || row.created_at,
                  tipo: row.tipo,
                  ordenId: row.orden_id,
                  folio: row.folio,
                  destinatarioRol: row.destinatario_rol,
                  destinatarioTecnico: row.destinatario_tecnico,
                  remitenteNombre: row.remitente_nombre,
                  leida: Boolean(row.leida),
                  accionRequerida: Boolean(row.accion_requerida),
                  detalles: row.detalles,
                };
                newOnes.push(notif);
                handleIncomingNotification(notif);
              }
            }

            if (hasNew) {
              const merged = [...newOnes, ...prev];
              saveNotifications(merged);
              return merged;
            }
            return prev;
          });
        }
      } catch {}
    }, 5000);

    return () => {
      window.removeEventListener('sotex_new_notification', handleCustomEvent);
      if (channel) channel.close();
      supabase.removeChannel(realtimeNotifs);
      supabase.removeChannel(realtimeReports);
      clearInterval(fallbackPoll);
    };
  }, [currentRole, currentUser, techProfile, reports]);

  // Check on login or role change if technician has an active unaccepted order
  useEffect(() => {
    if (currentRole === 'tecnico') {
      const currentTechName = currentUser?.nombre || techProfile.nombre;
      const unacceptedOrder = reports.find(
        (r) =>
          !r.aceptadaPorTecnico &&
          r.status === 'En Revisión' &&
          r.tecnicoNombre &&
          (r.tecnicoNombre.toLowerCase().includes(currentTechName.toLowerCase()) ||
            currentTechName.toLowerCase().includes(r.tecnicoNombre.toLowerCase()) ||
            r.tecnicoNombre.toLowerCase().includes('carlos'))
      );
      if (unacceptedOrder && !floatingAlertOrder) {
        setFloatingAlertOrder(unacceptedOrder);
      }
    } else {
      setFloatingAlertOrder(null);
    }
  }, [currentRole, currentUser, techProfile, reports]);

  // Fetch / Sync with Supabase on mount
  useEffect(() => {
    const fetchSupabaseData = async () => {
      const deletedEmpKeys = getPermanentlyDeletedEmployeeKeys();
      const deletedRepKeys = getPermanentlyDeletedReportKeys();

      // 1. Sync Employees from Supabase
      try {
        const { data, error } = await supabase.from('employees').select('*');
        if (!error && data && data.length > 0) {
          const remoteEmployees: Employee[] = data
            .map((d: any) => ({
              id: d.id,
              nombre: d.nombre,
              usuario: d.usuario,
              correo: d.correo,
              password: d.password,
              rol: (d.rol === 'admin' ? 'admin' : 'tecnico') as UserRole,
              telefono: d.telefono || '',
              puesto: d.puesto || '',
              sucursal: d.sucursal || 'Guadalajara (Matriz)',
              cedulaTecnica: d.cedula_tecnica || '',
              activo: d.activo ?? true,
              fotoUrl: d.foto_url,
              firmaDigital: d.firma_digital,
              fechaRegistro: d.created_at || new Date().toISOString().split('T')[0],
            }))
            .filter(
              (e) =>
                !deletedEmpKeys.has(e.id.toLowerCase()) &&
                (!e.usuario || !deletedEmpKeys.has(e.usuario.toLowerCase())) &&
                (!e.correo || !deletedEmpKeys.has(e.correo.toLowerCase()))
            );

          setEmployees((localList) => {
            const merged = [...remoteEmployees];
            for (const local of localList) {
              const isDeleted =
                deletedEmpKeys.has(local.id.toLowerCase()) ||
                (local.usuario && deletedEmpKeys.has(local.usuario.toLowerCase())) ||
                (local.correo && deletedEmpKeys.has(local.correo.toLowerCase()));

              if (
                !isDeleted &&
                !merged.some(
                  (m) =>
                    m.id === local.id ||
                    (m.usuario && local.usuario && m.usuario === local.usuario) ||
                    m.correo.toLowerCase() === local.correo.toLowerCase()
                )
              ) {
                merged.push(local);
              }
            }
            return merged;
          });
        }
      } catch (err) {
        console.log('Info de sincronización empleados Supabase:', err);
      }

      // 2. Sync Reports from Supabase
      try {
        const remoteReports = await fetchReportsFromSupabase();
        if (remoteReports && remoteReports.length > 0) {
          const validRemote = remoteReports.filter(
            (r) =>
              !deletedRepKeys.has(String(r.id || '').toLowerCase()) &&
              !deletedRepKeys.has(String(r.folio || '').toLowerCase())
          );

          setReports((localList) => {
            const map = new Map<string, ServiceReport>();

            // Authoritative remote reports
            validRemote.forEach((r) => map.set(r.id, r));

            // Merge local signatures if remote lacked them
            for (const local of localList) {
              const isDeleted =
                deletedRepKeys.has(String(local.id || '').toLowerCase()) ||
                deletedRepKeys.has(String(local.folio || '').toLowerCase());

              if (!isDeleted) {
                const existing = map.get(local.id);
                if (existing) {
                  let needsUpdate = false;
                  if (!existing.clienteFirma && local.clienteFirma) {
                    existing.clienteFirma = local.clienteFirma;
                    needsUpdate = true;
                  }
                  if (!existing.tecnicoFirma && local.tecnicoFirma) {
                    existing.tecnicoFirma = local.tecnicoFirma;
                    needsUpdate = true;
                  }
                  if (!existing.pruebaCabezalImagen && local.pruebaCabezalImagen) {
                    existing.pruebaCabezalImagen = local.pruebaCabezalImagen;
                    needsUpdate = true;
                  }
                  if (
                    (!existing.evidenciasFotos || existing.evidenciasFotos.length === 0) &&
                    local.evidenciasFotos &&
                    local.evidenciasFotos.length > 0
                  ) {
                    existing.evidenciasFotos = local.evidenciasFotos;
                    needsUpdate = true;
                  }

                  if (needsUpdate) {
                    saveReportToSupabase(existing).catch(() => {});
                  }
                  map.set(local.id, existing);
                }
              }
            }
            const cleanList = Array.from(map.values()).map(normalizeReport);
            saveReportsSafely(cleanList);
            return cleanList;
          });
        }
      } catch (repErr) {
        console.log('Info de sincronización reportes Supabase:', repErr);
      }

      // 3. Sync Folio Config from Supabase
      try {
        const { data: cfgData, error: cfgError } = await supabase
          .from('configuracion_folios')
          .select('*')
          .eq('id', 'config_principal')
          .maybeSingle();
        if (!cfgError && cfgData) {
          const remoteConfig: FolioConfig = {
            prefijo: cfgData.prefijo_folio || 'SOT-2026-',
            ultimoNumero: cfgData.ultimo_folio_numero ?? 5,
            codigoFormato: cfgData.codigo_formato_actual || 'SOT-REP-CLG-01',
            cerosPadding: cfgData.ceros_padding ?? 3,
          };
          setFolioConfig(remoteConfig);
          try {
            localStorage.setItem(FOLIO_CONFIG_KEY, JSON.stringify(remoteConfig));
          } catch {}
        }
      } catch (err) {
        console.log('Info de sincronización folios Supabase:', err);
      }

      // 4. Sync Notifications from Supabase
      try {
        const { data: notifData, error: notifError } = await supabase
          .from('system_notifications')
          .select('*')
          .order('fecha', { ascending: false })
          .limit(50);
        if (!notifError && notifData && notifData.length > 0) {
          const remoteNotifs: SystemNotification[] = notifData.map((d: any) => ({
            id: d.id,
            titulo: d.titulo,
            mensaje: d.mensaje,
            fecha: d.fecha || d.created_at,
            tipo: d.tipo,
            ordenId: d.orden_id,
            folio: d.folio,
            destinatarioRol: d.destinatario_rol,
            destinatarioTecnico: d.destinatario_tecnico,
            remitenteNombre: d.remitente_nombre,
            leida: d.leida,
            accionRequerida: d.accion_requerida,
          }));

          setNotifications((localList) => {
            const map = new Map<string, SystemNotification>();
            remoteNotifs.forEach((n) => map.set(n.id, n));
            localList.forEach((n) => {
              if (!map.has(n.id)) map.set(n.id, n);
            });
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            );
            saveNotifications(merged);
            return merged;
          });
        }
      } catch (err) {
        console.log('Info de sincronización notificaciones Supabase:', err);
      }
    };

    fetchSupabaseData();
  }, []);

  // Save reports safely with IndexedDB and quota-protected storage
  useEffect(() => {
    saveReportsSafely(reports);
  }, [reports]);

  // Asynchronously hydrate complete reports from IndexedDB (including rich diagnostic images)
  useEffect(() => {
    loadReportsFromIndexedDB()
      .then((idbReports) => {
        if (idbReports && idbReports.length > 0) {
          const deletedKeys = getPermanentlyDeletedReportKeys();
          const isNotDeleted = (r: any) =>
            r &&
            !deletedKeys.has(String(r.id || '').toLowerCase()) &&
            !deletedKeys.has(String(r.folio || '').toLowerCase());

          const validIdb = idbReports.filter(isNotDeleted).map(normalizeReport);
          if (validIdb.length > 0) {
            setReports((prev) => {
              const map = new Map<string, ServiceReport>();
              prev.forEach((r) => map.set(r.id, r));
              validIdb.forEach((r) => {
                const existing = map.get(r.id);
                // If not in state, or IndexedDB has the full test image
                if (!existing || (!existing.pruebaCabezalImagen && r.pruebaCabezalImagen)) {
                  map.set(r.id, r);
                }
              });
              return Array.from(map.values()).map(normalizeReport);
            });
          }
        }
      })
      .catch((err) => {
        console.warn('Nota de hidratación IndexedDB:', err);
      });
  }, []);

  // Save employees to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
    } catch (e) {
      console.warn('Nota al guardar empleados en almacenamiento:', e);
    }
  }, [employees]);

  // Save admin profile with full synchronization (currentUser, employees list, Supabase)
  const handleSaveAdminProfile = async (updated: AdminProfile) => {
    setAdminProfile(updated);
    try {
      localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(updated));
      sessionStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Nota al guardar perfil de administrador:', e);
    }

    // Update currentUser state & session
    if (currentUser) {
      const updatedUser: Employee = {
        ...currentUser,
        nombre: updated.nombre,
        correo: updated.correo,
        telefono: updated.telefono,
        puesto: updated.cargo,
        sucursal: updated.sucursal,
        cedulaTecnica: updated.cedulaTecnica,
        fotoUrl: updated.fotoUrl,
        firmaDigital: updated.firmaDigital,
      };
      setCurrentUser(updatedUser);
      saveActiveSession(currentRole, updatedUser, activeModule);
    }

    // Update employee in employees state
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === currentUser?.id || e.correo === updated.correo || e.nombre === updated.nombre
          ? {
              ...e,
              nombre: updated.nombre,
              correo: updated.correo,
              telefono: updated.telefono,
              puesto: updated.cargo,
              sucursal: updated.sucursal,
              cedulaTecnica: updated.cedulaTecnica,
              fotoUrl: updated.fotoUrl,
              firmaDigital: updated.firmaDigital,
            }
          : e
      )
    );

    // Sync to Supabase employees table
    try {
      const payload: any = {
        nombre: updated.nombre,
        correo: updated.correo,
        telefono: updated.telefono,
        puesto: updated.cargo,
        sucursal: updated.sucursal,
        cedula_tecnica: updated.cedulaTecnica,
        foto_url: updated.fotoUrl || null,
        firma_digital: updated.firmaDigital || null,
      };
      if (currentUser?.id) {
        await supabase.from('employees').update(payload).eq('id', currentUser.id);
      }
      await supabase.from('employees').update(payload).eq('correo', updated.correo);
    } catch (err) {
      console.log('Info sync Supabase empleado:', err);
    }

    showToast('Perfil de administrador y fotografía guardados exitosamente.', 'success');
  };

  // Save tech profile with full synchronization (currentUser, employees list, Supabase)
  const handleSaveTechProfile = async (updated: AdminProfile) => {
    setTechProfile(updated);
    try {
      localStorage.setItem(TECH_PROFILE_KEY, JSON.stringify(updated));
      sessionStorage.setItem(TECH_PROFILE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Nota al guardar perfil de técnico:', e);
    }

    // Update currentUser state & session
    if (currentUser) {
      const updatedUser: Employee = {
        ...currentUser,
        nombre: updated.nombre,
        correo: updated.correo,
        telefono: updated.telefono,
        puesto: updated.cargo,
        sucursal: updated.sucursal,
        cedulaTecnica: updated.cedulaTecnica,
        fotoUrl: updated.fotoUrl,
        firmaDigital: updated.firmaDigital,
      };
      setCurrentUser(updatedUser);
      saveActiveSession(currentRole, updatedUser, activeModule);
    }

    // Update employee in employees state
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === currentUser?.id || e.correo === updated.correo || e.nombre === updated.nombre
          ? {
              ...e,
              nombre: updated.nombre,
              correo: updated.correo,
              telefono: updated.telefono,
              puesto: updated.cargo,
              sucursal: updated.sucursal,
              cedulaTecnica: updated.cedulaTecnica,
              fotoUrl: updated.fotoUrl,
              firmaDigital: updated.firmaDigital,
            }
          : e
      )
    );

    // Sync to Supabase employees table
    try {
      const payload: any = {
        nombre: updated.nombre,
        correo: updated.correo,
        telefono: updated.telefono,
        puesto: updated.cargo,
        sucursal: updated.sucursal,
        cedula_tecnica: updated.cedulaTecnica,
        foto_url: updated.fotoUrl || null,
        firma_digital: updated.firmaDigital || null,
      };
      if (currentUser?.id) {
        await supabase.from('employees').update(payload).eq('id', currentUser.id);
      }
      await supabase.from('employees').update(payload).eq('correo', updated.correo);
    } catch (err) {
      console.log('Info sync Supabase empleado:', err);
    }

    showToast('Perfil de técnico y fotografía guardados exitosamente.', 'success');
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Login Success Handler
  const handleLoginSuccess = (user: Employee, role: UserRole) => {
    setCurrentUser(user);
    setCurrentRole(role);
    setIsLoginModalOpen(false);

    try {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch {}

    // Update active profile with user details
    const newProfile: AdminProfile = {
      nombre: user.nombre,
      correo: user.correo,
      cargo: user.puesto || (role === 'admin' ? 'Administrador' : 'Técnico de Servicio'),
      telefono: user.telefono || '+52 (33) 3615-8920',
      sucursal: user.sucursal || 'Guadalajara (Matriz)',
      cedulaTecnica: user.cedulaTecnica || 'SOT-01',
      bio: `Usuario activo en SOTEX con rol de ${role === 'admin' ? 'Administrador' : 'Técnico'}.`,
      fotoUrl: user.fotoUrl,
      firmaDigital: user.firmaDigital,
    };

    if (role === 'admin') {
      setAdminProfile(newProfile);
      try {
        localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(newProfile));
      } catch {}
    } else {
      setTechProfile(newProfile);
      try {
        localStorage.setItem(TECH_PROFILE_KEY, JSON.stringify(newProfile));
      } catch {}
    }

    if (role === 'tecnico' && activeModule === 'empleados') {
      setActiveModule('reportes');
    } else {
      setActiveModule('metricas');
    }

    showToast(`¡Bienvenido ${user.nombre}! Acceso como ${role === 'admin' ? 'Administrador' : 'Técnico'}.`, 'success');
  };

  const handleLogout = () => {
    setCurrentRole(null);
    setCurrentUser(null);
    try {
      localStorage.removeItem(ROLE_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {}
    showToast('Sesión finalizada. Bienvenido a la selección de roles.', 'info');
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Employees Handlers
  const handleAddEmployee = (newEmp: Employee) => {
    setEmployees((prev) => [newEmp, ...prev]);
    showToast(`Empleado "${newEmp.nombre}" dado de alta con éxito.`, 'success');
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    setEmployees((prev) => prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e)));
    showToast(`Empleado "${updatedEmp.nombre}" actualizado correctamente.`, 'success');
  };

  const handleRequestDeleteEmployee = (employee: Employee) => {
    setDeleteTarget({ type: 'employee', employee });
    setIsDeleteModalOpen(true);
  };

  // Reports Handlers
  const handleOpenNewReport = () => {
    setEditingReport(null);
    setIsFormOpen(true);
  };

  const handleEditReport = (report: ServiceReport) => {
    setIsDetailOpen(false);
    setEditingReport(report);
    setIsFormOpen(true);
  };

  const handleViewReport = (report: ServiceReport) => {
    setViewingReport(report);
    setIsDetailOpen(true);
  };

  const handleRequestDeleteReport = (report: ServiceReport) => {
    setDeleteTarget({ type: 'report', report });
    setIsDeleteModalOpen(true);
  };

  const handleRequestBulkDeleteReports = (reportsToDelete: ServiceReport[]) => {
    if (!reportsToDelete || reportsToDelete.length === 0) return;
    setDeleteTarget({ type: 'bulk_reports', reports: reportsToDelete });
    setIsDeleteModalOpen(true);
  };

  // Execute Permanent Deletion (Local Storage + Supabase "De Raíz")
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'report') {
      const { report } = deleteTarget;
      // 1. Add to permanent blacklist
      addPermanentlyDeletedReportKeys(report.id, report.folio);

      // 2. Remove immediately from local state and persist
      deleteReportFromIndexedDB(report.id);
      const remaining = reports.filter((r) => r.id !== report.id && r.folio !== report.folio);
      setReports(remaining);
      saveReportsSafely(remaining);

      // 3. Delete from Supabase table service_reports permanently (de raíz)
      await deleteReportFromSupabase(report.id, report.folio);

      // 4. Dispatch deletion event for cross-tab sync
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('sotex_report_deleted', { detail: { id: report.id, folio: report.folio } })
        );
      }

      if (isDetailOpen && viewingReport?.id === report.id) {
        setIsDetailOpen(false);
        setViewingReport(null);
      }

      showToast(`Reporte ${report.folio} borrado de raíz de Supabase y del sistema.`, 'success');
    } else if (deleteTarget.type === 'bulk_reports') {
      const { reports: toDelete } = deleteTarget;
      const ids = toDelete.map((r) => r.id);
      const folios = toDelete.map((r) => r.folio);

      // 1. Add to permanent blacklist
      toDelete.forEach((r) => {
        addPermanentlyDeletedReportKeys(r.id, r.folio);
        deleteReportFromIndexedDB(r.id);
      });

      // 2. Remove immediately from local state and persist
      const remaining = reports.filter((r) => !ids.includes(r.id) && !folios.includes(r.folio));
      setReports(remaining);
      saveReportsSafely(remaining);

      // 3. Delete from Supabase table permanently
      await Promise.all(toDelete.map((r) => deleteReportFromSupabase(r.id, r.folio)));

      showToast(`${toDelete.length} reportes borrados de raíz exitosamente de Supabase y del sistema.`, 'success');
    } else if (deleteTarget.type === 'employee') {
      const { employee } = deleteTarget;

      // 1. Add to permanent blacklist
      addPermanentlyDeletedEmployeeKeys(
        employee.id,
        employee.usuario,
        employee.correo
      );

      // 2. Remove immediately from local state
      setEmployees((prev) =>
        prev.filter(
          (e) =>
            e.id !== employee.id &&
            (!employee.usuario || e.usuario !== employee.usuario) &&
            (!employee.correo ||
              e.correo.toLowerCase() !== employee.correo.toLowerCase())
        )
      );

      // 3. Delete from Supabase table employees permanently
      try {
        await supabase.from('employees').delete().eq('id', employee.id);
        if (employee.usuario) {
          await supabase.from('employees').delete().eq('usuario', employee.usuario);
        }
        if (employee.correo) {
          await supabase.from('employees').delete().eq('correo', employee.correo);
        }
      } catch (err) {
        console.error('Error al borrar empleado en Supabase:', err);
      }

      showToast(`Empleado "${employee.nombre}" borrado de raíz de Supabase y del sistema.`, 'success');
    }

    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const handleSaveFolioConfig = async (newConfig: FolioConfig) => {
    setFolioConfig(newConfig);
    await saveFolioConfig(newConfig);
    showToast(`Consecutivo oficial actualizado: ${newConfig.prefijo}...`, 'success');
  };

  const handleAcceptOrder = async (folio: string) => {
    const target = reports.find((r) => r.folio === folio);
    if (!target) return;

    const currentProfile = currentRole === 'tecnico' ? techProfile : adminProfile;
    const nowIso = new Date().toISOString();
    const updated: ServiceReport = {
      ...target,
      aceptadaPorTecnico: true,
      fechaAceptada: nowIso,
    };

    setReports((prev) => prev.map((r) => (r.folio === folio ? updated : r)));
    setFloatingAlertOrder(null);

    // Sync to Supabase with schema resilience
    await saveReportToSupabase(updated);

    // Mark corresponding notification as read
    setNotifications((prev) => {
      const updatedNotifs = prev.map((n) =>
        n.folio === folio ? { ...n, leida: true, accionRequerida: false } : n
      );
      saveNotifications(updatedNotifs);
      return updatedNotifs;
    });

    // Dispatch notification to Admin
    await dispatchNotification({
      titulo: 'Orden de Trabajo Aceptada',
      mensaje: `El técnico ${currentProfile.nombre} ha recibido y aceptado la orden ${target.folio} (${target.empresa}).`,
      tipo: 'orden_aceptada',
      ordenId: target.id,
      folio: target.folio,
      destinatarioRol: 'admin',
      remitenteNombre: currentProfile.nombre,
      leida: false,
      accionRequerida: false,
    });

    showToast(`¡Orden ${folio} aceptada! El administrador ha sido notificado al instante.`, 'success');
  };

  const handleStatusChange = async (report: ServiceReport, newStatus: ServiceStatus) => {
    if (report.status === newStatus) return;
    const oldStatus = report.status;
    const updated: ServiceReport = { ...report, status: newStatus };

    setReports((prev) => prev.map((r) => (r.id === report.id ? updated : r)));

    // Sync to Supabase with schema resilience
    saveReportToSupabase(updated).catch(() => {});

    // If technician changed the status, notify Admin!
    if (currentRole === 'tecnico') {
      const currentProfile = techProfile;
      await dispatchNotification({
        titulo: `Estatus de Orden Actualizado: ${newStatus}`,
        mensaje: `El técnico ${currentProfile.nombre} actualizó la orden ${report.folio} (${report.empresa}) a '${newStatus}'.`,
        tipo: 'cambio_estatus',
        ordenId: report.id,
        folio: report.folio,
        destinatarioRol: 'admin',
        remitenteNombre: currentProfile.nombre,
        leida: false,
        accionRequerida: false,
        detalles: {
          estatusAnterior: oldStatus,
          estatusNuevo: newStatus,
          empresa: report.empresa,
        },
      });
    }

    showToast(`Estatus de orden ${report.folio} actualizado a "${newStatus}".`, 'success');
  };

  const handleMarkNotifAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, leida: true } : n));
      saveNotifications(updated);
      return updated;
    });
  };

  const handleMarkAllNotifsAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, leida: true }));
      saveNotifications(updated);
      return updated;
    });
    showToast('Todas las notificaciones han sido marcadas como leídas.', 'info');
  };

  const handleClearAllNotifs = () => {
    setNotifications([]);
    saveNotifications([]);
    showToast('Historial de notificaciones limpiado.', 'info');
  };

  const handleSaveReport = async (report: ServiceReport, andDownloadPDF = false) => {
    const isNew = !reports.some((r) => r.id === report.id || r.folio === report.folio);
    const previous = reports.find((r) => r.id === report.id || r.folio === report.folio);

    // If new report created, advance consecutive counter in folioConfig!
    if (isNew) {
      advanceFolioNumber()
        .then((res) => {
          setFolioConfig((prev) => ({ ...prev, ultimoNumero: res.newNumber }));
        })
        .catch(() => {});
    }

    setReports((prev) => {
      const existsIndex = prev.findIndex((r) => r.id === report.id || r.folio === report.folio);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = report;
        return updated;
      } else {
        return [report, ...prev];
      }
    });

    setIsFormOpen(false);
    setEditingReport(null);

    // Sync to Supabase table service_reports with adaptive schema handling
    const supabaseRes = await saveReportToSupabase(report);
    if (!supabaseRes.success) {
      console.warn('Nota de sincronización Supabase:', supabaseRes.error);
    }

    const currentProfile = currentRole === 'tecnico' ? techProfile : adminProfile;

    // Dispatch real-time notifications
    if (isNew) {
      if (currentRole === 'admin') {
        // Admin assigned order to technician
        await dispatchNotification({
          titulo: 'Nueva Orden de Trabajo Asignada',
          mensaje: `Se ha asignado la orden ${report.folio} (${report.empresa}) para diagnóstico.`,
          tipo: 'nueva_orden',
          ordenId: report.id,
          folio: report.folio,
          destinatarioRol: 'tecnico',
          destinatarioTecnico: report.tecnicoNombre,
          remitenteNombre: currentProfile.nombre,
          leida: false,
          accionRequerida: true,
          detalles: {
            empresa: report.empresa,
            tipoServicio: report.tipoServicio,
            estatusNuevo: report.status,
          },
        });
      } else {
        // Technician registered new order
        await dispatchNotification({
          titulo: 'Nueva Orden Registrada por Técnico',
          mensaje: `El técnico ${currentProfile.nombre} dio de alta la orden ${report.folio} (${report.empresa}).`,
          tipo: 'nueva_orden',
          ordenId: report.id,
          folio: report.folio,
          destinatarioRol: 'admin',
          remitenteNombre: currentProfile.nombre,
          leida: false,
          accionRequerida: false,
          detalles: {
            empresa: report.empresa,
            tipoServicio: report.tipoServicio,
            estatusNuevo: report.status,
          },
        });
      }
    } else if (previous && previous.status !== report.status && currentRole === 'tecnico') {
      // Technician modified status, notify Admin
      await dispatchNotification({
        titulo: `Estatus de Orden Actualizado: ${report.status}`,
        mensaje: `El técnico ${currentProfile.nombre} actualizó la orden ${report.folio} (${report.empresa}) a '${report.status}'.`,
        tipo: 'cambio_estatus',
        ordenId: report.id,
        folio: report.folio,
        destinatarioRol: 'admin',
        remitenteNombre: currentProfile.nombre,
        leida: false,
        accionRequerida: false,
        detalles: {
          estatusAnterior: previous.status,
          estatusNuevo: report.status,
          empresa: report.empresa,
        },
      });
    }

    if (andDownloadPDF) {
      generateServiceReportPDF(report, true);
      showToast(`Reporte ${report.folio} guardado y descargado en PDF.`, 'success');
    } else {
      showToast(`Reporte ${report.folio} guardado exitosamente.`, 'success');
    }
  };

  const handleExportAllExcel = () => {
    if (reports.length === 0) {
      showToast('No hay reportes para exportar.', 'error');
      return;
    }
    exportReportsToExcel(reports, `Reportes_Servicio_SOTEX_Todos_${reports.length}.xlsx`);
    showToast(`Archivo Excel generado con ${reports.length} reportes.`, 'success');
  };

  const handleExportAllPDF = () => {
    if (reports.length === 0) {
      showToast('No hay reportes para exportar.', 'error');
      return;
    }
    generateAllReportsPDF(reports);
    showToast(`Compilado PDF generado con ${reports.length} reportes oficiales.`, 'success');
  };

  const handleResetData = () => {
    const deletedKeys = getPermanentlyDeletedReportKeys();
    const activeDemo = INITIAL_REPORTS.filter(
      (r) =>
        !deletedKeys.has(r.id.toLowerCase()) &&
        !deletedKeys.has(r.folio.toLowerCase())
    );
    setReports(activeDemo.map(normalizeReport));
    showToast('Datos demo restaurados (respetando registros borrados de raíz).', 'info');
  };

  // If no role is selected, render the Minimalist Home with Logo & 2-column role access
  if (!currentRole) {
    return (
      <>
        <RoleHomeView
          onOpenLogin={(roleHint) => {
            setTargetRoleHint(roleHint || null);
            setIsLoginModalOpen(true);
          }}
          onOpenSqlModal={() => setShowSqlModal(true)}
        />

        {/* Login Modal */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          targetRoleHint={targetRoleHint}
          onLoginSuccess={handleLoginSuccess}
          localEmployees={employees}
        />

        {/* Modal: View SQL for Supabase */}
        {showSqlModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#1a1a1a] rounded-2xl max-w-2xl w-full border border-neutral-700 max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-white">
              <div className="p-4 bg-[#111111] border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      Script SQL para Supabase (znlhwxjiwrwcfhswppfx)
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Pega y corre este código en Supabase &gt; SQL Editor
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-auto bg-neutral-950 font-mono text-xs text-emerald-300 select-all">
                <pre className="whitespace-pre-wrap">{SUPABASE_SETUP_SQL}</pre>
              </div>

              <div className="p-4 bg-[#111111] border-t border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  Tablas, políticas RLS y credenciales para Harold y Carlos.
                </span>
                <button
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar SQL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-5 right-5 z-50 animate-fade-in">
            <div
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold text-white ${
                toast.type === 'error'
                  ? 'bg-rose-600'
                  : toast.type === 'info'
                  ? 'bg-neutral-800'
                  : 'bg-emerald-600'
              }`}
            >
              {toast.type === 'error' ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </>
    );
  }

  const currentProfile = currentRole === 'tecnico' ? techProfile : adminProfile;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex font-sans selection:bg-[#D60000] selection:text-white">
      {/* 1. Left Sidebar - Desktop / Fullscreen ONLY */}
      <Sidebar
        currentRole={currentRole}
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onNewReport={handleOpenNewReport}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        reportsCount={reports.length}
        adminProfile={currentProfile}
        onLogout={handleLogout}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden min-h-screen">
        {/* Top Header Navbar */}
        <Navbar
          currentRole={currentRole}
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          onNewReport={handleOpenNewReport}
          onExportExcel={handleExportAllExcel}
          onExportAllPDF={handleExportAllPDF}
          totalCount={reports.length}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onLogout={handleLogout}
          unreadNotificationsCount={unreadNotificationsCount}
          onOpenFolioConfig={() => setIsFolioConfigOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 pb-24 lg:pb-8">
          {/* Module 1: Métricas */}
          {activeModule === 'metricas' && (
            <MetricsView
              reports={reports}
              onSelectReport={handleViewReport}
              onNavigateToReports={() => setActiveModule('reportes')}
            />
          )}

          {/* Module 2: Reportes de Servicio (Shared and synchronized) */}
          {activeModule === 'reportes' && (
            <div className="space-y-5">
              {/* Minimal Clean Header & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Reportes de Servicio
                  </h2>
                  <span className="bg-red-100 text-red-700 text-[11px] font-mono font-bold px-2 py-0.5 rounded">
                    {folioConfig.codigoFormato || 'SOT-REP-CLG-01'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleOpenNewReport}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D60000] hover:bg-[#b50000] text-white text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Nuevo Registro</span>
                  </button>

                  <button
                    onClick={handleExportAllExcel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Excel</span>
                  </button>

                  <button
                    onClick={handleExportAllPDF}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-red-400" />
                    <span>PDF ({reports.length})</span>
                  </button>
                </div>
              </div>

              {/* Executive Stats Cards */}
              <StatsCards reports={reports} />

              {/* Main Data Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <FileSearch className="w-4 h-4 text-slate-500" />
                    Listado de Reportes
                  </h3>
                  <button
                    onClick={handleResetData}
                    title="Restablecer registros demo"
                    className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restaurar demo
                  </button>
                </div>

                <ReportsTable
                  reports={reports}
                  onView={handleViewReport}
                  onEdit={handleEditReport}
                  onDelete={handleRequestDeleteReport}
                  onBulkDelete={handleRequestBulkDeleteReports}
                  onNewReport={handleOpenNewReport}
                />
              </div>
            </div>
          )}

          {/* Module: Historial de Órdenes de Trabajo (Admin & Técnico) */}
          {activeModule === 'historial' && (
            <WorkOrdersHistoryView
              reports={reports}
              currentRole={currentRole}
              currentUserName={currentUser?.nombre || currentProfile.nombre}
              onViewReport={handleViewReport}
              onEditReport={handleEditReport}
              onDeleteReport={handleRequestDeleteReport}
              onStatusChange={handleStatusChange}
              onAcceptOrder={handleAcceptOrder}
              onNewReport={handleOpenNewReport}
            />
          )}

          {/* Module: Notificaciones en Tiempo Real (Admin & Técnico) */}
          {activeModule === 'notificaciones' && (
            <NotificationsView
              notifications={notifications}
              currentRole={currentRole}
              currentUserName={currentUser?.nombre || currentProfile.nombre}
              onMarkAsRead={handleMarkNotifAsRead}
              onMarkAllAsRead={handleMarkAllNotifsAsRead}
              onClearAll={handleClearAllNotifs}
              onSelectOrder={(folio) => {
                const rep = reports.find((r) => r.folio === folio);
                if (rep) handleViewReport(rep);
              }}
              onAcceptOrder={handleAcceptOrder}
              reports={reports}
            />
          )}

          {/* Module 3: Empleados (Admin Role Only) */}
          {activeModule === 'empleados' && currentRole === 'admin' && (
            <EmployeesView
              employees={employees}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleRequestDeleteEmployee}
            />
          )}

          {/* Module 4: Perfil */}
          {activeModule === 'perfil' && (
            <AdminProfileView
              profile={currentProfile}
              onSaveProfile={currentRole === 'tecnico' ? handleSaveTechProfile : handleSaveAdminProfile}
              reports={reports}
            />
          )}

          {/* Module 5: Manual del Usuario (Admin y Técnico) */}
          {activeModule === 'manual' && (
            <UserManualView
              currentRole={currentRole}
              onOpenSqlModal={() => setShowSqlModal(true)}
            />
          )}
        </main>

        {/* Desktop Footer */}
        <footer className="bg-white border-t border-slate-200 py-3 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">SOTEX</span>
              <span>•</span>
              <span className="font-mono text-slate-500">{folioConfig.codigoFormato || 'SOT-REP-CLG-01'}</span>
              <span>•</span>
              <span className="font-medium text-slate-600">
                Rol: {currentRole === 'admin' ? 'Administrador' : 'Técnico de Servicio'}
                {currentUser ? ` (${currentUser.nombre})` : ''}
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-500">
              <button
                onClick={handleLogout}
                className="hover:text-[#D60000] transition-colors underline font-medium cursor-pointer"
              >
                Cerrar Sesión
              </button>
              <span>•</span>
              <button
                onClick={() => setShowSqlModal(true)}
                className="hover:text-emerald-600 transition-colors underline font-medium cursor-pointer flex items-center gap-1"
              >
                <Database className="w-3 h-3 text-emerald-600" />
                <span>SQL Supabase</span>
              </button>
              <span>•</span>
              <a
                href="https://www.sotex.com.mx"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#D60000] transition-colors underline font-medium"
              >
                sotex.com.mx
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* 3. Bottom Navigation Bar - Mobile & Tablet ONLY */}
      <BottomNav
        currentRole={currentRole}
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        reportsCount={reports.length}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* Form Modal (Create / Edit Report) */}
      <ReportFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingReport(null);
        }}
        onSave={handleSaveReport}
        initialReport={editingReport}
        existingReportsCount={reports.length}
        defaultAdminProfile={currentProfile}
        currentRole={currentRole}
        currentUserName={currentUser?.nombre || currentProfile.nombre}
        techniciansList={techniciansList}
        folioConfig={folioConfig}
      />

      {/* Detail Modal (Printable Sheet View) */}
      <ReportDetailModal
        isOpen={isDetailOpen}
        report={viewingReport}
        onClose={() => {
          setIsDetailOpen(false);
          setViewingReport(null);
        }}
        onEdit={(rep) => handleEditReport(rep)}
        onDelete={(rep) => handleRequestDeleteReport(rep)}
        onAccept={handleAcceptOrder}
        currentRole={currentRole}
      />

      {/* Folio and Format Code Configuration Modal (Admin) */}
      <FolioConfigModal
        isOpen={isFolioConfigOpen}
        onClose={() => setIsFolioConfigOpen(false)}
        config={folioConfig}
        onSave={handleSaveFolioConfig}
      />

      {/* Floating Notification Window for Technician & Admin */}
      {floatingAlertOrder && (
        <FloatingNotificationAlert
          report={floatingAlertOrder}
          notification={floatingAlertNotification}
          currentRole={currentRole}
          onAccept={(rep) => handleAcceptOrder(rep.folio)}
          onView={(rep) => handleViewReport(rep)}
          onDismiss={() => {
            setFloatingAlertOrder(null);
            setFloatingAlertNotification(null);
          }}
          technicianName={currentUser?.nombre || currentProfile.nombre}
        />
      )}

      {/* Delete Confirm Modal (Borrar de Raíz) */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        target={deleteTarget}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* Modal: View SQL for Supabase */}
      {showSqlModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1a1a1a] rounded-2xl max-w-2xl w-full border border-neutral-700 max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-white">
            <div className="p-4 bg-[#111111] border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="font-bold text-sm text-white">
                    Script SQL para Supabase (znlhwxjiwrwcfhswppfx)
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Pega y corre este código en Supabase &gt; SQL Editor
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-neutral-950 font-mono text-xs text-emerald-300 select-all">
              <pre className="whitespace-pre-wrap">{SUPABASE_SETUP_SQL}</pre>
            </div>

            <div className="p-4 bg-[#111111] border-t border-neutral-800 flex items-center justify-between">
              <span className="text-xs text-neutral-400">
                Tablas, políticas RLS y credenciales para Harold y Carlos.
              </span>
              <button
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 lg:bottom-5 right-5 z-50 animate-fade-in">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold text-white ${
              toast.type === 'error'
                ? 'bg-rose-600'
                : toast.type === 'info'
                ? 'bg-slate-800'
                : 'bg-emerald-600'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
