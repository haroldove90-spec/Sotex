import React, { useState } from 'react';
import { UserRole } from '../types';
import { ShieldCheck, Wrench, LogIn, Database } from 'lucide-react';

interface RoleHomeViewProps {
  onOpenLogin: (roleHint?: UserRole) => void;
  onOpenSqlModal: () => void;
}

export const RoleHomeView: React.FC<RoleHomeViewProps> = ({
  onOpenLogin,
  onOpenSqlModal,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="min-h-screen bg-[#181818] flex flex-col items-center justify-center px-4 py-8 select-none">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* System Logo */}
        <div className="mb-10 sm:mb-12 flex items-center justify-center">
          {!imageError ? (
            <img
              src="https://sotex.com.mx/wp-content/uploads/2023/02/cropped-PNG-1-scaled-300x114.png"
              alt="SOTEX"
              className="h-12 sm:h-14 w-auto object-contain drop-shadow-md"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-wider text-white">SOTEX</span>
              <span className="w-2 h-2 rounded-full bg-[#D60000]" />
            </div>
          )}
        </div>

        {/* 2-Column Role Access (Mobile & Desktop) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
          {/* Admin Role Button */}
          <button
            id="btn-role-admin"
            onClick={() => onOpenLogin('admin')}
            className="group flex flex-col items-center justify-center p-5 sm:p-6 bg-[#242424] hover:bg-[#2b2b2b] active:bg-[#333333] rounded-2xl border border-neutral-700/80 hover:border-[#D60000]/60 shadow-lg hover:shadow-[#D60000]/10 transition-all duration-200 active:scale-95 text-center cursor-pointer"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#1a1a1a] border border-neutral-700 flex items-center justify-center mb-3 group-hover:border-[#D60000] transition-colors">
              <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-[#D60000]" />
            </div>
            <span className="text-white text-sm sm:text-base font-bold tracking-tight">
              Administrador
            </span>
          </button>

          {/* Técnico Role Button */}
          <button
            id="btn-role-tecnico"
            onClick={() => onOpenLogin('tecnico')}
            className="group flex flex-col items-center justify-center p-5 sm:p-6 bg-[#242424] hover:bg-[#2b2b2b] active:bg-[#333333] rounded-2xl border border-neutral-700/80 hover:border-[#D60000]/60 shadow-lg hover:shadow-[#D60000]/10 transition-all duration-200 active:scale-95 text-center cursor-pointer"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#1a1a1a] border border-neutral-700 flex items-center justify-center mb-3 group-hover:border-[#D60000] transition-colors">
              <Wrench className="w-6 h-6 sm:w-7 sm:h-7 text-neutral-200 group-hover:text-white" />
            </div>
            <span className="text-white text-sm sm:text-base font-bold tracking-tight">
              Técnico
            </span>
          </button>
        </div>

        {/* Minimal Actions: Login Button & Supabase SQL Link */}
        <div className="mt-6 w-full flex flex-col items-center gap-3">
          <button
            id="btn-iniciar-sesion-home"
            onClick={() => onOpenLogin()}
            className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-750 text-white text-xs font-bold rounded-xl border border-neutral-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-[#D60000]" />
            <span>Iniciar Sesión</span>
          </button>

          <button
            type="button"
            onClick={onOpenSqlModal}
            className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ver código SQL para Supabase</span>
          </button>
        </div>
      </div>
    </div>
  );
};
