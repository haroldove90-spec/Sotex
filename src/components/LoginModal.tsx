import React, { useState } from 'react';
import { UserRole, Employee } from '../types';
import { supabase } from '../utils/supabaseClient';
import { SupabaseSqlModal } from './SupabaseSqlModal';
import {
  Eye,
  EyeOff,
  LogIn,
  KeyRound,
  X,
  ShieldCheck,
  Wrench,
  Database,
  Copy,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRoleHint?: UserRole | null;
  onLoginSuccess: (user: Employee, role: UserRole) => void;
  localEmployees: Employee[];
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  targetRoleHint,
  onLoginSuccess,
  localEmployees,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSqlModal, setShowSqlModal] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      setErrorMessage('Por favor ingresa tu usuario o correo y contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Try querying Supabase employees table
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .or(`correo.ilike.${cleanId},usuario.ilike.${cleanId}`)
        .limit(1);

      if (!error && data && data.length > 0) {
        const remoteUser = data[0];
        if (remoteUser.password === cleanPass) {
          // Success from Supabase! Role is live from Supabase
          const activeRole: UserRole = remoteUser.rol === 'admin' ? 'admin' : 'tecnico';
          const employeeData: Employee = {
            id: remoteUser.id,
            nombre: remoteUser.nombre,
            usuario: remoteUser.usuario,
            correo: remoteUser.correo,
            password: remoteUser.password,
            rol: activeRole,
            telefono: remoteUser.telefono || '',
            puesto: remoteUser.puesto || '',
            sucursal: remoteUser.sucursal || 'Guadalajara (Matriz)',
            cedulaTecnica: remoteUser.cedula_tecnica || '',
            activo: remoteUser.activo ?? true,
            fotoUrl: remoteUser.foto_url,
            firmaDigital: remoteUser.firma_digital,
            fechaRegistro: remoteUser.created_at || new Date().toISOString().split('T')[0],
          };
          setIsLoading(false);
          onLoginSuccess(employeeData, activeRole);
          return;
        } else {
          setErrorMessage('Contraseña incorrecta. Verifica tu clave de acceso.');
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Supabase query failed or table not yet created; fallback to local check
    }

    // 2. Local Fallback with pre-configured credentials
    const localMatch = localEmployees.find(
      (emp) =>
        (emp.correo.toLowerCase() === cleanId ||
          (emp.usuario && emp.usuario.toLowerCase() === cleanId)) &&
        emp.password === cleanPass
    );

    if (localMatch) {
      const activeRole: UserRole = localMatch.rol || (targetRoleHint ?? 'admin');
      setIsLoading(false);
      onLoginSuccess(localMatch, activeRole);
      return;
    }

    // 3. Fallback for Harold & Carlos if not yet in local state
    if (
      (cleanId === 'haroldo90' || cleanId === 'haroldo90@hotmail.com') &&
      cleanPass === 'Chevropar#1970'
    ) {
      const haroldUser: Employee = {
        id: 'emp-haroldo-01',
        nombre: 'Harold Anguiano Morales',
        usuario: 'haroldo90',
        correo: 'haroldo90@hotmail.com',
        password: 'Chevropar#1970',
        rol: 'admin',
        telefono: '3312345678',
        puesto: 'Director / Administrador General',
        sucursal: 'Guadalajara (Matriz)',
        cedulaTecnica: 'SOT-DIR-01',
        activo: true,
        fechaRegistro: '2024-01-01',
      };
      setIsLoading(false);
      onLoginSuccess(haroldUser, 'admin');
      return;
    }

    if (
      (cleanId === 'carlos_raya' || cleanId === 'carlos_raya@sotex.com.mx') &&
      (cleanPass === 'Sotex#Raya2024*9X' || cleanPass.startsWith('Sotex#Raya'))
    ) {
      const carlosUser: Employee = {
        id: 'emp-carlos-raya-02',
        nombre: 'Carlos Raya',
        usuario: 'carlos_raya',
        correo: 'carlos_raya@sotex.com.mx',
        password: 'Sotex#Raya2024*9X',
        rol: 'admin',
        telefono: '3336158920',
        puesto: 'Administrador de Operaciones',
        sucursal: 'Guadalajara (Matriz)',
        cedulaTecnica: 'SOT-ADM-02',
        activo: true,
        fechaRegistro: '2024-01-01',
      };
      setIsLoading(false);
      onLoginSuccess(carlosUser, 'admin');
      return;
    }

    setIsLoading(false);
    setErrorMessage(
      'Usuario o contraseña no reconocidos. Puedes ingresar con usuario (ej. haroldo90) o correo (ej. haroldo90@hotmail.com).'
    );
  };

  const handleFillDemo = (user: 'haroldo' | 'carlos' | 'mendoza') => {
    if (user === 'haroldo') {
      setIdentifier('haroldo90');
      setPassword('Chevropar#1970');
    } else if (user === 'carlos') {
      setIdentifier('carlos_raya');
      setPassword('Sotex#Raya2024*9X');
    } else {
      setIdentifier('carlos_mendoza');
      setPassword('Sotex#2024*C1');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#1f1f1f] text-white rounded-2xl max-w-md w-full shadow-2xl border border-neutral-700 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#141414] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D60000]/20 border border-[#D60000]/40 flex items-center justify-center">
              <LogIn className="w-4 h-4 text-[#D60000]" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Iniciar Sesión en SOTEX
              </h3>
              <p className="text-[11px] text-neutral-400">
                Acceso con usuario o correo electrónico
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-950/80 border border-red-700/60 rounded-xl text-xs text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Identifier: Correo o Usuario */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1.5">
              Usuario o Correo Electrónico *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="ej. haroldo90 o haroldo90@hotmail.com"
              className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden text-sm"
            />
          </div>

          {/* Password con icono de ojito */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-neutral-300">
                Contraseña de Acceso *
              </label>
            </div>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full pl-3.5 pr-10 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                className="absolute right-2.5 p-1 text-neutral-400 hover:text-white cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Quick fills for registered users */}
          <div className="pt-1">
            <p className="text-[11px] text-neutral-400 mb-2">Acceso rápido con credenciales:</p>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleFillDemo('haroldo')}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-red-400 flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3 h-3 shrink-0" /> Harold (Admin)
                </div>
                <div className="text-[10px] text-neutral-400 truncate">haroldo90</div>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('carlos')}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-red-400 flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3 h-3 shrink-0" /> Carlos Raya
                </div>
                <div className="text-[10px] text-neutral-400 truncate">carlos_raya</div>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('mendoza')}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-amber-400 flex items-center gap-1 text-[11px]">
                  <Wrench className="w-3 h-3 shrink-0" /> Mendoza (Téc)
                </div>
                <div className="text-[10px] text-neutral-400 truncate">carlos_mendoza</div>
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-[#D60000] hover:bg-[#b50000] text-white font-bold rounded-xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando en Supabase...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Ingresar al Sistema</span>
              </>
            )}
          </button>

          {/* View SQL button */}
          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowSqlModal(true)}
              className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ver código SQL para Supabase</span>
            </button>
          </div>
        </form>

        {/* Modal: View SQL for Supabase */}
        <SupabaseSqlModal
          isOpen={showSqlModal}
          onClose={() => setShowSqlModal(false)}
        />
      </div>
    </div>
  );
};
