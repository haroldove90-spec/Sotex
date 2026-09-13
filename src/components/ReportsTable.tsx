import React, { useState, useMemo } from 'react';
import { ServiceReport, DamagedComponents } from '../types';
import {
  Search,
  Filter,
  Eye,
  FileText,
  FileSpreadsheet,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench,
  ChevronDown,
  DownloadCloud,
} from 'lucide-react';
import { generateServiceReportPDF } from '../utils/pdfExport';
import { exportReportsToExcel } from '../utils/excelExport';

interface ReportsTableProps {
  reports: ServiceReport[];
  onView: (report: ServiceReport) => void;
  onEdit: (report: ServiceReport) => void;
  onDelete: (id: string) => void;
  onNewReport: () => void;
}

export const ReportsTable: React.FC<ReportsTableProps> = ({
  reports,
  onView,
  onEdit,
  onDelete,
  onNewReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisit, setSelectedVisit] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDamage, setSelectedDamage] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter logic
  const filteredReports = useMemo(() => {
    if (!Array.isArray(reports)) return [];
    return reports.filter((rep) => {
      if (!rep) return false;
      // Search term
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        (rep.folio && rep.folio.toLowerCase().includes(searchLower)) ||
        (rep.empresa && rep.empresa.toLowerCase().includes(searchLower)) ||
        (rep.equipo?.marca && rep.equipo.marca.toLowerCase().includes(searchLower)) ||
        (rep.equipo?.modelo && rep.equipo.modelo.toLowerCase().includes(searchLower)) ||
        (rep.equipo?.noSerie && rep.equipo.noSerie.toLowerCase().includes(searchLower)) ||
        (rep.descripcionDanos && rep.descripcionDanos.toLowerCase().includes(searchLower)) ||
        (rep.tecnicoNombre && rep.tecnicoNombre.toLowerCase().includes(searchLower));

      // Visit filter
      const matchesVisit =
        selectedVisit === 'ALL' || rep.numVisita === Number(selectedVisit);

      // Status filter
      const matchesStatus =
        selectedStatus === 'ALL' || rep.status === selectedStatus;

      // Damage filter
      let matchesDamage = true;
      if (selectedDamage !== 'ALL') {
        const key = selectedDamage as keyof DamagedComponents;
        matchesDamage = Boolean(rep.danos && rep.danos[key]);
      }

      return matchesSearch && matchesVisit && matchesStatus && matchesDamage;
    });
  }, [reports, searchTerm, selectedVisit, selectedStatus, selectedDamage]);

  // Bulk actions
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredReports.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredReports.map((r) => r.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExportSelectedExcel = () => {
    const selected = reports.filter((r) => selectedIds.includes(r.id));
    if (selected.length === 0) return;
    exportReportsToExcel(selected, `Reportes_SOTEX_Seleccion_${selected.length}.xlsx`);
  };

  const getDamagedBadges = (danos?: DamagedComponents) => {
    if (!danos) return [];
    const active: { label: string; critical?: boolean }[] = [];
    if (danos.cabezal) active.push({ label: 'Cabezal', critical: true });
    if (danos.rodilloPrincipal) active.push({ label: 'Rodillo' });
    if (danos.display) active.push({ label: 'Display' });
    if (danos.sensorPapel) active.push({ label: 'Sensor Papel' });
    if (danos.sensorRibbon) active.push({ label: 'Sensor Ribbon' });
    if (danos.bandas) active.push({ label: 'Bandas' });
    if (danos.cutter) active.push({ label: 'Cutter' });
    if (danos.rebobinador) active.push({ label: 'Rebobinador' });
    if (danos.otro) active.push({ label: 'Otro' });
    return active;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Completado':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Pendiente Refacción':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'En Revisión':
        return 'bg-zinc-100 text-zinc-800 border-zinc-300';
      case 'Garantía':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Search & Filter Header Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Empresa, Folio, Serie, Marca, Técnico..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden text-slate-900 shadow-2xs"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Visit filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500">Visita:</span>
              <select
                value={selectedVisit}
                onChange={(e) => setSelectedVisit(e.target.value)}
                className="text-xs bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Todas</option>
                <option value="1">Visita 1</option>
                <option value="2">Visita 2</option>
                <option value="3">Visita 3</option>
                <option value="4">Visita 4</option>
              </select>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500">Estado:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="Completado">Completado</option>
                <option value="Pendiente Refacción">Pendiente Refacción</option>
                <option value="En Revisión">En Revisión</option>
                <option value="Garantía">Garantía</option>
              </select>
            </div>

            {/* Damage filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500">Falla:</span>
              <select
                value={selectedDamage}
                onChange={(e) => setSelectedDamage(e.target.value)}
                className="text-xs bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Cualquier daño</option>
                <option value="cabezal">Cabezal</option>
                <option value="rodilloPrincipal">Rodillo principal</option>
                <option value="sensorPapel">Sensor de papel</option>
                <option value="sensorRibbon">Sensor de ribbon</option>
                <option value="display">Display</option>
                <option value="bandas">Bandas</option>
                <option value="cutter">Cutter</option>
                <option value="rebobinador">Rebobinador</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            {(searchTerm || selectedVisit !== 'ALL' || selectedStatus !== 'ALL' || selectedDamage !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedVisit('ALL');
                  setSelectedStatus('ALL');
                  setSelectedDamage('ALL');
                }}
                className="text-xs text-slate-500 hover:text-[#D60000] underline px-1 py-1 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Multi-selection Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-[#212121] border border-neutral-800 rounded-lg px-3.5 py-2.5 flex items-center justify-between text-xs text-white shadow-sm">
            <span className="font-semibold text-neutral-200">
              {selectedIds.length} registro(s) seleccionado(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportSelectedExcel}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 text-white rounded font-semibold hover:bg-emerald-600 transition-colors shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Exportar Selección a Excel
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-neutral-400 hover:text-white underline px-2 transition-colors"
              >
                Deseleccionar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Component */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead>
            <tr className="bg-slate-100/90 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={
                    filteredReports.length > 0 &&
                    selectedIds.length === filteredReports.length
                  }
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-[#D60000] focus:ring-[#D60000]"
                />
              </th>
              <th className="py-3 px-3">Folio / Fecha</th>
              <th className="py-3 px-3">Empresa / Contacto</th>
              <th className="py-3 px-2 text-center">Visita</th>
              <th className="py-3 px-3">Equipo e Impresora</th>
              <th className="py-3 px-3">Daños Detectados</th>
              <th className="py-3 px-3">Estado</th>
              <th className="py-3 px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-600">No se encontraron reportes</p>
                    <p className="text-xs text-slate-400">
                      Intente modificar los términos de búsqueda o registre un nuevo reporte de servicio técnico.
                    </p>
                    <button
                      onClick={onNewReport}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-[#D60000] text-white hover:bg-[#b50000] shadow-sm transition-all"
                    >
                      Crear Nuevo Reporte
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredReports.map((rep) => {
                const damagedBadges = getDamagedBadges(rep.danos);
                const isSelected = selectedIds.includes(rep.id);

                return (
                  <tr
                    key={rep.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-red-50/40' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(rep.id)}
                        className="rounded border-slate-300 text-[#D60000] focus:ring-[#D60000]"
                      />
                    </td>

                    {/* Folio & Date */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                        {rep.folio}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {rep.fecha}
                      </div>
                    </td>

                    {/* Empresa */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 truncate max-w-[200px]">
                        {rep.empresa}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                        {rep.direccion || rep.telefono || 'Sin dirección registrada'}
                      </div>
                    </td>

                    {/* Visita */}
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-md font-bold text-xs bg-[#212121] text-white shadow-2xs">
                        {rep.numVisita ?? 1}
                      </span>
                    </td>

                    {/* Equipo */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800 flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{rep.equipo?.marca || 'Equipo'}</span>
                        <span>{rep.equipo?.modelo || ''}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                          {rep.equipo?.dpi || '203'} DPI
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        S/N: {rep.equipo?.noSerie || 'N/D'}
                      </div>
                    </td>

                    {/* Daños */}
                    <td className="py-3 px-3">
                      {damagedBadges.length === 0 ? (
                        <span className="text-[11px] text-emerald-700 font-medium inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Sin daños reportados
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {damagedBadges.map((badge, idx) => (
                            <span
                              key={idx}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                                badge.critical
                                  ? 'bg-red-50 text-red-700 border-red-200 font-bold'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {badge.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getStatusBadgeClass(
                          rep.status
                        )}`}
                      >
                        {rep.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onView(rep)}
                          title="Ver documento oficial SOT-REP-CLG-01"
                          className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => generateServiceReportPDF(rep, true)}
                          title="Descargar PDF formato oficial"
                          className="p-1.5 rounded text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => exportReportsToExcel([rep], `Reporte_${rep.folio}.xlsx`)}
                          title="Exportar a Excel"
                          className="p-1.5 rounded text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEdit(rep)}
                          title="Editar reporte"
                          className="p-1.5 rounded text-slate-600 hover:text-[#D60000] hover:bg-red-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDelete(rep.id)}
                          title="Eliminar registro"
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer / Summary */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500">
        <div>
          Mostrando <span className="font-bold text-slate-800">{filteredReports.length}</span> de{' '}
          <span className="font-bold text-slate-800">{reports.length}</span> reportes totales
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-600 inline-block" /> Falla crítica en cabezal
          </span>
          <span className="text-slate-400">|</span>
          <span className="font-mono text-slate-600 font-medium">SOTEX Soluciones Tecnológicas</span>
        </div>
      </div>
    </div>
  );
};
