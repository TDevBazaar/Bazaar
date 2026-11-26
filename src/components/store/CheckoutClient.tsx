"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  MessageCircle,
  ShoppingBag,
} from "lucide-react";
import {
  ImagePreviewModal,
  ZoomableThumb,
  type PreviewImageData,
} from "@/components/store/ImagePreviewModal";
import { MAX_ORDER_LINES, useShopStore } from "@/lib/store/cart-store";
import {
  cartSubtotal,
  hasUnpricedLines,
  useCartLinesState,
} from "@/lib/store/catalog";
import { formatPrice, formatPriceLabel } from "@/lib/store/format";
import {
  buildOrderPreviewImagePath,
  buildOrderPreviewPath,
} from "@/lib/store/order-preview";
import { STORE_KEY, apiSend, type ApiOrder } from "@/lib/store/powergy-api";
import { resolveActiveReferralForCheckout } from "@/lib/store/referral";
import type { CartLine, OrderSummary } from "@/lib/store/types";
import { buildStoreWhatsAppUrl } from "@/lib/store/whatsapp";

function buildWhatsAppMessage(
  reference: string,
  lines: CartLine[],
  subtotal: number,
  previewUrl: string,
  adminUrl: string
): string {
  const detalle = lines
    .map(
      (l) =>
        `• ${l.qty} × ${l.product.name} — ${
          l.product.price > 0 ? formatPrice(l.lineTotal) : "precio por confirmar"
        }`
    )
    .join("\n");

  return [
    "Hola Deve, quiero confirmar este pedido de la tienda.",
    "",
    `📋 Pedido: ${reference}`,
    "",
    "Artículos:",
    detalle,
    "",
    `Subtotal: ${formatPrice(subtotal)}`,
    "Entrega / envío: Por confirmar vía WhatsApp",
    `Total productos: ${formatPrice(subtotal)}`,
    "",
    "🖼️ Vista previa con fotos:",
    previewUrl,
    "",
    "🔗 Enlace directo al pedido (Admin):",
    adminUrl,
  ].join("\n");
}

