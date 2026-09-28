import React from 'react';
import { ActiveModule, AdminProfile, UserRole } from '../types';
import {
  FileText,
  BarChart3,
  User,
  Users,
  Plus,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  ShieldCheck,
  Wrench,
  BookOpen,
  History,
  Bell,
} from 'lucide-react';

interface SidebarProps {
  currentRole: UserRole;
  activeModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
  onNewReport: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  reportsCount: number;
  adminProfile: AdminProfile;
  onLogout: () => void;
  unreadNotificationsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeModule,
  onSelectModule,
  onNewReport,
  isCollapsed,
  onToggleCollapse,
  reportsCount,
  adminProfile,
  onLogout,
  unreadNotificationsCount = 0,
}) => {
  return (
    <aside
      className={`hidden lg:flex flex-col bg-[#212121] text-white border-r border-neutral-800 transition-all duration-300 ease-in-out shrink-0 select-none z-30 h-screen sticky top-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header with Logo & Collapse Toggle */}
      <div className="h-20 px-4 flex items-center justify-between border-b border-neutral-800">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src="https://sotex.com.mx/wp-content/uploads/2023/02/cropped-PNG-1-scaled-300x114.png"
              alt="SOTEX"
              className="h-10 w-auto object-contain max-w-[150px]"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="mx-auto flex items-center justify-center">
            <img
              src="https://daloocomercializadora.com.mx/sotexicono.png"
              alt="Sotex"
              className="w-8 h-8 object-contain rounded-md"
            />
          </div>
        )}

        {/* Hamburger / Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors hidden lg:flex items-center justify-center cursor-pointer"
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
          className={`w-full flex items-center justify-center gap-2 font-bold text-xs rounded-xl bg-[#D60000] hover:bg-[#b50000] text-white transition-all shadow-md active:scale-98 cursor-pointer ${
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
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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

        {/* 3. Module: Historial de Órdenes de Trabajo */}
        <button
          onClick={() => onSelectModule('historial')}
          title="Historial de Órdenes de Trabajo"
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeModule === 'historial'
              ? 'bg-[#D60000]/15 text-white border border-[#D60000]/30 shadow-xs'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/70'
          } ${isCollapsed ? 'justify-center' : ''}`}
        >
          <History
            className={`w-5 h-5 shrink-0 ${
              activeModule === 'historial' ? 'text-[#D60000]' : 'text-neutral-400'
            }`}
          />
          {!isCollapsed && <span>Historial Órdenes</span>}
        </button>

        {/* 4. Module: Notificaciones */}
        <button
          onClick={() => onSelectModule('notificaciones')}
          title="Historial de Notificaciones"
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeModule === 'notificaciones'
              ? 'bg-[#D60000]/15 text-white border border-[#D60000]/30 shadow-xs'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/70'
          } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell
                className={`w-5 h-5 shrink-0 ${
                  activeModule === 'notificaciones' ? 'text-[#D60000]' : 'text-neutral-400'
                }`}
              />
              {unreadNotificationsCount > 0 && isCollapsed && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#D60000] rounded-full animate-ping" />
              )}
            </div>
            {!isCollapsed && <span>Notificaciones</span>}
          </div>
          {!isCollapsed && unreadNotificationsCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D60000] text-white animate-pulse">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* 5. Module: Empleados (ONLY FOR ADMIN ROLE) */}
        {currentRole === 'admin' && (
          <button
            onClick={() => onSelectModule('empleados')}
            title="Empleados y Técnicos"
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeModule === 'empleados'
                ? 'bg-[#D60000]/15 text-white border border-[#D60000]/30 shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/70'
            } ${isCollapsed ? 'justify-center' : ''}`}
          >
            <Users
              className={`w-5 h-5 shrink-0 ${
                activeModule === 'empleados' ? 'text-[#D60000]' : 'text-neutral-400'
              }`}
            />
            {!isCollapsed && <span>Empleados</span>}
          </button>
        )}

        {/* 4. Module: Perfil */}
        <button
          onClick={() => onSelectModule('perfil')}
          title="Perfil"
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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

        {/* 5. Module: Manual de Usuario */}
        <button
          onClick={() => onSelectModule('manual')}
          title="Manual de Usuario"
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeModule === 'manual'
              ? 'bg-[#D60000]/15 text-white border border-[#D60000]/30 shadow-xs'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/70'
          } ${isCollapsed ? 'justify-center' : ''}`}
        >
          <BookOpen
            className={`w-5 h-5 shrink-0 ${
              activeModule === 'manual' ? 'text-[#D60000]' : 'text-neutral-400'
            }`}
          />
          {!isCollapsed && <span>Manual</span>}
        </button>
      </nav>

      {/* User Footer Profile Pill & Logout Button */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-900/50 space-y-2">
        <button
          onClick={() => onSelectModule('perfil')}
          title="Ver perfil"
          className={`w-full flex items-center gap-3 p-1.5 rounded-xl hover:bg-neutral-800/80 transition-colors text-left cursor-pointer ${
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
              <div className="flex items-center gap-1.5">
                {currentRole === 'admin' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-red-400 font-semibold">
                    <ShieldCheck className="w-3 h-3" /> Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                    <Wrench className="w-3 h-3" /> Técnico
                  </span>
                )}
              </div>
            </div>
          )}
        </button>

        {/* Dedicated Logout Button */}
        <button
          id="btn-sidebar-logout"
          onClick={onLogout}
          title="Cerrar sesión / Salir al Home"
          className={`w-full flex items-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800/60 hover:bg-red-900/50 hover:border-red-700/60 border border-neutral-700/50 transition-all cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          <LogOut className="w-4 h-4 text-red-400 shrink-0" />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};
