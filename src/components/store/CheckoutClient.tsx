"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  Handshake,
  MessageCircle,
  ShoppingBag,
  Store,
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
import {
  readStoredReferral,
  resolveActiveReferralForCheckout,
} from "@/lib/store/referral";
import type { CartLine, OrderSummary } from "@/lib/store/types";
import { buildStoreWhatsAppUrl } from "@/lib/store/whatsapp";

interface SellerOrderGroup {
  key: string;
  sellerName: string;
  sellerHandle: string | null;
  sellerPhone: string | null;
  lines: CartLine[];
  subtotal: number;
}

function buildWhatsAppMessage(
  order: ApiOrder,
  lines: CartLine[],
  subtotal: number,
  previewUrl: string,
  adminUrl: string
): string {
  const greetingName =
    order.whatsAppRecipientName?.trim() ||
    order.ownerDisplayName?.trim() ||
    "Deve";
  const detalle = lines
    .map(
      (l) =>
        `• ${l.qty} × ${l.product.name} — ${
          l.product.price > 0 ? formatPrice(l.lineTotal) : "precio por confirmar"
        }`
    )
    .join("\n");

  const extraAffiliateLines: string[] = [];
  if (order.affiliateHandle) {
    const commText =
      typeof order.totalAffiliateCommissionUsd === "number" &&
      order.totalAffiliateCommissionUsd > 0
        ? ` (Comisión estimada: ${formatPrice(order.totalAffiliateCommissionUsd)})`
        : "";
    extraAffiliateLines.push(
      `🤝 Referido por afiliado: @${order.affiliateHandle}${commText}`
    );
  }

  return [
    `Hola ${greetingName}, quiero confirmar este pedido de Deve Tienda.`,
    "",
    `📋 Pedido: ${order.reference}`,
    ...extraAffiliateLines,
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
    "🔗 Enlace directo al pedido (Panel):",
    adminUrl,
  ].join("\n");
}

