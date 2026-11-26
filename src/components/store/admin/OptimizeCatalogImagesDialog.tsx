"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CheckCircle2,
  ImageDown,
  Loader2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { AdminModal } from "@/components/store/admin/AdminModal";
import {
  buildProductPayloadFromApi,
  fetchAllAdminProducts,
  updateProduct,
} from "@/lib/store/admin-api";
import {
  HEAVY_IMAGE_THRESHOLD_BYTES,
  extractStoragePathFromPublicUrl,
  fetchRemoteImageBlob,
  formatFileSize,
  inspectRemoteImageWeight,
  isHeavyImageMeta,
  optimizeImageBlob,
  uploadOptimizedImageToStorage,
} from "@/lib/store/image-upload";
import { STORE_KEY, type ApiProduct } from "@/lib/store/powergy-api";
import { STORAGE_BUCKET } from "@/lib/store/supabase";

type CandidateStatus = "pending" | "processing" | "done" | "skipped" | "error";

interface HeavyImageCandidate {
  product: ApiProduct;
  originalBytes: number;
  contentType: string | null;
  status: CandidateStatus;
  optimizedBytes?: number;
  note?: string;
}

interface ScanReport {
  totalProducts: number;
  inspectedCount: number;
  unreadableCount: number;
  totalMeasuredBytes: number;
  candidates: HeavyImageCandidate[];
  urlRefCounts: Record<string, number>;
}

interface OptimizeCatalogImagesDialogProps {
  open: boolean;
  onClose: () => void;
  token: string;
  supabase: SupabaseClient | null;
  storageFolder?: string;
  onCompleted: (updatedImages: Record<string, string>) => void;
}

const SCAN_CONCURRENCY = 6;

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function next() {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await worker(items[idx]);
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, Math.max(1, items.length)) },
    () => next()
  );
  await Promise.all(workers);
  return results;
}

function shortFormatLabel(mimeType: string | null): string {
  const clean = mimeType?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (clean === "image/png") return "PNG";
  if (clean === "image/webp") return "WebP";
  if (clean === "image/avif") return "AVIF";
  if (clean === "image/jpeg") return "JPG";
  return "Imagen";
}

export function OptimizeCatalogImagesDialog(
  props: OptimizeCatalogImagesDialogProps
) {
  if (!props.open) return null;
  return <OptimizeCatalogImagesDialogContent {...props} />;
}

