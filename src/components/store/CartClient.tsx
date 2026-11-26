"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import {
  ImagePreviewModal,
  ZoomableThumb,
  type PreviewImageData,
} from "@/components/store/ImagePreviewModal";
import { QuantityStepper } from "@/components/store/QuantityStepper";
import {
  MAX_ORDER_LINES,
  MAX_QTY_PER_LINE,
  useShopStore,
} from "@/lib/store/cart-store";
import {
  cartSubtotal,
  hasUnpricedLines,
  useCartLinesState,
} from "@/lib/store/catalog";
import { formatPrice, formatPriceLabel } from "@/lib/store/format";

export function CartClient() {
  const { lines, pending } = useCartLinesState();
  const setQty = useShopStore((s) => s.setQty);
  const removeItem = useShopStore((s) => s.removeItem);
  const clearCart = useShopStore((s) => s.clearCart);
  const [previewImage, setPreviewImage] = useState<PreviewImageData | null>(
    null
  );

  const subtotal = cartSubtotal(lines);
  const unpriced = hasUnpricedLines(lines);
  const totalQty = lines.reduce((sum, l) => sum + l.qty, 0);
  const exceedsLimit = lines.length > MAX_ORDER_LINES;

  if (pending && lines.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200/80" />
          <div className="h-64 animate-pulse rounded-3xl bg-zinc-100" />
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-16 text-center shadow-xs">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            <ShoppingCart className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-zinc-950">
            Tu carrito está vacío
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
            Añade los productos que te interesen desde el catálogo y luego
            confirma tu pedido por WhatsApp.
          </p>
          <Link
            href="/tienda"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#6018F8] px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-600/25 transition hover:bg-[#5010E8]"
          >
            <ShoppingBag className="h-4 w-4" />
            Ir al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
            Deve Tienda
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-zinc-950 sm:text-4xl">
            Tu carrito
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {totalQty} {totalQty === 1 ? "artículo" : "artículos"} seleccionados
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Vaciar carrito
        </button>
      </div>

      {exceedsLimit && (
        <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs font-medium text-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <p>
            Cada pedido admite un máximo de {MAX_ORDER_LINES} productos
            distintos. Quita algunos artículos antes de continuar al resumen.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <ul className="space-y-3 lg:col-span-8">
          {lines.map((line) => {
            const hasDiscount =
              line.product.onSale &&
              line.product.discountPercent !== null &&
              line.product.discountPercent > 0 &&
              line.product.price > 0 &&
              line.product.originalPrice > line.product.price;

            return (
              <li
                key={line.productId}
                className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                  <ZoomableThumb
                    src={line.product.image}
                    alt={line.product.name}
                    onPreview={setPreviewImage}
                    priority
                    className="h-20 w-20 rounded-xl sm:h-24 sm:w-24"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                      {line.product.categoryName}
                    </p>
                    <Link
                      href={`/tienda/${encodeURIComponent(line.product.slug || line.product.id)}`}
                      className="mt-0.5 line-clamp-2 font-display text-sm font-bold text-zinc-950 transition hover:text-violet-700 sm:text-base"
                    >
                      {line.product.name}
                    </Link>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                      {hasDiscount ? (
                        <>
                          <span className="font-bold text-rose-600 tabular-nums">
                            {formatPrice(line.product.price)} c/u
                          </span>
                          <span className="text-zinc-400 line-through tabular-nums">
                            {formatPrice(line.product.originalPrice)}
                          </span>
                          <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                            -{line.product.discountPercent}%
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold text-zinc-600 tabular-nums">
                          {formatPriceLabel(line.product.price)}
                          {line.product.price > 0 ? " c/u" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-zinc-100 pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
                  <QuantityStepper
                    value={line.qty}
                    onChange={(next) => setQty(line.productId, next)}
                    min={1}
                    max={MAX_QTY_PER_LINE}
                    size="sm"
                  />

                  <div className="min-w-24 text-right">
                    <p className="font-display text-sm font-bold text-zinc-950 tabular-nums sm:text-base">
                      {formatPriceLabel(line.lineTotal)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(line.productId)}
                    aria-label={`Quitar ${line.product.name}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs sm:p-6 lg:sticky lg:top-32 lg:col-span-4">
          <h2 className="font-display text-lg font-bold text-zinc-950">
            Resumen del pedido
          </h2>

          <div className="mt-4 space-y-2.5 text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-zinc-600">Artículos</span>
              <span className="font-semibold text-zinc-950 tabular-nums">
                {totalQty}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-zinc-600">Subtotal estimado</span>
              <span className="font-semibold text-zinc-950 tabular-nums">
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-zinc-600">Envío / entrega</span>
              <span className="text-xs font-semibold text-violet-700">
                Confirmar por WhatsApp
              </span>
            </div>
            <hr className="border-zinc-200" />
            <div className="flex items-baseline justify-between gap-2 text-base">
              <span className="font-bold text-zinc-950">Total productos</span>
              <span className="font-display text-xl font-bold text-zinc-950 tabular-nums">
                {formatPrice(subtotal)}
              </span>
            </div>
          </div>

          {unpriced && (
            <p className="mt-4 rounded-2xl border border-violet-200/80 bg-violet-50/70 p-3 text-xs leading-relaxed text-violet-900">
              Incluye artículos con precio «Consultar». Confirmaremos el valor
              final contigo por WhatsApp.
            </p>
          )}

          {exceedsLimit ? (
            <button
              type="button"
              disabled
              className="mt-6 inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-zinc-200 px-5 text-sm font-semibold text-zinc-500"
            >
              Reduce a máx. {MAX_ORDER_LINES} artículos
            </button>
          ) : (
            <Link
              href="/tienda/checkout"
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#6018F8] px-5 text-sm font-semibold text-white shadow-md shadow-violet-600/25 transition hover:bg-[#5010E8]"
            >
              Continuar al pedido
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}

          <Link
            href="/tienda"
            className="mt-2.5 inline-flex h-10 w-full items-center justify-center rounded-full border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            Seguir comprando
          </Link>
        </aside>
      </div>

      <ImagePreviewModal
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}
