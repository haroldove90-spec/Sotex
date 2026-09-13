export type VisitNumber = 1 | 2 | 3 | 4;

export type ServiceStatus = 'Completado' | 'Pendiente Refacción' | 'En Revisión' | 'Garantía';

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
  folio: string;        // e.g. "FOL-2024-001"
  empresa: string;
  fecha: string;        // YYYY-MM-DD
  direccion: string;
  telefono: string;
  numVisita: VisitNumber;
  
  // Equipment
  equipo: EquipmentInfo;
  
  // Damages checklist
  danos: DamagedComponents;
  descripcionDanos: string;
  
  // Printhead test
  pruebaCabezalImagen?: string; // Base64 data or image URL
  pruebaCabezalResultado?: string; // e.g. "Cabezal 100% OK", "Puntos muertos detectados"
  
  // Client sign-off
  clienteNombre: string;
  clienteEmail: string;
  clienteFirma?: string; // Data URL
  
  // Technician / Engineer sign-off
  tecnicoNombre: string;
  tecnicoFirma?: string; // Data URL
  
  // Additional dashboard tracking
  status: ServiceStatus;
  observacionesGenerales?: string;
  createdAt: string;
}

export type ActiveModule = 'metricas' | 'reportes' | 'perfil';

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
