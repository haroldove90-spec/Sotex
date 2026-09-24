/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ServiceReport, VisitNumber, ActiveModule, AdminProfile, UserRole, Employee } from './types';
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
import { ReportFormModal } from './components/ReportFormModal';
import { ReportDetailModal } from './components/ReportDetailModal';
import { exportReportsToExcel } from './utils/excelExport';
import { generateAllReportsPDF, generateServiceReportPDF } from './utils/pdfExport';
import { supabase, SUPABASE_SETUP_SQL } from './utils/supabaseClient';
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
} from 'lucide-react';

const STORAGE_KEY = 'sotex_service_reports_v2';
const ADMIN_PROFILE_KEY = 'sotex_admin_profile_v2';
const TECH_PROFILE_KEY = 'sotex_tech_profile_v2';
const EMPLOYEES_STORAGE_KEY = 'sotex_employees_v2';
const ROLE_STORAGE_KEY = 'sotex_active_role_v2';
const USER_STORAGE_KEY = 'sotex_active_user_v2';

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
  return {
    id: raw?.id || `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    reportCode: raw?.reportCode || 'SOT-REP-CLG-01',
    folio: raw?.folio || 'SOT-2024-000',
    empresa: raw?.empresa || 'Cliente SOTEX',
    fecha: raw?.fecha || new Date().toISOString().split('T')[0],
    direccion: raw?.direccion || '',
    telefono: raw?.telefono || '',
    numVisita: (raw?.numVisita >= 1 && raw?.numVisita <= 4 ? raw.numVisita : 1) as VisitNumber,
    equipo: {
      equipo: raw?.equipo?.equipo || 'Impresora Térmica',
      marca: raw?.equipo?.marca || 'Zebra',
      modelo: raw?.equipo?.modelo || 'ZT411',
      dpi: raw?.equipo?.dpi || '203',
      noSerie: raw?.equipo?.noSerie || 'N/D',
    },
    danos: {
      cabezal: Boolean(raw?.danos?.cabezal),
      rodilloPrincipal: Boolean(raw?.danos?.rodilloPrincipal),
      display: Boolean(raw?.danos?.display),
      sensorPapel: Boolean(raw?.danos?.sensorPapel),
      sensorRibbon: Boolean(raw?.danos?.sensorRibbon),
      bandas: Boolean(raw?.danos?.bandas),
      cutter: Boolean(raw?.danos?.cutter),
      rebobinador: Boolean(raw?.danos?.rebobinador),
      otro: Boolean(raw?.danos?.otro),
    },
    descripcionDanos: raw?.descripcionDanos || '',
    pruebaCabezalResultado: raw?.pruebaCabezalResultado || '',
    pruebaCabezalImagen: raw?.pruebaCabezalImagen,
    clienteNombre: raw?.clienteNombre || '',
    clienteEmail: raw?.clienteEmail || '',
    clienteFirma: raw?.clienteFirma,
    tecnicoNombre: raw?.tecnicoNombre || 'Ing. Javier Rojas (SOTEX)',
    tecnicoFirma: raw?.tecnicoFirma,
    status: raw?.status || 'Completado',
    observacionesGenerales: raw?.observacionesGenerales || '',
    createdAt: raw?.createdAt || new Date().toISOString(),
  };
};

export default function App() {
  // Current active role: null (Home view) | 'admin' | 'tecnico'
  const [currentRole, setCurrentRole] = useState<UserRole | null>(() => {
    try {
      const saved = localStorage.getItem(ROLE_STORAGE_KEY);
      if (saved === 'admin' || saved === 'tecnico') {
        return saved as UserRole;
      }
    } catch {}
    return null;
  });

  // Current logged in user object
  const [currentUser, setCurrentUser] = useState<Employee | null>(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Login Modal state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [targetRoleHint, setTargetRoleHint] = useState<UserRole | null>(null);

  // Global SQL viewer modal state
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Reports state (shared and synchronized)
  const [reports, setReports] = useState<ServiceReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeReport);
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_REPORTS.map(normalizeReport);
  });

  // Active module navigation: 'metricas' | 'reportes' | 'empleados' | 'perfil'
  const [activeModule, setActiveModule] = useState<ActiveModule>('metricas');

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
    try {
      const saved = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_EMPLOYEES;
  });

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ServiceReport | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<ServiceReport | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info' | 'error' } | null>(null);

  // Fetch / Sync with Supabase on mount
  useEffect(() => {
    const fetchSupabaseData = async () => {
      try {
        const { data, error } = await supabase.from('employees').select('*');
        if (!error && data && data.length > 0) {
          const remoteEmployees: Employee[] = data.map((d: any) => ({
            id: d.id,
            nombre: d.nombre,
            usuario: d.usuario,
            correo: d.correo,
            password: d.password,
            rol: d.rol === 'admin' ? 'admin' : 'tecnico',
            telefono: d.telefono || '',
            puesto: d.puesto || '',
            sucursal: d.sucursal || 'Guadalajara (Matriz)',
            cedulaTecnica: d.cedula_tecnica || '',
            activo: d.activo ?? true,
            fotoUrl: d.foto_url,
            firmaDigital: d.firma_digital,
            fechaRegistro: d.created_at || new Date().toISOString().split('T')[0],
          }));

          setEmployees((localList) => {
            const merged = [...remoteEmployees];
            for (const local of localList) {
              if (
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
        console.log('Info de conexión a Supabase:', err);
      }
    };

    fetchSupabaseData();
  }, []);

  // Save reports to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch (e) {
      console.error('Error saving reports to localStorage:', e);
    }
  }, [reports]);

  // Save employees to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
    } catch (e) {
      console.error('Error saving employees to localStorage:', e);
    }
  }, [employees]);

  // Save admin profile to localStorage
  const handleSaveAdminProfile = (updated: AdminProfile) => {
    setAdminProfile(updated);
    try {
      localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving admin profile to localStorage:', e);
    }
    showToast('Perfil de administrador actualizado correctamente.', 'success');
  };

  // Save tech profile to localStorage
  const handleSaveTechProfile = (updated: AdminProfile) => {
    setTechProfile(updated);
    try {
      localStorage.setItem(TECH_PROFILE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving technician profile to localStorage:', e);
    }
    showToast('Perfil de técnico actualizado correctamente.', 'success');
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

  const handleDeleteEmployee = (id: string) => {
    const target = employees.find((e) => e.id === id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    showToast(`Empleado "${target?.nombre || 'seleccionado'}" eliminado.`, 'info');
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

  const handleDeleteReport = (id: string) => {
    const target = reports.find((r) => r.id === id);
    if (!target) return;

    if (window.confirm(`¿Está seguro de eliminar el reporte de servicio con Folio "${target.folio}" de la empresa "${target.empresa}"?`)) {
      setReports((prev) => prev.filter((r) => r.id !== id));
      showToast(`Reporte ${target.folio} eliminado correctamente.`, 'info');
    }
  };

  const handleSaveReport = (report: ServiceReport, andDownloadPDF = false) => {
    setReports((prev) => {
      const existsIndex = prev.findIndex((r) => r.id === report.id);
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
    if (window.confirm('¿Desea restaurar los datos de ejemplo iniciales del formato SOT-REP-CLG-01?')) {
      setReports(INITIAL_REPORTS.map(normalizeReport));
      showToast('Datos de muestra restaurados.', 'info');
    }
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
                    SOT-REP-CLG-01
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
                  onDelete={handleDeleteReport}
                  onNewReport={handleOpenNewReport}
                />
              </div>
            </div>
          )}

          {/* Module 3: Empleados (Admin Role Only) */}
          {activeModule === 'empleados' && currentRole === 'admin' && (
            <EmployeesView
              employees={employees}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
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
        </main>

        {/* Desktop Footer */}
        <footer className="bg-white border-t border-slate-200 py-3 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">SOTEX</span>
              <span>•</span>
              <span className="font-mono text-slate-500">SOT-REP-CLG-01</span>
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
