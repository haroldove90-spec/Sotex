import { jsPDF } from 'jspdf';
import { ServiceReport } from '../types';

const getPDFConstructor = () => {
  return (jsPDF as any)?.default || jsPDF;
};

export function generateServiceReportPDF(report: ServiceReport, autoDownload = true): jsPDF {
  const PDFClass = getPDFConstructor();
  const doc = new PDFClass({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter', // 215.9 x 279.4 mm
  });

  const pageWidth = 215.9;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // ~187.9 mm
  let currentY = 12;

  // --- 1. HEADER ---
  // Left: SOTEX Logo Box
  doc.setFillColor(20, 24, 33);
  doc.roundedRect(margin, currentY, 52, 16, 1.5, 1.5, 'F');

  // Red accent line inside logo
  doc.setFillColor(220, 38, 38);
  doc.rect(margin + 2, currentY + 2, 2.5, 12, 'F');

  // SOTEX text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('SOTEX', margin + 7, currentY + 9);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 210, 225);
  doc.text('SOLUCIONES TECNOLÓGICAS', margin + 7, currentY + 13.5);

  // Right: Document title & Code
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text('REPORTE DE SERVICIO CLIENTE', pageWidth - margin, currentY + 7, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text(report.reportCode || 'SOT-REP-CLG-01', pageWidth - margin, currentY + 12, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Folio: ${report.folio}`, pageWidth - margin, currentY + 16, { align: 'right' });

  currentY += 22;

  // --- 2. GENERAL INFO FIELDS ---
  const leftColX = margin;
  const rightColX = margin + 115;
  const fieldLineYOffset = 4.5;

  // Empresa & Fecha
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Empresa:', leftColX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(report.empresa, leftColX + 18, currentY);
  // Underline Empresa
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(leftColX + 17, currentY + 1, leftColX + 105, currentY + 1);

  doc.setFont('helvetica', 'bold');
  doc.text('Fecha:', rightColX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(report.fecha, rightColX + 14, currentY);
  // Underline Fecha
  doc.line(rightColX + 13, currentY + 1, pageWidth - margin, currentY + 1);

  currentY += 8;

  // Dirección & Tel
  doc.setFont('helvetica', 'bold');
  doc.text('Dirección:', leftColX, currentY);
  doc.setFont('helvetica', 'normal');
  const cleanDir = report.direccion.length > 55 ? report.direccion.substring(0, 52) + '...' : report.direccion;
  doc.text(cleanDir, leftColX + 18, currentY);
  doc.line(leftColX + 17, currentY + 1, leftColX + 105, currentY + 1);

  doc.setFont('helvetica', 'bold');
  doc.text('Tel:', rightColX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(report.telefono, rightColX + 14, currentY);
  doc.line(rightColX + 13, currentY + 1, pageWidth - margin, currentY + 1);

  currentY += 8;

  // Num. de visita
  doc.setFont('helvetica', 'bold');
  doc.text('Num. de visita:', leftColX, currentY);

  const visitBoxStartX = leftColX + 28;
  const visitBoxWidth = 14;
  const visitBoxHeight = 6;
  [1, 2, 3, 4].forEach((num, index) => {
    const boxX = visitBoxStartX + index * visitBoxWidth;
    const isSelected = report.numVisita === num;

    if (isSelected) {
      doc.setFillColor(30, 41, 59);
      doc.rect(boxX, currentY - 4.5, visitBoxWidth, visitBoxHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setDrawColor(120, 120, 120);
      doc.rect(boxX, currentY - 4.5, visitBoxWidth, visitBoxHeight);
      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(String(num), boxX + visitBoxWidth / 2, currentY - 0.5, { align: 'center' });
  });

  currentY += 7;

  // --- 3. EQUIPMENT TABLE ---
  // Table columns: Equipo (50mm), Marca (35mm), Modelo (35mm), DPI (22mm), No. de serie (45.9mm) = 187.9mm
  const colW = {
    equipo: 50,
    marca: 35,
    modelo: 35,
    dpi: 22,
    noSerie: 45.9,
  };

  // Header row
  doc.setFillColor(30, 30, 30);
  doc.rect(margin, currentY, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);

  let curX = margin;
  doc.text('Equipo', curX + 3, currentY + 4.2);
  curX += colW.equipo;
  doc.text('Marca', curX + 3, currentY + 4.2);
  curX += colW.marca;
  doc.text('Modelo', curX + 3, currentY + 4.2);
  curX += colW.modelo;
  doc.text('DPI', curX + 3, currentY + 4.2);
  curX += colW.dpi;
  doc.text('No. de serie', curX + 3, currentY + 4.2);

  // Table value row
  currentY += 6;
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.3);
  doc.rect(margin, currentY, contentWidth, 7);

  // Vertical dividers
  let divX = margin + colW.equipo;
  doc.line(divX, currentY, divX, currentY + 7);
  divX += colW.marca;
  doc.line(divX, currentY, divX, currentY + 7);
  divX += colW.modelo;
  doc.line(divX, currentY, divX, currentY + 7);
  divX += colW.dpi;
  doc.line(divX, currentY, divX, currentY + 7);

  // Table values
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  curX = margin;
  doc.text(report.equipo.equipo || '-', curX + 3, currentY + 4.8);
  curX += colW.equipo;
  doc.text(report.equipo.marca || '-', curX + 3, currentY + 4.8);
  curX += colW.marca;
  doc.text(report.equipo.modelo || '-', curX + 3, currentY + 4.8);
  curX += colW.modelo;
  doc.text(report.equipo.dpi || '-', curX + 3, currentY + 4.8);
  curX += colW.dpi;
  doc.text(report.equipo.noSerie || '-', curX + 3, currentY + 4.8);

  currentY += 9;

  // --- 4. DAÑOS DETECTADOS DURANTE REVISIÓN ---
  // Section Title Bar
  doc.setFillColor(30, 30, 30);
  doc.rect(margin, currentY, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Daños detectados durante revisión', margin + contentWidth / 2, currentY + 4, { align: 'center' });

  currentY += 5.5;

  // Checkboxes Box border
  const checklistHeight = 22;
  doc.setDrawColor(50, 50, 50);
  doc.rect(margin, currentY, contentWidth, checklistHeight);

  // 3 Columns of checkboxes
  const checkCol1X = margin + 4;
  const checkCol2X = margin + 65;
  const checkCol3X = margin + 128;

  const drawCheckboxItem = (label: string, isChecked: boolean, x: number, y: number, boxX: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    doc.text(label, x, y);

    // checkbox square
    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.3);
    doc.rect(boxX, y - 3, 3.5, 3.5);

    if (isChecked) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text('X', boxX + 0.8, y - 0.4);
    }
  };

  // Row 1
  drawCheckboxItem('Cabezal', report.danos.cabezal, checkCol1X, currentY + 5.5, checkCol1X + 44);
  drawCheckboxItem('Sensor de papel', report.danos.sensorPapel, checkCol2X, currentY + 5.5, checkCol2X + 44);
  drawCheckboxItem('Cutter', report.danos.cutter, checkCol3X, currentY + 5.5, checkCol3X + 44);

  // Row 2
  drawCheckboxItem('Rodillo principal', report.danos.rodilloPrincipal, checkCol1X, currentY + 11.5, checkCol1X + 44);
  drawCheckboxItem('Sensor de ribbon', report.danos.sensorRibbon, checkCol2X, currentY + 11.5, checkCol2X + 44);
  drawCheckboxItem('Rebobinador', report.danos.rebobinador, checkCol3X, currentY + 11.5, checkCol3X + 44);

  // Row 3
  drawCheckboxItem('Display', report.danos.display, checkCol1X, currentY + 17.5, checkCol1X + 44);
  drawCheckboxItem('Bandas', report.danos.bandas, checkCol2X, currentY + 17.5, checkCol2X + 44);
  drawCheckboxItem('Otro', report.danos.otro, checkCol3X, currentY + 17.5, checkCol3X + 44);

  currentY += checklistHeight;

  // Describa section (lines on page like physical form)
  const describeBoxHeight = 24;
  doc.rect(margin, currentY, contentWidth, describeBoxHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text('Describa:', margin + 4, currentY + 5);

  // Text content wrapped
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const splitDesc = doc.splitTextToSize(report.descripcionDanos || 'Sin observaciones adicionales registradas.', contentWidth - 28);
  doc.text(splitDesc, margin + 22, currentY + 5);

  // Lined pattern representing form paper
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(margin + 20, currentY + 6.5, margin + contentWidth - 4, currentY + 6.5);
  doc.line(margin + 4, currentY + 11.5, margin + contentWidth - 4, currentY + 11.5);
  doc.line(margin + 4, currentY + 16.5, margin + contentWidth - 4, currentY + 16.5);
  doc.line(margin + 4, currentY + 21.5, margin + contentWidth - 4, currentY + 21.5);

  currentY += describeBoxHeight + 3;

  // --- 5. PRUEBA DE IMPRESIÓN DEL CABEZAL ---
  doc.setFillColor(30, 30, 30);
  doc.rect(margin, currentY, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Prueba de impresión del cabezal', margin + contentWidth / 2, currentY + 4, { align: 'center' });

  currentY += 5.5;

  const testAreaHeight = 65;
  doc.setDrawColor(50, 50, 50);
  doc.rect(margin, currentY, contentWidth, testAreaHeight);

  // If user uploaded/provided a printhead test image
  if (report.pruebaCabezalImagen && report.pruebaCabezalImagen.startsWith('data:image')) {
    try {
      doc.addImage(
        report.pruebaCabezalImagen,
        'JPEG',
        margin + 4,
        currentY + 3,
        contentWidth - 8,
        testAreaHeight - 12,
        undefined,
        'FAST'
      );
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(70, 70, 70);
      doc.text(
        `Resultado: ${report.pruebaCabezalResultado || 'Prueba adjunta'}`,
        margin + 5,
        currentY + testAreaHeight - 3
      );
    } catch {
      renderDefaultPrintTestGrid(doc, margin, currentY, contentWidth, testAreaHeight, report.pruebaCabezalResultado);
    }
  } else {
    renderDefaultPrintTestGrid(doc, margin, currentY, contentWidth, testAreaHeight, report.pruebaCabezalResultado);
  }

  currentY += testAreaHeight + 8;

  // --- 6. FOOTER WEB & EMAIL ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 80, 180);
  doc.text('www.sotex.com.mx', margin + 8, currentY);
  doc.text('soporteqdl@sotex.com.mx', pageWidth - margin - 8, currentY, { align: 'right' });

  currentY += 16;

  // --- 7. SIGNATURES ---
  const signColWidth = 75;
  const clientSignX = margin + 10;
  const techSignX = pageWidth - margin - signColWidth - 10;

  // If signatures exist, draw them
  if (report.clienteFirma && report.clienteFirma.startsWith('data:image')) {
    try {
      doc.addImage(report.clienteFirma, 'PNG', clientSignX + 8, currentY - 14, 55, 12);
    } catch {
      // ignore
    }
  }

  if (report.tecnicoFirma && report.tecnicoFirma.startsWith('data:image')) {
    try {
      doc.addImage(report.tecnicoFirma, 'PNG', techSignX + 8, currentY - 14, 55, 12);
    } catch {
      // ignore
    }
  }

  // Signature lines
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.3);
  doc.line(clientSignX, currentY, clientSignX + signColWidth, currentY);
  doc.line(techSignX, currentY, techSignX + signColWidth, currentY);

  // Labels under signature lines
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text('Nombre, firma, correo (Cliente)', clientSignX + signColWidth / 2, currentY + 4, { align: 'center' });
  doc.text('Nombre y firma (Ing. SOTEX)', techSignX + signColWidth / 2, currentY + 4, { align: 'center' });

  // Text below signature
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  if (report.clienteNombre) {
    doc.text(`${report.clienteNombre} (${report.clienteEmail || 'Sin correo'})`, clientSignX + signColWidth / 2, currentY + 8, { align: 'center' });
  }
  if (report.tecnicoNombre) {
    doc.text(report.tecnicoNombre, techSignX + signColWidth / 2, currentY + 8, { align: 'center' });
  }

  if (autoDownload) {
    const filename = `Reporte_${report.folio}_${report.empresa.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(filename);
  }

  return doc;
}

function renderDefaultPrintTestGrid(
  doc: jsPDF,
  margin: number,
  currentY: number,
  contentWidth: number,
  testAreaHeight: number,
  resultado?: string
) {
  // Draw simulated printer test pattern grid
  doc.setFillColor(248, 250, 252);
  doc.rect(margin + 4, currentY + 3, contentWidth - 8, testAreaHeight - 14, 'F');

  // Barcode / test pattern lines simulation
  doc.setDrawColor(210, 215, 225);
  doc.setLineWidth(0.15);
  for (let i = margin + 10; i < margin + contentWidth - 10; i += 8) {
    doc.line(i, currentY + 6, i, currentY + 22);
  }

  // Label watermark box inside
  doc.setDrawColor(180, 190, 205);
  doc.rect(margin + 15, currentY + 7, contentWidth - 30, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(70, 80, 95);
  doc.text('PATRÓN DE PRUEBA DE CABEZAL TÉRMICO', margin + contentWidth / 2, currentY + 13, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Verificación de densidad, alineación y ausencia de píxeles/elementos dañados', margin + contentWidth / 2, currentY + 18, { align: 'center' });

  // Technical result box
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + 8, currentY + 28, contentWidth - 16, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Diagnóstico de Impresión del Cabezal:', margin + 12, currentY + 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  const resText = resultado || 'Prueba realizada con papel térmico directo y ribbon de resina. No se detectaron líneas muertas ni defectos de calentamiento en los elementos resistivos.';
  const splitRes = doc.splitTextToSize(resText, contentWidth - 28);
  doc.text(splitRes, margin + 12, currentY + 39);

  // Note for physical affixing
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text('* Área destinada para adherir etiqueta de muestra impresa o adjuntar comprobante gráfico.', margin + contentWidth / 2, currentY + testAreaHeight - 2, { align: 'center' });
}

export function generateAllReportsPDF(reports: ServiceReport[]) {
  if (!reports || reports.length === 0) return;

  const mainDoc = generateServiceReportPDF(reports[0], false);

  for (let i = 1; i < reports.length; i++) {
    mainDoc.addPage('letter', 'portrait');
    // We recreate the page for the report on the same doc
    const nextDoc = generateServiceReportPDF(reports[i], false);
    // Alternatively call the internal drawing function, but jsPDF allows simple sequential build:
  }

  // To build multi-page accurately:
  const PDFClass = getPDFConstructor();
  const multiDoc = new PDFClass({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  reports.forEach((rep, index) => {
    if (index > 0) {
      multiDoc.addPage('letter', 'portrait');
    }
    // Render content on multiDoc
    renderSinglePageOnDoc(multiDoc, rep);
  });

  multiDoc.save(`Reportes_Servicio_SOTEX_Compilado_${reports.length}_Folios.pdf`);
}

function renderSinglePageOnDoc(doc: jsPDF, report: ServiceReport) {
  const pageWidth = 215.9;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = 12;

  // SOTEX Logo Box
  doc.setFillColor(20, 24, 33);
  doc.roundedRect(margin, currentY, 52, 16, 1.5, 1.5, 'F');
  doc.setFillColor(220, 38, 38);
  doc.rect(margin + 2, currentY + 2, 2.5, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('SOTEX', margin + 7, currentY + 9);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 210, 225);
  doc.text('SOLUCIONES TECNOLÓGICAS', margin + 7, currentY + 13.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text('REPORTE DE SERVICIO CLIENTE', pageWidth - margin, currentY + 7, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(report.reportCode || 'SOT-REP-CLG-01', pageWidth - margin, currentY + 12, { align: 'right' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Folio: ${report.folio}`, pageWidth - margin, currentY + 16, { align: 'right' });

  currentY += 22;

  // Empresa & Fecha
  const leftColX = margin;
  const rightColX = margin + 115;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Empresa:', leftColX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(report.empresa, leftColX + 18, currentY);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(leftColX + 17, currentY + 1, leftColX + 105, currentY + 1);

  doc.setFont('helvetica', 'bold');
  doc.text('Fecha:', rightColX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(report.fecha, rightColX + 14, currentY);
  doc.line(rightColX + 13, currentY + 1, pageWidth - margin, currentY + 1);

  currentY += 8;

  // Dirección & Tel
  doc.setFont('helvetica', 'bold');
  doc.text('Dirección:', leftColX, currentY);
  doc.setFont('helvetica', 'normal');
  const cleanDir = report.direccion.length > 55 ? report.direccion.substring(0, 52) + '...' : report.direccion;
  doc.text(cleanDir, leftColX + 18, currentY);
  doc.line(leftColX + 17, currentY + 1, leftColX + 105, currentY + 1);

  doc.setFont('helvetica', 'bold');
  doc.text('Tel:', rightColX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(report.telefono, rightColX + 14, currentY);
  doc.line(rightColX + 13, currentY + 1, pageWidth - margin, currentY + 1);

  currentY += 8;

  // Visita
  doc.setFont('helvetica', 'bold');
  doc.text('Num. de visita:', leftColX, currentY);
  const visitBoxStartX = leftColX + 28;
  const visitBoxWidth = 14;
  const visitBoxHeight = 6;
  [1, 2, 3, 4].forEach((num, index) => {
    const boxX = visitBoxStartX + index * visitBoxWidth;
    const isSelected = report.numVisita === num;
    if (isSelected) {
      doc.setFillColor(30, 41, 59);
      doc.rect(boxX, currentY - 4.5, visitBoxWidth, visitBoxHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setDrawColor(120, 120, 120);
      doc.rect(boxX, currentY - 4.5, visitBoxWidth, visitBoxHeight);
      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(String(num), boxX + visitBoxWidth / 2, currentY - 0.5, { align: 'center' });
  });

  currentY += 7;

  // Equipment table
  const colW = { equipo: 50, marca: 35, modelo: 35, dpi: 22, noSerie: 45.9 };
  doc.setFillColor(30, 30, 30);
  doc.rect(margin, currentY, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);

  let curX = margin;
  doc.text('Equipo', curX + 3, currentY + 4.2);
  curX += colW.equipo;
  doc.text('Marca', curX + 3, currentY + 4.2);
  curX += colW.marca;
  doc.text('Modelo', curX + 3, currentY + 4.2);
  curX += colW.modelo;
  doc.text('DPI', curX + 3, currentY + 4.2);
  curX += colW.dpi;
  doc.text('No. de serie', curX + 3, currentY + 4.2);

  currentY += 6;
  doc.setDrawColor(40, 40, 40);
  doc.rect(margin, currentY, contentWidth, 7);
  let divX = margin + colW.equipo;
  doc.line(divX, currentY, divX, currentY + 7);
  divX += colW.marca;
  doc.line(divX, currentY, divX, currentY + 7);
  divX += colW.modelo;
  doc.line(divX, currentY, divX, currentY + 7);
  divX += colW.dpi;
  doc.line(divX, currentY, divX, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  curX = margin;
  doc.text(report.equipo.equipo || '-', curX + 3, currentY + 4.8);
  curX += colW.equipo;
  doc.text(report.equipo.marca || '-', curX + 3, currentY + 4.8);
  curX += colW.marca;
  doc.text(report.equipo.modelo || '-', curX + 3, currentY + 4.8);
  curX += colW.modelo;
  doc.text(report.equipo.dpi || '-', curX + 3, currentY + 4.8);
  curX += colW.dpi;
  doc.text(report.equipo.noSerie || '-', curX + 3, currentY + 4.8);

  currentY += 9;

  // Daños checklist
  doc.setFillColor(30, 30, 30);
  doc.rect(margin, currentY, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Daños detectados durante revisión', margin + contentWidth / 2, currentY + 4, { align: 'center' });

  currentY += 5.5;
  const checklistHeight = 22;
  doc.setDrawColor(50, 50, 50);
  doc.rect(margin, currentY, contentWidth, checklistHeight);

  const checkCol1X = margin + 4;
  const checkCol2X = margin + 65;
  const checkCol3X = margin + 128;

  const drawItem = (label: string, isChecked: boolean, x: number, y: number, boxX: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    doc.text(label, x, y);
    doc.setDrawColor(60, 60, 60);
    doc.rect(boxX, y - 3, 3.5, 3.5);
    if (isChecked) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text('X', boxX + 0.8, y - 0.4);
    }
  };

  drawItem('Cabezal', report.danos.cabezal, checkCol1X, currentY + 5.5, checkCol1X + 44);
  drawItem('Sensor de papel', report.danos.sensorPapel, checkCol2X, currentY + 5.5, checkCol2X + 44);
  drawItem('Cutter', report.danos.cutter, checkCol3X, currentY + 5.5, checkCol3X + 44);

  drawItem('Rodillo principal', report.danos.rodilloPrincipal, checkCol1X, currentY + 11.5, checkCol1X + 44);
  drawItem('Sensor de ribbon', report.danos.sensorRibbon, checkCol2X, currentY + 11.5, checkCol2X + 44);
  drawItem('Rebobinador', report.danos.rebobinador, checkCol3X, currentY + 11.5, checkCol3X + 44);

  drawItem('Display', report.danos.display, checkCol1X, currentY + 17.5, checkCol1X + 44);
  drawItem('Bandas', report.danos.bandas, checkCol2X, currentY + 17.5, checkCol2X + 44);
  drawItem('Otro', report.danos.otro, checkCol3X, currentY + 17.5, checkCol3X + 44);

  currentY += checklistHeight;

  // Describa
  const describeBoxHeight = 24;
  doc.rect(margin, currentY, contentWidth, describeBoxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text('Describa:', margin + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const splitDesc = doc.splitTextToSize(report.descripcionDanos || 'Sin observaciones adicionales registradas.', contentWidth - 28);
  doc.text(splitDesc, margin + 22, currentY + 5);

  doc.setDrawColor(200, 200, 200);
  doc.line(margin + 20, currentY + 6.5, margin + contentWidth - 4, currentY + 6.5);
  doc.line(margin + 4, currentY + 11.5, margin + contentWidth - 4, currentY + 11.5);
  doc.line(margin + 4, currentY + 16.5, margin + contentWidth - 4, currentY + 16.5);
  doc.line(margin + 4, currentY + 21.5, margin + contentWidth - 4, currentY + 21.5);

  currentY += describeBoxHeight + 3;

  // Printhead test
  doc.setFillColor(30, 30, 30);
  doc.rect(margin, currentY, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Prueba de impresión del cabezal', margin + contentWidth / 2, currentY + 4, { align: 'center' });

  currentY += 5.5;
  const testAreaHeight = 65;
  doc.setDrawColor(50, 50, 50);
  doc.rect(margin, currentY, contentWidth, testAreaHeight);

  if (report.pruebaCabezalImagen && report.pruebaCabezalImagen.startsWith('data:image')) {
    try {
      doc.addImage(report.pruebaCabezalImagen, 'JPEG', margin + 4, currentY + 3, contentWidth - 8, testAreaHeight - 12, undefined, 'FAST');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(70, 70, 70);
      doc.text(`Resultado: ${report.pruebaCabezalResultado || 'Prueba adjunta'}`, margin + 5, currentY + testAreaHeight - 3);
    } catch {
      renderDefaultPrintTestGrid(doc, margin, currentY, contentWidth, testAreaHeight, report.pruebaCabezalResultado);
    }
  } else {
    renderDefaultPrintTestGrid(doc, margin, currentY, contentWidth, testAreaHeight, report.pruebaCabezalResultado);
  }

  currentY += testAreaHeight + 8;

  // Footer links
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 80, 180);
  doc.text('www.sotex.com.mx', margin + 8, currentY);
  doc.text('soporteqdl@sotex.com.mx', pageWidth - margin - 8, currentY, { align: 'right' });

  currentY += 16;

  // Signatures
  const signColWidth = 75;
  const clientSignX = margin + 10;
  const techSignX = pageWidth - margin - signColWidth - 10;

  if (report.clienteFirma && report.clienteFirma.startsWith('data:image')) {
    try {
      doc.addImage(report.clienteFirma, 'PNG', clientSignX + 8, currentY - 14, 55, 12);
    } catch {
      // ignore
    }
  }

  if (report.tecnicoFirma && report.tecnicoFirma.startsWith('data:image')) {
    try {
      doc.addImage(report.tecnicoFirma, 'PNG', techSignX + 8, currentY - 14, 55, 12);
    } catch {
      // ignore
    }
  }

  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.3);
  doc.line(clientSignX, currentY, clientSignX + signColWidth, currentY);
  doc.line(techSignX, currentY, techSignX + signColWidth, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text('Nombre, firma, correo (Cliente)', clientSignX + signColWidth / 2, currentY + 4, { align: 'center' });
  doc.text('Nombre y firma (Ing. SOTEX)', techSignX + signColWidth / 2, currentY + 4, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  if (report.clienteNombre) {
    doc.text(`${report.clienteNombre} (${report.clienteEmail || 'Sin correo'})`, clientSignX + signColWidth / 2, currentY + 8, { align: 'center' });
  }
  if (report.tecnicoNombre) {
    doc.text(report.tecnicoNombre, techSignX + signColWidth / 2, currentY + 8, { align: 'center' });
  }
}
