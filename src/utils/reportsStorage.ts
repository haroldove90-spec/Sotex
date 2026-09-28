import { ServiceReport } from '../types';

export const STORAGE_KEY = 'sotex_service_reports_v2';
const DB_NAME = 'sotex_app_db';
const DB_VERSION = 1;
const STORE_NAME = 'service_reports';

/**
 * Initializes and opens the IndexedDB database.
 */
const openIndexedDB = (): Promise<IDBDatabase | null> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result as IDBDatabase;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (e) => {
        console.warn('No se pudo abrir IndexedDB, continuando con almacenamiento alternativo:', e);
        resolve(null);
      };
    } catch (err) {
      console.warn('Error al acceder a IndexedDB:', err);
      resolve(null);
    }
  });
};

/**
 * Saves all reports to IndexedDB (asynchronous, without 5MB quota restrictions).
 */
export const saveReportsToIndexedDB = async (reports: ServiceReport[]): Promise<boolean> => {
  try {
    const db = await openIndexedDB();
    if (!db) return false;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      // Clear existing records to keep in sync with current active reports
      store.clear();

      for (const report of reports) {
        if (report && report.id) {
          store.put(report);
        }
      }

      tx.oncomplete = () => {
        resolve(true);
      };

      tx.onerror = (err) => {
        console.warn('Error transaccional en IndexedDB:', err);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('Excepción al guardar en IndexedDB:', err);
    return false;
  }
};

/**
 * Loads all reports from IndexedDB.
 */
export const loadReportsFromIndexedDB = async (): Promise<ServiceReport[] | null> => {
  try {
    const db = await openIndexedDB();
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result;
        if (Array.isArray(results) && results.length > 0) {
          resolve(results as ServiceReport[]);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
};

/**
 * Deletes a report from IndexedDB by its ID.
 */
export const deleteReportFromIndexedDB = async (reportId: string): Promise<boolean> => {
  try {
    const db = await openIndexedDB();
    if (!db) return false;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(reportId);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
};

/**
 * Strips or minimizes heavy data (such as raw uncompressed test images or extra payloads)
 * specifically for the localStorage fallback, ensuring it always fits within browser quotas.
 * The full report with all high-resolution images is safely preserved in IndexedDB and Supabase.
 */
const createLightweightReportsForLocalStorage = (reports: ServiceReport[]): any[] => {
  return reports.map((r) => {
    // If the image is large, omit it from the localStorage fallback
    // (it will be hydrated from IndexedDB or Supabase on startup)
    const isImageTooBig = r.pruebaCabezalImagen && r.pruebaCabezalImagen.length > 10000;
    
    if (isImageTooBig) {
      const { pruebaCabezalImagen, ...rest } = r;
      return {
        ...rest,
        // Mark that an image exists so UI can show a placeholder until hydrated
        hasPruebaCabezalImagen: true,
      };
    }
    return r;
  });
};

/**
 * Safely saves reports:
 * 1. Always saves the full, uncompressed dataset to IndexedDB.
 * 2. Attempts to save to localStorage. If quota is exceeded, handles it gracefully:
 *    - Cleans up old cache keys.
 *    - Storing a lightweight version in localStorage.
 *    - Prevents unhandled QuotaExceededError and prevents red console errors.
 */
export const saveReportsSafely = (reports: ServiceReport[]): void => {
  // 1. Asynchronously persist full data to IndexedDB
  saveReportsToIndexedDB(reports).catch(() => {
    // background catch
  });

  // 2. Persist to localStorage with quota protection
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    // Attempt standard save
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (err: any) {
    // Browser quota exceeded (typically 5MB limit on localStorage)
    try {
      // Step A: Clean up any old or unnecessary keys
      const obsoleteKeys = [
        'sotex_service_reports_v1',
        'sotex_backup_reports',
        'sotex_temp_reports',
      ];
      obsoleteKeys.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // ignore
        }
      });

      // Step B: Create a lightweight version without heavy test printhead images
      const lightweight = createLightweightReportsForLocalStorage(reports);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
    } catch {
      try {
        // Step C: If still exceeding quota, store only the most recent 25 reports in localStorage
        const lightweight = createLightweightReportsForLocalStorage(reports.slice(0, 25));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
      } catch {
        // Step D: If localStorage is completely filled by other origin items,
        // keep localStorage clean and rely fully on IndexedDB and memory state.
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
      }
    }
  }
};
