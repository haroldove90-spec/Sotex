import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __deferredPWAInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

// Early capture of beforeinstallprompt so it's not lost before React hydration
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    window.__deferredPWAInstallPrompt = e as BeforeInstallPromptEvent;
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    return (typeof window !== 'undefined' && window.__deferredPWAInstallPrompt) || null;
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = (typeof navigator !== 'undefined' ? navigator.userAgent : '').toLowerCase();

    // 1. Detect standalone mode (already installed on phone)
    const isStandalone =
      (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ||
      (typeof window !== 'undefined' &&
        (window.navigator as unknown as { standalone?: boolean }).standalone === true);
    setIsInstalled(isStandalone);

    // 2. Detect iOS devices (iPhone, iPad, iPod)
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (typeof navigator !== 'undefined' &&
        navigator.platform === 'MacIntel' &&
        navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // 3. Detect Android devices
    const isAndroidDevice = /android/.test(userAgent);
    setIsAndroid(isAndroidDevice);

    // 4. Detect mobile devices (Strictly mobile, excluding desktop PC / Mac)
    const isMobileDevice =
      isIOSDevice ||
      isAndroidDevice ||
      /mobile|phone|tablet|silk|kindle/.test(userAgent) ||
      (typeof window !== 'undefined' && window.innerWidth <= 840);
    setIsMobile(isMobileDevice);

    // If early prompt was caught, set it
    if (window.__deferredPWAInstallPrompt && !deferredPrompt) {
      setDeferredPrompt(window.__deferredPWAInstallPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__deferredPWAInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__deferredPWAInstallPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    const promptEvent =
      deferredPrompt || (typeof window !== 'undefined' ? window.__deferredPWAInstallPrompt : null);

    if (!promptEvent) return false;

    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        if (typeof window !== 'undefined') {
          window.__deferredPWAInstallPrompt = null;
        }
        return true;
      }
    } catch (err) {
      console.error('Error al instalar la aplicación en el dispositivo móvil:', err);
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt || (typeof window !== 'undefined' && !!window.__deferredPWAInstallPrompt),
    isInstalled,
    isIOS,
    isAndroid,
    isMobile,
    install,
  };
}
