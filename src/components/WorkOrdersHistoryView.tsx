import React, { useState, useMemo } from 'react';
import { ServiceReport, UserRole, ServiceStatus, ServiceLocation } from '../types';
import { generateServiceReportPDF } from '../utils/pdfExport';
import {
  History,
  Search,
  Filter,
  FileText,
  Download,
  Eye,
  Edit2,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  Building,
  MapPin,
  User,
  Calendar,
  Sparkles,
  ChevronDown,
  Trash2,
} from 'lucide-react';

interface WorkOrdersHistoryViewProps {
  reports: ServiceReport[];
  currentRole: UserRole;
  currentUserName: string;
  onViewReport: (report: ServiceReport) => void;
  onEditReport: (report: ServiceReport) => void;
  onDeleteReport?: (report: ServiceReport) => void;
  onStatusChange?: (report: ServiceReport, newStatus: ServiceStatus) => void;
  onAcceptOrder?: (folio: string) => void;
  onNewReport: () => void;
}

export const WorkOrdersHistoryView: React.FC<WorkOrdersHistoryViewProps> = ({
  reports,
  currentRole,
  currentUserName,
  onViewReport,
  onEditReport,
  onDeleteReport,
  onStatusChange,
  onAcceptOrder,
  onNewReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [acceptanceFilter, setAcceptanceFilter] = useState<string>('ALL');
  const [selectedTech, setSelectedTech] = useState<string>('ALL');

  // Extract distinct technician names for admin filter dropdown
  const technicianList = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.tecnicoNombre && r.tecnicoNombre.trim()) {
        set.add(r.tecnicoNombre.trim());
      }
    });
    return Array.from(set).sort();
  }, [reports]);

  // Filter reports based on role:
  // Admin sees all by default, can filter by technician
  // Technician sees their own orders by default
  const baseReports = useMemo(() => {
    if (currentRole === 'admin') {
      if (selectedTech === 'ALL') return reports;
      return reports.filter(
        (r) => r.tecnicoNombre?.toLowerCase() === selectedTech.toLowerCase()
      );
    } else {
      // Role is technician: match their name or if empty/demo
      return reports.filter((r) => {
        if (!r.tecnicoNombre) return true;
        const techLower = r.tecnicoNombre.toLowerCase();
        const userLower = currentUserName.toLowerCase();
        return techLower.includes(userLower) || userLower.includes(techLower) || techLower.includes('carlos');
      });
    }
  }, [reports, currentRole, currentUserName, selectedTech]);

  // Smart search and faceted filters
  const filteredReports = useMemo(() => {
    return baseReports.filter((r) => {
      // 1. Smart multi-field search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesFolio = r.folio?.toLowerCase().includes(term);
        const matchesClient = r.empresa?.toLowerCase().includes(term);
        const matchesTech = r.tecnicoNombre?.toLowerCase().includes(term);
        const matchesEquipment =
          r.equipo?.equipo?.toLowerCase().includes(term) ||
          r.equipo?.marca?.toLowerCase().includes(term) ||
          r.equipo?.modelo?.toLowerCase().includes(term) ||
          r.equipo?.noSerie?.toLowerCase().includes(term);
        const matchesDesc = r.descripcionDanos?.toLowerCase().includes(term);
        const matchesCode = r.reportCode?.toLowerCase().includes(term);

        if (
          !matchesFolio &&
          !matchesClient &&
          !matchesTech &&
          !matchesEquipment &&
          !matchesDesc &&
          !matchesCode
        ) {
          return false;
        }
      }

      // 2. Status filter
      if (statusFilter !== 'ALL' && r.status !== statusFilter) {
        return false;
      }

      // 3. Location filter ('campo' vs 'sotex')
      if (locationFilter !== 'ALL') {
        const loc = r.tipoServicio || 'campo';
        if (loc !== locationFilter) return false;
      }

      // 4. Acceptance filter
      if (acceptanceFilter === 'ACEPTADA' && !r.aceptadaPorTecnico) return false;
      if (acceptanceFilter === 'PENDIENTE' && r.aceptadaPorTecnico) return false;

      return true;
    });
  }, [baseReports, searchTerm, statusFilter, locationFilter, acceptanceFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    return {
      total: baseReports.length,
      agendadas: baseReports.filter((r) => r.status === 'Agendado').length,
      enRevision: baseReports.filter((r) => r.status === 'En Revisión').length,
      completadas: baseReports.filter((r) => r.status === 'Completado').length,
      pendientes: baseReports.filter((r) => r.status === 'Pendiente Refacción').length,
      garantia: baseReports.filter((r) => r.status === 'Garantía').length,
      enCampo: baseReports.filter((r) => (r.tipoServicio || 'campo') === 'campo').length,
      enSotex: baseReports.filter((r) => r.tipoServicio === 'sotex').length,
    };
  }, [baseReports]);

  const handleExportSinglePDF = (report: ServiceReport) => {
    generateServiceReportPDF(report, true);
  };

  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'Agendado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <Calendar className="w-3 h-3 text-purple-600" />
            Agendado
          </span>
        );
      case 'En Revisión':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            En Revisión
          </span>
        );
      case 'Completado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Completado
          </span>
        );
      case 'Pendiente Refacción':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
            <Wrench className="w-3 h-3 text-rose-600" />
            Pendiente Refacción
          </span>
        );
      case 'Garantía':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-300">
            <AlertTriangle className="w-3 h-3 text-purple-600" />
            Garantía
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-[#D60000]" />
            {currentRole === 'admin'
              ? 'Historial General de Órdenes de Trabajo (Todos los Técnicos)'
              : 'Mi Historial de Órdenes de Trabajo'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentRole === 'admin'
              ? 'Consulta inteligente con filtros avanzados, estatus en tiempo real y descarga individual de cada orden en PDF.'
              : `Historial de servicios realizados y asignados a ${currentUserName}. Descarga tus reportes oficiales en PDF.`}
          </p>
        </div>

        <button
          onClick={onNewReport}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#D60000] hover:bg-[#b50000] text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <FileText className="w-4 h-4" />
          <span>Nueva Orden de Trabajo</span>
        </button>
      </div>

      {/* Quick Summary Pill Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-medium">Total Órdenes</span>
          <span className="text-lg font-black text-slate-800">{metrics.total}</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-purple-200 bg-purple-50/50 shadow-2xs">
          <span className="text-[11px] text-purple-700 block font-medium flex items-center gap-1">
            <Calendar className="w-3 h-3 text-purple-600" /> Agendadas
          </span>
          <span className="text-lg font-black text-purple-900">{metrics.agendadas}</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-amber-200 bg-amber-50/40 shadow-2xs">
          <span className="text-[11px] text-amber-700 block font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" /> 1. En Revisión
          </span>
          <span className="text-lg font-black text-amber-800">{metrics.enRevision}</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-rose-200 bg-rose-50/40 shadow-2xs">
          <span className="text-[11px] text-rose-700 block font-medium flex items-center gap-1">
            <Wrench className="w-3 h-3 text-rose-600" /> 2. Pend. Refacción
          </span>
          <span className="text-lg font-black text-rose-800">{metrics.pendientes}</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-blue-200 bg-blue-50/40 shadow-2xs">
          <span className="text-[11px] text-blue-700 block font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-blue-600" /> 3. Garantía
          </span>
          <span className="text-lg font-black text-blue-800">{metrics.garantia}</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-2xs">
          <span className="text-[11px] text-emerald-700 block font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 4. Completadas
          </span>
          <span className="text-lg font-black text-emerald-800">{metrics.completadas}</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 shadow-2xs">
          <span className="text-[11px] text-indigo-700 block font-medium flex items-center gap-1">
            <Building className="w-3 h-3 text-indigo-600" /> En Taller Sotex
          </span>
          <span className="text-lg font-black text-indigo-800">{metrics.enSotex}</span>
        </div>
      </div>

      {/* Smart Search and Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Main Smart Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscador Inteligente: escribe Folio (ej. SOT-2026-001), Cliente, Técnico, Modelo (ZT411), Serie..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden text-slate-900 shadow-inner"
          />
        </div>

        {/* Faceted Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-slate-500 font-semibold text-[11px]">Estatus:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Todos los estatus</option>
              <option value="Agendado">📅 Agendado</option>
              <option value="En Revisión">1. En Revisión</option>
              <option value="Pendiente Refacción">2. Pendiente Refacción</option>
              <option value="Garantía">3. Garantía</option>
              <option value="Completado">4. Completado</option>
            </select>
          </div>

          {/* Service Location Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-slate-500 font-semibold text-[11px]">Lugar:</span>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Campo y Sotex</option>
              <option value="campo">En Campo (Sitio Cliente)</option>
              <option value="sotex">En Taller Sotex</option>
            </select>
          </div>

          {/* Acceptance Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-slate-500 font-semibold text-[11px]">Aceptación:</span>
            <select
              value={acceptanceFilter}
              onChange={(e) => setAcceptanceFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Todas</option>
              <option value="ACEPTADA">Aceptadas por Técnico</option>
              <option value="PENDIENTE">Pendientes de Aceptar</option>
            </select>
          </div>

          {/* If Admin: Technician Filter */}
          {currentRole === 'admin' && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-slate-500 font-semibold text-[11px]">Técnico:</span>
              <select
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer max-w-[160px] truncate"
              >
                <option value="ALL">Todos los técnicos</option>
                {technicianList.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(searchTerm ||
            statusFilter !== 'ALL' ||
            locationFilter !== 'ALL' ||
            acceptanceFilter !== 'ALL' ||
            selectedTech !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setLocationFilter('ALL');
                setAcceptanceFilter('ALL');
                setSelectedTech('ALL');
              }}
              className="text-xs text-red-600 hover:text-red-700 font-semibold underline px-2 cursor-pointer"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Results Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No se encontraron órdenes de trabajo</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Prueba cambiando los términos del buscador inteligente o restableciendo los filtros de
              estatus y técnico.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Folio / Formato</th>
                  <th className="py-3 px-4">Empresa / Cliente</th>
                  <th className="py-3 px-4">Equipo &amp; Serie</th>
                  <th className="py-3 px-4">Técnico Asignado</th>
                  <th className="py-3 px-4">Lugar</th>
                  <th className="py-3 px-4">Estatus</th>
                  <th className="py-3 px-4 text-center">Aceptada</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => {
                  const isAccepted = Boolean(report.aceptadaPorTecnico);
                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => onViewReport(report)}
                    >
                      {/* Folio & Code */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 group-hover:text-[#D60000] transition-colors">
                          {report.folio}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {report.reportCode || 'SOT-REP-CLG-01'}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {report.fecha}
                        </div>
                      </td>

                      {/* Empresa */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 line-clamp-1">
                          {report.empresa}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {report.contactoNombre ? `Contacto: ${report.contactoNombre}` : report.clienteNombre || 'Contacto en sitio'}
                        </div>
                      </td>

                      {/* Equipment */}
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-semibold line-clamp-1">
                          {report.equipo?.marca} {report.equipo?.modelo}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500">
                          S/N: {report.equipo?.noSerie || 'N/D'}
                        </div>
                      </td>

                      {/* Técnico */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{report.tecnicoNombre || 'Sin asignar'}</span>
                        </div>
                      </td>

                      {/* Lugar */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {report.tipoServicio === 'sotex' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Building className="w-3 h-3" />
                            En Sotex
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <MapPin className="w-3 h-3" />
                            En Campo
                          </span>
                        )}
                      </td>

                      {/* Estatus */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(report.status)}
                          {report.status === 'Agendado' && report.fechaAgenda && (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              📅 Para: {report.fechaAgenda}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Aceptada status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isAccepted ? (
                          <span
                            title={`Aceptada el ${report.fechaAceptada || ''}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Aceptada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3 text-amber-500" />
                            Sin aceptar
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Export single PDF */}
                          <button
                            onClick={() => handleExportSinglePDF(report)}
                            title="Exportar esta orden en PDF Oficial"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-[#D60000] text-white text-[11px] font-bold transition-colors shadow-2xs cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>

                          {/* Quick Accept button for technician if not accepted yet */}
                          {currentRole === 'tecnico' && !isAccepted && onAcceptOrder && (
                            <button
                              onClick={() => onAcceptOrder(report.folio)}
                              title="Aceptar esta orden de trabajo"
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Aceptar
                            </button>
                          )}

                          {/* View Detail */}
                          <button
                            onClick={() => onViewReport(report)}
                            title="Ver detalle del reporte"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => onEditReport(report)}
                            title="Editar orden"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#D60000] hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete from system and Supabase */}
                          {onDeleteReport && (
                            <button
                              onClick={() => onDeleteReport(report)}
                              title="Borrar orden de raíz del sistema y de Supabase"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
