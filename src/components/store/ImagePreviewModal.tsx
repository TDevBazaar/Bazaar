"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { ImageOff, X, ZoomIn } from "lucide-react";
import { LazyImage } from "./LazyImage";

export interface PreviewImageData {
  src: string;
  alt: string;
}

interface ZoomableThumbProps {
  src?: string | null;
  alt: string;
  onPreview: (image: PreviewImageData) => void;
  className?: string;
  priority?: boolean;
}

export function ZoomableThumb({
  src,
  alt,
  onPreview,
  className = "h-12 w-12 rounded-xl",
  priority = false,
}: ZoomableThumbProps) {
  const cleanSrc = src?.trim() ?? "";

  if (!cleanSrc) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center bg-zinc-100 text-zinc-400 ${className}`}
        aria-hidden="true"
      >
        <ImageOff className="h-4 w-4" />
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onPreview({ src: cleanSrc, alt })}
      aria-label={`Ampliar imagen de ${alt}`}
      title="Toca para ampliar"
      className={`group/thumb relative block shrink-0 cursor-zoom-in overflow-hidden bg-zinc-100 transition hover:ring-2 hover:ring-violet-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 ${className}`}
    >
      <LazyImage
        src={cleanSrc}
        alt={alt}
        sizes="120px"
        priority={priority}
        fallbackIconSize="sm"
        wrapperClassName="h-full w-full"
        className="transition duration-300 group-hover/thumb:scale-105"
      />
      <span
        className="pointer-events-none absolute right-1 bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950/65 text-white shadow-xs transition group-hover/thumb:scale-110"
        aria-hidden="true"
      >
        <ZoomIn className="h-3 w-3" />
      </span>
    </button>
  );
}

interface ImagePreviewModalProps {
  image: PreviewImageData | null;
  onClose: () => void;
}

export function ImagePreviewModal({ image, onClose }: ImagePreviewModalProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const broken = Boolean(image && failedSrc === image.src);

  useEffect(() => {
    if (!image) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [image, onClose]);

  if (!image) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.alt || "Imagen del producto"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <h3 className="line-clamp-2 font-display text-base font-bold text-zinc-950 sm:text-lg">
            {image.alt || "Imagen del producto"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar vista ampliada"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-h-48 w-full flex-1 items-center justify-center overflow-hidden rounded-2xl bg-zinc-50 p-2 sm:min-h-72 sm:p-4">
          {broken ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-zinc-500">
              <ImageOff className="h-8 w-8 opacity-45" />
              <span>No se pudo cargar la imagen.</span>
            </div>
          ) : (
            <img
              src={image.src}
              alt={image.alt}
              onError={() => setFailedSrc(image.src)}
              className="mx-auto block h-auto max-h-[66dvh] w-auto max-w-full rounded-xl object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
}
