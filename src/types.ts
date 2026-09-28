export type VisitNumber = 1 | 2 | 3 | 4;

export type ServiceStatus = 'En Revisión' | 'Completado' | 'Pendiente Refacción' | 'Garantía';

export type ServiceLocation = 'campo' | 'sotex';

export interface DamagedComponents {
  cabezal: boolean;
  rodilloPrincipal: boolean;
  display: boolean;
  sensorPapel: boolean;
  sensorRibbon: boolean;
  bandas: boolean;
  cutter: boolean;
  rebobinador: boolean;
  otro: boolean;
}

export interface EquipmentInfo {
  equipo: string;       // e.g. "Impresora Térmica Industrial"
  marca: string;        // e.g. "Zebra", "SATO", "Honeywell"
  modelo: string;       // e.g. "ZT411", "ZT230", "CL4NX"
  dpi: string;          // e.g. "203", "300", "600"
  noSerie: string;      // e.g. "42J2012019"
}

export interface ServiceReport {
  id: string;
  reportCode: string;   // e.g. "SOT-REP-CLG-01"
  folio: string;        // e.g. "SOT-2026-001"
  empresa: string;
  fecha: string;        // YYYY-MM-DD
  direccion: string;
  telefono: string;
  numVisita: VisitNumber;
  
  // Location of service: 'campo' | 'sotex'
  tipoServicio?: ServiceLocation;
  
  // Equipment
  equipo: EquipmentInfo;
  
  // Damages checklist
  danos: DamagedComponents;
  descripcionDanos: string;
  
  // Printhead test
  pruebaCabezalImagen?: string; // Base64 data or image URL
  pruebaCabezalResultado?: string; // e.g. "Cabezal 100% OK", "Puntos muertos detectados"
  
  // Multiple photographic evidence
  evidenciasFotos?: string[];
  
  // Client sign-off
  clienteNombre: string;
  clienteEmail: string;
  clienteFirma?: string; // Data URL
  
  // Technician / Engineer sign-off
  tecnicoNombre: string;
  tecnicoFirma?: string; // Data URL
  tecnicoId?: string;
  
  // Technician Acceptance status
  aceptadaPorTecnico?: boolean;
  fechaAceptada?: string;
  
  // Additional dashboard tracking
  status: ServiceStatus;
  observacionesGenerales?: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'tecnico';

export type ActiveModule =
  | 'metricas'
  | 'reportes'
  | 'historial'
  | 'notificaciones'
  | 'empleados'
  | 'perfil'
  | 'manual';

export interface FolioConfig {
  prefijo: string;
  ultimoNumero: number;
  codigoFormato: string;
  cerosPadding: number;
}

export interface SystemNotification {
  id: string;
  titulo: string;
  mensaje: string;
  fecha: string; // ISO string
  tipo: 'nueva_orden' | 'orden_aceptada' | 'cambio_estatus' | 'sistema';
  ordenId?: string;
  folio?: string;
  destinatarioRol: 'admin' | 'tecnico' | 'todos';
  destinatarioTecnico?: string;
  remitenteNombre?: string;
  leida: boolean;
  accionRequerida?: boolean;
  detalles?: {
    estatusAnterior?: ServiceStatus;
    estatusNuevo?: ServiceStatus;
    empresa?: string;
    tipoServicio?: ServiceLocation;
  };
}

export interface AdminProfile {
  nombre: string;
  correo: string;
  cargo: string;
  telefono: string;
  sucursal: string;
  cedulaTecnica: string;
  fotoUrl?: string;
  firmaDigital?: string;
  bio?: string;
}

export interface Employee {
  id: string;
  nombre: string;
  usuario?: string;
  correo: string;
  password?: string;
  rol: UserRole;
  telefono: string;
  puesto: string;
  sucursal: string;
  cedulaTecnica: string;
  activo: boolean;
  fotoUrl?: string;
  firmaDigital?: string;
  fechaRegistro: string;
}

export interface TechnicianProfile {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  puesto: string;
  sucursal: string;
  cedulaTecnica: string;
  fotoUrl?: string;
  firmaDigital?: string;
}
