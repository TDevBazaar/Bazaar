import type { SupabaseClient } from "@supabase/supabase-js";

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const MAX_SOURCE_IMAGE_BYTES = 25 * 1024 * 1024;
export const STORAGE_UPLOAD_LIMIT_BYTES = 10 * 1024 * 1024;
export const DEFAULT_IMAGE_MAX_DIMENSION = 1280;
export const ALREADY_LIGHT_IMAGE_BYTES = 220 * 1024;
export const HEAVY_IMAGE_THRESHOLD_BYTES = 350 * 1024;
export const HEAVY_LOSSLESS_THRESHOLD_BYTES = 120 * 1024;

const ADAPTIVE_TARGET_BYTES = 280 * 1024;

export interface OptimizeImageOptions {
  maxDimension?: number;
  preferredQuality?: number;
}

export interface OptimizedImageResult {
  blob: Blob;
  contentType: string;
  extension: string;
  originalBytes: number;
  optimizedBytes: number;
  width: number;
  height: number;
  wasOptimized: boolean;
}

export interface RemoteImageWeight {
  bytes: number | null;
  contentType: string | null;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function isSupportedImageType(mimeType: string): boolean {
  const clean = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(clean);
}

export function isHeavyImageMeta(
  bytes: number | null,
  contentType: string | null
): boolean {
  if (bytes === null || !Number.isFinite(bytes) || bytes <= 0) return false;
  const cleanType = contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (cleanType === "image/png" || cleanType === "image/avif") {
    return bytes > HEAVY_LOSSLESS_THRESHOLD_BYTES;
  }
  return bytes > HEAVY_IMAGE_THRESHOLD_BYTES;
}

export function inferMimeTypeFromNameOrUrl(value: string): string {
  const clean = value.split("?")[0]?.split("#")[0]?.trim().toLowerCase() ?? "";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".avif")) return "image/avif";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  return "";
}

export function isSupportedImageFile(file: File): boolean {
  const mime =
    file.type.split(";")[0]?.trim().toLowerCase() ||
    inferMimeTypeFromNameOrUrl(file.name);
  return isSupportedImageType(mime);
}

export function extensionForMimeType(mimeType: string): string {
  const clean = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (clean === "image/webp") return "webp";
  if (clean === "image/png") return "png";
  if (clean === "image/avif") return "avif";
  return "jpg";
}

export function extractStoragePathFromPublicUrl(
  rawUrl: string,
  bucket: string,
  supabaseUrl?: string
): string | null {
  try {
    const parsed = new URL(rawUrl.trim());
    if (supabaseUrl) {
      const expectedHost = new URL(supabaseUrl).hostname;
      if (parsed.hostname !== expectedHost) return null;
    } else if (!parsed.hostname.endsWith(".supabase.co")) {
      return null;
    }

    const prefix = `/storage/v1/object/public/${bucket}/`;
    if (!parsed.pathname.startsWith(prefix)) return null;
    const relative = decodeURIComponent(
      parsed.pathname.slice(prefix.length)
    ).replace(/^\/+/, "");
    return relative || null;
  } catch {
    return null;
  }
}

export async function inspectRemoteImageWeight(
  rawUrl: string,
  signal?: AbortSignal
): Promise<RemoteImageWeight | null> {
  const clean = rawUrl.trim();
  if (!/^https?:\/\//i.test(clean)) return null;
  try {
    const response = await fetch(clean, { method: "HEAD", signal });
    if (!response.ok) return null;
    const contentLengthHeader = response.headers.get("content-length");
    const parsedLength = contentLengthHeader
      ? Number.parseInt(contentLengthHeader, 10)
      : NaN;
    const bytes =
      Number.isFinite(parsedLength) && parsedLength > 0 ? parsedLength : null;
    const contentType = response.headers.get("content-type");
    return { bytes, contentType };
  } catch {
    return null;
  }
}

interface DecodedImageSurface {
  width: number;
  height: number;
  targetWidth: number;
  targetHeight: number;
  renderToCanvas: (background?: string) => HTMLCanvasElement;
  cleanup: () => void;
}

function createCanvasRenderer(
  source: CanvasImageSource,
  width: number,
  height: number,
  maxDimension: number,
  cleanup: () => void
): DecodedImageSurface {
  if (!width || !height) {
    cleanup();
    throw new Error("La imagen no tiene dimensiones válidas.");
  }
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  return {
    width,
    height,
    targetWidth,
    targetHeight,
    cleanup,
    renderToCanvas: (background?: string) => {
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("No pudimos inicializar el lienzo de compresión.");
      }
      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
      return canvas;
    },
  };
}