export function CheckoutClient() {
  const { lines, pending } = useCartLinesState();
  const clearCart = useShopStore((s) => s.clearCart);
  const [confirmedOrders, setConfirmedOrders] = useState<OrderSummary[]>([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [previewImage, setPreviewImage] = useState<PreviewImageData | null>(
    null
  );
  const [activeAffiliateHandle, setActiveAffiliateHandle] = useState<
    string | null
  >(null);

  const subtotal = cartSubtotal(lines);
  const unpriced = hasUnpricedLines(lines);

  // Agrupa automáticamente los artículos por vendedor (1 pedido y 1 botón WA por vendedor)
  const sellerGroups = useMemo<SellerOrderGroup[]>(() => {
    const map = new Map<string, SellerOrderGroup>();
    for (const line of lines) {
      const ownerId = line.product.owner?.id ?? line.product.ownerAdminUserId ?? "deve-default";
      const existing = map.get(ownerId);
      if (existing) {
        existing.lines.push(line);
        existing.subtotal += line.lineTotal;
      } else {
        map.set(ownerId, {
          key: ownerId,
          sellerName: line.product.owner?.displayName ?? "Deve Tienda",
          sellerHandle: line.product.owner?.handle ?? null,
          sellerPhone: line.product.owner?.whatsAppPhone ?? null,
          lines: [line],
          subtotal: line.lineTotal,
        });
      }
    }
    return Array.from(map.values());
  }, [lines]);

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

  useEffect(() => {
    if (confirmedOrders.length > 0 || !warmupPath) return;
    const controller = new AbortController();
    void fetch(warmupPath, { signal: controller.signal }).catch(() => {});
    return () => controller.abort();
  }, [confirmedOrders.length, warmupPath]);

  useEffect(() => {
    if (confirmedOrders.length > 0 || lines.length === 0) return;
    let active = true;
    resolveActiveReferralForCheckout(1500)
      .then((ref) => {
        if (!active) return;
        const current = ref ?? readStoredReferral();
        if (current?.kind === "affiliate") {
          setActiveAffiliateHandle(current.code);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [confirmedOrders.length, lines.length]);

  if (confirmedOrders.length > 0) {
    const isMulti = confirmedOrders.length > 1;
    return (
      <div className="mx-auto max-w-2xl px-4 pb-20 pt-10 text-center sm:px-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-xs sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            {isMulti
              ? `¡${confirmedOrders.length} pedidos registrados!`
              : "¡Pedido registrado!"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            {isMulti
              ? "Como tu carrito incluía artículos de distintos vendedores, dividimos tu compra automáticamente. Envía cada pedido por WhatsApp tocando su botón correspondiente:"
              : `Tu pedido ${confirmedOrders[0].id} quedó registrado. Continúa en WhatsApp para confirmar disponibilidad, pago y entrega.`}
          </p>

          <div className="mt-6 space-y-4 text-left">
            {confirmedOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-zinc-950">
                      {order.id}
                    </span>
                    {order.sellerName && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200">
                        <Store className="h-3 w-3 text-violet-600" />
                        {order.sellerName}
                      </span>
                    )}
                  </div>
                  <span className="font-display text-base font-bold text-zinc-950 tabular-nums">
                    {formatPrice(order.total)}
                  </span>
                </div>

                {order.affiliateHandle && (
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900">
                    <Handshake className="h-3 w-3" />
                    Afiliado acreditado: @{order.affiliateHandle}
                    {order.whatsappRouting === "affiliate"
                      ? " (atención directa por afiliado)"
                      : ""}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    href={order.whatsappUrl || buildStoreWhatsAppUrl("Hola Deve")}
                    target={isMulti ? "_blank" : undefined}
                    rel={isMulti ? "noopener noreferrer" : undefined}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 sm:flex-none"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar a {order.whatsappRecipientName || order.sellerName || "WhatsApp"}
                  </a>
                  <Link
                    href={`/tienda/admin?order=${encodeURIComponent(order.id)}`}
                    className="inline-flex h-10 items-center gap-1 rounded-full border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-600 hover:text-violet-700"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    Panel
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 flex justify-center">
            <Link
              href="/tienda"
              className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
              Seguir comprando
            </Link>
          </div>
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
    if (sellerGroups.some((g) => g.lines.length > MAX_ORDER_LINES)) {
      setSendError(
        `Cada pedido admite hasta ${MAX_ORDER_LINES} artículos distintos por vendedor. Ajusta tu carrito antes de continuar.`
      );
      return;
    }

    setSending(true);
    setSendError("");
    try {
      const referral = await resolveActiveReferralForCheckout(1500);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const createdSummaries: OrderSummary[] = [];
      const warmupFetches: Promise<Response>[] = [];

      for (const group of sellerGroups) {
        const respuesta = await apiSend<ApiOrder>("orders", {
          method: "POST",
          body: {
            store: STORE_KEY,
            idempotencyKey: crypto.randomUUID(),
            affiliateHandle:
              referral?.kind === "affiliate" ? referral.code : undefined,
            referralCode:
              referral?.kind === "legacy" ? referral.code : undefined,
            items: group.lines.map((l) => ({
              productId: l.productId,
              quantity: l.qty,
            })),
          },
        });

        const groupPreviewItems = group.lines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          name: l.product.name,
          price: l.product.price,
          image: l.product.images[0] || l.product.image,
          categoryName: l.product.categoryName,
          slug: l.product.slug,
        }));

        const previewUrl = `${origin}${buildOrderPreviewPath(
          respuesta.reference,
          groupPreviewItems
        )}`;
        const ogImageUrl = `${origin}${buildOrderPreviewImagePath(
          respuesta.reference,
          groupPreviewItems
        )}`;
        const adminUrl = `${origin}/tienda/admin?order=${encodeURIComponent(
          respuesta.reference
        )}`;

        const mensaje = buildWhatsAppMessage(
          respuesta,
          group.lines,
          group.subtotal,
          previewUrl,
          adminUrl
        );

        const recipientPhone =
          respuesta.whatsAppRecipientPhone ??
          (referral?.kind === "legacy" ? referral.whatsAppPhone : null) ??
          group.sellerPhone ??
          null;

        const whatsappUrl = buildStoreWhatsAppUrl(mensaje, recipientPhone);
        warmupFetches.push(fetch(previewUrl), fetch(ogImageUrl));

        createdSummaries.push({
          id: respuesta.reference,
          items: group.lines.map((l) => ({
            productId: l.productId,
            qty: l.qty,
          })),
          subtotal: group.subtotal,
          total: group.subtotal,
          status: respuesta.status,
          createdAt: respuesta.createdAt,
          sellerName: respuesta.ownerDisplayName ?? group.sellerName,
          whatsappUrl,
          whatsappRouting: respuesta.whatsAppRouting ?? null,
          whatsappRecipientName:
            respuesta.whatsAppRecipientName ??
            respuesta.ownerDisplayName ??
            group.sellerName,
          affiliateHandle: respuesta.affiliateHandle ?? null,
          totalAffiliateCommissionUsd:
            respuesta.totalAffiliateCommissionUsd ?? null,
        });
      }

      clearCart();
      setConfirmedOrders(createdSummaries);
      window.scrollTo({ top: 0 });

      await Promise.race([
        Promise.allSettled(warmupFetches),
        new Promise<void>((resolve) => setTimeout(resolve, 1100)),
      ]);

      // Si es un solo vendedor, abrimos WhatsApp automáticamente; si son varios, el comprador elige cada botón.
      if (createdSummaries.length === 1 && createdSummaries[0].whatsappUrl) {
        try {
          window.location.assign(createdSummaries[0].whatsappUrl);
        } catch {
          /* Botón manual disponible */
        }
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
          {sellerGroups.length > 1
            ? `Tu carrito incluye productos de ${sellerGroups.length} vendedores distintos. Generaremos una referencia DE-… y su botón de WhatsApp separado para cada vendedor.`
            : "Revisa tu selección y confirma para generar tu referencia DE-… y continuar por WhatsApp con vista previa de fotos."}
        </p>
      </header>

      <form onSubmit={handleConfirm} noValidate>
        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-base font-bold text-zinc-950">
              Tu selección
            </h2>
            <div className="flex items-center gap-2">
              {activeAffiliateHandle && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                  <Handshake className="h-3 w-3" />
                  Afiliado @{activeAffiliateHandle}
                </span>
              )}
              <span className="text-xs font-semibold text-zinc-500">
                {totalQty} {totalQty === 1 ? "artículo" : "artículos"}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-5">
            {sellerGroups.map((group) => (
              <div
                key={group.key}
                className="rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-3.5"
              >
                <div className="mb-3 flex items-center justify-between gap-2 border-b border-zinc-200/70 pb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                    <Store className="h-3.5 w-3.5 text-[#6018F8]" />
                    {group.sellerName}
                    {group.sellerHandle && (
                      <span className="font-mono text-[11px] font-normal text-zinc-500">
                        @{group.sellerHandle}
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-bold text-zinc-800 tabular-nums">
                    {formatPrice(group.subtotal)}
                  </span>
                </div>

                <ul className="space-y-3">
                  {group.lines.map((l) => {
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
                            className="h-14 w-14 rounded-xl"
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
              </div>
            ))}
          </div>

          <hr className="my-4 border-zinc-200" />

          <div className="space-y-2 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-zinc-600">Subtotal general</span>
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
            {sending
              ? "Registrando pedido…"
              : sellerGroups.length > 1
                ? `Confirmar ${sellerGroups.length} pedidos`
                : "Confirmar y abrir WhatsApp"}
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
