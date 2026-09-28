import React, { useState } from 'react';
import { ServiceReport, UserRole } from '../types';
import {
  X,
  FileText,
  FileSpreadsheet,
  Edit,
  Printer,
  Trash2,
  CheckCircle2,
  Clock,
  MapPin,
  Building,
  Camera,
  Download,
} from 'lucide-react';
import { generateServiceReportPDF } from '../utils/pdfExport';
import { exportReportsToExcel } from '../utils/excelExport';

interface ReportDetailModalProps {
  report: ServiceReport | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (report: ServiceReport) => void;
  onDelete?: (report: ServiceReport) => void;
  onAccept?: (folio: string) => void;
  currentRole?: UserRole;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onAccept,
  currentRole = 'admin',
}) => {
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  if (!isOpen || !report) return null;

  const handleDownloadPDF = () => {
    generateServiceReportPDF(report, true);
  };

  const handleExportExcel = () => {
    exportReportsToExcel([report], `Reporte_${report.folio}.xlsx`);
  };

  const isAccepted = Boolean(report.aceptadaPorTecnico);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-6 overflow-hidden border border-slate-300 flex flex-col max-h-[94vh]">
        {/* Modal Action Header */}
        <div className="bg-[#212121] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-mono bg-[#D60000] text-white px-2.5 py-0.5 rounded-md font-bold shadow-2xs">
              {report.folio}
            </span>
            <span className="text-xs text-neutral-300 font-mono">
              {report.reportCode || 'SOT-REP-CLG-01'}
            </span>
            {report.tipoServicio === 'sotex' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-700/50">
                <Building className="w-3 h-3" /> En Taller Sotex
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/50">
                <MapPin className="w-3 h-3" /> En Campo
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentRole === 'tecnico' && !isAccepted && onAccept && (
              <button
                type="button"
                onClick={() => onAccept(report.folio)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aceptar Orden</span>
              </button>
            )}

            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#D60000] hover:bg-[#b50000] text-white transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white transition-colors shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={() => onEdit(report)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors border border-neutral-700 cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(report)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-2xs"
                title="Borrar de raíz este reporte"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Borrar</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Document Preview Container */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-200/70 flex justify-center">
          {/* Printable Sheet */}
          <div className="bg-white text-slate-900 w-full max-w-[800px] p-6 sm:p-10 shadow-lg border border-slate-300 font-sans relative rounded-lg">
            {/* Acceptance and Status Header Badge */}
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Estado:</span>
                <span className="font-bold text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800">
                  {report.status}
                </span>
                {report.tipoServicio === 'sotex' ? (
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Servicio en Taller SOTEX
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Servicio en Campo
                  </span>
                )}
              </div>

              <div>
                {isAccepted ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Orden Aceptada por el Técnico
                    {report.fechaAceptada && (
                      <span className="font-normal text-slate-500">
                        ({new Date(report.fechaAceptada).toLocaleDateString()})
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Pendiente de confirmación por el técnico
                  </span>
                )}
              </div>
            </div>

            {/* Document Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <img
                  src="https://sotex.com.mx/wp-content/uploads/2023/02/cropped-PNG-1-scaled-300x114.png"
                  alt="SOTEX Soluciones Tecnológicas"
                  className="h-10 sm:h-12 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

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

              <div className="p-3 grid grid-cols-3 gap-2 text-xs border-b border-slate-300 bg-white">
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
                Prueba de impresión del cabezal térmico
              </div>

              <div className="p-4 bg-white min-h-[120px] flex flex-col items-center justify-center">
                {report.pruebaCabezalImagen ? (
                  <div className="w-full flex flex-col items-center">
                    <img
                      src={report.pruebaCabezalImagen}
                      alt="Prueba de impresión de cabezal"
                      className="max-h-40 object-contain rounded border border-slate-300 cursor-pointer"
                      onClick={() => setSelectedImageModal(report.pruebaCabezalImagen!)}
                    />
                    <p className="text-[11px] text-slate-600 mt-2 font-medium">
                      {report.pruebaCabezalResultado}
                    </p>
                  </div>
                ) : (
                  <div className="w-full border border-dashed border-slate-300 p-4 rounded bg-slate-50 text-center">
                    <p className="text-xs font-bold text-slate-700">
                      {report.pruebaCabezalResultado || 'Prueba de densidad y líneas térmicas realizada satisfactoriamente.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Evidencias Fotográficas Adjuntas (si existen) */}
            {report.evidenciasFotos && report.evidenciasFotos.length > 0 && (
              <div className="mt-4 border border-slate-900">
                <div className="bg-slate-900 text-white text-xs font-bold text-center py-1 flex items-center justify-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  Evidencias Fotográficas de la Orden ({report.evidenciasFotos.length})
                </div>
                <div className="p-3 bg-slate-50 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {report.evidenciasFotos.map((imgUrl, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedImageModal(imgUrl)}
                      className="aspect-square rounded-lg border border-slate-300 bg-white overflow-hidden shadow-2xs hover:ring-2 hover:ring-[#D60000] cursor-pointer transition-all flex items-center justify-center"
                    >
                      <img
                        src={imgUrl}
                        alt={`Evidencia ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

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

      {/* Image Zoom Modal */}
      {selectedImageModal && (
        <div
          onClick={() => setSelectedImageModal(null)}
          className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer"
        >
          <div className="max-w-2xl max-h-[85vh] relative">
            <img
              src={selectedImageModal}
              alt="Evidencia ampliada"
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
