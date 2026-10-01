import React, { useState } from 'react';
import { EquipmentTypeConfig } from '../types';
import {
  saveEquipmentTypes,
  upsertEquipmentTypeToSupabase,
  deleteEquipmentTypeFromSupabase,
} from '../utils/equipmentTypesManager';
import {
  Cpu,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  ListChecks,
  Printer,
  Laptop,
  Smartphone,
  Barcode,
  Save,
  X,
  AlertCircle,
} from 'lucide-react';

interface EquipmentTypesAdminViewProps {
  equipmentTypes: EquipmentTypeConfig[];
  onUpdateEquipmentTypes: (types: EquipmentTypeConfig[]) => void;
  onOpenNewReport?: () => void;
}

export const EquipmentTypesAdminView: React.FC<EquipmentTypesAdminViewProps> = ({
  equipmentTypes,
  onUpdateEquipmentTypes,
  onOpenNewReport,
}) => {
  const [editingType, setEditingType] = useState<EquipmentTypeConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleOpenCreate = () => {
    setEditingType({
      id: `eq-${Date.now()}`,
      nombre: '',
      descripcion: '',
      checklists: ['Revisión general de encendido', 'Inspección visual de conectores'],
    });
    setNewChecklistText('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (type: EquipmentTypeConfig) => {
    setEditingType({
      ...type,
      checklists: [...type.checklists],
    });
    setNewChecklistText('');
    setIsModalOpen(true);
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim() || !editingType) return;
    setEditingType({
      ...editingType,
      checklists: [...editingType.checklists, newChecklistText.trim()],
    });
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (idx: number) => {
    if (!editingType) return;
    setEditingType({
      ...editingType,
      checklists: editingType.checklists.filter((_, i) => i !== idx),
    });
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType || !editingType.nombre.trim()) return;

    let updatedList: EquipmentTypeConfig[] = [];
    const exists = equipmentTypes.some((t) => t.id === editingType.id);

    if (exists) {
      updatedList = equipmentTypes.map((t) => (t.id === editingType.id ? editingType : t));
    } else {
      updatedList = [...equipmentTypes, editingType];
    }

    onUpdateEquipmentTypes(updatedList);
    saveEquipmentTypes(updatedList);
    upsertEquipmentTypeToSupabase(editingType).catch(() => {});

    setIsModalOpen(false);
    setEditingType(null);
    showFeedback(
      `Tipo de equipo "${editingType.nombre}" y su checklist dinámico guardados correctamente.`
    );
  };

  const handleDeleteType = async (typeId: string, typeName: string) => {
    if (equipmentTypes.length <= 1) {
      alert('Debe existir al menos un tipo de equipo configurado.');
      return;
    }
    const confirmed = window.confirm(
      `¿Deseas eliminar el tipo de equipo "${typeName}" y su checklist?`
    );
    if (!confirmed) return;

    const updated = equipmentTypes.filter((t) => t.id !== typeId);
    onUpdateEquipmentTypes(updated);
    saveEquipmentTypes(updated);
    deleteEquipmentTypeFromSupabase(typeId).catch(() => {});
    showFeedback(`Tipo de equipo "${typeName}" eliminado.`);
  };

  const getTypeIcon = (nombre: string) => {
    const n = nombre.toLowerCase();
    if (n.includes('etiqueta') || n.includes('térmica') || n.includes('termica')) {
      return <Barcode className="w-5 h-5 text-[#D60000]" />;
    }
    if (n.includes('hoja') || n.includes('láser') || n.includes('laser') || n.includes('inyección')) {
      return <Printer className="w-5 h-5 text-blue-600" />;
    }
    if (n.includes('computadora') || n.includes('laptop') || n.includes('pc')) {
      return <Laptop className="w-5 h-5 text-amber-600" />;
    }
    if (n.includes('terminal') || n.includes('colector') || n.includes('móvil')) {
      return <Smartphone className="w-5 h-5 text-emerald-600" />;
    }
    return <Cpu className="w-5 h-5 text-purple-600" />;
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-[#D60000]" />
              Catálogo de Equipos y Checklists Dinámicos
            </h2>
            <span className="bg-red-100 text-red-700 text-[11px] font-mono font-bold px-2 py-0.5 rounded">
              SOT-EQ-01
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configura los tipos de equipos atendidos y personaliza la lista de fallas y revisiones comunes que se cargan automáticamente en el formulario técnico.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#D60000] hover:bg-[#b50000] text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Tipo de Equipo</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Grid of Equipment Types & Checklists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {equipmentTypes.map((type) => (
          <div
            key={type.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    {getTypeIcon(type.nombre)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {type.nombre}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {type.checklists.length} fallas/daños configurados
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(type)}
                    title="Editar equipo y checklist"
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteType(type.id, type.nombre)}
                    title="Eliminar tipo de equipo"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {type.descripcion && (
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                  {type.descripcion}
                </p>
              )}

              {/* Checklist items pills */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Checklist Dinámico de Revisión:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
                  {type.checklists.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-50 border border-slate-200 text-slate-700"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px]">
                Se carga automáticamente al seleccionar este equipo en Nuevo Reporte
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create / Edit Equipment Type and Checklist */}
      {isModalOpen && editingType && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-300 overflow-hidden shadow-2xl text-slate-900 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-red-400" />
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {equipmentTypes.some((t) => t.id === editingType.id)
                      ? 'Editar Tipo de Equipo y Checklist'
                      : 'Nuevo Tipo de Equipo y Checklist'}
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Define el nombre del equipo y los componentes a inspeccionar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Tipo de Equipo *
                </label>
                <input
                  type="text"
                  required
                  value={editingType.nombre}
                  onChange={(e) =>
                    setEditingType({ ...editingType, nombre: e.target.value })
                  }
                  placeholder="Ej. Impresora de Etiquetas / Térmica, Escáner, Terminal, etc."
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:outline-hidden text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción o Modelos Típicos (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={editingType.descripcion || ''}
                  onChange={(e) =>
                    setEditingType({ ...editingType, descripcion: e.target.value })
                  }
                  placeholder="Ej. Impresoras industriales y de escritorio Zebra ZT411, ZT230, SATO, Honeywell..."
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:outline-hidden text-slate-900"
                />
              </div>

              {/* Checklist builder */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700">
                  Lista de Daños / Fallas Comunes a Inspeccionar (Checklist)
                </label>
                <p className="text-[11px] text-slate-500">
                  Los técnicos verán estas casillas al seleccionar este tipo de equipo en el formulario.
                </p>

                {/* Add Item input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                    placeholder="Escribe un componente o falla (ej. Rodillo principal, Sensor de papel...)"
                    className="flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:outline-hidden text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {editingType.checklists.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400">
                      No hay puntos en el checklist. Agrega el primero arriba.
                    </div>
                  ) : (
                    editingType.checklists.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 shadow-2xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 font-mono text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="truncate">{item}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveChecklistItem(idx)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                          title="Eliminar de checklist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#D60000] hover:bg-[#b50000] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-transform active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Tipo de Equipo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
