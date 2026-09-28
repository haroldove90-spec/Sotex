/**
 * Utility for playing the official notification alert sound and broadcasting real-time events.
 */

export const NOTIFICATION_SOUND_URL =
  'https://znlhwxjiwrwcfhswppfx.supabase.co/storage/v1/object/public/Notificaciones/universfield-new-notification-057-494255.mp3';

let audioInstance: HTMLAudioElement | null = null;

export const playNotificationSound = () => {
  try {
    if (!audioInstance) {
      audioInstance = new Audio(NOTIFICATION_SOUND_URL);
      audioInstance.volume = 0.9;
    } else {
      audioInstance.currentTime = 0;
    }

    const playPromise = audioInstance.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Autoplay may be blocked if user has not interacted with document yet
        console.warn('Alerta sonora de notificación en espera de interacción:', err);
      });
    }

    // Trigger mobile vibration if device supports Vibration API
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([150, 80, 200]);
      } catch {}
    }
  } catch (err) {
    console.warn('Error al reproducir sonido de notificación:', err);
  }
};
