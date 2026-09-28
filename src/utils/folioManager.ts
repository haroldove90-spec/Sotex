import { FolioConfig } from '../types';
import { supabase } from './supabaseClient';

export const FOLIO_CONFIG_KEY = 'sotex_folio_config_v2';

export const DEFAULT_FOLIO_CONFIG: FolioConfig = {
  prefijo: 'SOT-2026-',
  ultimoNumero: 5,
  codigoFormato: 'SOT-REP-CLG-01',
  cerosPadding: 3,
};

export const loadFolioConfig = (): FolioConfig => {
  try {
    const raw = localStorage.getItem(FOLIO_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.ultimoNumero === 'number') {
        return {
          prefijo: parsed.prefijo ?? 'SOT-2026-',
          ultimoNumero: parsed.ultimoNumero,
          codigoFormato: parsed.codigoFormato ?? 'SOT-REP-CLG-01',
          cerosPadding: parsed.cerosPadding ?? 3,
        };
      }
    }
  } catch {}
  return DEFAULT_FOLIO_CONFIG;
};

export const saveFolioConfig = async (config: FolioConfig): Promise<void> => {
  try {
    localStorage.setItem(FOLIO_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('Error al guardar configuración de folios en localStorage:', err);
  }

  // Sync to Supabase table configuracion_folios
  try {
    await supabase.from('configuracion_folios').upsert({
      id: 'config_principal',
      prefijo_folio: config.prefijo,
      ultimo_folio_numero: config.ultimoNumero,
      codigo_formato_actual: config.codigoFormato,
      ceros_padding: config.cerosPadding,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.log('Nota: Configuración de folios guardada localmente:', err);
  }
};

/**
 * Returns the next consecutive folio string according to config
 */
export const formatFolioString = (config: FolioConfig, number: number): string => {
  const padded = String(number).padStart(config.cerosPadding || 3, '0');
  return `${config.prefijo || 'SOT-2026-'}${padded}`;
};

/**
 * Gets the next available folio without advancing the counter
 */
export const getNextFolioPreview = (config?: FolioConfig): { folio: string; reportCode: string; nextNumber: number } => {
  const currentConfig = config || loadFolioConfig();
  const nextNumber = currentConfig.ultimoNumero + 1;
  const folio = formatFolioString(currentConfig, nextNumber);
  return {
    folio,
    reportCode: currentConfig.codigoFormato || 'SOT-REP-CLG-01',
    nextNumber,
  };
};

/**
 * Advances the counter by 1 and persists the new configuration
 */
export const advanceFolioNumber = async (): Promise<{ folio: string; reportCode: string; newNumber: number }> => {
  const current = loadFolioConfig();
  const newNumber = current.ultimoNumero + 1;
  const updatedConfig: FolioConfig = {
    ...current,
    ultimoNumero: newNumber,
  };
  await saveFolioConfig(updatedConfig);
  const folio = formatFolioString(updatedConfig, newNumber);
  return {
    folio,
    reportCode: updatedConfig.codigoFormato,
    newNumber,
  };
};
