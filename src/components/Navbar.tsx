import React from 'react';
import { ActiveModule, UserRole } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Menu,
  FileSpreadsheet,
  FileText,
  Plus,
  LogOut,
  ShieldCheck,
  Wrench,
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  activeModule: ActiveModule;
  onSelectModule: (mod: ActiveModule) => void;
  onNewReport: () => void;
  onExportExcel: () => void;
  onExportAllPDF: () => void;
  totalCount: number;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  activeModule,
  onSelectModule,
  onNewReport,
  onExportExcel,
  onExportAllPDF,
  totalCount,
  isSidebarCollapsed,
  onToggleSidebar,
  onLogout,
}) => {
  const getModuleTitle = () => {
    switch (activeModule) {
      case 'metricas':
        return {
          title: 'Métricas',
          code: 'SOT-MET-01',
        };
      case 'reportes':
        return {
          title: 'Reportes de Servicio',
          code: 'SOT-REP-CLG-01',
        };
      case 'empleados':
        return {
          title: 'Gestión de Empleados',
          code: 'SOT-EMP-01',
        };
      case 'perfil':
        return {
          title: 'Perfil',
          code: 'SOT-PER-01',
        };
    }
  };

  const currentInfo = getModuleTitle();

  return (
    <header className="sticky top-0 z-20 bg-[#212121] text-white shadow-xs border-b border-neutral-800">
      <div className="w-full px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          {/* Left: Desktop Hamburger toggle + Logo / Title */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger Icon - Desktop fullscreen toggle */}
            <button
              id="btn-desktop-hamburger"
              onClick={onToggleSidebar}
              title={isSidebarCollapsed ? 'Abrir barra lateral' : 'Cerrar barra lateral'}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors border border-neutral-700/60 cursor-pointer"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
            </button>

            {/* Logo on Tablet and Mobile */}
            <div className="flex lg:hidden items-center">
              <img
                src="https://sotex.com.mx/wp-content/uploads/2023/02/cropped-PNG-1-scaled-300x114.png"
                alt="SOTEX"
                className="h-7 sm:h-8 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Title & Code tag */}
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-neutral-100 tracking-tight truncate">
                {currentInfo.title}
              </h1>
              <span className="bg-[#D60000]/20 text-[#ff6666] border border-[#D60000]/40 text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0">
                {currentInfo.code}
              </span>
            </div>

            {/* Role Badge */}
            <div className="hidden md:flex items-center">
              {currentRole === 'admin' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-700/50 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3 text-red-400" />
                  Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/50 text-[10px] font-bold">
                  <Wrench className="w-3 h-3 text-amber-400" />
                  Técnico
                </span>
              )}
            </div>
          </div>

          {/* Right Action buttons: PWA Install + Exports + New Report + Logout */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />

            {activeModule === 'reportes' && (
              <>
                <button
                  id="btn-navbar-excel"
                  onClick={onExportExcel}
                  title="Exportar a Excel"
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-emerald-700 hover:bg-emerald-600 text-white transition-all shadow-2xs active:scale-95 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>

                <button
                  id="btn-navbar-pdf"
                  onClick={onExportAllPDF}
                  title="Descargar PDF"
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-neutral-700 hover:bg-neutral-600 text-white transition-all shadow-2xs active:scale-95 border border-neutral-600 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-red-400" />
                  <span>PDF ({totalCount})</span>
                </button>
              </>
            )}

            <button
              id="btn-navbar-nuevo"
              onClick={onNewReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md bg-[#D60000] hover:bg-[#b50000] text-white transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Nuevo Reporte</span>
              <span className="sm:hidden">Nuevo</span>
            </button>

            {/* Logout button in navbar */}
            <button
              id="btn-navbar-logout"
              onClick={onLogout}
              title="Cerrar sesión / Salir al Home"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-red-950/80 hover:border-red-600/50 border border-neutral-700/60 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
