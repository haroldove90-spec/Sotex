import * as XLSX from 'xlsx';
import { ServiceReport } from '../types';

export function exportReportsToExcel(reports: ServiceReport[], fileName = 'Reportes_Servicio_SOTEX.xlsx') {
  if (!Array.isArray(reports) || reports.length === 0) return;

  const xlsxLib: any = (XLSX as any).utils ? XLSX : ((XLSX as any).default || XLSX);

  const rows = reports.map((rep) => ({
    'Folio': rep.folio || '',
    'Código': rep.reportCode || 'SOT-REP-CLG-01',
    'Fecha': rep.fecha || '',
    'Empresa': rep.empresa || '',
    'Teléfono': rep.telefono || '',
    'Dirección': rep.direccion || '',
    'Visita #': rep.numVisita || 1,
    'Estado': rep.status || 'Completado',
    'Equipo': rep.equipo?.equipo || 'Impresora Térmica',
    'Marca': rep.equipo?.marca || 'N/A',
    'Modelo': rep.equipo?.modelo || '',
    'DPI': rep.equipo?.dpi || '203',
    'No. Serie': rep.equipo?.noSerie || '',
    'Cabezal Dañado': rep.danos?.cabezal ? 'SÍ' : 'NO',
    'Rodillo Dañado': rep.danos?.rodilloPrincipal ? 'SÍ' : 'NO',
    'Display Dañado': rep.danos?.display ? 'SÍ' : 'NO',
    'Sensor Papel Dañado': rep.danos?.sensorPapel ? 'SÍ' : 'NO',
    'Sensor Ribbon Dañado': rep.danos?.sensorRibbon ? 'SÍ' : 'NO',
    'Bandas Dañadas': rep.danos?.bandas ? 'SÍ' : 'NO',
    'Cutter Dañado': rep.danos?.cutter ? 'SÍ' : 'NO',
    'Rebobinador Dañado': rep.danos?.rebobinador ? 'SÍ' : 'NO',
    'Otro Daño': rep.danos?.otro ? 'SÍ' : 'NO',
    'Descripción / Diagnóstico': rep.descripcionDanos || '',
    'Resultado Prueba Cabezal': rep.pruebaCabezalResultado || 'Sin registrar',
    'Cliente (Nombre)': rep.clienteNombre || '',
    'Cliente (Correo)': rep.clienteEmail || '',
    'Técnico SOTEX': rep.tecnicoNombre || '',
    'Observaciones Generales': rep.observacionesGenerales || '',
  }));

  const worksheet = xlsxLib.utils.json_to_sheet(rows);

  // Set column widths for readability
  const colWidths = [
    { wch: 14 }, // Folio
    { wch: 16 }, // Código
    { wch: 12 }, // Fecha
    { wch: 28 }, // Empresa
    { wch: 15 }, // Teléfono
    { wch: 35 }, // Dirección
    { wch: 10 }, // Visita #
    { wch: 18 }, // Estado
    { wch: 25 }, // Equipo
    { wch: 14 }, // Marca
    { wch: 16 }, // Modelo
    { wch: 8 },  // DPI
    { wch: 18 }, // No. Serie
    { wch: 14 }, // Cabezal
    { wch: 14 }, // Rodillo
    { wch: 14 }, // Display
    { wch: 18 }, // Sensor Papel
    { wch: 18 }, // Sensor Ribbon
    { wch: 14 }, // Bandas
    { wch: 14 }, // Cutter
    { wch: 18 }, // Rebobinador
    { wch: 12 }, // Otro
    { wch: 45 }, // Descripción
    { wch: 35 }, // Prueba
    { wch: 24 }, // Cliente
    { wch: 26 }, // Email
    { wch: 24 }, // Técnico
    { wch: 35 }, // Observaciones
  ];
  worksheet['!cols'] = colWidths;

  const workbook = xlsxLib.utils.book_new();
  xlsxLib.utils.book_append_sheet(workbook, worksheet, 'Reportes SOTEX');

  // Summary sheet
  const brandCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  const damageCounts: Record<string, number> = {
    'Cabezal': 0,
    'Rodillo principal': 0,
    'Display': 0,
    'Sensor de papel': 0,
    'Sensor de ribbon': 0,
    'Bandas': 0,
    'Cutter': 0,
    'Rebobinador': 0,
    'Otro': 0,
  };

  reports.forEach((r) => {
    const brand = r.equipo?.marca || 'Otros';
    brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    const st = r.status || 'Completado';
    statusCounts[st] = (statusCounts[st] || 0) + 1;
    if (r.danos?.cabezal) damageCounts['Cabezal']++;
    if (r.danos?.rodilloPrincipal) damageCounts['Rodillo principal']++;
    if (r.danos?.display) damageCounts['Display']++;
    if (r.danos?.sensorPapel) damageCounts['Sensor de papel']++;
    if (r.danos?.sensorRibbon) damageCounts['Sensor de ribbon']++;
    if (r.danos?.bandas) damageCounts['Bandas']++;
    if (r.danos?.cutter) damageCounts['Cutter']++;
    if (r.danos?.rebobinador) damageCounts['Rebobinador']++;
    if (r.danos?.otro) damageCounts['Otro']++;
  });

  const summaryData = [
    ['RESUMEN EJECUTIVO DE SERVICIOS TÉCNICOS SOTEX'],
    ['Total de Reportes Registrados', reports.length],
    [''],
    ['--- DISTRIBUCIÓN POR MARCA ---'],
    ...Object.entries(brandCounts).map(([k, v]) => [k, v]),
    [''],
    ['--- DISTRIBUCIÓN POR ESTADO ---'],
    ...Object.entries(statusCounts).map(([k, v]) => [k, v]),
    [''],
    ['--- COMPONENTES CON FALLAS DETECTADAS ---'],
    ...Object.entries(damageCounts).map(([k, v]) => [k, v]),
  ];

  const summarySheet = xlsxLib.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 35 }, { wch: 15 }];
  xlsxLib.utils.book_append_sheet(workbook, summarySheet, 'Estadísticas');

  xlsxLib.writeFile(workbook, fileName);
}
