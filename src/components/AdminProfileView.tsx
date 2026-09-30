import React, { useState, useRef, useEffect } from 'react';
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
  X,
  RotateCcw,
  Check,
} from 'lucide-react';
import { compressImageFile } from '../utils/imageCompressor';
import { SignaturePad, SignaturePadRef } from './SignaturePad';

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
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [tempSignature, setTempSignature] = useState<string | undefined>(profile.firmaDigital);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signaturePadRef = useRef<SignaturePadRef>(null);

  // Keep formData in sync if profile updates from remote Supabase sync
  useEffect(() => {
    setFormData(profile);
    setTempSignature(profile.firmaDigital);
  }, [profile]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress avatar to clean ~240x240 JPEG (~18KB) so it saves instantly in storage and Supabase
      const compressed = await compressImageFile(file, 240, 240, 0.82);
      setFormData((prev) => ({ ...prev, fotoUrl: compressed }));
    } catch (err) {
      console.warn('Error al procesar foto de perfil:', err);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleOpenSignModal = () => {
    setTempSignature(formData.firmaDigital);
    setIsSignModalOpen(true);
  };

  const handleSaveSignatureFromModal = () => {
    const sig = signaturePadRef.current?.getSignature();
    if (sig) {
      setFormData((prev) => ({ ...prev, firmaDigital: sig }));
    } else if (tempSignature) {
      setFormData((prev) => ({ ...prev, firmaDigital: tempSignature }));
    }
    setIsSignModalOpen(false);
  };

  const handleRemoveSignature = () => {
    setFormData((prev) => ({ ...prev, firmaDigital: undefined }));
    setTempSignature(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const myReports = reports.filter(
    (r) =>
      (r.tecnicoNombre && formData.nombre && r.tecnicoNombre.toLowerCase().includes(formData.nombre.toLowerCase())) ||
      (formData.nombre && r.tecnicoNombre && formData.nombre.toLowerCase().includes(r.tecnicoNombre.toLowerCase()))
  );
  const totalReportsCount = myReports.length > 0 ? myReports.length : reports.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-10">
      {/* Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-[#D60000]" />
            <span>Perfil de Usuario</span>
            <span className="bg-red-100 text-red-700 text-[11px] font-mono font-bold px-2 py-0.5 rounded">
              SOT-PER-01
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestiona tu información de usuario, fotografía y firma digital oficial para reportes técnicos.
          </p>
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
            title="Cambiar foto de perfil"
          >
            <Camera className="w-5 h-5 mb-1 text-red-400" />
            <span className="text-[10px] font-semibold">Cambiar Foto</span>
          </button>

          {formData.fotoUrl && (
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, fotoUrl: undefined }))}
              className="absolute -bottom-1.5 -right-1.5 bg-white border border-slate-300 text-slate-500 hover:text-red-600 p-1 rounded-full shadow-xs cursor-pointer"
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
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight truncate">
              {formData.nombre || 'Usuario SOTEX'}
            </h3>
            <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
              <ShieldCheck className="w-3 h-3" />
              Verificado
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {formData.cargo || 'Técnico Especialista'} • {formData.sucursal || 'Guadalajara (Matriz)'}
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
            <span className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 font-mono">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              Cédula: {formData.cedulaTecnica || 'SOT-01'}
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
          <h3 className="text-sm font-bold text-slate-900">Datos de Cuenta y Firma Oficial</h3>
          {saveSuccess && (
            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Guardado en Sistema y Supabase
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

          {/* Firma Digital - Archivo desactivado, ventana de firma activada */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Firma Digital (para autorizar y cerrar reportes de servicio)
              </label>
              <span className="text-[10px] text-slate-500 font-medium">
                Captura táctil / mouse autorizada
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-4">
              {/* Preview box */}
              <div className="w-64 h-24 border-2 border-dashed border-slate-300 rounded-lg bg-white flex items-center justify-center overflow-hidden p-2 shadow-inner">
                {formData.firmaDigital ? (
                  <img
                    src={formData.firmaDigital}
                    alt="Firma Digital"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400 text-xs">
                    <PenTool className="w-5 h-5 mb-1 text-slate-300" />
                    <span>Sin firma registrada</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-1">
                <button
                  type="button"
                  onClick={handleOpenSignModal}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-neutral-900 hover:bg-[#D60000] text-white rounded-lg transition-colors cursor-pointer shadow-xs active:scale-98"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{formData.firmaDigital ? 'Volver a Firmar en Pantalla' : 'Abrir Ventana para Firmar'}</span>
                </button>

                {formData.firmaDigital && (
                  <button
                    type="button"
                    onClick={handleRemoveSignature}
                    className="text-xs text-rose-600 hover:text-rose-700 text-left font-medium flex items-center gap-1 cursor-pointer self-start"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Eliminar firma digital</span>
                  </button>
                )}

                <p className="text-[11px] text-slate-500">
                  La carga de archivos de firma ha sido desactivada. Puedes trazar tu firma a mano alzada en la pantalla con tu dedo o mouse para máxima autenticidad.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#D60000] hover:bg-[#b50000] text-white font-bold text-xs rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios de Perfil</span>
            </button>
          </div>
        </div>
      </form>

      {/* Ventana Flotante Modal para Firmar */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-300 overflow-hidden shadow-2xl text-slate-900">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-red-400" />
                <div>
                  <h4 className="font-bold text-sm text-white">
                    Ventana de Firma Digital del Usuario
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Traza tu firma sobre el recuadro con el dedo o puntero
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Signature Pad */}
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <SignaturePad
                  ref={signaturePadRef}
                  label="Firma de Conformidad Oficial"
                  initialSignature={tempSignature}
                  onSave={(dataUrl) => setTempSignature(dataUrl)}
                  onClear={() => setTempSignature(undefined)}
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Esta firma quedará vinculada a tu perfil y se plasmará automáticamente en los formatos oficiales de servicio técnico SOT-REP que generes.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  signaturePadRef.current?.clear();
                  setTempSignature(undefined);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar Trazo</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSignModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveSignatureFromModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-transform active:scale-95"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Aceptar y Guardar Firma</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
