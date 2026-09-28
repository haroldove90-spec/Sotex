import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Share2, PlusSquare, CheckCircle2, Apple } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'navbar' | 'banner' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'navbar',
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isMobile, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // 1. If already installed and running standalone on the phone, do not show
  if (isInstalled) {
    return null;
  }

  // 2. Strict Rule: If NOT mobile (desktop computer / laptop), do NOT show install prompt
  // "no quiero que se ponga el acceso en el escritorio. quiero que se instale directamente la app al celular"
  if (!isMobile) {
    return null;
  }

  // Handler for installation
  const handleInstall = async () => {
    // A. For iOS: WebKit does not support programmatic beforeinstallprompt.
    // Show iOS step-by-step instructions to add to home screen.
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    // B. For Android / Mobile Chrome: Trigger direct OS installation prompt
    setIsInstalling(true);
    try {
      const ok = await install();
      if (ok) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      } else {
        // If browser prompt is not currently available, show Android-specific guide
        setShowAndroidModal(true);
      }
    } catch {
      setShowAndroidModal(true);
    } finally {
      setIsInstalling(false);
    }
  };

  // Render Card/Banner variant for Mobile Landing / Role Screen
  if (variant === 'card' || variant === 'banner') {
    return (
      <>
        <div className={`p-3.5 bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700 rounded-xl text-white shadow-md flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#D60000] flex items-center justify-center shrink-0 shadow-xs">
              {isIOS ? <Apple className="w-5 h-5 text-white" /> : <Smartphone className="w-5 h-5 text-white" />}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold block text-white truncate">
                {isIOS ? 'Instalar App en iPhone / iPad' : 'Instalar App en tu Celular'}
              </span>
              <span className="text-[11px] text-neutral-400 block truncate">
                {isIOS ? 'Agrega el acceso directo a tu pantalla' : 'Instalación directa para Android'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstall}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#D60000] hover:bg-[#b50000] text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Instalar</span>
          </button>
        </div>

        {/* Modal for iOS */}
        {showIOSModal && renderIOSModal(() => setShowIOSModal(false))}
        {/* Modal for Android fallback */}
        {showAndroidModal && renderAndroidModal(() => setShowAndroidModal(false))}
      </>
    );
  }

  // Standard Mobile Navbar / Header Button
  return (
    <>
      <button
        id="btn-pwa-mobile-install"
        type="button"
        onClick={handleInstall}
        title={isIOS ? 'Instalar en iPhone' : 'Instalar en Celular Android'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-[#D60000] hover:bg-[#b50000] text-white transition-all shadow-sm active:scale-95 cursor-pointer ${className}`}
      >
        <Smartphone className="w-3.5 h-3.5 stroke-[2.5]" />
        <span className="whitespace-nowrap">
          {installSuccess ? '¡Instalando!' : isIOS ? 'Instalar en iPhone' : 'Instalar App'}
        </span>
      </button>

      {/* iOS Modal: ONLY shown on iOS */}
      {showIOSModal && renderIOSModal(() => setShowIOSModal(false))}

      {/* Android Modal fallback: ONLY shown on Android when browser prompt is pending */}
      {showAndroidModal && renderAndroidModal(() => setShowAndroidModal(false))}
    </>
  );
};

// Modal specifically for iOS (iPhone / iPad)
function renderIOSModal(onClose: () => void) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#1f1f1f] border border-neutral-700 text-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
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
            <h3 className="text-sm font-bold text-white">Instalar Sotex en iPhone / iPad</h3>
            <p className="text-[11px] text-neutral-400">Instrucciones para Safari iOS</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-neutral-300 bg-neutral-900/90 p-4 rounded-xl border border-neutral-800">
          <p className="font-semibold text-neutral-100 text-[11px]">
            Para poner el acceso directo en la pantalla de tu iPhone:
          </p>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#D60000] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              1
            </span>
            <span className="text-[11px] leading-relaxed">
              En Safari, toca el botón de{' '}
              <strong className="text-white inline-flex items-center gap-1 mx-0.5 bg-neutral-800 px-1.5 py-0.5 rounded">
                <Share2 className="w-3 h-3 text-blue-400 inline" /> Compartir
              </strong>{' '}
              en la barra inferior.
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#D60000] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              2
            </span>
            <span className="text-[11px] leading-relaxed">
              Desliza hacia abajo en las opciones y selecciona{' '}
              <strong className="text-white inline-flex items-center gap-1 mx-0.5 bg-neutral-800 px-1.5 py-0.5 rounded">
                <PlusSquare className="w-3 h-3 text-emerald-400 inline" /> Agregar a inicio
              </strong>.
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#D60000] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              3
            </span>
            <span className="text-[11px] leading-relaxed">
              Toca <strong className="text-white font-bold">"Agregar"</strong> en la esquina superior derecha.
            </span>
          </div>
        </div>

        <div className="mt-4 p-2.5 bg-neutral-900 rounded-lg border border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>La app se abrirá a pantalla completa sin barras de navegador.</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl transition-colors border border-neutral-700 cursor-pointer"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

// Modal specifically for Android fallback (when browser prompt was suppressed or needs manual touch)
function renderAndroidModal(onClose: () => void) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#1f1f1f] border border-neutral-700 text-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
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
            <h3 className="text-sm font-bold text-white">Instalar en tu Celular Android</h3>
            <p className="text-[11px] text-neutral-400">Instalación directa en el dispositivo</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-neutral-300 bg-neutral-900/90 p-4 rounded-xl border border-neutral-800">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#D60000] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              1
            </span>
            <span className="text-[11px] leading-relaxed">
              Toca los tres puntos <strong className="text-white">⋮ Menú</strong> en la esquina superior de Chrome.
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#D60000] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              2
            </span>
            <span className="text-[11px] leading-relaxed">
              Selecciona <strong className="text-white">"Instalar aplicación"</strong> (o "Agregar a la pantalla principal").
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#D60000] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              3
            </span>
            <span className="text-[11px] leading-relaxed">
              Presiona <strong className="text-white">"Instalar"</strong>. La aplicación se instalará directamente en tu celular.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2.5 bg-[#D60000] hover:bg-[#b50000] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
