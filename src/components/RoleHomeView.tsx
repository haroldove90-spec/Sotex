import React from 'react';
import { UserRole } from '../types';
import { ShieldCheck, Wrench } from 'lucide-react';

interface RoleHomeViewProps {
  onSelectRole: (role: UserRole) => void;
}

export const RoleHomeView: React.FC<RoleHomeViewProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center px-4 py-8 select-none">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* System Logo */}
        <div className="mb-10 sm:mb-12 flex items-center justify-center">
          <img
            src="https://sotex.com.mx/wp-content/uploads/2023/02/cropped-PNG-1-scaled-300x114.png"
            alt="SOTEX"
            className="h-12 sm:h-14 w-auto object-contain drop-shadow-md"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* 2-Column Role Access (Mobile & Desktop) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
          {/* Admin Role Button */}
          <button
            id="btn-role-admin"
            onClick={() => onSelectRole('admin')}
            className="group flex flex-col items-center justify-center p-5 sm:p-6 bg-neutral-800 hover:bg-neutral-750 active:bg-neutral-700 rounded-2xl border border-neutral-700/80 hover:border-[#D60000]/60 shadow-lg hover:shadow-[#D60000]/10 transition-all duration-200 active:scale-95 text-center cursor-pointer"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center mb-3 group-hover:border-[#D60000] transition-colors">
              <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-[#D60000]" />
            </div>
            <span className="text-white text-sm sm:text-base font-bold tracking-tight">
              Administrador
            </span>
          </button>

          {/* Técnico Role Button */}
          <button
            id="btn-role-tecnico"
            onClick={() => onSelectRole('tecnico')}
            className="group flex flex-col items-center justify-center p-5 sm:p-6 bg-neutral-800 hover:bg-neutral-750 active:bg-neutral-700 rounded-2xl border border-neutral-700/80 hover:border-[#D60000]/60 shadow-lg hover:shadow-[#D60000]/10 transition-all duration-200 active:scale-95 text-center cursor-pointer"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center mb-3 group-hover:border-[#D60000] transition-colors">
              <Wrench className="w-6 h-6 sm:w-7 sm:h-7 text-neutral-200 group-hover:text-white" />
            </div>
            <span className="text-white text-sm sm:text-base font-bold tracking-tight">
              Técnico
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
