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
    tecnicoNombre: row?.tecnico_nombre || row?.tecnicoNombre || 'Tec. Carlos Mendoza',
    tecnicoFirma,
    tecnicoId,
    aceptadaPorTecnico,
    fechaAceptada,
    status: (row?.status || 'En Revisión') as ServiceStatus,
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
  };

  try {
    const { error: fullError } = await supabase
      .from('service_reports')
      .upsert(fullPayload);

    if (!fullError) {
      return { success: true, mode: 'full' };
    }

    // If error is about a missing column (PGRST204), try fallback with base columns
    const isColumnError =
      fullError.code === 'PGRST204' ||
      fullError.message?.toLowerCase().includes('column') ||
      fullError.message?.toLowerCase().includes('schema cache');

    if (isColumnError) {
      console.warn(
        'Supabase: Columnas avanzadas no detectadas en BD remota. Usando modo de compatibilidad JSONB:',
        fullError.message
      );

      const basePayload = {
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
        status: report.status || 'En Revisión',
        observaciones_generales: report.observacionesGenerales || '',
      };

      const { error: baseError } = await supabase
        .from('service_reports')
        .upsert(basePayload);

      if (!baseError) {
        return { success: true, mode: 'fallback_jsonb' };
      }

      console.error('Error al guardar en Supabase (modo compatibilidad):', baseError);
      return { success: false, mode: 'fallback_jsonb', error: baseError.message };
    }

    console.error('Error al guardar en Supabase:', fullError);
    return { success: false, mode: 'full', error: fullError.message };
  } catch (err: any) {
    console.error('Excepción de red al conectar con Supabase:', err);
    return { success: false, mode: 'full', error: err?.message || 'Error de conexión' };
  }
};

/**
 * Deletes a report from Supabase permanently by id and folio.
 */
export const deleteReportFromSupabase = async (
  reportId: string,
  folio?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error: err1 } = await supabase
      .from('service_reports')
      .delete()
      .eq('id', reportId);

    if (folio) {
      await supabase.from('service_reports').delete().eq('folio', folio);
    }

    if (err1) {
      return { success: false, error: err1.message };
    }
    return { success: true };
  } catch (err: any) {
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
