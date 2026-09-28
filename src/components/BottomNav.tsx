import React from 'react';
import { ActiveModule, UserRole } from '../types';
import { BarChart3, FileText, User, Users, BookOpen, History, Bell } from 'lucide-react';

interface BottomNavProps {
  currentRole: UserRole;
  activeModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
  reportsCount: number;
  unreadNotificationsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentRole,
  activeModule,
  onSelectModule,
  reportsCount,
  unreadNotificationsCount = 0,
}) => {
  const isAdmin = currentRole === 'admin';

  return (
    <nav
      id="mobile-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#212121] border-t border-neutral-800 shadow-2xl pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-5 h-14 max-w-md mx-auto items-center px-1">
        {/* 1. Module: Métricas */}
        <button
          id="btn-nav-metricas-mobile"
          onClick={() => onSelectModule('metricas')}
          className={`flex flex-col items-center justify-center h-full relative transition-colors cursor-pointer ${
            activeModule === 'metricas' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <BarChart3
            className={`w-5 h-5 ${
              activeModule === 'metricas' ? 'text-[#D60000]' : 'text-neutral-400'
            }`}
          />
          <span
            className={`text-[10px] font-semibold mt-0.5 ${
              activeModule === 'metricas' ? 'text-white font-bold' : 'text-neutral-400'
            }`}
          >
            Métricas
          </span>
          {activeModule === 'metricas' && (
            <div className="absolute top-0 w-8 h-0.5 bg-[#D60000] rounded-full" />
          )}
        </button>

        {/* 2. Module: Reportes */}
        <button
          id="btn-nav-reportes-mobile"
          onClick={() => onSelectModule('reportes')}
          className={`flex flex-col items-center justify-center h-full relative transition-colors cursor-pointer ${
            activeModule === 'reportes' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <div className="relative">
            <FileText
              className={`w-5 h-5 ${
                activeModule === 'reportes' ? 'text-[#D60000]' : 'text-neutral-400'
              }`}
            />
            {reportsCount > 0 && (
              <span className="absolute -top-1 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-[#D60000] text-white text-[9px] font-bold flex items-center justify-center">
                {reportsCount > 99 ? '99+' : reportsCount}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] font-semibold mt-0.5 ${
              activeModule === 'reportes' ? 'text-white font-bold' : 'text-neutral-400'
            }`}
          >
            Reportes
          </span>
          {activeModule === 'reportes' && (
            <div className="absolute top-0 w-8 h-0.5 bg-[#D60000] rounded-full" />
          )}
        </button>

        {/* 3. Module: Historial */}
        <button
          id="btn-nav-historial-mobile"
          onClick={() => onSelectModule('historial')}
          className={`flex flex-col items-center justify-center h-full relative transition-colors cursor-pointer ${
            activeModule === 'historial' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <History
            className={`w-5 h-5 ${
              activeModule === 'historial' ? 'text-[#D60000]' : 'text-neutral-400'
            }`}
          />
          <span
            className={`text-[10px] font-semibold mt-0.5 ${
              activeModule === 'historial' ? 'text-white font-bold' : 'text-neutral-400'
            }`}
          >
            Historial
          </span>
          {activeModule === 'historial' && (
            <div className="absolute top-0 w-8 h-0.5 bg-[#D60000] rounded-full" />
          )}
        </button>

        {/* 4. Module: Notificaciones */}
        <button
          id="btn-nav-notificaciones-mobile"
          onClick={() => onSelectModule('notificaciones')}
          className={`flex flex-col items-center justify-center h-full relative transition-colors cursor-pointer ${
            activeModule === 'notificaciones' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <div className="relative">
            <Bell
              className={`w-5 h-5 ${
                activeModule === 'notificaciones' ? 'text-[#D60000]' : 'text-neutral-400'
              }`}
            />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#D60000] text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] font-semibold mt-0.5 ${
              activeModule === 'notificaciones' ? 'text-white font-bold' : 'text-neutral-400'
            }`}
          >
            Alertas
          </span>
          {activeModule === 'notificaciones' && (
            <div className="absolute top-0 w-8 h-0.5 bg-[#D60000] rounded-full" />
          )}
        </button>

        {/* 5. Module: Empleados (if Admin) or Perfil */}
        {isAdmin ? (
          <button
            id="btn-nav-empleados-mobile"
            onClick={() => onSelectModule('empleados')}
            className={`flex flex-col items-center justify-center h-full relative transition-colors cursor-pointer ${
              activeModule === 'empleados' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users
              className={`w-5 h-5 ${
                activeModule === 'empleados' ? 'text-[#D60000]' : 'text-neutral-400'
              }`}
            />
            <span
              className={`text-[10px] font-semibold mt-0.5 ${
                activeModule === 'empleados' ? 'text-white font-bold' : 'text-neutral-400'
              }`}
            >
              Empleados
            </span>
            {activeModule === 'empleados' && (
              <div className="absolute top-0 w-8 h-0.5 bg-[#D60000] rounded-full" />
            )}
          </button>
        ) : (
          <button
            id="btn-nav-perfil-mobile"
            onClick={() => onSelectModule('perfil')}
            className={`flex flex-col items-center justify-center h-full relative transition-colors cursor-pointer ${
              activeModule === 'perfil' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <User
              className={`w-5 h-5 ${
                activeModule === 'perfil' ? 'text-[#D60000]' : 'text-neutral-400'
              }`}
            />
            <span
              className={`text-[10px] font-semibold mt-0.5 ${
                activeModule === 'perfil' ? 'text-white font-bold' : 'text-neutral-400'
              }`}
            >
              Perfil
            </span>
            {activeModule === 'perfil' && (
              <div className="absolute top-0 w-8 h-0.5 bg-[#D60000] rounded-full" />
            )}
          </button>
        )}
      </div>
    </nav>
  );
};