async function decodeImageSurface(
  blob: Blob,
  maxDimension: number
): Promise<DecodedImageSurface> {
  if (typeof createImageBitmap === "function") {
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(blob);
    } catch {
      throw new Error(
        "No pudimos procesar la imagen. Usa un archivo JPG, PNG, WebP o AVIF válido."
      );
    }
    return createCanvasRenderer(
      bitmap,
      bitmap.width,
      bitmap.height,
      maxDimension,
      () => bitmap.close()
    );
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () =>
        reject(
          new Error(
            "No pudimos procesar la imagen. Usa un archivo JPG, PNG, WebP o AVIF válido."
          )
        );
      el.src = objectUrl;
    });
    return createCanvasRenderer(
      img,
      img.naturalWidth,
      img.naturalHeight,
      maxDimension,
      () => URL.revokeObjectURL(objectUrl)
    );
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

async function encodeCanvas(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

export async function optimizeImageBlob(
  input: Blob,
  options: OptimizeImageOptions = {}
): Promise<OptimizedImageResult> {
  const maxDimension = options.maxDimension ?? DEFAULT_IMAGE_MAX_DIMENSION;
  const preferredQuality = options.preferredQuality ?? 0.82;
  const rawMime = input.type.split(";")[0]?.trim().toLowerCase() ?? "";
  const sourceMime =
    rawMime ||
    (input instanceof File ? inferMimeTypeFromNameOrUrl(input.name) : "");

  const decoded = await decodeImageSurface(input, maxDimension);
  try {
    const maxSide = Math.max(decoded.width, decoded.height);
    const alreadyOptimizedLossy =
      (sourceMime === "image/webp" || sourceMime === "image/jpeg") &&
      maxSide <= maxDimension &&
      input.size <= ALREADY_LIGHT_IMAGE_BYTES;
    const tinyPng =
      sourceMime === "image/png" &&
      maxSide <= maxDimension &&
      input.size <= 80 * 1024;

    if (alreadyOptimizedLossy || tinyPng) {
      return {
        blob: input,
        contentType: sourceMime,
        extension: extensionForMimeType(sourceMime),
        originalBytes: input.size,
        optimizedBytes: input.size,
        width: decoded.width,
        height: decoded.height,
        wasOptimized: false,
      };
    }

    return await encodeWithAdaptiveFallback(
      decoded,
      input,
      sourceMime,
      maxDimension,
      preferredQuality
    );
  } finally {
    decoded.cleanup();
  }
}

async function encodeWithAdaptiveFallback(
  decoded: DecodedImageSurface,
  input: Blob,
  sourceMime: string,
  maxDimension: number,
  preferredQuality: number
): Promise<OptimizedImageResult> {
  const transparentCanvas = decoded.renderToCanvas();
  let bestBlob = await encodeCanvas(
    transparentCanvas,
    "image/webp",
    preferredQuality
  );
  let targetMime = "image/webp";

  if (!bestBlob || bestBlob.type !== "image/webp") {
    const whiteCanvas = decoded.renderToCanvas("#FFFFFF");
    bestBlob = await encodeCanvas(whiteCanvas, "image/jpeg", preferredQuality);
    targetMime = "image/jpeg";
  }

  if (bestBlob && bestBlob.size > ADAPTIVE_TARGET_BYTES) {
    const secondCanvas =
      targetMime === "image/webp"
        ? transparentCanvas
        : decoded.renderToCanvas("#FFFFFF");
    for (const quality of [0.72, 0.62]) {
      const lighterBlob = await encodeCanvas(secondCanvas, targetMime, quality);
      if (
        lighterBlob &&
        lighterBlob.type === targetMime &&
        lighterBlob.size < bestBlob.size
      ) {
        bestBlob = lighterBlob;
      }
      if (bestBlob.size <= ADAPTIVE_TARGET_BYTES) break;
    }
  }

  if (!bestBlob) {
    return {
      blob: input,
      contentType: sourceMime || "image/jpeg",
      extension: extensionForMimeType(sourceMime || "image/jpeg"),
      originalBytes: input.size,
      optimizedBytes: input.size,
      width: decoded.width,
      height: decoded.height,
      wasOptimized: false,
    };
  }

  const maxSide = Math.max(decoded.width, decoded.height);
  const canKeepOriginal =
    (sourceMime === "image/webp" || sourceMime === "image/jpeg") &&
    maxSide <= maxDimension &&
    bestBlob.size >= input.size;

  if (canKeepOriginal) {
    return {
      blob: input,
      contentType: sourceMime,
      extension: extensionForMimeType(sourceMime),
      originalBytes: input.size,
      optimizedBytes: input.size,
      width: decoded.width,
      height: decoded.height,
      wasOptimized: false,
    };
  }

  return {
    blob: bestBlob,
    contentType: targetMime,
    extension: extensionForMimeType(targetMime),
    originalBytes: input.size,
    optimizedBytes: bestBlob.size,
    width: decoded.targetWidth,
    height: decoded.targetHeight,
    wasOptimized:
      bestBlob.size < input.size ||
      sourceMime !== targetMime ||
      decoded.targetWidth !== decoded.width ||
      decoded.targetHeight !== decoded.height,
  };
}

export async function fetchRemoteImageBlob(
  rawUrl: string,
  signal?: AbortSignal
): Promise<Blob> {
  const response = await fetch(rawUrl.trim(), { signal });
  if (!response.ok) {
    throw new Error(`No se pudo descargar la imagen (${response.status}).`);
  }
  const rawBlob = await response.blob();
  if (!rawBlob.size) {
    throw new Error("La imagen descargada está vacía.");
  }
  const blobMime = rawBlob.type.split(";")[0]?.trim().toLowerCase() ?? "";
  const headerMime =
    response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ??
    "";
  const inferred = inferMimeTypeFromNameOrUrl(rawUrl);
  const resolvedMime =
    blobMime && blobMime !== "application/octet-stream"
      ? blobMime
      : headerMime && headerMime !== "application/octet-stream"
        ? headerMime
        : inferred;

  if (resolvedMime && resolvedMime !== blobMime) {
    return new Blob([rawBlob], { type: resolvedMime });
  }
  return rawBlob;
}

export async function uploadOptimizedImageToStorage(
  supabase: SupabaseClient,
  bucket: string,
  folder: string,
  result: OptimizedImageResult
): Promise<{ publicUrl: string; storagePath: string }> {
  if (result.optimizedBytes > STORAGE_UPLOAD_LIMIT_BYTES) {
    throw new Error("Incluso tras optimizar, la imagen supera el límite de 10 MB.");
  }
  const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
  const fileName = `${crypto.randomUUID()}.${result.extension}`;
  const storagePath = cleanFolder ? `${cleanFolder}/${fileName}` : fileName;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, result.blob, {
      upsert: false,
      cacheControl: "31536000",
      contentType: result.contentType,
    });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return { publicUrl: data.publicUrl, storagePath };
}
