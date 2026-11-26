"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  ExternalLink,
  Loader2,
  PackageOpen,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { DeveWordmark } from "@/components/brand/DeveWordmark";
import {
  ImagePreviewModal,
  ZoomableThumb,
  type PreviewImageData,
} from "@/components/store/ImagePreviewModal";
import { formatPrice, formatPriceLabel } from "@/lib/store/format";
import type { OrderPreviewData } from "@/lib/store/order-preview";
import { fetchProductsByIds } from "@/lib/store/powergy-api";

interface OrderPreviewClientProps {
  order: OrderPreviewData;
}

export function OrderPreviewClient({ order }: OrderPreviewClientProps) {
  const [data, setData] = useState<OrderPreviewData>(order);
  const [retrying, setRetrying] = useState(false);
  const [previewImage, setPreviewImage] = useState<PreviewImageData | null>(
    null
  );

  const hasMissing = data.lines.some((line) => !line.available);
  const adminHref = `/tienda/admin?order=${encodeURIComponent(data.reference)}`;

  const loadProductsByIds = async (
    missingIds: string[],
    signal?: AbortSignal
  ) => {
    if (missingIds.length === 0) return;

    setRetrying(true);
    try {
      const products = await fetchProductsByIds(missingIds, new Map(), signal);
      const byId = new Map(products.map((p) => [p.id, p]));
      setData((prev) => {
        const nextLines = prev.lines.map((line) => {
          const found = byId.get(line.productId);
          if (!found) return line;
          const unitPrice = found.price > 0 ? found.price : 0;
          return {
            productId: found.id,
            slug: found.slug || found.id,
            name: found.name,
            categoryName: found.categoryName || "Deve",
            brand: found.brand || "",
            model: found.model || "",
            image: found.image || found.images[0] || "",
            qty: line.qty,
            unitPrice,
            lineTotal: unitPrice * line.qty,
            available: true,
            hasSnapshot: true,
          };
        });
        return {
          ...prev,
          lines: nextLines,
          totalQty: nextLines.reduce((sum, l) => sum + l.qty, 0),
          subtotal: nextLines.reduce((sum, l) => sum + l.lineTotal, 0),
          hasUnpriced: nextLines.some((l) => l.unitPrice <= 0),
        };
      });
    } catch {
      /* El usuario puede reintentar manualmente */
    } finally {
      if (!signal?.aborted) setRetrying(false);
    }
  };

  useEffect(() => {
    const missingIds = order.lines
      .filter((l) => !l.available)
      .map((l) => l.productId);
    if (missingIds.length === 0) return;
    const controller = new AbortController();
    fetchProductsByIds(missingIds, new Map(), controller.signal)
      .then((products) => {
        if (controller.signal.aborted) return;
        const byId = new Map(products.map((p) => [p.id, p]));
        setData((prev) => {
          const nextLines = prev.lines.map((line) => {
            const found = byId.get(line.productId);
            if (!found) return line;
            const unitPrice = found.price > 0 ? found.price : 0;
            return {
              productId: found.id,
              slug: found.slug || found.id,
              name: found.name,
              categoryName: found.categoryName || "Deve",
              brand: found.brand || "",
              model: found.model || "",
              image: found.image || found.images[0] || "",
              qty: line.qty,
              unitPrice,
              lineTotal: unitPrice * line.qty,
              available: true,
              hasSnapshot: true,
            };
          });
          return {
            ...prev,
            lines: nextLines,
            totalQty: nextLines.reduce((sum, l) => sum + l.qty, 0),
            subtotal: nextLines.reduce((sum, l) => sum + l.lineTotal, 0),
            hasUnpriced: nextLines.some((l) => l.unitPrice <= 0),
          };
        });
      })
      .catch(() => {
        /* El usuario puede reintentar manualmente */
      });
    return () => controller.abort();
  }, [order.lines]);

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/tienda"
            className="inline-flex items-center gap-2 transition hover:opacity-85"
          >
            <DeveWordmark size="sm" textColorClass="text-zinc-950" priority />
            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-violet-800">
              Tienda
            </span>
          </Link>

          <Link
            href="/tienda"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-800 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Ir a la tienda
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
                Vista rápida de pedido
              </p>
              <h1 className="mt-1.5 break-all font-mono text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                #{data.reference}
              </h1>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 sm:text-sm">
                Toca cualquier foto para ver el producto en tamaño grande.
              </p>
            </div>

            {data.lines.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-xs font-semibold text-zinc-800">
                  <ShoppingBag className="h-3.5 w-3.5 text-violet-700" />
                  {data.totalQty}{" "}
                  {data.totalQty === 1 ? "artículo" : "artículos"}
                </span>
                <span className="inline-flex items-center rounded-full bg-zinc-950 px-4 py-1.5 text-xs font-bold text-white">
                  Total{" "}
                  {data.subtotal > 0
                    ? formatPrice(data.subtotal)
                    : "por confirmar"}
                </span>
              </div>
            )}
          </div>

          {hasMissing && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-600">
              <span className="inline-flex items-center gap-2">
                {retrying && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-600" />
                )}
                {retrying
                  ? "Cargando fotos y precios del catálogo…"
                  : "Algunas fotos tardaron en responder desde el servidor."}
              </span>
              {!retrying && (
                <button
                  type="button"
                  onClick={() =>
                    void loadProductsByIds(
                      data.lines
                        .filter((line) => !line.available)
                        .map((line) => line.productId)
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-900 transition hover:bg-zinc-100"
                >
                  <RefreshCw className="h-3 w-3" />
                  Reintentar
                </button>
              )}
            </div>
          )}
        </section>

        {data.lines.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-zinc-200 bg-white px-6 py-14 text-center shadow-xs">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <PackageOpen className="h-7 w-7" />
            </span>
            <h2 className="mt-4 font-display text-lg font-bold text-zinc-950">
              No pudimos cargar los artículos de este enlace
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
              El enlace está incompleto o los productos ya no están disponibles.
              Puedes abrir el pedido directamente en el panel de administración.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
              <Link
                href={adminHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#6018F8] px-6 text-sm font-semibold text-white shadow-sm shadow-violet-600/25 transition hover:bg-[#5010E8]"
              >
                <ClipboardList className="h-4 w-4" />
                Abrir en Admin
              </Link>
              <Link
                href="/tienda"
                className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
              >
                Explorar catálogo
              </Link>
            </div>
          </section>
        ) : (
          <>
            <ul className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
              {data.lines.map((line) => (
                <li
                  key={line.productId}
                  className="flex w-full min-w-0 items-center gap-3.5 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-2xs sm:p-4"
                >
                  <div className="relative shrink-0">
                    <ZoomableThumb
                      src={line.image}
                      alt={line.name}
                      onPreview={setPreviewImage}
                      priority
                      className="h-28 w-24 rounded-xl sm:h-32 sm:w-28"
                    />
                    <span className="pointer-events-none absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#6018F8] px-1.5 text-[11px] font-bold text-white shadow-xs">
                      ×{line.qty}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch py-0.5">
                    <div className="min-w-0">
                      <p className="truncate text-[10.5px] font-bold uppercase tracking-[0.14em] text-violet-700">
                        {line.categoryName}
                      </p>
                      <h2 className="mt-1 line-clamp-2 [overflow-wrap:anywhere] text-sm font-semibold leading-snug text-zinc-950 sm:text-[15px]">
                        {line.name}
                      </h2>
                      {(line.brand || line.model) && (
                        <p className="mt-0.5 truncate text-[11.5px] text-zinc-500">
                          {[line.brand, line.model].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-base font-bold leading-none text-zinc-950 tabular-nums">
                          {formatPriceLabel(line.lineTotal)}
                        </p>
                        {line.qty > 1 && line.unitPrice > 0 && (
                          <p className="mt-1 text-[11px] text-zinc-500 tabular-nums">
                            {formatPrice(line.unitPrice)} c/u
                          </p>
                        )}
                      </div>

                      {line.available && (
                        <Link
                          href={`/tienda/${encodeURIComponent(line.slug)}`}
                          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-800 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
                        >
                          <span>Ficha</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs sm:p-6">
              <div className="space-y-2.5 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-zinc-600">Subtotal</span>
                  <span className="font-semibold text-zinc-950 tabular-nums">
                    {formatPrice(data.subtotal)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-zinc-600">Entrega / envío</span>
                  <span className="text-xs font-semibold text-violet-700">
                    Por confirmar por WhatsApp
                  </span>
                </div>
                <hr className="border-zinc-200" />
                <div className="flex items-baseline justify-between gap-3 text-base">
                  <span className="font-semibold text-zinc-950">
                    Total productos
                  </span>
                  <span className="font-bold text-zinc-950 tabular-nums">
                    {formatPrice(data.subtotal)}
                  </span>
                </div>
              </div>

              {data.hasUnpriced && (
                <p className="mt-3 rounded-2xl border border-violet-200/70 bg-violet-50/70 p-3 text-xs leading-relaxed text-violet-900">
                  Incluye artículos sin precio publicado (se confirman por
                  WhatsApp).
                </p>
              )}

              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                <Link
                  href={adminHref}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#6018F8] px-6 text-sm font-semibold text-white shadow-sm shadow-violet-600/25 transition hover:bg-[#5010E8]"
                >
                  <ClipboardList className="h-4 w-4" />
                  Abrir pedido en Admin
                </Link>
                <Link
                  href="/tienda"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                >
                  Ir al catálogo
                </Link>
              </div>
            </section>
          </>
        )}
      </main>

      <ImagePreviewModal
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}
