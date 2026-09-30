import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import { RotateCcw, Check, PenTool } from 'lucide-react';

export interface SignaturePadRef {
  getSignature: () => string | undefined;
  clear: () => void;
  isEmpty: () => boolean;
}

interface SignaturePadProps {
  label: string;
  initialSignature?: string;
  onSave?: (dataUrl: string) => void;
  onClear?: () => void;
}

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  ({ label, initialSignature, onSave, onClear }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [hasDrawn, setHasDrawn] = useState<boolean>(Boolean(initialSignature));
    const hasDrawnRef = useRef<boolean>(Boolean(initialSignature));
    const isDrawingRef = useRef<boolean>(false);
    const lastPosRef = useRef<{ x: number; y: number } | null>(null);

    // Export current canvas data URL if drawn
    const getSignatureData = useCallback((): string | undefined => {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawnRef.current) return undefined;
      try {
        return canvas.toDataURL('image/png');
      } catch (err) {
        console.warn('Error al exportar firma canvas:', err);
        return undefined;
      }
    }, []);

    // Expose ref API to parent form
    useImperativeHandle(
      ref,
      () => ({
        getSignature: () => getSignatureData(),
        clear: () => handleClear(),
        isEmpty: () => !hasDrawnRef.current,
      }),
      [getSignatureData]
    );

    // Render initial signature when provided
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (initialSignature && initialSignature.startsWith('data:image')) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          hasDrawnRef.current = true;
          setHasDrawn(true);
        };
        img.onerror = () => {
          console.warn('No se pudo cargar la firma inicial en el canvas');
        };
        img.src = initialSignature;
      } else if (!initialSignature) {
        // If initialSignature was explicitly cleared
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasDrawnRef.current = false;
        setHasDrawn(false);
      }
    }, [initialSignature]);

    // Calculate canvas-relative coordinates
    const getCoordinates = (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return { x: 0, y: 0 };

      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ('touches' in e && e.touches.length > 0) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY,
        };
      } else if ('clientX' in e) {
        return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
        };
      }
      return { x: 0, y: 0 };
    };

    const startDrawing = (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ) => {
      // Prevent scrolling on mobile touch screens while drawing signature
      if ('touches' in e) {
        if (e.cancelable) e.preventDefault();
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      isDrawingRef.current = true;
      const coords = getCoordinates(e);
      lastPosRef.current = coords;

      ctx.beginPath();
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#0f172a'; // slate-900 high contrast ink
      ctx.moveTo(coords.x, coords.y);
      // Draw initial dot in case of quick tap
      ctx.lineTo(coords.x + 0.1, coords.y + 0.1);
      ctx.stroke();

      hasDrawnRef.current = true;
      setHasDrawn(true);
    };

    const draw = (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (!isDrawingRef.current) return;
      if ('touches' in e && e.cancelable) {
        e.preventDefault();
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const coords = getCoordinates(e);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      lastPosRef.current = coords;

      if (!hasDrawnRef.current) {
        hasDrawnRef.current = true;
        setHasDrawn(true);
      }
    };

    const stopDrawing = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      lastPosRef.current = null;

      const canvas = canvasRef.current;
      if (canvas && hasDrawnRef.current) {
        const dataUrl = canvas.toDataURL('image/png');
        if (onSave) {
          onSave(dataUrl);
        }
      }
    };

    const handleClear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasDrawnRef.current = false;
      isDrawingRef.current = false;
      lastPosRef.current = null;
      setHasDrawn(false);

      if (onClear) {
        onClear();
      }
    };

    return (
      <div className="flex flex-col gap-1.5 select-none">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <PenTool className="w-3.5 h-3.5 text-slate-500" />
            <span>{label}</span>
          </label>

          <div className="flex items-center gap-2">
            {hasDrawn && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 animate-fade-in">
                <Check className="w-3 h-3 stroke-[2.5]" />
                Firma capturada
              </span>
            )}
            {hasDrawn && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-rose-50 cursor-pointer"
                title="Borrar y volver a firmar"
              >
                <RotateCcw className="w-3 h-3" />
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="relative border border-slate-300 rounded-lg bg-white overflow-hidden shadow-xs hover:border-slate-400 transition-colors">
          <canvas
            ref={canvasRef}
            width={400}
            height={130}
            className="w-full h-[110px] touch-none cursor-crosshair block bg-transparent"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          {!hasDrawn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 text-xs gap-1">
              <span className="font-medium text-slate-500">
                Dibujar firma aquí
              </span>
              <span className="text-[10px] text-slate-400">
                (Mouse o pantalla táctil en dispositivo móvil)
              </span>
            </div>
          )}

          <div className="absolute bottom-2 left-6 right-6 border-b border-dashed border-slate-300 pointer-events-none" />
        </div>
      </div>
    );
  }
);

SignaturePad.displayName = 'SignaturePad';
