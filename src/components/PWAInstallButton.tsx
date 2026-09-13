import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, CheckCircle2, Smartphone, X, Share2, PlusSquare } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 3500);
      }
    } else {
      setShowModal(true);
    }
  };

  if (isInstalled) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-900/60 border border-emerald-600/40 text-[11px] font-medium text-emerald-300 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">PWA Instalada</span>
      </div>
    );
  }

  return (
    <>
      <button
        id="btn-pwa-install"
        onClick={handleInstallClick}
        title="Instalar Sotex en tu dispositivo (PWA)"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs font-bold rounded-md bg-[#D60000] hover:bg-[#b50000] text-white transition-all shadow-sm active:scale-95 border border-red-500/30 animate-pulse-subtle ${className}`}
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span className="whitespace-nowrap">Instalar App</span>
      </button>

      {/* Instructional Guide Modal for iOS or manual install */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-[#212121] border border-neutral-700 text-white rounded-xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center p-2 shadow-inner">
                <img
                  src="https://daloocomercializadora.com.mx/sotexicono.png"
                  alt="Sotex Icon"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Instalar Sotex</h3>
                <p className="text-xs text-neutral-400">Accede como aplicación nativa en tu dispositivo</p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-neutral-300 bg-neutral-900/80 p-3.5 rounded-lg border border-neutral-800">
                <p className="font-semibold text-neutral-200">Para instalar en iPhone o iPad (Safari):</p>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#D60000] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
                  <span>Presiona el botón <strong className="text-white inline-flex items-center gap-1 mx-1"><Share2 className="w-3.5 h-3.5 text-blue-400 inline" /> Compartir</strong> en la barra inferior de Safari.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#D60000] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
                  <span>Desplaza hacia abajo y selecciona <strong className="text-white inline-flex items-center gap-1 mx-1"><PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" /> Agregar a pantalla de inicio</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#D60000] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
                  <span>Confirma pulsando <strong className="text-white">Agregar</strong> en la esquina superior derecha.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-neutral-300 bg-neutral-900/80 p-3.5 rounded-lg border border-neutral-800">
                <p className="font-semibold text-neutral-200">Para instalar en Android o Computadora (Chrome / Edge):</p>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#D60000] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
                  <span>Toca los tres puntos <strong className="text-white">⋮ Menú</strong> del navegador en la esquina superior.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#D60000] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
                  <span>Selecciona la opción <strong className="text-white inline-flex items-center gap-1 mx-1"><Smartphone className="w-3.5 h-3.5 text-emerald-400 inline" /> Instalar aplicación</strong> o <strong>Agregar a la pantalla principal</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#D60000] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
                  <span>¡Listo! Tendrás el ícono de Sotex en tu pantalla de inicio para abrirla a pantalla completa sin barra de navegación del navegador.</span>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="w-full sm:w-auto px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg transition-colors border border-neutral-600"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
