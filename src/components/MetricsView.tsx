import React, { useState } from 'react';
import { ServiceReport } from '../types';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Clock,
  Printer,
  ShieldAlert,
  Layers,
  Calendar,
  Filter,
} from 'lucide-react';

interface MetricsViewProps {
  reports: ServiceReport[];
  onSelectReport?: (report: ServiceReport) => void;
  onNavigateToReports?: () => void;
}

export const MetricsView: React.FC<MetricsViewProps> = ({
  reports,
  onSelectReport,
  onNavigateToReports,
}) => {
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('ALL');

  const filteredReports = reports.filter((r) => {
    if (selectedBrandFilter !== 'ALL' && r.equipo.marca !== selectedBrandFilter) {
      return false;
    }
    return true;
  });

  const total = filteredReports.length;
  const completados = filteredReports.filter((r) => r.status === 'Completado').length;
  const pendientesRefaccion = filteredReports.filter((r) => r.status === 'Pendiente Refacción').length;
  const enRevision = filteredReports.filter((r) => r.status === 'En Revisión').length;
  const garantia = filteredReports.filter((r) => r.status === 'Garantía').length;

  // Damaged components stats
  const cabezalDamaged = filteredReports.filter((r) => r.danos?.cabezal).length;
  const rodilloDamaged = filteredReports.filter((r) => r.danos?.rodilloPrincipal).length;
  const sensorPapelDamaged = filteredReports.filter((r) => r.danos?.sensorPapel).length;
  const sensorRibbonDamaged = filteredReports.filter((r) => r.danos?.sensorRibbon).length;
  const bandasDamaged = filteredReports.filter((r) => r.danos?.bandas).length;
  const cutterDamaged = filteredReports.filter((r) => r.danos?.cutter).length;
  const displayDamaged = filteredReports.filter((r) => r.danos?.display).length;
  const rebobinadorDamaged = filteredReports.filter((r) => r.danos?.rebobinador).length;

  // Brands breakdown
  const brandCounts: Record<string, number> = {};
  filteredReports.forEach((r) => {
    const b = r.equipo?.marca || 'Otra';
    brandCounts[b] = (brandCounts[b] || 0) + 1;
  });
  const sortedBrands = Object.entries(brandCounts).sort((a, b) => b[1] - a[1]);

  // Visits breakdown (1, 2, 3, 4)
  const visitCounts = [1, 2, 3, 4].map((v) => ({
    visit: v,
    count: filteredReports.filter((r) => r.numVisita === v).length,
  }));

  // Technicians activity
  const techCounts: Record<string, { total: number; completados: number }> = {};
  filteredReports.forEach((r) => {
    const tech = r.tecnicoNombre || 'Sin asignar';
    if (!techCounts[tech]) {
      techCounts[tech] = { total: 0, completados: 0 };
    }
    techCounts[tech].total += 1;
    if (r.status === 'Completado') {
      techCounts[tech].completados += 1;
    }
  });

  const allAvailableBrands = Array.from(new Set(reports.map((r) => r.equipo?.marca))).filter(Boolean);

  const damagesList = [
    { label: 'Cabezal Térmico (Resistencias)', count: cabezalDamaged, color: 'bg-[#D60000]', text: 'text-[#D60000]' },
    { label: 'Rodillo Principal (Platen Roller)', count: rodilloDamaged, color: 'bg-neutral-800', text: 'text-neutral-800' },
    { label: 'Sensor de Papel / Gap / Black Mark', count: sensorPapelDamaged, color: 'bg-amber-600', text: 'text-amber-700' },
    { label: 'Sensor de Ribbon / Cinta', count: sensorRibbonDamaged, color: 'bg-amber-500', text: 'text-amber-600' },
    { label: 'Bandas / Engranes de Tracción', count: bandasDamaged, color: 'bg-neutral-600', text: 'text-neutral-600' },
    { label: 'Cuchilla Cortadora (Cutter)', count: cutterDamaged, color: 'bg-red-800', text: 'text-red-800' },
    { label: 'Display / Pantalla Panel Frontal', count: displayDamaged, color: 'bg-neutral-500', text: 'text-neutral-500' },
    { label: 'Rebobinador Interno / Eje', count: rebobinadorDamaged, color: 'bg-neutral-700', text: 'text-neutral-700' },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-10">
      {/* Minimal Header with Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#D60000]" />
            <span>Métricas Operativas</span>
            <span className="bg-red-100 text-red-700 text-[11px] font-mono font-bold px-2 py-0.5 rounded">
              SOT-MET-01
            </span>
          </h2>
        </div>

        {/* Filter by Brand */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-2xs">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-600 font-medium">Marca:</span>
          <select
            value={selectedBrandFilter}
            onChange={(e) => setSelectedBrandFilter(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">Todas ({reports.length})</option>
            {allAvailableBrands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Services */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Servicios</span>
            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800">
              <Printer className="w-4 h-4 text-[#D60000]" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{total}</span>
            <span className="text-xs text-slate-500">equipos atendidos</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Formato SOT-REP-CLG-01</span>
            <span className="text-emerald-600 font-semibold">100% Digitalizado</span>
          </div>
        </div>

        {/* Printhead Failure Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Falla en Cabezal</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[#D60000]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#D60000]">{cabezalDamaged}</span>
            <span className="text-xs text-slate-500">
              ({total > 0 ? Math.round((cabezalDamaged / total) * 100) : 0}% de los equipos)
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Puntos muertos / rayado</span>
            <span className="text-red-600 font-semibold font-mono">Crítico</span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completados</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">{completados}</span>
            <span className="text-xs text-slate-500">
              ({total > 0 ? Math.round((completados / total) * 100) : 0}% efectividad)
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Pendientes por pieza:</span>
            <span className="text-amber-600 font-bold">{pendientesRefaccion}</span>
          </div>
        </div>

        {/* Sensors & Rollers */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mecánica / Sensores</span>
            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{rodilloDamaged + sensorPapelDamaged}</span>
            <span className="text-xs text-slate-500">piezas desgastadas</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>En revisión / prueba:</span>
            <span className="text-neutral-700 font-bold">{enRevision}</span>
          </div>
        </div>
      </div>

      {/* Grid: Componentes Dañados & Distribución por Marcas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Component Damage Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#D60000]" />
                Diagnóstico de Daños por Componente
              </h2>
              <p className="text-xs text-slate-500">
                Frecuencia de afectación registrada en los reportes de servicio.
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {damagesList.map((item) => {
              const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-800">{item.label}</span>
                    <span className="font-bold text-slate-700">
                      {item.count} equipos <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Brands & Visit Number Distribution */}
        <div className="space-y-6">
          {/* Brands distribution */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-neutral-800" />
              Distribución por Fabricante / Marca
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Equipos ingresados a diagnóstico y mantenimiento.
            </p>

            <div className="space-y-3">
              {sortedBrands.map(([brand, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={brand}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-800">{brand}</span>
                      <span className="font-semibold text-slate-600">
                        {count} reportes ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#212121] rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visits Number (1, 2, 3, 4) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-neutral-800" />
              Historial de Visitas Técnicas
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Cantidad de visitas aplicadas por equipo según formato oficial SOT-REP.
            </p>

            <div className="grid grid-cols-4 gap-2 text-center">
              {visitCounts.map(({ visit, count }) => (
                <div key={visit} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Visita {visit}
                  </span>
                  <span className="text-xl font-black text-[#212121] mt-1 block">
                    {count}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {total > 0 ? Math.round((count / total) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Technician Performance Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Desempeño Técnico y Asignación</h2>
            <p className="text-xs text-slate-500">Reportes generados por cada ingeniero o técnico de campo.</p>
          </div>
          {onNavigateToReports && (
            <button
              onClick={onNavigateToReports}
              className="text-xs text-[#D60000] hover:text-[#b50000] font-bold underline transition-colors"
            >
              Ver tabla de reportes
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Técnico / Ingeniero</th>
                <th className="py-2.5 px-4 text-center">Servicios Totales</th>
                <th className="py-2.5 px-4 text-center">Completados</th>
                <th className="py-2.5 px-4 text-center">Tasa de Cierre</th>
                <th className="py-2.5 px-4 text-right">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(techCounts).map(([tech, data]) => {
                const closureRate = data.total > 0 ? Math.round((data.completados / data.total) * 100) : 0;
                return (
                  <tr key={tech} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{tech}</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-700">{data.total}</td>
                    <td className="py-3 px-4 text-center font-semibold text-emerald-600">{data.completados}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{closureRate}%</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Activo
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
