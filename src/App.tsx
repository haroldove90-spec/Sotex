/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ServiceReport, VisitNumber, ActiveModule, AdminProfile } from './types';
import { INITIAL_REPORTS } from './data/mockReports';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { StatsCards } from './components/StatsCards';
import { ReportsTable } from './components/ReportsTable';
import { MetricsView } from './components/MetricsView';
import { AdminProfileView } from './components/AdminProfileView';
import { ReportFormModal } from './components/ReportFormModal';
import { ReportDetailModal } from './components/ReportDetailModal';
import { exportReportsToExcel } from './utils/excelExport';
import { generateAllReportsPDF, generateServiceReportPDF } from './utils/pdfExport';
import {
  FileText,
  FileSpreadsheet,
  Plus,
  RotateCcw,
  Check,
  AlertTriangle,
  FileSearch,
  Printer,
} from 'lucide-react';

const STORAGE_KEY = 'sotex_service_reports_v2';
const ADMIN_PROFILE_KEY = 'sotex_admin_profile_v2';

const DEFAULT_ADMIN_PROFILE: AdminProfile = {
  nombre: 'Ing. Javier Rojas',
  correo: 'javier.rojas@sotex.com.mx',
  cargo: 'Administrador de Servicio Técnico',
  telefono: '+52 (33) 3615-8920',
  sucursal: 'Guadalajara (Matriz)',
  cedulaTecnica: 'SOT-ING-4819',
  bio: 'Especialista en diagnóstico y mantenimiento de cabezales térmicos Zebra, Honeywell, SATO y Datamax.',
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

  // Active module navigation: 'metricas' | 'reportes' | 'perfil'
  const [activeModule, setActiveModule] = useState<ActiveModule>('metricas');

  // Sidebar collapse state (Fullscreen desktop hamburger)
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

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ServiceReport | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<ServiceReport | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info' | 'error' } | null>(null);

  // Save reports to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch (e) {
      console.error('Error saving reports to localStorage:', e);
    }
  }, [reports]);

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

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Handlers
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
      setReports(INITIAL_REPORTS);
      showToast('Datos de muestra restaurados.', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex font-sans selection:bg-[#D60000] selection:text-white">
      {/* 1. Left Sidebar - Desktop / Fullscreen ONLY (hidden on mobile and tablet) */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onNewReport={handleOpenNewReport}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        reportsCount={reports.length}
        adminProfile={adminProfile}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden min-h-screen">
        {/* Top Header Navbar */}
        <Navbar
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          onNewReport={handleOpenNewReport}
          onExportExcel={handleExportAllExcel}
          onExportAllPDF={handleExportAllPDF}
          totalCount={reports.length}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Main Content Area (extra bottom padding on mobile for bottom navigation) */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 pb-24 lg:pb-8">
          {/* Module 1: Métricas */}
          {activeModule === 'metricas' && (
            <MetricsView
              reports={reports}
              onSelectReport={handleViewReport}
              onNavigateToReports={() => setActiveModule('reportes')}
            />
          )}

          {/* Module 2: Reportes de Servicio */}
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D60000] hover:bg-[#b50000] text-white text-xs font-bold shadow-2xs transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Nuevo Registro</span>
                  </button>

                  <button
                    onClick={handleExportAllExcel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-2xs transition-all active:scale-95"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Excel</span>
                  </button>

                  <button
                    onClick={handleExportAllPDF}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-2xs transition-all active:scale-95"
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

          {/* Module 3: Perfil */}
          {activeModule === 'perfil' && (
            <AdminProfileView
              profile={adminProfile}
              onSaveProfile={handleSaveAdminProfile}
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
            </div>
            <div className="flex items-center gap-3 text-slate-500">
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
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        reportsCount={reports.length}
      />

      {/* Form Modal (Create / Edit) */}
      <ReportFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingReport(null);
        }}
        onSave={handleSaveReport}
        initialReport={editingReport}
        existingReportsCount={reports.length}
        defaultAdminProfile={adminProfile}
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
