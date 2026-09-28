/**
 * Image compression utilities for SOTEX application.
 * Optimizes test print photos, profile pictures, and signatures
 * to prevent localStorage and network quota issues while preserving crisp inspection quality.
 */

export const compressImageFile = async (
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.75
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado no es una imagen válida'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        reject(new Error('No se pudo obtener el contenido de la imagen'));
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(dataUrl); // Fallback to raw data url if decode fails
      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale down if either dimension exceeds max
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          // Use white background for JPEG rendering
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Export compressed JPEG
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (err) {
          console.warn('Fallback a imagen original:', err);
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Compresses an existing base64/dataURL string if needed.
 */
export const compressDataUrl = async (
  dataUrl: string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
): Promise<string> => {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return dataUrl;
  // If the dataURL is already small (< 50KB), no need to compress
  if (dataUrl.length < 50 * 1024) return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => resolve(dataUrl);
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.src = dataUrl;
  });
};
