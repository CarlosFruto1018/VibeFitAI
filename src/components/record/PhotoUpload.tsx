"use client";

import { useRef, useState } from "react";
import { Camera, X, ImagePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  onSelected: (file: File) => void;
  disabled?: boolean;
  uploading?: boolean;
}

export function PhotoUpload({ onSelected, disabled, uploading }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onSelected(file);
    e.target.value = "";
  }

  function handleClear() {
    setPreview(null);
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {preview ? (
        <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element -- preview local (object URL), next/image no aplica */}
          <img
            src={preview}
            alt="Foto de tu entrenamiento pendiente de análisis"
            className="w-full h-56 object-cover"
          />
          <button
            onClick={handleClear}
            disabled={uploading}
            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center shadow-sm hover:bg-white transition-colors disabled:opacity-50"
            aria-label="Eliminar foto"
          >
            <X size={16} className="text-slate-700" />
          </button>
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent p-3">
            {uploading ? (
              <p className="text-white text-xs font-medium flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin" />
                Subiendo y analizando...
              </p>
            ) : (
              <p className="text-white text-xs font-medium">VibeFitAI analizará esta imagen</p>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className={cn(
            "w-full h-48 rounded-2xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-3 transition-all",
            "hover:border-accent/50 hover:bg-accent-container/25",
            disabled && "opacity-40 cursor-not-allowed"
          )}
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Camera size={24} className="text-slate-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">Sube una foto</p>
            <p className="text-xs text-slate-400 mt-0.5">Pizarra, máquina o nota del gym</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-on-primary-container font-medium bg-primary-container px-3 py-1.5 rounded-full">
            <ImagePlus size={12} />
            Cámara o galería
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
