"use client";

/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";

const ALLOWED_IMAGE_HOSTS = (() => {
  const hosts = new Set<string>(["fqyrdzljxsdhgeysdhoc.supabase.co"]);
  try {
    const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    if (raw) {
      hosts.add(new URL(raw).hostname);
    }
  } catch {
    // Usar el host por defecto si NEXT_PUBLIC_SUPABASE_URL no es válida.
  }
  return hosts;
})();

function isNextOptimizableSrc(src: string): boolean {
  if (!src) return false;
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    const parsed = new URL(src);
    return (
      parsed.protocol === "https:" &&
      ALLOWED_IMAGE_HOSTS.has(parsed.hostname) &&
      parsed.pathname.startsWith("/storage/v1/object/public/")
    );
  } catch {
    return false;
  }
}

type IntersectCallback = () => void;

const viewportObservers = new Map<
  string,
  {
    observer: IntersectionObserver;
    targets: Map<Element, IntersectCallback>;
  }
>();

function observeViewport(
  element: Element,
  rootMargin: string,
  onEnter: IntersectCallback
): () => void {
  if (typeof IntersectionObserver === "undefined") {
    onEnter();
    return () => {};
  }

  let entry = viewportObservers.get(rootMargin);
  if (!entry) {
    const targets = new Map<Element, IntersectCallback>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const item of entries) {
          if (item.isIntersecting) {
            const callback = targets.get(item.target);
            if (callback) {
              targets.delete(item.target);
              observer.unobserve(item.target);
              callback();
            }
          }
        }
      },
      { root: null, rootMargin, threshold: 0 }
    );
    entry = { observer, targets };
    viewportObservers.set(rootMargin, entry);
  }

  entry.targets.set(element, onEnter);
  entry.observer.observe(element);

  return () => {
    entry.targets.delete(element);
    entry.observer.unobserve(element);
  };
}

export interface LazyImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  sizes?: string;
  priority?: boolean;
  rootMargin?: string;
  fallbackIconSize?: "sm" | "md";
}

const DEFAULT_SIZES = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";

export function LazyImage({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  sizes = DEFAULT_SIZES,
  priority = false,
  rootMargin = "100px 0px",
  fallbackIconSize = "md",
}: LazyImageProps) {
  const cleanSrc = src?.trim() ?? "";
  const containerRef = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(priority);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [bypassOptimizerSrc, setBypassOptimizerSrc] = useState<string | null>(
    null
  );

  const shouldLoad = priority || inView;
  const loaded = Boolean(cleanSrc) && loadedSrc === cleanSrc;
  const failed = Boolean(cleanSrc) && failedSrc === cleanSrc;
  const useNextImage =
    isNextOptimizableSrc(cleanSrc) && bypassOptimizerSrc !== cleanSrc;

  useEffect(() => {
    if (priority || inView || !cleanSrc) return;
    const node = containerRef.current;
    if (!node) return;

    return observeViewport(node, rootMargin, () => {
      setInView(true);
    });
  }, [priority, inView, cleanSrc, rootMargin]);

  const handleImgRef = (node: HTMLImageElement | null) => {
    if (!node || !cleanSrc || loadedSrc === cleanSrc) return;
    if (node.complete && node.naturalWidth > 0) {
      setLoadedSrc(cleanSrc);
    }
  };

  const animClass = priority
    ? className
    : `transition-all duration-500 ease-out ${loaded ? "scale-100 opacity-100" : "scale-95 opacity-0"} ${className}`;

  return (
    <span
      ref={containerRef}
      className={`relative block overflow-hidden bg-zinc-100 ${wrapperClassName}`}
    >
      {!cleanSrc || failed ? (
        <span className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-400">
          <ImageOff className={fallbackIconSize === "sm" ? "h-4 w-4" : "h-6 w-6"} />
        </span>
      ) : (
        <>
          {!loaded && (
            <span className="absolute inset-0 animate-pulse bg-zinc-200/70" />
          )}
          {shouldLoad &&
            (useNextImage ? (
              <Image
                ref={handleImgRef}
                src={cleanSrc}
                alt={alt}
                fill
                sizes={sizes}
                priority={priority}
                loading={priority ? undefined : "eager"}
                decoding="async"
                onLoad={() => setLoadedSrc(cleanSrc)}
                onError={() => setBypassOptimizerSrc(cleanSrc)}
                className={`object-cover ${animClass}`}
              />
            ) : (
              <img
                ref={handleImgRef}
                src={cleanSrc}
                alt={alt}
                loading="eager"
                decoding="async"
                onLoad={() => setLoadedSrc(cleanSrc)}
                onError={() => setFailedSrc(cleanSrc)}
                className={`relative h-full w-full object-cover ${animClass}`}
              />
            ))}
        </>
      )}
    </span>
  );
}
