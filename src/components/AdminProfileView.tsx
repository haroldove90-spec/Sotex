import React, { useState, useRef } from 'react';
import { AdminProfile, ServiceReport } from '../types';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Camera,
  Trash2,
  Save,
  CheckCircle2,
  ShieldCheck,
  Award,
  PenTool,
} from 'lucide-react';

interface AdminProfileViewProps {
  profile: AdminProfile;
  onSaveProfile: (updated: AdminProfile) => void;
  reports: ServiceReport[];
}

export const AdminProfileView: React.FC<AdminProfileViewProps> = ({
  profile,
  onSaveProfile,
  reports,
}) => {
  const [formData, setFormData] = useState<AdminProfile>(profile);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('La imagen seleccionada supera los 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData((prev) => ({ ...prev, fotoUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData((prev) => ({ ...prev, firmaDigital: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const myReports = reports.filter(
    (r) =>
      r.tecnicoNombre.toLowerCase().includes(formData.nombre.toLowerCase()) ||
      formData.nombre.toLowerCase().includes(r.tecnicoNombre.toLowerCase())
  );
  const totalReportsCount = myReports.length > 0 ? myReports.length : reports.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-10">
      {/* Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-[#D60000]" />
            <span>Perfil</span>
            <span className="bg-red-100 text-red-700 text-[11px] font-mono font-bold px-2 py-0.5 rounded">
              SOT-PER-01
            </span>
          </h2>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Avatar */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-300 shadow-xs flex items-center justify-center">
            {formData.fotoUrl ? (
              <img
                src={formData.fotoUrl}
                alt={formData.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-slate-400" />
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
            title="Cambiar foto"
          >
            <Camera className="w-5 h-5 mb-1 text-red-400" />
            <span className="text-[10px] font-semibold">Foto</span>
          </button>

          {formData.fotoUrl && (
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, fotoUrl: undefined }))}
              className="absolute -bottom-1.5 -right-1.5 bg-white border border-slate-300 text-slate-500 hover:text-red-600 p-1 rounded-full shadow-xs"
              title="Eliminar foto"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>

        {/* Info */}
        <div className="text-center sm:text-left flex-1 min-w-0">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight truncate">
            {formData.nombre || 'Usuario SOTEX'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {formData.cargo || 'Técnico'} • {formData.sucursal || 'Matriz'}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {formData.correo}
            </span>
            {formData.telefono && (
              <span className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {formData.telefono}
              </span>
            )}
            <span className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              ID: {formData.cedulaTecnica}
            </span>
          </div>
        </div>

        {/* Quick stat */}
        <div className="shrink-0 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Reportes</span>
          <span className="text-xl font-black text-slate-900">{totalReportsCount}</span>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">Datos de Cuenta y Firma</h3>
          {saveSuccess && (
            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Guardado
            </div>
          )}
        </div>

        <div className="p-5 space-y-5">
          {/* Datos Personales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:outline-hidden text-slate-900 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:outline-hidden text-slate-900 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:outline-hidden text-slate-900 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cargo / Puesto
              </label>
              <input
                type="text"
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:outline-hidden text-slate-900 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sucursal
              </label>
              <input
                type="text"
                value={formData.sucursal}
                onChange={(e) => setFormData({ ...formData, sucursal: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:outline-hidden text-slate-900 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ID / Cédula Técnica
              </label>
              <input
                type="text"
                value={formData.cedulaTecnica}
                onChange={(e) => setFormData({ ...formData, cedulaTecnica: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:outline-hidden text-slate-900 shadow-2xs"
              />
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Firma Digital */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Firma Digital (para autorizar reportes)
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-56 h-20 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden p-2">
                {formData.firmaDigital ? (
                  <img
                    src={formData.firmaDigital}
                    alt="Firma Digital"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400">Sin firma</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => signatureInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors"
                >
                  {formData.firmaDigital ? 'Reemplazar Firma' : 'Cargar Firma'}
                </button>
                {formData.firmaDigital && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, firmaDigital: undefined }))}
                    className="text-xs text-red-600 hover:text-red-700 text-left font-medium"
                  >
                    Eliminar firma
                  </button>
                )}
                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSignatureUpload}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#D60000] hover:bg-[#b50000] text-white font-bold text-xs rounded-lg transition-all shadow-xs active:scale-95"
            >
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
