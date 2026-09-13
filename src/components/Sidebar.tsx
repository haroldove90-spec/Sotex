import React from 'react';
import { ActiveModule, AdminProfile } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import {
  FileText,
  BarChart3,
  User,
  Plus,
  PanelLeftClose,
  PanelLeft,
  ShieldCheck,
  ChevronRight,
  Printer,
} from 'lucide-react';

interface SidebarProps {
  activeModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
  onNewReport: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  reportsCount: number;
  adminProfile: AdminProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  onNewReport,
  isCollapsed,
  onToggleCollapse,
  reportsCount,
  adminProfile,
}) => {
  return (
    <aside
      className={`hidden lg:flex flex-col bg-[#212121] text-white border-r border-neutral-800 transition-all duration-300 ease-in-out shrink-0 select-none z-30 h-screen sticky top-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header with Unencapsulated Logo & Collapse Toggle */}
      <div className="h-20 px-4 flex items-center justify-between border-b border-neutral-800">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Real Logo without white encapsulation */}
            <img
              src="https://sotex.com.mx/wp-content/uploads/2023/02/cropped-PNG-1-scaled-300x114.png"
              alt="SOTEX"
              className="h-10 w-auto object-contain max-w-[150px]"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="mx-auto flex items-center justify-center">
            {/* Collapsed small icon */}
            <img
              src="https://ljymwaifrkaedgmpdpwv.supabase.co/storage/v1/object/public/logo/urchecklogo.png"
              alt="Sotex"
              className="w-8 h-8 object-contain rounded-md"
            />
          </div>
        )}

        {/* Hamburger / Collapse toggle for Fullscreen */}
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors hidden lg:flex items-center justify-center"
        >
          {isCollapsed ? <PanelLeft className="w-5 h-5 text-neutral-300" /> : <PanelLeftClose className="w-5 h-5 text-neutral-300" />}
        </button>
      </div>

      {/* Quick Action: Nuevo Reporte */}
      <div className="p-3">
        <button
          id="btn-sidebar-nuevo-reporte"
          onClick={onNewReport}
          title="Crear nuevo reporte de servicio"
          className={`w-full flex items-center justify-center gap-2 font-bold text-xs rounded-xl bg-[#D60000] hover:bg-[#b50000] text-white transition-all shadow-md active:scale-98 ${
            isCollapsed ? 'h-11 px-0' : 'py-3 px-4'
          }`}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          {!isCollapsed && <span>Nuevo Reporte</span>}
        </button>
      </div>

      {/* Navigation Modules */}
      <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
        {/* 1. Module: Métricas */}
        <button
          onClick={() => onSelectModule('metricas')}
          title="Métricas"
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all ${
            activeModule === 'metricas'
              ? 'bg-[#D60000]/15 text-white border border-[#D60000]/30 shadow-xs'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/70'
          } ${isCollapsed ? 'justify-center' : ''}`}
        >
          <BarChart3
            className={`w-5 h-5 shrink-0 ${
              activeModule === 'metricas' ? 'text-[#D60000]' : 'text-neutral-400'
            }`}
          />
          {!isCollapsed && <span>Métricas</span>}
        </button>

        {/* 2. Module: Reportes */}
        <button
          onClick={() => onSelectModule('reportes')}
          title="Reportes"
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all ${
            activeModule === 'reportes'
              ? 'bg-[#D60000]/15 text-white border border-[#D60000]/30 shadow-xs'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/70'
          } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
        >
          <div className="flex items-center gap-3">
            <FileText
              className={`w-5 h-5 shrink-0 ${
                activeModule === 'reportes' ? 'text-[#D60000]' : 'text-neutral-400'
              }`}
            />
            {!isCollapsed && <span>Reportes</span>}
          </div>
          {!isCollapsed && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeModule === 'reportes'
                  ? 'bg-[#D60000] text-white'
                  : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              {reportsCount}
            </span>
          )}
        </button>

        {/* 3. Module: Perfil */}
        <button
          onClick={() => onSelectModule('perfil')}
          title="Perfil"
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all ${
            activeModule === 'perfil'
              ? 'bg-[#D60000]/15 text-white border border-[#D60000]/30 shadow-xs'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/70'
          } ${isCollapsed ? 'justify-center' : ''}`}
        >
          <User
            className={`w-5 h-5 shrink-0 ${
              activeModule === 'perfil' ? 'text-[#D60000]' : 'text-neutral-400'
            }`}
          />
          {!isCollapsed && <span>Perfil</span>}
        </button>
      </nav>

      {/* PWA Install Area */}
      <div className="p-3 border-t border-neutral-800">
        {!isCollapsed ? (
          <div className="bg-neutral-900/90 rounded-xl p-3 border border-neutral-800/80">
            <div className="flex items-center gap-2 mb-2">
              <img
                src="https://ljymwaifrkaedgmpdpwv.supabase.co/storage/v1/object/public/logo/urchecklogo.png"
                alt="Sotex"
                className="w-5 h-5 object-contain"
              />
              <span className="text-[11px] font-bold text-neutral-200">Sotex PWA</span>
            </div>
            <PWAInstallButton className="w-full justify-center text-xs py-2" />
          </div>
        ) : (
          <div className="flex justify-center">
            <PWAInstallButton className="px-2 py-2" />
          </div>
        )}
      </div>

      {/* User Footer Profile Pill */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-900/50">
        <button
          onClick={() => onSelectModule('perfil')}
          title="Ver perfil"
          className={`w-full flex items-center gap-3 p-1.5 rounded-xl hover:bg-neutral-800/80 transition-colors text-left ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center shrink-0">
            {adminProfile.fotoUrl ? (
              <img
                src={adminProfile.fotoUrl}
                alt={adminProfile.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-neutral-400" />
            )}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{adminProfile.nombre}</p>
              <p className="text-[10px] text-neutral-400 truncate">{adminProfile.cargo}</p>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
