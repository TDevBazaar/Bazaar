"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Ban,
  BellRing,
  CheckCircle2,
  EyeOff,
  ExternalLink,
  Gavel,
  Loader2,
  RotateCcw,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AdminModal } from "@/components/store/admin/AdminModal";
import {
  ZoomableThumb,
  type PreviewImageData,
} from "@/components/store/ImagePreviewModal";
import { PaginationControls } from "@/components/store/PaginationControls";
import {
  applySellerModerationAction,
  fetchModerationRecentProducts,
  fetchModerationSellers,
  hideProductModeration,
  restoreProductModeration,
  type ModerationProductItem,
  type ModerationSellerItem,
  type SellerModerationAction,
} from "@/lib/store/admin-api";
import { formatDate, formatPriceLabel } from "@/lib/store/format";
import { formatCommissionText } from "@/lib/store/powergy-api";

interface ModerationTabProps {
  token: string;
  refreshTick: number;
  onPreviewImage: (image: PreviewImageData) => void;
  onMutated: () => void;
}

const PAGE_SIZE = 20;

export function ModerationTab({
  token,
  refreshTick,
  onPreviewImage,
  onMutated,
}: ModerationTabProps) {
  const [subTab, setSubTab] = useState<"publications" | "sellers">(
    "publications"
  );

  // Publicaciones recientes
  const [products, setProducts] = useState<ModerationProductItem[]>([]);
  const [prodPage, setProdPage] = useState(1);
  const [prodTotal, setProdTotal] = useState(0);
  const [prodPages, setProdPages] = useState(1);
  const [onlySellers, setOnlySellers] = useState(true);
  const [prodQuery, setProdQuery] = useState("");
  const [loadedProdKey, setLoadedProdKey] = useState("");

  // Vendedores
  const [sellers, setSellers] = useState<ModerationSellerItem[]>([]);
  const [sellerPage, setSellerPage] = useState(1);
  const [sellerTotal, setSellerTotal] = useState(0);
  const [sellerPages, setSellerPages] = useState(1);
  const [sellerStatus, setSellerStatus] = useState<
    "all" | "active" | "suspended" | "banned"
  >("all");
  const [sellerQuery, setSellerQuery] = useState("");
  const [loadedSellerKey, setLoadedSellerKey] = useState("");

  // Modal ocultar producto
  const [hideTarget, setHideTarget] = useState<ModerationProductItem | null>(
    null
  );
  const [hideReason, setHideReason] = useState("");
  const [hideWarnSeller, setHideWarnSeller] = useState(true);
  const [savingHide, setSavingHide] = useState(false);

  // Modal sancionar / notificar vendedor
  const [sellerTarget, setSellerTarget] = useState<{
    id: string;
    name: string;
    handle: string | null;
    isSuspended: boolean;
    isActive: boolean;
  } | null>(null);
  const [sellerAction, setSellerAction] =
    useState<SellerModerationAction>("warn");
  const [actionTitle, setActionTitle] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [durationHours, setDurationHours] = useState("72");
  const [hideActiveProducts, setHideActiveProducts] = useState(true);
  const [savingAction, setSavingAction] = useState(false);

  const [localTick, setLocalTick] = useState(0);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const prodRequestKey = `${token}|${onlySellers ? "1" : "0"}|${prodQuery.trim()}|${prodPage}|${refreshTick}|${localTick}`;
  const loadingProds =
    subTab === "publications" && Boolean(token) && loadedProdKey !== prodRequestKey;

  useEffect(() => {
    if (!token || subTab !== "publications") return;
    let active = true;
    const controller = new AbortController();
    const key = prodRequestKey;

    fetchModerationRecentProducts(token, {
      onlySellers,
      q: prodQuery.trim() || undefined,
      page: prodPage,
      pageSize: PAGE_SIZE,
      signal: controller.signal,
    })
      .then((res) => {
        if (!active) return;
        setProducts(res.items);
        setProdTotal(res.totalItems);
        setProdPages(Math.max(1, res.totalPages));
        setNowMs(Date.now());
      })
      .catch((err) => {
        if (!active || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        toast.error(
          err instanceof Error
            ? err.message
            : "Error cargando publicaciones recientes."
        );
      })
      .finally(() => {
        if (active) setLoadedProdKey(key);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [token, subTab, onlySellers, prodQuery, prodPage, prodRequestKey]);

  const sellerRequestKey = `${token}|${sellerStatus}|${sellerQuery.trim()}|${sellerPage}|${refreshTick}|${localTick}`;
  const loadingSellers =
    subTab === "sellers" && Boolean(token) && loadedSellerKey !== sellerRequestKey;

  useEffect(() => {
    if (!token || subTab !== "sellers") return;
    let active = true;
    const controller = new AbortController();
    const key = sellerRequestKey;

    fetchModerationSellers(token, {
      status: sellerStatus,
      q: sellerQuery.trim() || undefined,
      page: sellerPage,
      pageSize: PAGE_SIZE,
      signal: controller.signal,
    })
      .then((res) => {
        if (!active) return;
        setSellers(res.items);
        setSellerTotal(res.totalItems);
        setSellerPages(Math.max(1, res.totalPages));
      })
      .catch((err) => {
        if (!active || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        toast.error(
          err instanceof Error ? err.message : "Error cargando vendedores."
        );
      })
      .finally(() => {
        if (active) setLoadedSellerKey(key);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [token, subTab, sellerStatus, sellerQuery, sellerPage, sellerRequestKey]);

  const handleConfirmHide = async () => {
    if (!hideTarget) return;
    if (hideReason.trim().length < 3) {
      toast.error("Indica el motivo del retiro (mínimo 3 caracteres).");
      return;
    }
    setSavingHide(true);
    try {
      await hideProductModeration(token, hideTarget.id, {
        reason: hideReason.trim(),
        warnSeller: hideWarnSeller,
      });
      toast.success("Anuncio retirado y vendedor notificado");
      setHideTarget(null);
      setHideReason("");
      setLocalTick((t) => t + 1);
      onMutated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo retirar.");
    } finally {
      setSavingHide(false);
    }
  };

  const handleRestore = async (item: ModerationProductItem) => {
    try {
      await restoreProductModeration(token, item.id);
      toast.success(`“${item.name}” restaurado`);
      setLocalTick((t) => t + 1);
      onMutated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo restaurar.");
    }
  };

  const openSellerActionModal = (target: {
    id: string;
    name: string;
    handle: string | null;
    isSuspended: boolean;
    isActive: boolean;
  }) => {
    setSellerTarget(target);
    setSellerAction(target.isSuspended || !target.isActive ? "unsuspend" : "warn");
    setActionTitle("");
    setActionReason("");
    setDurationHours("72");
    setHideActiveProducts(true);
  };

  const handleApplySellerAction = async () => {
    if (!sellerTarget) return;
    if (actionReason.trim().length < 3) {
      toast.error("Escribe el motivo o mensaje para el vendedor.");
      return;
    }

    setSavingAction(true);
    try {
      await applySellerModerationAction(token, sellerTarget.id, {
        action: sellerAction,
        title: actionTitle.trim() || undefined,
        reason: actionReason.trim(),
        durationHours:
          sellerAction === "suspend"
            ? Math.max(1, Number.parseInt(durationHours, 10) || 72)
            : undefined,
        hideActiveProducts:
          sellerAction === "suspend" ? hideActiveProducts : sellerAction === "ban",
      });
      toast.success("Acción de moderación aplicada y notificada al vendedor");
      setSellerTarget(null);
      setLocalTick((t) => t + 1);
      onMutated();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo aplicar la acción."
      );
    } finally {
      setSavingAction(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab("publications")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              subTab === "publications"
                ? "bg-[#6018F8] text-white"
                : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-violet-50"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Últimas publicaciones ({prodTotal})
          </button>
          <button
            type="button"
            onClick={() => setSubTab("sellers")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              subTab === "sellers"
                ? "bg-[#6018F8] text-white"
                : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-violet-50"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Vendedores registrados
          </button>
        </div>

        {subTab === "publications" ? (
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700">
              <input
                type="checkbox"
                checked={onlySellers}
                onChange={(e) => {
                  setOnlySellers(e.target.checked);
                  setProdPage(1);
                }}
                className="h-3.5 w-3.5 accent-[#6018F8]"
              />
              Solo publicaciones de vendedores
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={prodQuery}
                onChange={(e) => {
                  setProdQuery(e.target.value);
                  setProdPage(1);
                }}
                placeholder="Filtrar producto o vendedor…"
                className="h-9 rounded-full border border-zinc-200 pl-8 pr-3 text-xs text-zinc-900 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sellerStatus}
              onChange={(e) => {
                setSellerStatus(
                  e.target.value as "all" | "active" | "suspended" | "banned"
                );
                setSellerPage(1);
              }}
              className="h-9 rounded-full border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800"
            >
              <option value="all">Estado: Todos</option>
              <option value="active">Activos</option>
              <option value="suspended">Suspendidos</option>
              <option value="banned">Bloqueados</option>
            </select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={sellerQuery}
                onChange={(e) => {
                  setSellerQuery(e.target.value);
                  setSellerPage(1);
                }}
                placeholder="Buscar vendedor o @usuario…"
                className="h-9 rounded-full border border-zinc-200 pl-8 pr-3 text-xs text-zinc-900 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {subTab === "publications" ? (
        <>
          {loadingProds && products.length === 0 ? (
            <div className="flex items-center justify-center py-14 text-sm text-zinc-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-violet-600" />
              Cargando publicaciones recientes…
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50/70 px-6 py-12 text-center text-sm text-zinc-600">
              No hay publicaciones recientes para revisar.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {products.map((item) => {
                const commissionLabel = item.allowAffiliates
                  ? formatCommissionText(
                      item.affiliateCommissionType,
                      item.affiliateCommissionValue,
                      item.priceUsd ?? undefined
                    )
                  : null;
                const ownerSuspended =
                  !item.ownerIsActive ||
                  (item.ownerSuspendedUntil !== null &&
                    new Date(item.ownerSuspendedUntil).getTime() > nowMs);

                return (
                  <li
                    key={item.id}
                    className={`flex flex-col gap-3 rounded-2xl border bg-white p-3.5 sm:flex-row sm:items-center ${
                      item.moderatedAt
                        ? "border-rose-200 bg-rose-50/30"
                        : "border-zinc-200"
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <ZoomableThumb
                        src={item.primaryImage}
                        alt={item.name}
                        onPreview={onPreviewImage}
                        className="h-14 w-14 rounded-xl"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                            {item.category}
                          </span>
                          {item.isActive ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              Publicado
                            </span>
                          ) : item.moderatedAt ? (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                              Retirado por moderación
                            </span>
                          ) : (
                            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-700">
                              Oculto
                            </span>
                          )}
                          {commissionLabel && (
                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800">
                              Afiliados: {commissionLabel}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-sm font-bold text-zinc-950">
                          {item.name}{" "}
                          <span className="font-semibold text-zinc-500">
                            · {formatPriceLabel(item.priceUsd ?? 0)}
                          </span>
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                          <span>
                            Subido por{" "}
                            <strong className="text-zinc-800">
                              {item.ownerDisplayName}
                            </strong>
                            {item.ownerHandle ? ` (@${item.ownerHandle})` : ""}
                            {item.ownerEmail ? ` · ${item.ownerEmail}` : ""}
                          </span>
                          <span>· {formatDate(item.createdAt)}</span>
                          {item.ownerWarningCount > 0 && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 font-bold text-amber-900">
                              {item.ownerWarningCount} adv.
                            </span>
                          )}
                          {ownerSuspended && (
                            <span className="rounded bg-rose-100 px-1.5 py-0.5 font-bold text-rose-700">
                              {item.ownerIsActive ? "Suspendido" : "Bloqueado"}
                            </span>
                          )}
                        </div>
                        {item.moderationReason && (
                          <p className="mt-1 text-[11px] font-medium text-rose-700">
                            Motivo: {item.moderationReason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1.5 border-t border-zinc-100 pt-2.5 sm:border-t-0 sm:pt-0">
                      <Link
                        href={`/tienda/${encodeURIComponent(item.slug)}`}
                        target="_blank"
                        className="inline-flex h-8 items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ver
                      </Link>
                      {item.isActive ? (
                        <button
                          type="button"
                          onClick={() => {
                            setHideTarget(item);
                            setHideReason("");
                            setHideWarnSeller(true);
                          }}
                          className="inline-flex h-8 items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          <EyeOff className="h-3.5 w-3.5" />
                          Retirar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleRestore(item)}
                          className="inline-flex h-8 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restaurar
                        </button>
                      )}
                      {item.ownerId && item.ownerRole === "seller" && (
                        <button
                          type="button"
                          onClick={() =>
                            openSellerActionModal({
                              id: item.ownerId!,
                              name: item.ownerDisplayName,
                              handle: item.ownerHandle,
                              isSuspended: ownerSuspended,
                              isActive: item.ownerIsActive,
                            })
                          }
                          className="inline-flex h-8 items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                        >
                          <Gavel className="h-3.5 w-3.5" />
                          Vendedor
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <PaginationControls
            page={prodPage}
            totalPages={prodPages}
            totalItems={prodTotal}
            pageSize={PAGE_SIZE}
            onPageChange={setProdPage}
            disabled={loadingProds}
          />
        </>
      ) : (
        <>
          {loadingSellers && sellers.length === 0 ? (
            <div className="flex items-center justify-center py-14 text-sm text-zinc-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-violet-600" />
              Cargando vendedores…
            </div>
          ) : sellers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50/70 px-6 py-12 text-center text-sm text-zinc-600">
              No hay vendedores que coincidan con este filtro.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {sellers.map((seller) => (
                <li
                  key={seller.id}
                  className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-zinc-950">
                        {seller.displayName}
                      </p>
                      {seller.handle && (
                        <Link
                          href={`/tienda/vendedor/${encodeURIComponent(seller.handle)}`}
                          target="_blank"
                          className="font-mono text-xs font-semibold text-violet-700 hover:underline"
                        >
                          @{seller.handle}
                        </Link>
                      )}
                      {!seller.isActive ? (
                        <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10.5px] font-bold text-rose-700">
                          Bloqueado
                        </span>
                      ) : seller.isSuspended ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-900">
                          Suspendido hasta{" "}
                          {seller.suspendedUntil
                            ? formatDate(seller.suspendedUntil)
                            : ""}
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-800">
                          Activo
                        </span>
                      )}
                      {seller.warningCount > 0 && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-bold text-amber-800">
                          {seller.warningCount} advertencia(s)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">
                      {seller.email || "Sin correo"}
                      {seller.whatsAppPhone ? ` · WA: +${seller.whatsAppPhone}` : ""}
                      {" · "}
                      {seller.activeProductCount} activos /{" "}
                      {seller.hiddenProductCount} ocultos
                    </p>
                    {seller.suspensionReason && (
                      <p className="text-[11px] font-medium text-rose-700">
                        Última sanción: {seller.suspensionReason}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openSellerActionModal({
                        id: seller.id,
                        name: seller.displayName,
                        handle: seller.handle,
                        isSuspended: seller.isSuspended,
                        isActive: seller.isActive,
                      })
                    }
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-zinc-950 px-4 text-xs font-semibold text-white transition hover:bg-[#6018F8]"
                  >
                    <Gavel className="h-3.5 w-3.5" />
                    Notificar / Sancionar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <PaginationControls
            page={sellerPage}
            totalPages={sellerPages}
            totalItems={sellerTotal}
            pageSize={PAGE_SIZE}
            onPageChange={setSellerPage}
            disabled={loadingSellers}
          />
        </>
      )}

      {/* Modal retirar anuncio */}
      <AdminModal
        open={hideTarget !== null}
        onClose={() => !savingHide && setHideTarget(null)}
        maxWidthClass="max-w-md"
        title="Retirar anuncio por moderación"
        description={
          hideTarget
            ? `El anuncio “${hideTarget.name}” quedará oculto inmediatamente y el vendedor no podrá reactivarlo por sí mismo.`
            : undefined
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setHideTarget(null)}
              disabled={savingHide}
              className="inline-flex h-10 items-center rounded-full border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleConfirmHide()}
              disabled={savingHide}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-rose-600 px-5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {savingHide && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Retirar y notificar
            </button>
          </>
        }
      >
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-800">
              Motivo del retiro *
            </label>
            <textarea
              rows={3}
              value={hideReason}
              onChange={(e) => setHideReason(e.target.value)}
              placeholder="Ej. Producto prohibido, precio engañoso, foto no corresponde al artículo..."
              className="mt-1 w-full rounded-xl border border-zinc-200 p-3 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
            />
          </div>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-xs font-semibold text-amber-950">
            <span>Sumar advertencia oficial al vendedor</span>
            <input
              type="checkbox"
              checked={hideWarnSeller}
              onChange={(e) => setHideWarnSeller(e.target.checked)}
              className="h-4 w-4 accent-[#6018F8]"
            />
          </label>
        </div>
      </AdminModal>

      {/* Modal acción sobre vendedor */}
      <AdminModal
        open={sellerTarget !== null}
        onClose={() => !savingAction && setSellerTarget(null)}
        maxWidthClass="max-w-lg"
        title={
          sellerTarget
            ? `Moderar a ${sellerTarget.name}${sellerTarget.handle ? ` (@${sellerTarget.handle})` : ""}`
            : "Moderar vendedor"
        }
        description="El vendedor recibirá una notificación automática en su panel con el mensaje y la medida aplicada."
        footer={
          <>
            <button
              type="button"
              onClick={() => setSellerTarget(null)}
              disabled={savingAction}
              className="inline-flex h-10 items-center rounded-full border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleApplySellerAction()}
              disabled={savingAction}
              className={`inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-xs font-semibold text-white disabled:opacity-50 ${
                sellerAction === "ban" || sellerAction === "suspend"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : sellerAction === "unsuspend"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-[#6018F8] hover:bg-[#5010E8]"
              }`}
            >
              {savingAction && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Aplicar medida
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(
              [
                { id: "notify", label: "Solo notificar", icon: BellRing },
                { id: "warn", label: "Advertir (+1)", icon: AlertTriangle },
                { id: "suspend", label: "Suspender", icon: ShieldAlert },
                { id: "ban", label: "Bloquear", icon: Ban },
                { id: "unsuspend", label: "Reactivar", icon: CheckCircle2 },
              ] as const
            ).map((opt) => {
              const Icon = opt.icon;
              const selected = sellerAction === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSellerAction(opt.id)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    selected
                      ? "border-[#6018F8] bg-violet-50 text-violet-900"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>

          {(sellerAction === "notify" || sellerAction === "warn") && (
            <div>
              <label className="block text-xs font-semibold text-zinc-800">
                Título opcional
              </label>
              <input
                type="text"
                value={actionTitle}
                onChange={(e) => setActionTitle(e.target.value)}
                placeholder="Ej. Aviso sobre publicaciones duplicadas"
                className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-950"
              />
            </div>
          )}

          {sellerAction === "suspend" && (
            <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-800">
                  Duración de la suspensión
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900"
                >
                  <option value="24">24 horas (1 día)</option>
                  <option value="72">72 horas (3 días)</option>
                  <option value="168">7 días</option>
                  <option value="720">30 días</option>
                </select>
              </div>
              <label className="flex cursor-pointer items-center justify-between text-xs font-semibold text-zinc-800">
                <span>Ocultar también todos sus anuncios activos ahora</span>
                <input
                  type="checkbox"
                  checked={hideActiveProducts}
                  onChange={(e) => setHideActiveProducts(e.target.checked)}
                  className="h-4 w-4 accent-[#6018F8]"
                />
              </label>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-800">
              Mensaje / Motivo *
            </label>
            <textarea
              rows={3}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Explica claramente el motivo o instrucción al vendedor..."
              className="mt-1 w-full rounded-xl border border-zinc-200 p-3 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
