import { ServiceReport, ServiceStatus, ServiceLocation, VisitNumber } from '../types';
import { supabase } from './supabaseClient';

/**
 * Normalizes any database row (whether with new columns or base columns + JSONB metadata)
 * into a complete, typed ServiceReport.
 */
export const normalizeSupabaseReportRow = (row: any): ServiceReport => {
  const meta = row?.equipo?._sotex_meta || {};

  const tipoServicio: ServiceLocation =
    row?.tipo_servicio === 'sotex' ||
    row?.tipoServicio === 'sotex' ||
    meta?.tipoServicio === 'sotex'
      ? 'sotex'
      : 'campo';

  const evidenciasFotos: string[] = Array.isArray(row?.evidencias_fotos)
    ? row.evidencias_fotos
    : Array.isArray(row?.evidenciasFotos)
    ? row.evidenciasFotos
    : Array.isArray(meta?.evidenciasFotos)
    ? meta.evidenciasFotos
    : [];

  const aceptadaPorTecnico: boolean = Boolean(
    row?.aceptada_por_tecnico ??
    row?.aceptadaPorTecnico ??
    meta?.aceptadaPorTecnico ??
    false
  );

  const fechaAceptada: string | undefined =
    row?.fecha_aceptada ||
    row?.fechaAceptada ||
    meta?.fechaAceptada ||
    undefined;

  const tecnicoId: string | undefined =
    row?.tecnico_id ||
    row?.tecnicoId ||
    meta?.tecnicoId ||
    undefined;

  const clienteFirma: string | undefined =
    row?.cliente_firma ||
    row?.clienteFirma ||
    meta?.clienteFirma ||
    undefined;

  const tecnicoFirma: string | undefined =
    row?.tecnico_firma ||
    row?.tecnicoFirma ||
    meta?.tecnicoFirma ||
    undefined;

  // Clean equipment object without internal metadata for display
  const rawEquipo = row?.equipo || {};
  const cleanedEquipo = {
    equipo: rawEquipo.equipo || 'Impresora Térmica',
    marca: rawEquipo.marca || 'Zebra',
    modelo: rawEquipo.modelo || 'ZT411',
    dpi: rawEquipo.dpi || '203',
    noSerie: rawEquipo.noSerie || 'N/D',
  };

  return {
    id: row?.id || `rep-${Date.now()}`,
    reportCode: row?.report_code || row?.reportCode || 'SOT-REP-CLG-01',
    folio: row?.folio || 'SOT-2026-000',
    tipoServicio,
    empresa: row?.empresa || 'Cliente SOTEX',
    fecha: row?.fecha || new Date().toISOString().split('T')[0],
    direccion: row?.direccion || '',
    telefono: row?.telefono || '',
    numVisita: (row?.num_visita >= 1 && row?.num_visita <= 4
      ? row.num_visita
      : row?.numVisita >= 1 && row?.numVisita <= 4
      ? row.numVisita
      : 1) as VisitNumber,
    equipo: cleanedEquipo,
    danos: {
      cabezal: Boolean(row?.danos?.cabezal),
      rodilloPrincipal: Boolean(row?.danos?.rodilloPrincipal),
      display: Boolean(row?.danos?.display),
      sensorPapel: Boolean(row?.danos?.sensorPapel),
      sensorRibbon: Boolean(row?.danos?.sensorRibbon),
      bandas: Boolean(row?.danos?.bandas),
      cutter: Boolean(row?.danos?.cutter),
      rebobinador: Boolean(row?.danos?.rebobinador),
      otro: Boolean(row?.danos?.otro),
    },
    descripcionDanos: row?.descripcion_danos || row?.descripcionDanos || '',
    pruebaCabezalResultado:
      row?.prueba_cabezal_resultado || row?.pruebaCabezalResultado || '',
    pruebaCabezalImagen: row?.prueba_cabezal_imagen || row?.pruebaCabezalImagen,
    evidenciasFotos,
    clienteNombre: row?.cliente_nombre || row?.clienteNombre || '',
    clienteEmail: row?.cliente_email || row?.clienteEmail || '',
    clienteFirma,
    contactoNombre:
      row?.contacto_nombre ||
      row?.contactoNombre ||
      meta?.contactoNombre ||
      '',
    serviciosRealizar: Array.isArray(row?.servicios_realizar)
      ? row.servicios_realizar
      : Array.isArray(row?.serviciosRealizar)
      ? row.serviciosRealizar
      : Array.isArray(meta?.serviciosRealizar)
      ? meta.serviciosRealizar
      : [],
    tipoEquipoNombre:
      row?.tipo_equipo_nombre ||
      row?.tipoEquipoNombre ||
      meta?.tipoEquipoNombre ||
      '',
    fotoAntes: row?.foto_antes || row?.fotoAntes || meta?.fotoAntes || undefined,
    fotoDespues:
      row?.foto_despues || row?.fotoDespues || meta?.fotoDespues || undefined,
    danosDinamicos:
      row?.danos_dinamicos ||
      row?.danosDinamicos ||
      meta?.danosDinamicos ||
      {},
    fechaAgenda:
      row?.fecha_agenda ||
      row?.fechaAgenda ||
      meta?.fechaAgenda ||
      undefined,
    tecnicoNombre: row?.tecnico_nombre || row?.tecnicoNombre || 'Tec. Carlos Mendoza',
    tecnicoFirma,
    tecnicoId,
    aceptadaPorTecnico,
    fechaAceptada,
    status: ((meta?.realStatus || meta?.status || row?.status || 'En Revisión') as ServiceStatus),
    observacionesGenerales:
      row?.observaciones_generales || row?.observacionesGenerales || '',
    createdAt: row?.created_at || row?.createdAt || new Date().toISOString(),
  };
};