function OptimizeCatalogImagesDialogContent({
  open,
  onClose,
  token,
  supabase,
  storageFolder = STORE_KEY,
  onCompleted,
}: OptimizeCatalogImagesDialogProps) {
  const [scanNonce, setScanNonce] = useState(0);
  const [resolvedNonce, setResolvedNonce] = useState(-1);
  const [optimizing, setOptimizing] = useState(false);
  const [scanError, setScanError] = useState("");
  const [report, setReport] = useState<ScanReport | null>(null);
  const [progressText, setProgressText] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const scanning = Boolean(token) && resolvedNonce !== scanNonce;

  const triggerRescan = useCallback(() => {
    setScanError("");
    setProgressText("");
    setScanNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    abortRef.current = controller;
    const currentNonce = scanNonce;

    fetchAllAdminProducts(token, controller.signal)
      .then(async (products) => {
        if (controller.signal.aborted) return;

        const urlRefCounts: Record<string, number> = {};
        for (const product of products) {
          const cleanUrl = product.primary_image.trim();
          if (cleanUrl) {
            urlRefCounts[cleanUrl] = (urlRefCounts[cleanUrl] ?? 0) + 1;
          }
        }

        const uniqueUrls = Object.keys(urlRefCounts).filter((u) =>
          /^https?:\/\//i.test(u)
        );
        const urlWeights = new Map<
          string,
          { bytes: number | null; contentType: string | null } | null
        >();

        await mapWithConcurrency(uniqueUrls, SCAN_CONCURRENCY, async (url) => {
          if (controller.signal.aborted) return;
          const meta = await inspectRemoteImageWeight(url, controller.signal);
          urlWeights.set(url, meta);
        });

        if (controller.signal.aborted) return;

        let inspectedCount = 0;
        let unreadableCount = 0;
        let totalMeasuredBytes = 0;
        const countedUrls = new Set<string>();
        const candidates: HeavyImageCandidate[] = [];

        for (const product of products) {
          const cleanUrl = product.primary_image.trim();
          if (!/^https?:\/\//i.test(cleanUrl)) {
            if (cleanUrl) unreadableCount += 1;
            continue;
          }

          const meta = urlWeights.get(cleanUrl);
          if (!meta || meta.bytes === null) {
            unreadableCount += 1;
            continue;
          }

          inspectedCount += 1;
          if (!countedUrls.has(cleanUrl)) {
            countedUrls.add(cleanUrl);
            totalMeasuredBytes += meta.bytes;
          }

          if (isHeavyImageMeta(meta.bytes, meta.contentType)) {
            candidates.push({
              product,
              originalBytes: meta.bytes,
              contentType: meta.contentType,
              status: "pending",
            });
          }
        }

        candidates.sort((a, b) => b.originalBytes - a.originalBytes);
        setScanError("");
        setReport({
          totalProducts: products.length,
          inspectedCount,
          unreadableCount,
          totalMeasuredBytes,
          candidates,
          urlRefCounts,
        });
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setScanError(
          error instanceof Error
            ? error.message
            : "No se pudo analizar el catálogo."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setResolvedNonce(currentNonce);
        }
      });

    return () => {
      controller.abort();
    };
  }, [token, scanNonce]);

  const updateCandidate = (
    productId: string,
    patch: Partial<HeavyImageCandidate>
  ) => {
    setReport((prev) =>
      prev
        ? {
            ...prev,
            candidates: prev.candidates.map((item) =>
              item.product.id === productId ? { ...item, ...patch } : item
            ),
          }
        : prev
    );
  };

  const optimizeAllPending = async () => {
    if (!report || !token || !supabase || optimizing) return;
    const pendingList = report.candidates.filter(
      (c) => c.status === "pending" || c.status === "error"
    );
    if (pendingList.length === 0) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setOptimizing(true);
    const refCounts: Record<string, number> = { ...report.urlRefCounts };
    const uploadCache = new Map<
      string,
      { publicUrl: string; optimizedBytes: number }
    >();
    const obsoleteStoragePaths = new Set<string>();
    const updatedImages: Record<string, string> = {};
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

    let savedBytesTotal = 0;
    let optimizedCount = 0;

    try {
      for (let i = 0; i < pendingList.length; i += 1) {
        if (controller.signal.aborted) break;
        const candidate = pendingList[i];
        const product = candidate.product;
        const oldUrl = product.primary_image.trim();

        setProgressText(
          `Optimizando ${i + 1} de ${pendingList.length}: ${product.name}`
        );
        updateCandidate(product.id, { status: "processing", note: undefined });

        try {
          let cached = uploadCache.get(oldUrl);
          if (!cached) {
            const rawBlob = await fetchRemoteImageBlob(
              oldUrl,
              controller.signal
            );
            const result = await optimizeImageBlob(rawBlob);

            if (
              !result.wasOptimized ||
              result.optimizedBytes >= rawBlob.size
            ) {
              updateCandidate(product.id, {
                status: "skipped",
                note: "Ya está en su menor peso",
              });
              continue;
            }

            const uploaded = await uploadOptimizedImageToStorage(
              supabase,
              STORAGE_BUCKET,
              storageFolder,
              result
            );
            cached = {
              publicUrl: uploaded.publicUrl,
              optimizedBytes: result.optimizedBytes,
            };
            uploadCache.set(oldUrl, cached);
          }

          await updateProduct(
            token,
            product.id,
            buildProductPayloadFromApi(product, {
              primaryImage: cached.publicUrl,
            })
          );

          updatedImages[product.id] = cached.publicUrl;
          optimizedCount += 1;
          savedBytesTotal += Math.max(
            0,
            candidate.originalBytes - cached.optimizedBytes
          );

          refCounts[oldUrl] = Math.max(0, (refCounts[oldUrl] ?? 1) - 1);
          refCounts[cached.publicUrl] = (refCounts[cached.publicUrl] ?? 0) + 1;
          if (refCounts[oldUrl] === 0) {
            const oldStoragePath = extractStoragePathFromPublicUrl(
              oldUrl,
              STORAGE_BUCKET,
              supabaseUrl
            );
            if (oldStoragePath?.startsWith(`${storageFolder}/`)) {
              obsoleteStoragePaths.add(oldStoragePath);
            }
          }

          const pct = Math.max(
            1,
            Math.round(
              ((candidate.originalBytes - cached.optimizedBytes) /
                candidate.originalBytes) *
                100
            )
          );
          updateCandidate(product.id, {
            status: "done",
            optimizedBytes: cached.optimizedBytes,
            note: `-${pct}%`,
          });
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            updateCandidate(product.id, {
              status: "pending",
              note: "Detenida",
            });
            break;
          }
          updateCandidate(product.id, {
            status: "error",
            note:
              error instanceof Error
                ? error.message
                : "No se pudo optimizar.",
          });
        }
      }

      if (obsoleteStoragePaths.size > 0) {
        try {
          await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([...obsoleteStoragePaths]);
        } catch {
          /* Ignorar fallo al limpiar copia anterior */
        }
      }

      if (optimizedCount > 0) {
        onCompleted(updatedImages);
        toast.success(
          `${optimizedCount} ${optimizedCount === 1 ? "imagen optimizada" : "imágenes optimizadas"}`,
          {
            description: `Ahorro estimado: ${formatFileSize(savedBytesTotal)}`,
          }
        );
      }
    } finally {
      setOptimizing(false);
      setProgressText("");
    }
  };

  const pendingCandidates =
    report?.candidates.filter(
      (c) => c.status === "pending" || c.status === "error"
    ) ?? [];
  const totalHeavyBytes =
    report?.candidates.reduce((sum, c) => sum + c.originalBytes, 0) ?? 0;

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-xl"
      title={
        <span className="inline-flex items-center gap-2">
          <ImageDown className="h-5 w-5 text-violet-700" />
          Optimizar imágenes pesadas
        </span>
      }
      description="Detecta fotos pesadas (como PNGs grandes), las convierte a WebP ligero (máx. 1280 px) y actualiza cada producto automáticamente."
      footer={
        optimizing ? (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className="inline-flex h-10 items-center rounded-full border border-zinc-300 bg-white px-4 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
          >
            Detener
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-full border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={triggerRescan}
              disabled={scanning}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Volver a analizar
            </button>
            {pendingCandidates.length > 0 && (
              <button
                type="button"
                onClick={() => void optimizeAllPending()}
                disabled={!supabase || scanning}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#6018F8] px-5 text-xs font-semibold text-white transition hover:bg-[#5010E8] disabled:opacity-50"
              >
                <ImageDown className="h-4 w-4" />
                Optimizar todas ({pendingCandidates.length})
              </button>
            )}
          </>
        )
      }
    >
      {scanning ? (
        <div className="flex flex-col items-center justify-center gap-2.5 rounded-2xl bg-zinc-50 px-4 py-10 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
          <p className="text-sm font-semibold text-zinc-900">
            Analizando peso de las imágenes del catálogo…
          </p>
          <p className="text-xs text-zinc-500">Esto tarda solo unos segundos.</p>
        </div>
      ) : scanError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{scanError}</span>
          </p>
        </div>
      ) : report ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-3.5 text-xs sm:grid-cols-3">
            <div>
              <p className="text-zinc-500">Productos revisados</p>
              <p className="mt-0.5 text-sm font-bold text-zinc-950 tabular-nums">
                {report.totalProducts}
              </p>
            </div>
            <div>
              <p className="text-zinc-500">Peso medido</p>
              <p className="mt-0.5 text-sm font-bold text-zinc-950 tabular-nums">
                {formatFileSize(report.totalMeasuredBytes)}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-zinc-500">Por optimizar</p>
              <p
                className={`mt-0.5 text-sm font-bold tabular-nums ${
                  report.candidates.length > 0
                    ? "text-rose-600"
                    : "text-emerald-700"
                }`}
              >
                {report.candidates.length}{" "}
                {report.candidates.length === 1 ? "imagen" : "imágenes"}
                {totalHeavyBytes > 0 && ` (${formatFileSize(totalHeavyBytes)})`}
              </p>
            </div>
          </div>

          {report.unreadableCount > 0 && (
            <p className="text-xs text-zinc-500">
              {report.unreadableCount}{" "}
              {report.unreadableCount === 1
                ? "imagen externa no permitió medir su tamaño."
                : "imágenes externas no permitieron medir su tamaño."}
            </p>
          )}

          {report.candidates.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-8 text-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              <p className="text-sm font-bold text-zinc-950">
                Todas las imágenes medibles ya están optimizadas
              </p>
              <p className="max-w-sm text-xs leading-relaxed text-zinc-600">
                No se encontraron fotos mayores a{" "}
                {formatFileSize(HEAVY_IMAGE_THRESHOLD_BYTES)} ni PNG/AVIF
                pesados.
              </p>
            </div>
          ) : (
            <ul className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
              {report.candidates.map((item) => (
                <li
                  key={item.product.id}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-2.5"
                >
                  <img
                    src={item.product.primary_image}
                    alt={item.product.name}
                    className="h-12 w-12 shrink-0 rounded-lg bg-zinc-100 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-zinc-950">
                      {item.product.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-700 tabular-nums">
                        {shortFormatLabel(item.contentType)} ·{" "}
                        {formatFileSize(item.originalBytes)}
                      </span>
                      {item.status === "done" && item.optimizedBytes && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800 tabular-nums">
                          → {formatFileSize(item.optimizedBytes)}{" "}
                          {item.note ?? ""}
                        </span>
                      )}
                      {item.status === "skipped" && item.note && (
                        <span className="text-zinc-500">{item.note}</span>
                      )}
                      {item.status === "error" && item.note && (
                        <span className="text-rose-600">{item.note}</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {item.status === "processing" && (
                      <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                    )}
                    {item.status === "done" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    )}
                    {item.status === "error" && (
                      <TriangleAlert className="h-4 w-4 text-rose-600" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {progressText && (
            <p className="flex items-center gap-2 text-xs font-medium text-zinc-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-600" />
              <span className="truncate">{progressText}</span>
            </p>
          )}
        </div>
      ) : null}
    </AdminModal>
  );
}
