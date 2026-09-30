/**
 * Utility for playing the official notification alert sound and broadcasting real-time events.
 */

export const NOTIFICATION_SOUND_URL =
  'https://znlhwxjiwrwcfhswppfx.supabase.co/storage/v1/object/public/Notificaciones/universfield-new-notification-057-494255.mp3';

let audioInstance: HTMLAudioElement | null = null;
let hasUnlocked = false;

// Preload audio instance
if (typeof window !== 'undefined') {
  try {
    audioInstance = new Audio(NOTIFICATION_SOUND_URL);
    audioInstance.volume = 1.0;
    audioInstance.preload = 'auto';

    // Auto-unlock on first user interaction so subsequent notification sounds always play without restriction
    const unlockHandler = () => {
      if (!hasUnlocked && audioInstance) {
        audioInstance
          .play()
          .then(() => {
            audioInstance?.pause();
            if (audioInstance) audioInstance.currentTime = 0;
            hasUnlocked = true;
          })
          .catch(() => {});
      }
      window.removeEventListener('pointerdown', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);
    };

    window.addEventListener('pointerdown', unlockHandler, { once: true, passive: true });
    window.addEventListener('keydown', unlockHandler, { once: true, passive: true });
  } catch {}
}

/**
 * Plays synthesized notification chime using Web Audio API as a fail-safe
 */
const playSynthesizedChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    // Pleasant two-tone chime (587.33 Hz D5 -> 880 Hz A5)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.08);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  } catch {}
};

export const playNotificationSound = () => {
  try {
    if (!audioInstance) {
      audioInstance = new Audio(NOTIFICATION_SOUND_URL);
      audioInstance.volume = 1.0;
    } else {
      audioInstance.currentTime = 0;
      audioInstance.volume = 1.0;
    }

    const playPromise = audioInstance.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          hasUnlocked = true;
        })
        .catch((err) => {
          console.warn('Alerta sonora de notificación en espera de interacción, usando sintetizador:', err);
          // Fallback to Web Audio synthesized chime if mp3 autoplay is restricted
          playSynthesizedChime();
        });
    }

    // Trigger mobile vibration if device supports Vibration API
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([160, 90, 220]);
      } catch {}
    }
  } catch (err) {
    console.warn('Error al reproducir sonido de notificación:', err);
    playSynthesizedChime();
  }
};