/**
 * Saves a service report to Supabase with automatic schema adaptation.
 *
 * If the user's Supabase database has not had the latest ALTER TABLE migrations applied yet,
 * PostgREST will reject extra columns with PGRST204.
 * This function detects that and seamlessly falls back to saving standard columns with all
 * extended metadata preserved in the JSONB 'equipo' column.
 */
export const saveReportToSupabase = async (
  report: ServiceReport
): Promise<{ success: boolean; mode: 'full' | 'fallback_jsonb'; error?: string }> => {
  // Always attach extended metadata in equipo._sotex_meta so it is NEVER lost,
  // regardless of which table schema is currently active in Supabase!
  const equipoWithMeta = {
    equipo: report.equipo?.equipo || 'Impresora Térmica',
    marca: report.equipo?.marca || 'Zebra',
    modelo: report.equipo?.modelo || 'ZT411',
    dpi: report.equipo?.dpi || '203',
    noSerie: report.equipo?.noSerie || 'N/D',
    _sotex_meta: {
      tipoServicio: report.tipoServicio || 'campo',
      evidenciasFotos: report.evidenciasFotos || [],
      aceptadaPorTecnico: Boolean(report.aceptadaPorTecnico),
      fechaAceptada: report.fechaAceptada || null,
      tecnicoId: report.tecnicoId || null,
      clienteFirma: report.clienteFirma || null,
      tecnicoFirma: report.tecnicoFirma || null,
      contactoNombre: report.contactoNombre || '',
      serviciosRealizar: report.serviciosRealizar || [],
      tipoEquipoNombre: report.tipoEquipoNombre || '',
      fotoAntes: report.fotoAntes || null,
      fotoDespues: report.fotoDespues || null,
      danosDinamicos: report.danosDinamicos || {},
      fechaAgenda: report.fechaAgenda || null,
      savedAt: new Date().toISOString(),
    },
  };

  // Attempt 1: Full upsert with all top-level columns
  const fullPayload = {
    id: report.id,
    report_code: report.reportCode || 'SOT-REP-CLG-01',
    folio: report.folio,
    tipo_servicio: report.tipoServicio || 'campo',
    empresa: report.empresa,
    fecha: report.fecha,
    direccion: report.direccion || '',
    telefono: report.telefono || '',
    num_visita: report.numVisita || 1,
    equipo: equipoWithMeta,
    danos: report.danos || {},
    descripcion_danos: report.descripcionDanos || '',
    prueba_cabezal_resultado: report.pruebaCabezalResultado || '',
    prueba_cabezal_imagen: report.pruebaCabezalImagen || null,
    evidencias_fotos: report.evidenciasFotos || [],
    cliente_nombre: report.clienteNombre || '',
    cliente_email: report.clienteEmail || '',
    cliente_firma: report.clienteFirma || null,
    tecnico_nombre: report.tecnicoNombre || '',
    tecnico_firma: report.tecnicoFirma || null,
    tecnico_id: report.tecnicoId || null,
    aceptada_por_tecnico: Boolean(report.aceptadaPorTecnico),
    fecha_aceptada: report.fechaAceptada || null,
    status: report.status || 'En Revisión',
    observaciones_generales: report.observacionesGenerales || '',
    contacto_nombre: report.contactoNombre || '',
    servicios_realizar: report.serviciosRealizar || [],
    tipo_equipo_nombre: report.tipoEquipoNombre || '',
    foto_antes: report.fotoAntes || null,
    foto_despues: report.fotoDespues || null,
    danos_dinamicos: report.danosDinamicos || {},
    fecha_agenda: report.fechaAgenda || null,
  };

  try {
    // Attempt 1: Full upsert with all top-level columns
    const { error: fullError } = await supabase
      .from('service_reports')
      .upsert(fullPayload);

    if (!fullError) {
      return { success: true, mode: 'full' };
    }

    const isCheckConstraintError = (err: any) =>
      Boolean(
        err &&
        (err.code === '23514' ||
         err.message?.toLowerCase().includes('check constraint') ||
         err.message?.toLowerCase().includes('status_check') ||
         err.message?.toLowerCase().includes('violates check constraint'))
      );

    const isColumnError = (err: any) =>
      Boolean(
        err &&
        (err.code === 'PGRST204' ||
         err.message?.toLowerCase().includes('column') ||
         err.message?.toLowerCase().includes('schema cache'))
      );

    // If check constraint failed on full payload (e.g. status 'Agendado' not in remote check constraint yet)
    if (isCheckConstraintError(fullError)) {
      console.warn(
        'Supabase: Estatus no admitido por constraint remota (ej. Agendado). Usando compatibilidad con _sotex_meta:',
        fullError.message
      );
      const fullStatusCompatPayload = {
        ...fullPayload,
        status: 'En Revisión',
      };
      const { error: fullStatusError } = await supabase
        .from('service_reports')
        .upsert(fullStatusCompatPayload);

      if (!fullStatusError) {
        return { success: true, mode: 'fallback_jsonb' };
      }
    }

    // Attempt 2: Base payload without newly added columns, preserving full state in JSONB equipo._sotex_meta
    const basePayload = {
      id: report.id,
      report_code: report.reportCode || 'SOT-REP-CLG-01',
      folio: report.folio,
      tipo_servicio: report.tipoServicio || 'campo',
      empresa: report.empresa,
      fecha: report.fecha,
      direccion: report.direccion || '',
      telefono: report.telefono || '',
      num_visita: report.numVisita || 1,
      equipo: equipoWithMeta,
      danos: report.danos || {},
      descripcion_danos: report.descripcionDanos || '',
      prueba_cabezal_resultado: report.pruebaCabezalResultado || '',
      prueba_cabezal_imagen: report.pruebaCabezalImagen || null,
      evidencias_fotos: report.evidenciasFotos || [],
      cliente_nombre: report.clienteNombre || '',
      cliente_email: report.clienteEmail || '',
      cliente_firma: report.clienteFirma || null,
      tecnico_nombre: report.tecnicoNombre || '',
      tecnico_firma: report.tecnicoFirma || null,
      tecnico_id: report.tecnicoId || null,
      aceptada_por_tecnico: Boolean(report.aceptadaPorTecnico),
      fecha_aceptada: report.fechaAceptada || null,
      status: report.status || 'En Revisión',
      observaciones_generales: report.observacionesGenerales || '',
    };

    const { error: baseError } = await supabase
      .from('service_reports')
      .upsert(basePayload);

    if (!baseError) {
      return { success: true, mode: 'fallback_jsonb' };
    }

    // If basePayload failed due to status check constraint
    if (isCheckConstraintError(baseError)) {
      console.warn(
        'Supabase: Reintentando payload base con estatus compatible En Revisión:',
        baseError.message
      );
      const baseStatusCompatPayload = {
        ...basePayload,
        status: 'En Revisión',
      };
      const { error: baseStatusError } = await supabase
        .from('service_reports')
        .upsert(baseStatusCompatPayload);

      if (!baseStatusError) {
        return { success: true, mode: 'fallback_jsonb' };
      }
    }

    // Attempt 3: Ultra-compatible payload for earliest schema versions
    const ultraBasePayload = {
      id: report.id,
      report_code: report.reportCode || 'SOT-REP-CLG-01',
      folio: report.folio,
      empresa: report.empresa,
      fecha: report.fecha,
      direccion: report.direccion || '',
      telefono: report.telefono || '',
      num_visita: report.numVisita || 1,
      equipo: equipoWithMeta,
      danos: report.danos || {},
      descripcion_danos: report.descripcionDanos || '',
      prueba_cabezal_resultado: report.pruebaCabezalResultado || '',
      prueba_cabezal_imagen: report.pruebaCabezalImagen || null,
      cliente_nombre: report.clienteNombre || '',
      cliente_email: report.clienteEmail || '',
      cliente_firma: report.clienteFirma || null,
      tecnico_nombre: report.tecnicoNombre || '',
      tecnico_firma: report.tecnicoFirma || null,
      status: 'En Revisión',
      observaciones_generales: report.observacionesGenerales || '',
    };

    const { error: ultraError } = await supabase
      .from('service_reports')
      .upsert(ultraBasePayload);

    if (!ultraError) {
      return { success: true, mode: 'fallback_jsonb' };
    }

    console.warn('Nota al sincronizar reporte en Supabase:', ultraError.message);
    return { success: false, mode: 'fallback_jsonb', error: ultraError.message };
  } catch (err: any) {
    console.warn('Excepción al conectar con Supabase:', err);
    return { success: false, mode: 'full', error: err?.message || 'Error de conexión' };
  }
};

