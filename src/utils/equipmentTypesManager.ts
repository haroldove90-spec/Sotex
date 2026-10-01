import { EquipmentTypeConfig } from '../types';
import { supabase } from './supabaseClient';

export const EQUIPMENT_TYPES_STORAGE_KEY = 'sotex_equipment_types_v1';

export const DEFAULT_EQUIPMENT_TYPES: EquipmentTypeConfig[] = [
  {
    id: 'eq-impresora-etiquetas',
    nombre: 'Impresora de Etiquetas / Térmica',
    descripcion: 'Impresoras térmicas directas y de transferencia térmica industrial/desktop (Zebra, SATO, Honeywell, etc.).',
    checklists: [
      'Cabezal térmico (resistencias / líneas muertas)',
      'Rodillo principal (platen roller / desgaste)',
      'Sensor de papel (gap / black mark / muesca)',
      'Sensor de ribbon (cinta de transferencia)',
      'Bandas y engranes de tracción',
      'Cuchilla cortadora (cutter mecánico)',
      'Rebobinador interno / rebobinador de papel',
      'Display / Panel de control frontal',
      'Fuente de alimentación / calibración general',
    ],
  },
  {
    id: 'eq-impresora-hojas',
    nombre: 'Impresora de Hojas (Láser / Inyección)',
    descripcion: 'Impresoras multifuncionales y de hojas para oficina o almacén (HP, Brother, Epson, Canon).',
    checklists: [
      'Unidad fusora / Rodillo de calor',
      'Rodillos de alimentación (pick-up roller)',
      'Cabezal de inyección / Unidad de imagen / Tambor',
      'Sensores de bandeja de papel y registro',
      'Mecanismo de reversa dúplex',
      'Tarjeta lógica principal / Formatter',
      'Fuente de alimentación interna',
      'Almohadillas / Depósito de tinta residual',
    ],
  },
  {
    id: 'eq-computadora',
    nombre: 'Computadora / Laptop / PC Industrial',
    descripcion: 'Equipos de cómputo para líneas de producción, estaciones de etiquetado y oficinas.',
    checklists: [
      'Unidad de almacenamiento (Disco duro / SSD)',
      'Memoria RAM y rendimiento',
      'Fuente de poder / Cargador / Batería',
      'Sistema operativo y drivers de impresión',
      'Puertos USB / Serial / Ethernet de comunicación',
      'Pantalla / Display / Monitor',
      'Ventilación / Disipación térmica / Pasta térmica',
    ],
  },
  {
    id: 'eq-terminal',
    nombre: 'Terminal Portátil / Colector de Datos',
    descripcion: 'Terminales móviles y computadoras de mano con escáner integrado (Zebra TC52, Datalogic, Honeywell).',
    checklists: [
      'Pantalla táctil / Digitalizador / Cristal',
      'Batería principal / Autonomía de celda',
      'Motor de escaneo 1D / 2D (Imager / Láser)',
      'Teclado físico / Botones laterales de disparo',
      'Conector de comunicación y pines de carga',
      'Módulo de conectividad Wi-Fi / Bluetooth',
      'Gatillo pistol grip (si aplica)',
    ],
  },
  {
    id: 'eq-escaner',
    nombre: 'Escáner / Lector de Código de Barras',
    descripcion: 'Lectores de código de barras alámbricos e inalámbricos (Zebra DS2208, Honeywell Xenon, Datalogic).',
    checklists: [
      'Ventana de lectura / Lente óptico',
      'Gatillo de activación / Switch',
      'Cable de comunicación USB / Serial',
      'Cuna de comunicación y base de carga',
      'Batería interna recargable',
      'Buzzer acústico e indicador LED de lectura',
    ],
  },
];

/**
 * Loads equipment types from localStorage or fallback defaults.
 */
export const loadEquipmentTypes = (): EquipmentTypeConfig[] => {
  if (typeof window === 'undefined') return DEFAULT_EQUIPMENT_TYPES;

  try {
    const raw = localStorage.getItem(EQUIPMENT_TYPES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  return DEFAULT_EQUIPMENT_TYPES;
};

/**
 * Saves equipment types to localStorage and sessionStorage.
 */
export const saveEquipmentTypes = (types: EquipmentTypeConfig[]): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(EQUIPMENT_TYPES_STORAGE_KEY, JSON.stringify(types));
    sessionStorage.setItem(EQUIPMENT_TYPES_STORAGE_KEY, JSON.stringify(types));
  } catch (err) {
    console.warn('Error al guardar tipos de equipos en almacenamiento local:', err);
  }
};

/**
 * Synchronizes equipment types with Supabase table configuracion_equipos.
 */
export const syncEquipmentTypesWithSupabase = async (): Promise<EquipmentTypeConfig[]> => {
  try {
    const { data, error } = await supabase
      .from('configuracion_equipos')
      .select('*')
      .order('nombre', { ascending: true });

    if (!error && data && data.length > 0) {
      const remoteTypes: EquipmentTypeConfig[] = data.map((d: any) => ({
        id: d.id,
        nombre: d.nombre,
        descripcion: d.descripcion || '',
        checklists: Array.isArray(d.checklists) ? d.checklists : [],
      }));
      saveEquipmentTypes(remoteTypes);
      return remoteTypes;
    }
  } catch (err) {
    console.log('Info sync equipos Supabase:', err);
  }

  return loadEquipmentTypes();
};

/**
 * Persists an equipment type to Supabase.
 */
export const upsertEquipmentTypeToSupabase = async (
  item: EquipmentTypeConfig
): Promise<boolean> => {
  try {
    const { error } = await supabase.from('configuracion_equipos').upsert({
      id: item.id,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      checklists: item.checklists || [],
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Nota al guardar tipo de equipo en Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Excepción al sincronizar equipo con Supabase:', err);
    return false;
  }
};

/**
 * Deletes an equipment type from Supabase.
 */
export const deleteEquipmentTypeFromSupabase = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('configuracion_equipos').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
};
