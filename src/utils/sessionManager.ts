import { UserRole, Employee, ActiveModule } from '../types';
import { INITIAL_EMPLOYEES } from '../data/mockEmployees';

export const ROLE_STORAGE_KEY = 'sotex_active_role_v2';
export const USER_STORAGE_KEY = 'sotex_active_user_v2';
export const MODULE_STORAGE_KEY = 'sotex_active_module_v2';

const VALID_MODULES: ActiveModule[] = [
  'metricas',
  'reportes',
  'historial',
  'notificaciones',
  'empleados',
  'perfil',
  'manual',
];

/**
 * Gets default user for a given role if stored user is missing.
 */
export const getDefaultUserForRole = (role: UserRole): Employee => {
  if (role === 'admin') {
    return (
      INITIAL_EMPLOYEES.find((e) => e.rol === 'admin') || {
        id: 'emp-haroldo-01',
        nombre: 'Harold Anguiano Morales',
        usuario: 'haroldo90',
        correo: 'haroldo90@hotmail.com',
        password: 'Chevropar#1970',
        rol: 'admin',
        telefono: '+52 (33) 1234-5678',
        puesto: 'Director / Administrador General',
        sucursal: 'Guadalajara (Matriz)',
        cedulaTecnica: 'SOT-DIR-01',
        activo: true,
        fechaRegistro: '2024-01-01',
      }
    );
  } else {
    return (
      INITIAL_EMPLOYEES.find((e) => e.rol === 'tecnico') || {
        id: 'emp-001',
        nombre: 'Tec. Carlos Mendoza',
        usuario: 'carlos_mendoza',
        correo: 'carlos.mendoza@sotex.com.mx',
        password: 'Sotex#2024*C1',
        rol: 'tecnico',
        telefono: '+52 (33) 3610-8820',
        puesto: 'Técnico Especialista en Cabezales',
        sucursal: 'Guadalajara (Matriz)',
        cedulaTecnica: 'TEC-SOT-01',
        activo: true,
        fechaRegistro: '2024-01-15',
      }
    );
  }
};

/**
 * Saves session state with redundancy across localStorage and sessionStorage,
 * and quota protection so session data is never dropped.
 */
export const saveActiveSession = (
  role: UserRole | null,
  user: Employee | null,
  module?: ActiveModule
): void => {
  if (typeof window === 'undefined') return;

  const saveToStorage = (storage: Storage) => {
    try {
      if (role) {
        storage.setItem(ROLE_STORAGE_KEY, role);
      } else {
        storage.removeItem(ROLE_STORAGE_KEY);
      }

      if (user) {
        storage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } else if (!role) {
        storage.removeItem(USER_STORAGE_KEY);
      }

      if (module && VALID_MODULES.includes(module)) {
        storage.setItem(MODULE_STORAGE_KEY, module);
      }
    } catch (e: any) {
      // If quota exceeded, clean up non-critical cache and retry
      try {
        storage.removeItem('sotex_temp_reports');
        storage.removeItem('sotex_backup_reports');
        if (role) storage.setItem(ROLE_STORAGE_KEY, role);
        if (user) storage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        if (module) storage.setItem(MODULE_STORAGE_KEY, module);
      } catch {
        // Fallback
      }
    }
  };

  if (window.localStorage) {
    saveToStorage(window.localStorage);
  }
  if (window.sessionStorage) {
    saveToStorage(window.sessionStorage);
  }

  // Sync module with URL hash so refresh always keeps exact page
  if (module && VALID_MODULES.includes(module)) {
    try {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', `#${module}`);
      } else {
        window.location.hash = `#${module}`;
      }
    } catch {}
  }
};

/**
 * Loads session state across localStorage and sessionStorage.
 */
export const loadActiveSession = (): {
  role: UserRole | null;
  user: Employee | null;
  module: ActiveModule;
} => {
  if (typeof window === 'undefined') {
    return { role: null, user: null, module: 'metricas' };
  }

  const readItem = (key: string): string | null => {
    try {
      return (
        window.localStorage?.getItem(key) ||
        window.sessionStorage?.getItem(key) ||
        null
      );
    } catch {
      return null;
    }
  };

  let role: UserRole | null = null;
  const rawRole = readItem(ROLE_STORAGE_KEY);
  if (rawRole === 'admin' || rawRole === 'tecnico') {
    role = rawRole as UserRole;
  }

  let user: Employee | null = null;
  const rawUser = readItem(USER_STORAGE_KEY);
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser);
      if (parsed && parsed.nombre) {
        user = parsed;
      }
    } catch {}
  }

  // If role is active but user object was missing, supply default user so session is complete
  if (role && !user) {
    user = getDefaultUserForRole(role);
    // Persist complete user
    saveActiveSession(role, user);
  }

  let module: ActiveModule = 'metricas';

  // First check URL hash (e.g. #reportes, #historial, #notificaciones, #perfil)
  if (typeof window !== 'undefined' && window.location.hash) {
    const hashMod = window.location.hash.replace('#', '') as ActiveModule;
    if (VALID_MODULES.includes(hashMod)) {
      if (role === 'tecnico' && hashMod === 'empleados') {
        module = 'reportes';
      } else {
        module = hashMod;
      }
    }
  }

  // If no hash matched, read from storage
  if (module === 'metricas') {
    const rawModule = readItem(MODULE_STORAGE_KEY) as ActiveModule;
    if (rawModule && VALID_MODULES.includes(rawModule)) {
      if (role === 'tecnico' && rawModule === 'empleados') {
        module = 'reportes';
      } else {
        module = rawModule;
      }
    }
  }

  return { role, user, module };
};

/**
 * Clears active session from all storages.
 */
export const clearActiveSession = (): void => {
  if (typeof window === 'undefined') return;

  const clearStorage = (storage: Storage) => {
    try {
      storage.removeItem(ROLE_STORAGE_KEY);
      storage.removeItem(USER_STORAGE_KEY);
      storage.removeItem(MODULE_STORAGE_KEY);
    } catch {}
  };

  if (window.localStorage) clearStorage(window.localStorage);
  if (window.sessionStorage) clearStorage(window.sessionStorage);
};
