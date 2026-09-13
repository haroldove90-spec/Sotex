import React from 'react';
import { ActiveModule } from '../types';
import { BarChart3, FileText, User } from 'lucide-react';

interface BottomNavProps {
  activeModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
  reportsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeModule,
  onSelectModule,
  reportsCount,
}) => {
  return (
    <nav
      id="mobile-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#212121] border-t border-neutral-800 shadow-2xl pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-3 h-14 max-w-md mx-auto items-center px-4">
        {/* 1. Module: Métricas */}
        <button
          id="btn-nav-metricas-mobile"
          onClick={() => onSelectModule('metricas')}
          className={`flex flex-col items-center justify-center h-full relative transition-colors ${
            activeModule === 'metricas' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <BarChart3
            className={`w-5 h-5 ${
              activeModule === 'metricas' ? 'text-[#D60000]' : 'text-neutral-400'
            }`}
          />
          <span
            className={`text-[11px] font-semibold mt-0.5 ${
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
          className={`flex flex-col items-center justify-center h-full relative transition-colors ${
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
            className={`text-[11px] font-semibold mt-0.5 ${
              activeModule === 'reportes' ? 'text-white font-bold' : 'text-neutral-400'
            }`}
          >
            Reportes
          </span>
          {activeModule === 'reportes' && (
            <div className="absolute top-0 w-8 h-0.5 bg-[#D60000] rounded-full" />
          )}
        </button>

        {/* 3. Module: Perfil */}
        <button
          id="btn-nav-perfil-mobile"
          onClick={() => onSelectModule('perfil')}
          className={`flex flex-col items-center justify-center h-full relative transition-colors ${
            activeModule === 'perfil' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <User
            className={`w-5 h-5 ${
              activeModule === 'perfil' ? 'text-[#D60000]' : 'text-neutral-400'
            }`}
          />
          <span
            className={`text-[11px] font-semibold mt-0.5 ${
              activeModule === 'perfil' ? 'text-white font-bold' : 'text-neutral-400'
            }`}
          >
            Perfil
          </span>
          {activeModule === 'perfil' && (
            <div className="absolute top-0 w-8 h-0.5 bg-[#D60000] rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};