export function CheckoutClient() {
  const { lines, pending } = useCartLinesState();
  const clearCart = useShopStore((s) => s.clearCart);
  const [confirmed, setConfirmed] = useState<OrderSummary | null>(null);
  const [whatsappLink, setWhatsappLink] = useState("");
  const [confirmedPhone, setConfirmedPhone] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [previewImage, setPreviewImage] = useState<PreviewImageData | null>(
    null
  );

  const subtotal = cartSubtotal(lines);
  const unpriced = hasUnpricedLines(lines);

  const previewItems = useMemo(
    () =>
      lines.map((l) => ({
        productId: l.productId,
        qty: l.qty,
        name: l.product.name,
        price: l.product.price,
        image: l.product.images[0] || l.product.image,
        categoryName: l.product.categoryName,
        slug: l.product.slug,
      })),
    [lines]
  );

  const warmupPath =
    previewItems.length > 0
      ? buildOrderPreviewImagePath("warmup", previewItems)
      : "";

  // Pre-calienta el generador Open Graph mientras el usuario revisa el resumen
  useEffect(() => {
    if (confirmed || !warmupPath) return;
    const controller = new AbortController();
    void fetch(warmupPath, { signal: controller.signal }).catch(() => {});
    return () => controller.abort();
  }, [confirmed, warmupPath]);

  // Refresca el teléfono del vendedor referido (?v=) antes de confirmar
  useEffect(() => {
    if (confirmed || lines.length === 0) return;
    void resolveActiveReferralForCheckout(1500);
  }, [confirmed, lines.length]);

  if (confirmed) {
    return (
      <div className="mx-auto max-w-xl px-4 pb-20 pt-10 text-center sm:px-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-xs sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            ¡Pedido registrado!
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            Tu pedido{" "}
            <span className="font-mono font-bold text-zinc-950">
              {confirmed.id}
            </span>{" "}
            quedó registrado. Te estamos redirigiendo a WhatsApp para confirmar
            disponibilidad, pago y entrega…
          </p>

          <div className="mt-6 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 text-left text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-zinc-600">Artículos</span>
              <span className="font-semibold text-zinc-950 tabular-nums">
                {confirmed.items.reduce((a, i) => a + i.qty, 0)}
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between gap-3">
              <span className="text-zinc-600">Entrega / envío</span>
              <span className="text-xs font-semibold text-violet-700">
                Confirmación por WhatsApp
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between gap-3">
              <span className="text-zinc-600">Total estimado</span>
              <span className="font-bold text-zinc-950 tabular-nums">
                {formatPrice(confirmed.total)}
              </span>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <a
              href={
                whatsappLink ||
                buildStoreWhatsAppUrl("Hola Deve, acabo de registrar un pedido.", confirmedPhone)
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm shadow-emerald-600/25 transition hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" />
              Continuar en WhatsApp
            </a>
            <Link
              href="/tienda"
              className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
              Seguir comprando
            </Link>
          </div>

          <Link
            href={`/tienda/admin?order=${encodeURIComponent(confirmed.id)}`}
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-violet-700"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Ver pedido #{confirmed.id} en el panel Admin
          </Link>
        </div>
      </div>
    );
  }

  if (pending && lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:px-6">
        <div className="h-80 animate-pulse rounded-3xl bg-zinc-100" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-xs">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            <ShoppingBag className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-zinc-950">
            No hay artículos para pedir
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Añade productos al carrito antes de completar tu solicitud.
          </p>
          <Link
            href="/tienda"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#6018F8] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5010E8]"
          >
            Ir al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault();
    if (lines.length > MAX_ORDER_LINES) {
      setSendError(
        `Cada pedido admite hasta ${MAX_ORDER_LINES} artículos distintos. Ajusta tu carrito antes de continuar.`
      );
      return;
    }

    setSending(true);
    setSendError("");
    try {
      const referral = await resolveActiveReferralForCheckout(1500);
      const respuesta = await apiSend<ApiOrder>("orders", {
        method: "POST",
        body: {
          store: STORE_KEY,
          idempotencyKey: crypto.randomUUID(),
          referralCode: referral?.code || undefined,
          items: lines.map((l) => ({
            productId: l.productId,
            quantity: l.qty,
          })),
        },
      });

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const previewUrl = `${origin}${buildOrderPreviewPath(
        respuesta.reference,
        previewItems
      )}`;
      const ogImageUrl = `${origin}${buildOrderPreviewImagePath(
        respuesta.reference,
        previewItems
      )}`;
      const adminUrl = `${origin}/tienda/admin?order=${encodeURIComponent(
        respuesta.reference
      )}`;

      const order: OrderSummary = {
        id: respuesta.reference,
        items: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
        subtotal,
        total: subtotal,
        status: respuesta.status,
        createdAt: respuesta.createdAt,
      };

      const mensaje = buildWhatsAppMessage(
        respuesta.reference,
        lines,
        subtotal,
        previewUrl,
        adminUrl
      );
      const sellerPhone = referral?.whatsAppPhone ?? null;
      setConfirmedPhone(sellerPhone);
      const urlWa = buildStoreWhatsAppUrl(mensaje, sellerPhone);
      setWhatsappLink(urlWa);

      clearCart();
      setConfirmed(order);
      window.scrollTo({ top: 0 });

      // Pre-cachea la vista previa visual y su imagen PNG antes de abrir WhatsApp
      await Promise.race([
        Promise.allSettled([fetch(previewUrl), fetch(ogImageUrl)]),
        new Promise<void>((resolve) => setTimeout(resolve, 1100)),
      ]);

      try {
        window.location.assign(urlWa);
      } catch {
        /* El usuario dispone del botón manual */
      }
    } catch (error) {
      setSendError(
        error instanceof Error
          ? error.message
          : "No pudimos registrar el pedido. Inténtalo de nuevo."
      );
    } finally {
      setSending(false);
    }
  };

  const totalQty = lines.reduce((a, l) => a + l.qty, 0);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-8 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
          Último paso
        </p>
        <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
          Confirmar pedido
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Revisa tu selección y confirma para generar tu referencia{" "}
          <span className="font-mono font-semibold text-zinc-900">DE-…</span> y
          continuar por WhatsApp con vista previa de fotos.
        </p>
      </header>

      <form onSubmit={handleConfirm} noValidate>
        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-base font-bold text-zinc-950">
              Tu selección
            </h2>
            <span className="text-xs font-semibold text-zinc-500">
              {totalQty} {totalQty === 1 ? "artículo" : "artículos"}
            </span>
          </div>

          <ul className="mt-4 max-h-96 space-y-3 overflow-y-auto pt-1.5 pr-1">
            {lines.map((l) => {
              const hasDiscount =
                l.product.onSale &&
                l.product.discountPercent !== null &&
                l.product.discountPercent > 0 &&
                l.product.price > 0 &&
                l.product.originalPrice > l.product.price;

              return (
                <li
                  key={l.productId}
                  className="flex min-w-0 items-center gap-3"
                >
                  <span className="relative shrink-0">
                    <ZoomableThumb
                      src={l.product.images[0]}
                      alt={l.product.name}
                      onPreview={setPreviewImage}
                      priority
                      className="h-16 w-16 rounded-xl"
                    />
                    <span className="pointer-events-none absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6018F8] px-1 text-[10px] font-bold text-white shadow-xs">
                      {l.qty}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 break-words text-sm font-semibold leading-snug text-zinc-950">
                      {l.product.name}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-zinc-500">
                      {l.product.categoryName}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    {hasDiscount ? (
                      <>
                        <span className="block text-sm font-bold text-rose-600 tabular-nums">
                          {formatPriceLabel(l.lineTotal)}
                        </span>
                        <span className="mt-0.5 flex items-center justify-end gap-1 text-[10.5px]">
                          <span className="text-zinc-400 line-through tabular-nums">
                            {formatPrice(l.product.originalPrice * l.qty)}
                          </span>
                          <span className="rounded-full bg-rose-100 px-1.5 py-0.5 font-bold text-rose-700 tabular-nums">
                            -{l.product.discountPercent}%
                          </span>
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-zinc-950 tabular-nums">
                        {formatPriceLabel(l.lineTotal)}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>

          <hr className="my-4 border-zinc-200" />

          <div className="space-y-2 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-zinc-600">Subtotal</span>
              <span className="font-semibold text-zinc-950 tabular-nums">
                {formatPrice(subtotal)}
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
              <span className="font-bold text-zinc-950">Total productos</span>
              <span className="font-display text-xl font-bold text-zinc-950 tabular-nums">
                {formatPrice(subtotal)}
              </span>
            </div>
          </div>

          {unpriced && (
            <p className="mt-3 rounded-2xl border border-violet-200/80 bg-violet-50/70 p-3 text-xs leading-relaxed text-violet-900">
              Tu pedido incluye artículos sin precio publicado: los confirmamos
              contigo por WhatsApp.
            </p>
          )}

          {sendError && (
            <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
              {sendError}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#6018F8] px-6 text-sm font-semibold text-white shadow-md shadow-violet-600/25 transition hover:bg-[#5010E8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MessageCircle className="h-4 w-4" />
            {sending ? "Registrando pedido…" : "Confirmar y abrir WhatsApp"}
          </button>

          <Link
            href="/tienda/carrito"
            className="mt-2.5 inline-flex h-10 w-full items-center justify-center rounded-full text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            Volver al carrito
          </Link>
        </section>
      </form>

      <ImagePreviewModal
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}
