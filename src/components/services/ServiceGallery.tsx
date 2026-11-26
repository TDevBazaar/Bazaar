"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

export function ServiceGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveIndex(null);
      if (e.key === "ArrowRight")
        setActiveIndex((i) => (i === null ? 0 : (i + 1) % images.length));
      if (e.key === "ArrowLeft")
        setActiveIndex((i) =>
          i === null ? 0 : (i - 1 + images.length) % images.length
        );
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, images.length]);

  if (images.length === 0) return null;

  return (
    <section aria-labelledby="gallery-heading" className="mt-12">
      <h2
        id="gallery-heading"
        className="font-display text-2xl font-bold text-zinc-950"
      >
        Galería de vistas y ejemplos
      </h2>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {images.map((src, idx) => (
          <button
            key={src}
            type="button"
            onClick={() => setActiveIndex(idx)}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
          >
            <Image
              src={src}
              alt={`${title} - vista ${idx + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/40">
              <ZoomIn className="h-6 w-6 text-white opacity-0 transition group-hover:opacity-100" />
            </span>
          </button>
        ))}
      </div>

      {/* Accessible Lightbox */}
      {activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada de imagen"
          onClick={() => setActiveIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            aria-label="Cerrar galería"
            onClick={() => setActiveIndex(null)}
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-zinc-900/90 text-white transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Imagen anterior"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((activeIndex - 1 + images.length) % images.length);
                }}
                className="absolute left-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-zinc-900/90 text-white transition hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Imagen siguiente"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((activeIndex + 1) % images.length);
                }}
                className="absolute right-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-zinc-900/90 text-white transition hover:bg-white/20"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative h-[78vh] w-full max-w-5xl"
          >
            <Image
              src={images[activeIndex]}
              alt={`${title} - vista ampliada ${activeIndex + 1}`}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </section>
  );
}