/**
 * Deletes a report from Supabase permanently by id and folio (de raíz).
 */
export const deleteReportFromSupabase = async (
  reportId: string,
  folio?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const cleanId = String(reportId || '').trim();
    const cleanFolio = String(folio || '').trim();

    // 1. Delete by primary ID
    if (cleanId) {
      await supabase.from('service_reports').delete().eq('id', cleanId);
      await supabase.from('service_reports').delete().ilike('id', cleanId);
    }

    // 2. Delete by Folio if provided
    if (cleanFolio) {
      await supabase.from('service_reports').delete().eq('folio', cleanFolio);
      await supabase.from('service_reports').delete().ilike('folio', cleanFolio);
    }

    // Also delete any matching system_notifications for this order
    if (cleanId) {
      await supabase.from('system_notifications').delete().eq('orden_id', cleanId);
    }
    if (cleanFolio) {
      await supabase.from('system_notifications').delete().eq('folio', cleanFolio);
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Nota al eliminar reporte en Supabase:', err);
    return { success: false, error: err?.message };
  }
};

/**
 * Fetches all reports from Supabase and normalizes them.
 */
export const fetchReportsFromSupabase = async (): Promise<ServiceReport[]> => {
  try {
    const { data, error } = await supabase
      .from('service_reports')
      .select('*')
      .order('fecha', { ascending: false });

    if (error || !data) {
      console.warn('Nota al consultar service_reports en Supabase:', error);
      return [];
    }

    return data.map(normalizeSupabaseReportRow);
  } catch (err) {
    console.warn('Excepción al consultar Supabase:', err);
    return [];
  }
};
