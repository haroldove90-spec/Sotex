import React from 'react';
import { ServiceReport } from '../types';
import { FileText, AlertTriangle, Cpu, CheckCircle2 } from 'lucide-react';

interface StatsCardsProps {
  reports: ServiceReport[];
  onFilterByStatus?: (status: string) => void;
  onFilterByDamage?: (damageKey: string) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  reports,
  onFilterByStatus,
  onFilterByDamage,
}) => {
  const total = reports?.length || 0;
  const cabezalDamaged = reports?.filter((r) => r?.danos?.cabezal).length || 0;
  const sensorDamaged = reports?.filter((r) => r?.danos?.sensorPapel || r?.danos?.sensorRibbon).length || 0;
  const completados = reports?.filter((r) => r?.status === 'Completado').length || 0;
  const pendientes = reports?.filter((r) => r?.status === 'Pendiente Refacción').length || 0;

  const brands = Array.from(new Set(reports?.map((r) => r?.equipo?.marca))).filter(Boolean);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* Total Reports */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Reportes
          </span>
          <div className="w-8 h-8 rounded-md bg-neutral-100 text-[#212121] flex items-center justify-center font-bold">
            <FileText className="w-4 h-4 text-[#D60000]" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-slate-900">{total}</span>
          <span className="text-xs text-slate-500 ml-2">registros en formato SOT-REP</span>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Formato oficial activo</span>
          <span className="font-mono text-slate-700 font-semibold">SOT-REP-CLG-01</span>
        </div>
      </div>

      {/* Cabezales con Daño */}
      <div 
        onClick={() => onFilterByDamage && onFilterByDamage('cabezal')}
        className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between cursor-pointer hover:border-red-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Falla en Cabezal Térmico
          </span>
          <div className="w-8 h-8 rounded-md bg-red-50 text-[#D60000] flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-[#D60000]">{cabezalDamaged}</span>
          <span className="text-xs text-slate-500 ml-2">
            ({total > 0 ? Math.round((cabezalDamaged / total) * 100) : 0}% de los equipos)
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Componente crítico</span>
          <span className="text-red-700 font-medium font-mono text-[10px]">Líneas muertas / desgaste</span>
        </div>
      </div>

      {/* Daños en Sensores o Mecánica */}
      <div 
        onClick={() => onFilterByDamage && onFilterByDamage('sensores')}
        className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between cursor-pointer hover:border-neutral-400 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Sensores y Rodillos
          </span>
          <div className="w-8 h-8 rounded-md bg-neutral-100 text-neutral-700 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-slate-900">{sensorDamaged}</span>
          <span className="text-xs text-slate-500 ml-2">con ajuste o limpieza</span>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Marcas en servicio:</span>
          <span className="text-slate-700 font-semibold">{brands.slice(0, 3).join(', ')}</span>
        </div>
      </div>

      {/* Servicios Completados */}
      <div 
        onClick={() => onFilterByStatus && onFilterByStatus('Completado')}
        className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between cursor-pointer hover:border-emerald-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Completados / Entregados
          </span>
          <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-emerald-600">{completados}</span>
          <span className="text-xs text-slate-500 ml-2">
            de {total} reportes
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Pendientes de refacción:</span>
          <span className="text-amber-600 font-semibold">{pendientes}</span>
        </div>
      </div>
    </div>
  );
};
