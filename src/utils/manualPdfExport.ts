import { jsPDF } from 'jspdf';
import { UserRole } from '../types';
import { SOTEX_LOGO_DATA_URI } from './sotexLogoBase64';

const getPDFConstructor = () => {
  return (jsPDF as any)?.default || jsPDF;
};

interface ManualSection {
  title: string;
  badge?: string;
  paragraphs: string[];
  steps?: string[];
  tips?: string[];
  warnings?: string[];
}

export function generateManualPDF(role: UserRole, autoDownload = true): jsPDF {
  const PDFClass = getPDFConstructor();
  const doc = new PDFClass({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter', // 215.9 x 279.4 mm
  });

  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2; // ~183.9 mm
  let currentY = 16;

  const isAdmin = role === 'admin';
  const docCode = isAdmin ? 'SOT-MAN-ADM-01' : 'SOT-MAN-TEC-01';
  const docTitle = isAdmin
    ? 'MANUAL DEL ADMINISTRADOR GENERAL'
    : 'MANUAL OPERATIVO DEL TÉCNICO DE SERVICIO';
  const docSubtitle = isAdmin
    ? 'Guía de gestión, asignación de roles, empleados, reportes y control de base de datos'
    : 'Guía de levantamiento de reportes SOT-REP-CLG-01, diagnóstico de cabezales y firmas';

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
      renderRunningHeader();
    }
  };

  const renderRunningHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('SOTEX Soluciones Tecnológicas • Sistema de Servicio Técnico', margin, 12);
    doc.text(docCode, pageWidth - margin, 12, { align: 'right' });
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, 14, pageWidth - margin, 14);
  };

  // --- COVER / HEADER ---
  try {
    doc.addImage(SOTEX_LOGO_DATA_URI, 'PNG', margin, currentY - 2, 44, 16);
  } catch {
    doc.setFillColor(20, 24, 33);
    doc.roundedRect(margin, currentY, 44, 16, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('SOTEX', margin + 6, currentY + 10);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(214, 0, 0); // SOTEX Red
  doc.text('DOCUMENTO TÉCNICO OFICIAL', pageWidth - margin, currentY + 4, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text(docCode, pageWidth - margin, currentY + 10, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  doc.text(`Revisión: 2.4 | ${new Date().toLocaleDateString('es-MX')}`, pageWidth - margin, currentY + 15, {
    align: 'right',
  });

  currentY += 24;

  // Header Title Box
  doc.setFillColor(isAdmin ? 33 : 24, isAdmin ? 33 : 24, isAdmin ? 33 : 24);
  doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'F');
  doc.setFillColor(214, 0, 0);
  doc.rect(margin, currentY, 3.5, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(docTitle, margin + 7, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(220, 220, 220);
  doc.text(docSubtitle, margin + 7, currentY + 16);

  currentY += 28;

  // Role Badge and Intro Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Rol asignado: ${isAdmin ? 'Administrador General (Acceso Total)' : 'Técnico de Servicio en Campo'}`, margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Plataforma: Aplicación Web Progresiva (PWA) + Base de Datos Supabase (znlhwxjiwrwcfhswppfx).',
    margin + 4,
    currentY + 10.5
  );

  currentY += 20;

  // SECTIONS DATA
  const adminSections: ManualSection[] = [
    {
      title: '1. Arquitectura y Credenciales de Acceso',
      badge: 'Acceso y Seguridad',
      paragraphs: [
        'El sistema SOTEX está diseñado para operar con sincronización en tiempo real con Supabase y respaldo en almacenamiento local sin conexión.',
        'El Administrador puede ingresar al sistema utilizando tanto su correo electrónico como su nombre de usuario asignado.',
      ],
      steps: [
        'En la pantalla principal, presione sobre la tarjeta "Administrador" o el botón "Iniciar Sesión".',
        'Ingrese su nombre de usuario (ej. haroldo90 o carlos_raya) o su correo electrónico registrado.',
        'Escriba su contraseña. Puede hacer clic en el icono del ojito para visualizar los caracteres.',
        'Al autenticarse, el sistema verifica su rol "admin" en la base de datos de Supabase y habilita todos los privilegios.',
      ],
      tips: [
        'Las contraseñas se almacenan cifradas en la base de datos de Supabase.',
        'Si modifica el rol de un usuario en la tabla employees de Supabase, el cambio se aplicará en el próximo inicio de sesión.',
      ],
    },
    {
      title: '2. Gestión Integral de Empleados y Asignación de Roles',
      badge: 'Módulo Empleados',
      paragraphs: [
        'Exclusivo para el rol Administrador. Permite registrar a técnicos y supervisores, asignarles su rol (admin o técnico), sucursal y generar credenciales seguras.',
      ],
      steps: [
        'Diríjase al módulo "Empleados" desde la barra de navegación lateral o inferior.',
        'Haga clic en el botón rojo "Dar de Alta Empleado".',
        'Complete el formulario con Nombre completo, Usuario, Correo, Teléfono, Puesto y Sucursal.',
        'Seleccione el Rol: "Administrador" o "Técnico".',
        'Haga clic en "Generar Contraseña Segura" para obtener una clave aleatoria y segura de alta complejidad.',
        'Guarde el registro. El empleado se guardará localmente y se sincronizará automáticamente con Supabase.',
        'Utilice el botón "WhatsApp" en la tarjeta del empleado para enviarle sus credenciales formateadas con un solo toque.',
      ],
      warnings: [
        'Asignar el rol "Administrador" permite al usuario editar otros empleados y realizar borrados de raíz.',
      ],
    },
    {
      title: '3. Supervisión y Auditoría de Reportes SOT-REP-CLG-01',
      badge: 'Módulo Reportes',
      paragraphs: [
        'Permite monitorear el trabajo técnico realizado en las plantas de clientes, diagnosticar fallas críticas y exportar documentación oficial.',
      ],
      steps: [
        'Filtre los reportes por Empresa, Folio, Número de Visita (1 a 4), Estado o Falla crítica.',
        'Haga clic en el icono del ojo para ver la representación gráfica del formato físico oficial SOT-REP-CLG-01.',
        'Descargue el PDF oficial individual con firmas digitales o descargue el compilado total con el botón "PDF (Todos)".',
        'Exporte los registros a Microsoft Excel (.xlsx) con columnas completas de datos técnicos y estados.',
      ],
      tips: [
        'Los reportes con fallas en cabezal térmico aparecen destacados con un indicador rojo de atención inmediata.',
      ],
    },
    {
      title: '4. Protocolo de Borrado de Raíz (Local y Supabase)',
      badge: 'Borrado Permanente',
      paragraphs: [
        'El sistema cuenta con un motor de borrado de raíz diseñado para eliminar permanentemente registros sin dejar residuos.',
      ],
      steps: [
        'Borrado individual: Presione el icono de papelera en la fila del reporte o en la tarjeta de empleado.',
        'Borrado múltiple: Marque las casillas de los reportes a eliminar y presione "Borrar de Raíz (N)" en la barra negra.',
        'Confirme la acción en el modal de seguridad. El sistema ejecutará la sentencia DELETE en Supabase.',
        'El registro se añade a una lista negra persistente para garantizar que jamás vuelva a mostrarse, incluso tras reiniciar o refrescar la aplicación.',
      ],
      warnings: [
        'El borrado de raíz es irreversible. No se puede recuperar un registro una vez confirmado.',
      ],
    },
    {
      title: '5. Sincronización y Mantenimiento de Supabase',
      badge: 'Base de Datos',
      paragraphs: [
        'El sistema se conecta al proyecto znlhwxjiwrwcfhswppfx de Supabase para almacenar las tablas employees y service_reports.',
      ],
      steps: [
        'Puede consultar el script SQL completo en cualquier momento usando el botón "SQL Supabase".',
        'Copie el script con el botón "Copiar SQL" y ejecútelo en el SQL Editor de Supabase si necesita restaurar esquemas o políticas RLS.',
      ],
    },
  ];

  const techSections: ManualSection[] = [
    {
      title: '1. Inicio de Sesión y Perfil del Técnico',
      badge: 'Acceso y Perfil',
      paragraphs: [
        'Como técnico de campo o taller de SOTEX, su labor principal es levantar diagnósticos precisos en impresoras térmicas y formalizar los reportes de servicio.',
      ],
      steps: [
        'Seleccione el rol "Técnico" en la pantalla de bienvenida.',
        'Introduzca su usuario o correo y contraseña proporcionados por el Administrador.',
        'Acceda a su módulo "Perfil" para registrar su cédula técnica, teléfono de guardia y trazar su firma digital táctil.',
      ],
      tips: [
        'Su firma digital guardada en el perfil se usará automáticamente en los reportes de servicio que genere.',
      ],
    },
    {
      title: '2. Levantamiento del Reporte Físico SOT-REP-CLG-01',
      badge: 'Nuevo Reporte',
      paragraphs: [
        'El reporte SOT-REP-CLG-01 es el documento legal y técnico que avala la visita ante el cliente.',
      ],
      steps: [
        'Presione el botón rojo "+ Nuevo Reporte" en la barra lateral o en la cabecera.',
        'Verifique que el Folio y la Fecha coincidan con la orden de trabajo.',
        'Seleccione el Número de Visita: Visita 1 (Diagnóstico inicial) a Visita 4 (Entrega/Cierre).',
        'Registre la Empresa cliente, dirección de planta y teléfono de contacto.',
        'Capture los datos del equipo: Marca (Zebra, Sato, Honeywell, etc.), Modelo, Número de Serie y Resolución (203, 300 o 600 DPI).',
      ],
    },
    {
      title: '3. Checklist de Daños e Inspección del Cabezal Térmico',
      badge: 'Diagnóstico Técnico',
      paragraphs: [
        'El cabezal térmico es el componente más crítico. Marque detalladamente los componentes dañados o desgastados.',
      ],
      steps: [
        'Marque las casillas de componentes averiados: Cabezal, Rodillo principal, Display, Sensor de papel, Sensor de ribbon, Bandas, Cutter o Rebobinador.',
        'En "Prueba de Cabezal": Especifique el resultado de la impresión de prueba (ej. "Cabezal 100% OK" o "3 puntos quemados a la derecha").',
        'Suba una fotografía clara de la etiqueta de prueba de cabezal usando el botón de captura o archivo.',
        'Describa las acciones correctivas aplicadas en el campo "Descripción de Daños / Solución".',
      ],
      tips: [
        'Siempre limpie el cabezal con alcohol isopropílico antes de realizar la prueba de impresión final.',
      ],
    },
    {
      title: '4. Captura de Firmas y Cierre de Servicio',
      badge: 'Firmas Digitales',
      paragraphs: [
        'Todo reporte debe contar con la firma de conformidad del cliente y la firma del técnico responsable.',
      ],
      steps: [
        'Escriba el nombre y correo del encargado o responsable que recibe el servicio en planta.',
        'Solicite al cliente que plasme su firma en el panel táctil en pantalla.',
        'Verifique o trace su firma como técnico responsable de SOTEX.',
        'Seleccione el estado final: "Completado", "Pendiente Refacción", "En Revisión" o "Garantía".',
        'Presione "Guardar y Descargar PDF" para generar de inmediato la hoja oficial SOT-REP-CLG-01.',
      ],
    },
    {
      title: '5. Operación Fuera de Línea (Offline) y Entregas',
      badge: 'Disponibilidad',
      paragraphs: [
        'La aplicación funciona plenamente sin conexión a internet si se encuentra en naves industriales sin cobertura.',
      ],
      steps: [
        'Puede llenar y guardar reportes sin internet. Quedan almacenados en la memoria del dispositivo.',
        'En cuanto el dispositivo recupere señal WiFi o datos móviles, los reportes se sincronizarán automáticamente con Supabase.',
        'Puede mostrar el reporte al cliente en pantalla o enviarle el PDF generado por correo o WhatsApp.',
      ],
    },
  ];

  const sections = isAdmin ? adminSections : techSections;

  sections.forEach((sec, idx) => {
    checkPageBreak(35);

    // Section Header Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, currentY, contentWidth, 8.5, 1, 1, 'F');
    doc.setFillColor(214, 0, 0);
    doc.rect(margin, currentY, 2, 8.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(sec.title, margin + 5, currentY + 5.5);

    if (sec.badge) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(214, 0, 0);
      doc.text(`[ ${sec.badge.toUpperCase()} ]`, pageWidth - margin - 2, currentY + 5.5, {
        align: 'right',
      });
    }

    currentY += 12;

    // Paragraphs
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    sec.paragraphs.forEach((p) => {
      const lines = doc.splitTextToSize(p, contentWidth);
      checkPageBreak(lines.length * 4.5 + 2);
      doc.text(lines, margin, currentY);
      currentY += lines.length * 4.5 + 2;
    });

    // Steps list
    if (sec.steps && sec.steps.length > 0) {
      checkPageBreak(sec.steps.length * 5 + 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text('Pasos de ejecución:', margin + 2, currentY + 2);
      currentY += 5;

      sec.steps.forEach((step, sIdx) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(214, 0, 0);
        doc.text(`${sIdx + 1}.`, margin + 3, currentY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        const stepLines = doc.splitTextToSize(step, contentWidth - 9);
        checkPageBreak(stepLines.length * 4.2 + 2);
        doc.text(stepLines, margin + 8, currentY);
        currentY += stepLines.length * 4.2 + 1.5;
      });
      currentY += 2;
    }

    // Tips Box
    if (sec.tips && sec.tips.length > 0) {
      const tipText = sec.tips.join(' • ');
      const tipLines = doc.splitTextToSize(`CONSEJO SOTEX: ${tipText}`, contentWidth - 8);
      const tipBoxHeight = tipLines.length * 4 + 4;
      checkPageBreak(tipBoxHeight + 2);

      doc.setFillColor(240, 253, 244); // light green
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(margin, currentY, contentWidth, tipBoxHeight, 1, 1, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(22, 101, 52);
      doc.text(tipLines, margin + 4, currentY + 3.5);

      currentY += tipBoxHeight + 3;
    }

    // Warnings Box
    if (sec.warnings && sec.warnings.length > 0) {
      const warnText = sec.warnings.join(' • ');
      const warnLines = doc.splitTextToSize(`ATENCIÓN: ${warnText}`, contentWidth - 8);
      const warnBoxHeight = warnLines.length * 4 + 4;
      checkPageBreak(warnBoxHeight + 2);

      doc.setFillColor(254, 242, 242); // light red
      doc.setDrawColor(254, 202, 202);
      doc.roundedRect(margin, currentY, contentWidth, warnBoxHeight, 1, 1, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(153, 27, 27);
      doc.text(warnLines, margin + 4, currentY + 3.5);

      currentY += warnBoxHeight + 3;
    }

    currentY += 4;
  });

  // --- FOOTER ON ALL PAGES ---
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    doc.text('SOTEX Soluciones Tecnológicas • Documento Confidencial de Uso Interno', margin, pageHeight - 8);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  if (autoDownload) {
    const filename = isAdmin
      ? 'Manual_Administrador_SOTEX_SOT-MAN-ADM-01.pdf'
      : 'Manual_Tecnico_SOTEX_SOT-MAN-TEC-01.pdf';
    doc.save(filename);
  }

  return doc;
}
