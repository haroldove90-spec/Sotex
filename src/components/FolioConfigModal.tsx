import React, { useState } from 'react';
import { FolioConfig } from '../types';
import { formatFolioString } from '../utils/folioManager';
import { X, Hash, Save, Check, RefreshCw, FileText, Info } from 'lucide-react';

interface FolioConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FolioConfig;
  onSave: (newConfig: FolioConfig) => void;
}

export const FolioConfigModal: React.FC<FolioConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [prefijo, setPrefijo] = useState(config.prefijo);
  const [ultimoNumero, setUltimoNumero] = useState(config.ultimoNumero);
  const [codigoFormato, setCodigoFormato] = useState(config.codigoFormato);
  const [cerosPadding, setCerosPadding] = useState(config.cerosPadding || 3);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const previewNextFolio = formatFolioString(
    { prefijo, ultimoNumero, codigoFormato, cerosPadding },
    ultimoNumero + 1
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: FolioConfig = {
      prefijo: prefijo.trim() || 'SOT-2026-',
      ultimoNumero: Math.max(0, Number(ultimoNumero) || 0),
      codigoFormato: codigoFormato.trim() || 'SOT-REP-CLG-01',
      cerosPadding: Math.max(1, Math.min(6, Number(cerosPadding) || 3)),
    };
    onSave(newConfig);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D60000] flex items-center justify-center shadow-sm">
              <Hash className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Folio Oficial y Código de Formato
              </h3>
              <p className="text-xs text-neutral-300">
                Configuración del consecutivo automático de órdenes de trabajo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Al configurar el número de folio oficial y código de formato, las nuevas órdenes de
              trabajo creadas por Administradores o Técnicos incrementarán automáticamente de forma
              consecutiva.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Prefijo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Prefijo Oficial del Folio
              </label>
              <input
                type="text"
                value={prefijo}
                onChange={(e) => setPrefijo(e.target.value)}
                placeholder="ej. SOT-2026-"
                required
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500">Ejemplo: SOT-2026- o ORD-</span>
            </div>

            {/* Código de Formato */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Código Oficial de Formato
              </label>
              <input
                type="text"
                value={codigoFormato}
                onChange={(e) => setCodigoFormato(e.target.value)}
                placeholder="ej. SOT-REP-CLG-01"
                required
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500">Identificador institucional</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Último Número Registrado */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Último Número Emitido
              </label>
              <input
                type="number"
                min="0"
                value={ultimoNumero}
                onChange={(e) => setUltimoNumero(Number(e.target.value))}
                required
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500">La próxima orden será el número {ultimoNumero + 1}</span>
            </div>

            {/* Ceros Padding */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ceros a la Izquierda (Dígitos)
              </label>
              <select
                value={cerosPadding}
                onChange={(e) => setCerosPadding(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden bg-white cursor-pointer"
              >
                <option value={2}>2 dígitos (ej. 01)</option>
                <option value={3}>3 dígitos (ej. 001)</option>
                <option value={4}>4 dígitos (ej. 0001)</option>
                <option value={5}>5 dígitos (ej. 00001)</option>
              </select>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-[#D60000]" />
              Vista Previa de la Siguiente Orden
            </span>
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <div>
                <span className="text-[11px] text-slate-500 block">Folio Consecutivo:</span>
                <span className="text-base font-black font-mono text-[#D60000]">
                  {previewNextFolio}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Formato:</span>
                <span className="text-xs font-bold font-mono text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                  {codigoFormato || 'SOT-REP-CLG-01'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#D60000] hover:bg-[#b50000] rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Configuración Guardada!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Consecutivo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
