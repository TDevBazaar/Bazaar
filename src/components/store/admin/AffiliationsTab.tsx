"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Copy,
  ExternalLink,
  Handshake,
  Loader2,
  MessageCircle,
  Store,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  ZoomableThumb,
  type PreviewImageData,
} from "@/components/store/ImagePreviewModal";
import {
  fetchMyAffiliations,
  unsubscribeAffiliate,
  type AdminSellerProfile,
  type MyAffiliationItem,
} from "@/lib/store/admin-api";
import { formatPrice, formatPriceLabel } from "@/lib/store/format";
import { formatCommissionText } from "@/lib/store/powergy-api";
import {
  buildAffiliateProductUrl,
  buildAffiliateShowcaseUrl,
} from "@/lib/store/referral";

interface AffiliationsTabProps {
  token: string;
  sellerProfile: AdminSellerProfile | null;
  refreshTick: number;
  onPreviewImage: (image: PreviewImageData) => void;
  onMutated: () => void;
}

export function AffiliationsTab({
  token,
  sellerProfile,
  refreshTick,
  onPreviewImage,
  onMutated,
}: AffiliationsTabProps) {
  const [items, setItems] = useState<MyAffiliationItem[]>([]);
  const [loadedKey, setLoadedKey] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const requestKey = `${token}:${refreshTick}`;
  const loading = Boolean(token) && loadedKey !== requestKey;

  useEffect(() => {
    if (!token) return;
    let active = true;
    const controller = new AbortController();
    const key = requestKey;

    fetchMyAffiliations(token, controller.signal)
      .then((res) => {
        if (!active) return;
        setItems(res);
        setErrorMsg("");
      })
      .catch((err) => {
        if (!active || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar tus afiliaciones."
        );
      })
      .finally(() => {
        if (active) setLoadedKey(key);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [token, requestKey]);

  const myHandle = sellerProfile?.handle?.trim() ?? "";

  const copyText = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(label, { description: url });
    } catch {
      toast.info(label, { description: url });
    }
  };

  const handleUnsubscribe = async (item: MyAffiliationItem) => {
    if (removingId) return;
    setRemovingId(item.productId);
    try {
      await unsubscribeAffiliate(token, item.productId);
      setItems((prev) => prev.filter((x) => x.productId !== item.productId));
      toast.info(`Dejaste de promocionar “${item.productName}”`);
      onMutated();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo quitar la afiliación."
      );
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner con vitrina pública de afiliado */}
      <div className="flex flex-col gap-4 rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 via-white to-indigo-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-800 shadow-2xs ring-1 ring-violet-200/80">
            <Handshake className="h-3.5 w-3.5 text-[#6018F8]" />
            Programa de Afiliados
          </span>
          <h2 className="mt-2 font-display text-lg font-bold text-zinc-950">
            Productos que estás promocionando ({items.length})
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-600">
            Comparte el enlace de cada producto o tu vitrina completa. Cuando un
            cliente compra desde tu enlace, la comisión queda registrada a tu
            nombre y recibes una notificación inmediata.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {myHandle && (
            <button
              type="button"
              onClick={() =>
                void copyText(
                  buildAffiliateShowcaseUrl(myHandle),
                  "Enlace de tu vitrina de afiliados copiado"
                )
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#6018F8] px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-[#5010E8]"
            >
              <Copy className="h-3.5 w-3.5" />
              Copiar mi vitrina
            </button>
          )}
          <Link
            href="/tienda"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-800 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
          >
            <Store className="h-3.5 w-3.5" />
            Explorar productos para afiliarme
          </Link>
        </div>
      </div>

      {errorMsg && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
          {errorMsg}
        </p>
      )}

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center py-14 text-sm text-zinc-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-violet-600" />
          Cargando tus afiliaciones…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50/70 px-6 py-12 text-center">
          <Handshake className="mx-auto h-8 w-8 text-violet-500" />
          <p className="mt-3 text-sm font-bold text-zinc-900">
            Todavía no te has afiliado a ningún producto
          </p>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-zinc-600">
            Visita el perfil de cualquier vendedor en la tienda o abre un
            producto con comisión activa para afiliarte con un clic y empezar a
            ganar por cada venta referida.
          </p>
          <Link
            href="/tienda"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#6018F8] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#5010E8]"
          >
            Explorar el catálogo
          </Link>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => {
            const available = item.productIsActive && item.allowAffiliates;
            const commissionLabel = formatCommissionText(
              item.commissionType,
              item.commissionValue,
              item.effectivePriceUsd ?? undefined
            );
            const shareUrl = myHandle
              ? buildAffiliateProductUrl(myHandle, item.productSlug)
              : "";

            return (
              <li
                key={item.id}
                className={`flex flex-col gap-3 rounded-2xl border bg-white p-3.5 sm:flex-row sm:items-center ${
                  available
                    ? "border-zinc-200"
                    : "border-amber-200 bg-amber-50/40"
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <ZoomableThumb
                    src={item.primaryImage}
                    alt={item.productName}
                    onPreview={onPreviewImage}
                    className="h-14 w-14 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                        {item.categoryName}
                      </span>
                      {commissionLabel && available ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-800">
                          Comisión: {commissionLabel}
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-900">
                          {!item.productIsActive
                            ? "Producto pausado"
                            : "Afiliados desactivados por el dueño"}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm font-bold text-zinc-950">
                      {item.productName}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                      <span>
                        Dueño:{" "}
                        {item.ownerHandle ? (
                          <Link
                            href={`/tienda/vendedor/${encodeURIComponent(item.ownerHandle)}`}
                            className="font-semibold text-violet-700 hover:underline"
                          >
                            {item.ownerDisplayName} (@{item.ownerHandle})
                          </Link>
                        ) : (
                          <span className="font-semibold text-zinc-700">
                            {item.ownerDisplayName}
                          </span>
                        )}
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-zinc-800 tabular-nums">
                        {item.effectivePriceUsd && item.effectivePriceUsd > 0
                          ? formatPrice(item.effectivePriceUsd)
                          : formatPriceLabel(0)}
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 text-zinc-600">
                        <MessageCircle className="h-3 w-3 text-emerald-600" />
                        {item.ownerAffiliateOrderRouting === "affiliate"
                          ? "WhatsApp directo a ti"
                          : "WhatsApp al dueño (con alerta para ti)"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-1.5 border-t border-zinc-100 pt-2.5 sm:border-t-0 sm:pt-0">
                  {available && shareUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        void copyText(
                          shareUrl,
                          `Enlace de afiliado copiado para “${item.productName}”`
                        )
                      }
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#6018F8] px-3.5 text-xs font-semibold text-white transition hover:bg-[#5010E8]"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copiar enlace
                    </button>
                  )}
                  <Link
                    href={`/tienda/${encodeURIComponent(item.productSlug)}`}
                    className="inline-flex h-9 items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleUnsubscribe(item)}
                    disabled={removingId === item.productId}
                    title="Dejar de ser afiliado de este producto"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                  >
                    {removingId === item.productId ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
