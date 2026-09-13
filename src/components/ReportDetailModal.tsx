import React from 'react';
import { ServiceReport } from '../types';
import { X, FileText, FileSpreadsheet, Edit, Printer } from 'lucide-react';
import { generateServiceReportPDF } from '../utils/pdfExport';
import { exportReportsToExcel } from '../utils/excelExport';

interface ReportDetailModalProps {
  report: ServiceReport | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (report: ServiceReport) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !report) return null;

  const handleDownloadPDF = () => {
    generateServiceReportPDF(report, true);
  };

  const handleExportExcel = () => {
    exportReportsToExcel([report], `Reporte_${report.folio}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-6 overflow-hidden border border-slate-300 flex flex-col max-h-[94vh]">
        {/* Modal Action Header */}
        <div className="bg-[#212121] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono bg-[#D60000] text-white px-2 py-0.5 rounded font-bold shadow-2xs">
              {report.folio}
            </span>
            <h2 className="text-sm font-semibold text-neutral-100">
              Vista Previa de Formato Físico Oficial
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-[#D60000] hover:bg-[#b50000] text-white transition-colors shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              Descargar PDF
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-emerald-700 hover:bg-emerald-600 text-white transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Excel
            </button>

            <button
              onClick={() => onEdit(report)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors border border-neutral-700"
            >
              <Edit className="w-3.5 h-3.5" />
              Editar
            </button>

            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Document Preview Container */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-200/70 flex justify-center">
          {/* Printable Sheet */}
          <div className="bg-white text-slate-900 w-full max-w-[800px] p-6 sm:p-10 shadow-lg border border-slate-300 font-sans relative">
            {/* Watermark / status tag in preview */}
            <div className="absolute top-6 right-6 opacity-20 pointer-events-none select-none">
              <span className="text-5xl font-black uppercase text-slate-400">
                {report.status}
              </span>
            </div>

            {/* Document Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
              {/* Logo SOTEX */}
              <div className="flex items-center gap-2">
                <img
                  src="https://sotex.com.mx/wp-content/uploads/2023/02/cropped-PNG-1-scaled-300x114.png"
                  alt="SOTEX Soluciones Tecnológicas"
                  className="h-10 sm:h-12 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Title & Code */}
              <div className="text-right">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase leading-tight">
                  REPORTE DE SERVICIO CLIENTE
                </h1>
                <p className="text-xs font-bold text-slate-700 font-mono mt-0.5">
                  {report.reportCode || 'SOT-REP-CLG-01'}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Folio: <span className="font-bold text-slate-800">{report.folio}</span>
                </p>
              </div>
            </div>

            {/* General Info Lines */}
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-8 flex items-baseline">
                  <span className="font-bold text-slate-800 w-20">Empresa:</span>
                  <span className="flex-1 border-b border-slate-400 font-medium text-slate-900 pb-0.5 px-2">
                    {report.empresa}
                  </span>
                </div>
                <div className="sm:col-span-4 flex items-baseline">
                  <span className="font-bold text-slate-800 w-16">Fecha:</span>
                  <span className="flex-1 border-b border-slate-400 font-medium text-slate-900 pb-0.5 px-2">
                    {report.fecha}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-8 flex items-baseline">
                  <span className="font-bold text-slate-800 w-20">Dirección:</span>
                  <span className="flex-1 border-b border-slate-400 font-medium text-slate-900 pb-0.5 px-2 truncate">
                    {report.direccion || '-'}
                  </span>
                </div>
                <div className="sm:col-span-4 flex items-baseline">
                  <span className="font-bold text-slate-800 w-16">Tel:</span>
                  <span className="flex-1 border-b border-slate-400 font-medium text-slate-900 pb-0.5 px-2">
                    {report.telefono || '-'}
                  </span>
                </div>
              </div>

              {/* Num. de visita */}
              <div className="flex items-center gap-3 pt-1">
                <span className="font-bold text-slate-800">Num. de visita:</span>
                <div className="flex border border-slate-400 divide-x divide-slate-400">
                  {([1, 2, 3, 4] as const).map((num) => (
                    <div
                      key={num}
                      className={`w-10 sm:w-12 py-1 text-center font-bold text-xs ${
                        report.numVisita === num
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-600'
                      }`}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Equipment Table */}
            <div className="mt-4 border border-slate-900">
              <div className="grid grid-cols-5 bg-slate-900 text-white text-[11px] font-bold text-center py-1 divide-x divide-slate-700">
                <div>Equipo</div>
                <div>Marca</div>
                <div>Modelo</div>
                <div>DPI</div>
                <div>No. de serie</div>
              </div>
              <div className="grid grid-cols-5 text-xs text-center py-1.5 divide-x divide-slate-300 font-medium bg-slate-50">
                <div className="px-1 truncate">{report.equipo?.equipo || 'Impresora'}</div>
                <div className="px-1 truncate">{report.equipo?.marca || 'N/A'}</div>
                <div className="px-1 truncate">{report.equipo?.modelo || '-'}</div>
                <div className="px-1">{report.equipo?.dpi || '203'}</div>
                <div className="px-1 font-mono">{report.equipo?.noSerie || '-'}</div>
              </div>
            </div>

            {/* Daños detectados durante revisión */}
            <div className="mt-4 border border-slate-900">
              <div className="bg-slate-900 text-white text-xs font-bold text-center py-1">
                Daños detectados durante revisión
              </div>

              {/* 3 Columns Checklist */}
              <div className="p-3 grid grid-cols-3 gap-2 text-xs border-b border-slate-300 bg-white">
                {/* Col 1 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pr-2">
                    <span>Cabezal</span>
                    <span className="w-4 h-4 border border-slate-600 inline-flex items-center justify-center font-bold text-red-600 text-xs">
                      {report.danos?.cabezal ? 'X' : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pr-2">
                    <span>Rodillo principal</span>
                    <span className="w-4 h-4 border border-slate-600 inline-flex items-center justify-center font-bold text-red-600 text-xs">
                      {report.danos?.rodilloPrincipal ? 'X' : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pr-2">
                    <span>Display</span>
                    <span className="w-4 h-4 border border-slate-600 inline-flex items-center justify-center font-bold text-red-600 text-xs">
                      {report.danos?.display ? 'X' : ''}
                    </span>
                  </div>
                </div>

                {/* Col 2 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pr-2">
                    <span>Sensor de papel</span>
                    <span className="w-4 h-4 border border-slate-600 inline-flex items-center justify-center font-bold text-red-600 text-xs">
                      {report.danos?.sensorPapel ? 'X' : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pr-2">
                    <span>Sensor de ribbon</span>
                    <span className="w-4 h-4 border border-slate-600 inline-flex items-center justify-center font-bold text-red-600 text-xs">
                      {report.danos?.sensorRibbon ? 'X' : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pr-2">
                    <span>Bandas</span>
                    <span className="w-4 h-4 border border-slate-600 inline-flex items-center justify-center font-bold text-red-600 text-xs">
                      {report.danos?.bandas ? 'X' : ''}
                    </span>
                  </div>
                </div>

                {/* Col 3 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pr-2">
                    <span>Cutter</span>
                    <span className="w-4 h-4 border border-slate-600 inline-flex items-center justify-center font-bold text-red-600 text-xs">
                      {report.danos?.cutter ? 'X' : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pr-2">
                    <span>Rebobinador</span>
                    <span className="w-4 h-4 border border-slate-600 inline-flex items-center justify-center font-bold text-red-600 text-xs">
                      {report.danos?.rebobinador ? 'X' : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pr-2">
                    <span>Otro</span>
                    <span className="w-4 h-4 border border-slate-600 inline-flex items-center justify-center font-bold text-red-600 text-xs">
                      {report.danos?.otro ? 'X' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Describa: */}
              <div className="p-3 bg-white text-xs">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-slate-900 w-16">Describa:</span>
                  <div className="flex-1 space-y-1 border-b border-slate-300 pb-1">
                    <p className="text-slate-800 leading-relaxed font-normal">
                      {report.descripcionDanos || 'Sin descripción adicional registrada.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Prueba de impresión del cabezal */}
            <div className="mt-4 border border-slate-900">
              <div className="bg-slate-900 text-white text-xs font-bold text-center py-1">
                Prueba de impresión del cabezal
              </div>

              <div className="p-4 bg-white min-h-[140px] flex flex-col items-center justify-center">
                {report.pruebaCabezalImagen ? (
                  <div className="w-full flex flex-col items-center">
                    <img
                      src={report.pruebaCabezalImagen}
                      alt="Prueba de impresión de cabezal"
                      className="max-h-40 object-contain rounded border border-slate-300"
                    />
                    <p className="text-[11px] text-slate-600 mt-2 font-medium">
                      {report.pruebaCabezalResultado}
                    </p>
                  </div>
                ) : (
                  <div className="w-full border border-dashed border-slate-300 p-4 rounded bg-slate-50 text-center">
                    <div className="w-full h-10 border-b border-slate-300 flex items-center justify-around opacity-40 mb-2">
                      <div className="w-2 h-6 bg-slate-600" />
                      <div className="w-1 h-6 bg-slate-600" />
                      <div className="w-3 h-6 bg-slate-600" />
                      <div className="w-1 h-6 bg-slate-600" />
                      <div className="w-2 h-6 bg-slate-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      {report.pruebaCabezalResultado || 'Prueba de densidad y líneas térmicas realizada en campo.'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 italic">
                      Comprobante gráfico de prueba de cabezal térmico
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Contact URLs */}
            <div className="mt-6 flex items-center justify-between text-xs text-neutral-700 font-medium px-2">
              <span>www.sotex.com.mx</span>
              <span>soporteqdl@sotex.com.mx</span>
            </div>

            {/* Signatures */}
            <div className="mt-8 grid grid-cols-2 gap-8 pt-4">
              {/* Cliente */}
              <div className="text-center flex flex-col items-center">
                <div className="h-16 flex items-center justify-center mb-1">
                  {report.clienteFirma ? (
                    <img
                      src={report.clienteFirma}
                      alt="Firma cliente"
                      className="max-h-14 object-contain"
                    />
                  ) : (
                    <span className="text-[11px] text-slate-300 italic">Firma registrada</span>
                  )}
                </div>
                <div className="w-full border-t border-slate-800 pt-1">
                  <p className="text-xs font-bold text-slate-900">
                    Nombre, firma, correo (Cliente)
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {report.clienteNombre || 'Cliente SOTEX'} {report.clienteEmail ? `• ${report.clienteEmail}` : ''}
                  </p>
                </div>
              </div>

              {/* Ingeniero SOTEX */}
              <div className="text-center flex flex-col items-center">
                <div className="h-16 flex items-center justify-center mb-1">
                  {report.tecnicoFirma ? (
                    <img
                      src={report.tecnicoFirma}
                      alt="Firma ingeniero"
                      className="max-h-14 object-contain"
                    />
                  ) : (
                    <span className="text-[11px] text-slate-300 italic">Firma registrada</span>
                  )}
                </div>
                <div className="w-full border-t border-slate-800 pt-1">
                  <p className="text-xs font-bold text-slate-900">
                    Nombre y firma (Ing. SOTEX)
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {report.tecnicoNombre || 'Ing. de Soporte SOTEX'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
