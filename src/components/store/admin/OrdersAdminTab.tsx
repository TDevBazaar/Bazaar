"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Link2,
  Loader2,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminModal } from "@/components/store/admin/AdminModal";
import {
  ZoomableThumb,
  type PreviewImageData,
} from "@/components/store/ImagePreviewModal";
import { PaginationControls } from "@/components/store/PaginationControls";
import { QuantityStepper } from "@/components/store/QuantityStepper";
import {
  CANCELLATION_REASONS,
  STATUS_LABELS,
  closeOrder,
  confirmOrderCommissionPaid,
  disputeOrderCommission,
  fetchAdminOrders,
  fetchAdminProducts,
  fetchOrder,
  fetchOrderMetrics,
  markOrderCommissionPaid,
  type AdminOrder,
  type AdminOrderListItem,
  type AdminSellerProfile,
  type OrderMetrics,
} from "@/lib/store/admin-api";
import {
  DEFAULT_ORDER_DATE_FILTER,
  resolveOrderDateFilter,
  toLocalYmd,
  type OrderDateFilterState,
  type OrderDatePreset,
} from "@/lib/store/admin-dates";
import { formatDate, formatPrice, formatPriceLabel } from "@/lib/store/format";
import {
  fetchProductsByIds,
  type CommissionPayoutStatus,
} from "@/lib/store/powergy-api";
import { normalizeReferralCode } from "@/lib/store/referral";
import { buildStoreWhatsAppUrl } from "@/lib/store/whatsapp";

const ADMIN_PAGE_SIZE = 20;

const DATE_PRESETS: { id: OrderDatePreset; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "today", label: "Hoy" },
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
  { id: "month", label: "Este mes" },
  { id: "single", label: "Fecha" },
  { id: "range", label: "Rango" },
];

const STATUS_STYLES: Record<string, string> = {
  requested: "bg-amber-100 text-amber-900",
  closed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-700",
};

const COMMISSION_STATUS_META: Record<
  CommissionPayoutStatus,
  { label: string; badgeClass: string }
> = {
  pending: {
    label: "Falta pagar comisión",
    badgeClass: "bg-amber-100 text-amber-900 border border-amber-200",
  },
  paid: {
    label: "Comisión pagada (por confirmar)",
    badgeClass: "bg-sky-100 text-sky-900 border border-sky-200",
  },
  confirmed: {
    label: "Comisión confirmada",
    badgeClass: "bg-emerald-100 text-emerald-900 border border-emerald-200",
  },
  disputed: {
    label: "Pago reportado",
    badgeClass: "bg-rose-100 text-rose-800 border border-rose-200",
  },
};

function resolveEffectiveCommissionStatus(order: {
  status: string;
  commissionStatus?: CommissionPayoutStatus | null;
  totalAffiliateCommissionUsd?: number | null;
  affiliateHandle?: string | null;
}): CommissionPayoutStatus | null {
  if (order.status !== "closed") return null;
  if (order.commissionStatus) return order.commissionStatus;
  if (
    order.affiliateHandle &&
    typeof order.totalAffiliateCommissionUsd === "number" &&
    order.totalAffiliateCommissionUsd > 0
  ) {
    return "pending";
  }
  return null;
}

interface EditableLine {
  productId: string;
  productName: string;
  quantity: number;
  price: string;
  remove: boolean;
}

interface OrdersAdminTabProps {
  token: string;
  targetOrder: string | null;
  refreshTick: number;
  sellerProfile: AdminSellerProfile | null;
  productImages: Record<string, string>;
  onImagesDiscovered: (entries: Record<string, string>) => void;
  onPreviewImage: (image: PreviewImageData) => void;
  onMetricsLoaded: (metrics: OrderMetrics | null) => void;
  onMutated: () => void;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
}

export function OrdersAdminTab({
  token,
  targetOrder,
  refreshTick,
  sellerProfile,
  productImages,
  onImagesDiscovered,
  onPreviewImage,
  onMetricsLoaded,
  onMutated,
}: OrdersAdminTabProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [metrics, setMetrics] = useState<OrderMetrics | null>(null);
  const [loadedKey, setLoadedKey] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [dateFilter, setDateFilter] = useState<OrderDateFilterState>(
    DEFAULT_ORDER_DATE_FILTER
  );
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "requested" | "closed" | "cancelled"
  >("all");
  const [commissionFilter, setCommissionFilter] = useState<
    "all" | CommissionPayoutStatus
  >("all");
  const [scopeFilter, setScopeFilter] = useState<
    "all" | "owner" | "affiliate" | "buyer"
  >("all");
  const [referralFilter, setReferralFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState<"all" | "unpriced" | "priced">(
    "all"
  );
  const [showFilters, setShowFilters] = useState(false);
  const [knownReferrals, setKnownReferrals] = useState<Record<string, string>>(
    {}
  );

  // Detalle / cierre de solicitud y liquidación de comisión
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderListItem | null>(
    null
  );
  const [detail, setDetail] = useState<AdminOrder | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [editableLines, setEditableLines] = useState<EditableLine[]>([]);
  const [outcome, setOutcome] = useState<"closed" | "cancelled">("closed");
  const [cancelReason, setCancelReason] = useState("price");
  const [cancelNote, setCancelNote] = useState("");
  const [confirmUnpriced, setConfirmUnpriced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paymentNote, setPaymentNote] = useState("");
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [commissionBusy, setCommissionBusy] = useState(false);

  const productImagesRef = useRef(productImages);
  useEffect(() => {
    productImagesRef.current = productImages;
  }, [productImages]);

  const resolvedDates = useMemo(
    () => resolveOrderDateFilter(dateFilter),
    [dateFilter]
  );

  useEffect(() => {
    const clean = query.trim();
    if (clean === debouncedQuery) return;
    const timer = window.setTimeout(() => {
      setDebouncedQuery(clean);
      setPage(1);
    }, 260);
    return () => window.clearTimeout(timer);
  }, [query, debouncedQuery]);

  // Métricas del periodo
  useEffect(() => {
    if (!token || resolvedDates.validationError) return;
    let active = true;
    const controller = new AbortController();

    fetchOrderMetrics(token, {
      from: resolvedDates.metricsFrom,
      to: resolvedDates.metricsTo,
      scope: scopeFilter,
      signal: controller.signal,
    })
      .then((res) => {
        if (!active) return;
        setMetrics(res);
        onMetricsLoaded(res);
      })
      .catch((err) => {
        if (!active || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        setErrorMsg(
          err instanceof Error ? err.message : "No se pudieron cargar métricas."
        );
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    token,
    refreshTick,
    scopeFilter,
    resolvedDates.metricsFrom,
    resolvedDates.metricsTo,
    resolvedDates.validationError,
    onMetricsLoaded,
  ]);

  const ordersRequestKey = `${token}|${page}|${refreshTick}|${scopeFilter}|${statusFilter}|${commissionFilter}|${debouncedQuery}|${referralFilter}|${priceFilter}|${resolvedDates.ordersFrom ?? ""}|${resolvedDates.ordersTo ?? ""}`;
  const loading =
    Boolean(token) &&
    !resolvedDates.validationError &&
    loadedKey !== ordersRequestKey;

  // Listado paginado
  useEffect(() => {
    if (!token || resolvedDates.validationError) return;
    let active = true;
    const controller = new AbortController();
    const key = ordersRequestKey;

    fetchAdminOrders(token, {
      status: statusFilter === "all" ? undefined : statusFilter,
      commissionStatus:
        commissionFilter === "all" ? undefined : commissionFilter,
      scope: scopeFilter,
      q: debouncedQuery || undefined,
      referral: referralFilter === "all" ? undefined : referralFilter,
      hasUnpriced:
        priceFilter === "unpriced"
          ? true
          : priceFilter === "priced"
            ? false
            : undefined,
      from: resolvedDates.ordersFrom,
      to: resolvedDates.ordersTo,
      page,
      pageSize: ADMIN_PAGE_SIZE,
      signal: controller.signal,
    })
      .then((res) => {
        if (!active) return;
        const safePages = Math.max(1, res.totalPages);
        if (page > safePages) {
          setPage(safePages);
          return;
        }
        setErrorMsg("");
        setOrders(res.items);
        setTotalItems(res.totalItems);
        setTotalPages(safePages);
        setKnownReferrals((prev) => {
          let next: Record<string, string> | null = null;
          for (const item of res.items) {
            if (!item.referralCode) continue;
            const code = item.referralCode;
            const label = item.referredByAdminName || code;
            if (prev[code] !== label) {
              if (!next) next = { ...prev };
              next[code] = label;
            }
          }
          return next ?? prev;
        });
      })
      .catch((err) => {
        if (!active || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las solicitudes."
        );
      })
      .finally(() => {
        if (active) setLoadedKey(key);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    token,
    page,
    refreshTick,
    scopeFilter,
    statusFilter,
    commissionFilter,
    debouncedQuery,
    referralFilter,
    priceFilter,
    resolvedDates.ordersFrom,
    resolvedDates.ordersTo,
    resolvedDates.validationError,
    ordersRequestKey,
  ]);

  const resolveOrderImages = useCallback(
    async (order: AdminOrder) => {
      const allLines = [...order.items, ...order.removedItems];
      const missingIds = [
        ...new Set(
          allLines
            .map((l) => l.productId)
            .filter((id) => !productImagesRef.current[id])
        ),
      ];
      if (missingIds.length === 0) return;

      setLoadingImages(true);
      try {
        const resolved: Record<string, string> = {};
        try {
          const activeProducts = await fetchProductsByIds(missingIds);
          for (const prod of activeProducts) {
            if (prod.image) resolved[prod.id] = prod.image;
          }
        } catch {
          /* Respaldo con listado admin */
        }

        const stillMissing = missingIds.filter((id) => !resolved[id]);
        if (stillMissing.length > 0) {
          try {
            const adminRes = await fetchAdminProducts(token, {
              page: 1,
              pageSize: 100,
            });
            const missingSet = new Set(stillMissing);
            for (const prod of adminRes.items) {
              if (prod.primary_image && missingSet.has(prod.id)) {
                resolved[prod.id] = prod.primary_image;
              }
            }
          } catch {
            /* Ignorar respaldo */
          }
        }

        if (Object.keys(resolved).length > 0) {
          onImagesDiscovered(resolved);
        }
      } finally {
        setLoadingImages(false);
      }
    },
    [token, onImagesDiscovered]
  );

  const openOrderDetail = useCallback(
    async (item: AdminOrderListItem) => {
      setSelectedOrder(item);
      setDetail(null);
      setEditableLines([]);
      setOutcome("closed");
      setCancelReason("price");
      setCancelNote("");
      setConfirmUnpriced(false);
      setPaymentNote("");
      setDisputeOpen(false);
      setDisputeReason("");
      setLoadingDetail(true);
      try {
        const full = await fetchOrder(token, item.id);
        setDetail(full);
        setEditableLines(
          full.items.map((line) => ({
            productId: line.productId,
            productName: line.productName,
            quantity: line.quantity,
            price: line.unitPriceUsd === null ? "" : String(line.unitPriceUsd),
            remove: false,
          }))
        );
        void resolveOrderImages(full);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "No se pudo abrir la solicitud."
        );
        setSelectedOrder(null);
      } finally {
        setLoadingDetail(false);
      }
    },
    [token, resolveOrderImages]
  );

  // Deep link ?order=DE-XXXXXXXX
  const handledTargetRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      !targetOrder ||
      handledTargetRef.current === targetOrder ||
      !token ||
      loadingDetail
    ) {
      return;
    }

    const found = orders.find(
      (o) =>
        o.reference.toLowerCase() === targetOrder.toLowerCase() ||
        o.id.toLowerCase() === targetOrder.toLowerCase()
    );
    const idToFetch = found?.id ?? (isUuid(targetOrder) ? targetOrder : null);
    if (!idToFetch) return;

    handledTargetRef.current = targetOrder;
    let active = true;

    fetchOrder(token, idToFetch)
      .then((full) => {
        if (!active) return;
        setSelectedOrder(
          found ?? {
            id: full.id,
            reference: full.reference,
            status: full.status,
            store: full.store,
            estimatedTotalUsd: full.estimatedTotalUsd,
            originalEstimatedTotalUsd: full.originalEstimatedTotalUsd,
            itemCount: full.items.reduce((acc, i) => acc + i.quantity, 0),
            createdAt: full.createdAt,
            closedAt: full.closedAt,
            closedByAdminUserId: full.closedByAdminUserId,
            cancellationReason: full.cancellationReason,
            hasUnpricedItems: full.hasUnpricedItems,
            items: full.items,
            referralCode: full.referralCode,
            referredByAdminName: full.referredByAdminName,
          }
        );
        setDetail(full);
        setEditableLines(
          full.items.map((line) => ({
            productId: line.productId,
            productName: line.productName,
            quantity: line.quantity,
            price: line.unitPriceUsd === null ? "" : String(line.unitPriceUsd),
            remove: false,
          }))
        );
        setOutcome("closed");
        setCancelReason("price");
        setCancelNote("");
        setConfirmUnpriced(false);
        void resolveOrderImages(full);
      })
      .catch((err) => {
        if (!active) return;
        toast.error(
          err instanceof Error ? err.message : "No se encontró el pedido."
        );
      });

    return () => {
      active = false;
    };
  }, [targetOrder, orders, token, loadingDetail, resolveOrderImages]);

  const closeModal = () => {
    if (saving || commissionBusy) return;
    setSelectedOrder(null);
    setDetail(null);
    setPaymentNote("");
    setDisputeOpen(false);
    setDisputeReason("");
    if (targetOrder) {
      router.replace("/tienda/admin", { scroll: false });
    }
  };

  const handleMarkCommissionPaid = async () => {
    if (!detail || commissionBusy) return;
    setCommissionBusy(true);
    try {
      const updated = await markOrderCommissionPaid(token, detail.id, paymentNote);
      setDetail(updated);
      setPaymentNote("");
      toast.success("Comisión marcada como pagada. Se notificó al afiliado.");
      onMutated();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudo registrar el pago de la comisión."
      );
    } finally {
      setCommissionBusy(false);
    }
  };

  const handleConfirmCommission = async () => {
    if (!detail || commissionBusy) return;
    setCommissionBusy(true);
    try {
      const updated = await confirmOrderCommissionPaid(token, detail.id);
      setDetail(updated);
      setDisputeOpen(false);
      setDisputeReason("");
      toast.success("¡Confirmado! El pago de tu comisión quedó registrado.");
      onMutated();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudo confirmar la comisión."
      );
    } finally {
      setCommissionBusy(false);
    }
  };

  const handleDisputeCommission = async () => {
    if (!detail || commissionBusy) return;
    if (disputeReason.trim().length < 3) {
      toast.error("Describe brevemente el problema con el pago.");
      return;
    }
    setCommissionBusy(true);
    try {
      const updated = await disputeOrderCommission(token, detail.id, disputeReason);
      setDetail(updated);
      setDisputeOpen(false);
      setDisputeReason("");
      toast.warning("Reporte enviado al vendedor y a moderación.");
      onMutated();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo enviar el reporte."
      );
    } finally {
      setCommissionBusy(false);
    }
  };

  const finalLines = editableLines.filter((l) => !l.remove);
  const hasUnpricedFinal = finalLines.some((l) => {
    const num = Number.parseFloat(l.price.replace(",", "."));
    return !Number.isFinite(num) || num <= 0;
  });

  const handleCloseOrder = async () => {
    if (!selectedOrder) return;
    if (finalLines.length === 0) {
      toast.error("La solicitud necesita al menos un producto.");
      return;
    }
    if (outcome === "cancelled" && !cancelReason) {
      toast.error("Indica el motivo de la cancelación.");
      return;
    }
    if (outcome === "closed" && hasUnpricedFinal && !confirmUnpriced) {
      toast.error("Confirma que vas a cerrar la venta con artículos sin precio.");
      return;
    }

    setSaving(true);
    try {
      await closeOrder(token, selectedOrder.id, {
        outcome,
        items: finalLines.map((l) => {
          const val = Number.parseFloat(l.price.replace(",", "."));
          return {
            productId: l.productId,
            quantity: l.quantity,
            unitPriceUsd: Number.isFinite(val) ? val : null,
          };
        }),
        cancellationReason: outcome === "cancelled" ? cancelReason : null,
        cancellationNote:
          outcome === "cancelled" ? cancelNote.trim() || null : null,
      });
      toast.success(
        outcome === "closed"
          ? "Solicitud marcada como vendida"
          : "Solicitud cancelada"
      );
      closeModal();
      onMutated();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo cerrar la solicitud."
      );
    } finally {
      setSaving(false);
    }
  };

  const selectDatePreset = (preset: OrderDatePreset) => {
    const today = toLocalYmd(new Date());
    setPage(1);
    setDateFilter((prev) => ({
      ...prev,
      preset,
      singleDate: preset === "single" ? prev.singleDate || today : prev.singleDate,
    }));
  };

  const referralOptions = useMemo(() => {
    const map = new Map<string, string>();
    const ownCode = normalizeReferralCode(sellerProfile?.referralCode);
    if (ownCode) {
      map.set(ownCode, sellerProfile?.displayName?.trim() || ownCode);
    }
    for (const [code, label] of Object.entries(knownReferrals)) {
      const clean = normalizeReferralCode(code);
      if (clean && !map.has(clean)) map.set(clean, label || clean);
    }
    return Array.from(map.entries())
      .map(([code, label]) => ({ code, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [sellerProfile?.referralCode, sellerProfile?.displayName, knownReferrals]);

  const hasFilters = Boolean(
    debouncedQuery ||
      statusFilter !== "all" ||
      commissionFilter !== "all" ||
      referralFilter !== "all" ||
      priceFilter !== "all" ||
      dateFilter.preset !== "all"
  );

  const resetFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setStatusFilter("all");
    setCommissionFilter("all");
    setReferralFilter("all");
    setPriceFilter("all");
    setDateFilter(DEFAULT_ORDER_DATE_FILTER);
    setPage(1);
  };

  const canManageDetailOrder = Boolean(
    detail &&
      detail.status === "requested" &&
      (sellerProfile?.role === "admin" ||
        (Boolean(sellerProfile?.id) &&
          (detail.ownerAdminUserId === sellerProfile?.id ||
            detail.items.some((i) => i.ownerAdminUserId === sellerProfile?.id))))
  );

  return (
    <div className="space-y-4">
      {/* Filtro de rol: Mis ventas (dueño), Mis referidos (afiliado), Mis compras */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            { id: "all", label: "Todas mis solicitudes" },
            { id: "owner", label: "Mis ventas (dueño)" },
            { id: "affiliate", label: "Mis referidos (afiliado)" },
            { id: "buyer", label: "Mis compras" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              setScopeFilter(opt.id);
              setPage(1);
            }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              scopeFilter === opt.id
                ? "bg-zinc-950 text-white"
                : "border border-zinc-200 bg-white text-zinc-700 hover:bg-violet-50 hover:text-violet-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Presets de fecha */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 inline-flex items-center gap-1 text-xs font-bold text-zinc-600">
            <Calendar className="h-3.5 w-3.5 text-violet-600" />
            Periodo:
          </span>
          {DATE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectDatePreset(p.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                dateFilter.preset === p.id
                  ? "bg-[#6018F8] text-white"
                  : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-violet-50 hover:text-violet-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {dateFilter.preset === "single" && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="date"
              value={dateFilter.singleDate}
              onChange={(e) => {
                setDateFilter((prev) => ({
                  ...prev,
                  singleDate: e.target.value,
                }));
                setPage(1);
              }}
              className="h-9 rounded-xl border border-zinc-200 px-3 text-xs text-zinc-900"
            />
          </div>
        )}

        {dateFilter.preset === "range" && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={dateFilter.fromDate}
              onChange={(e) => {
                setDateFilter((prev) => ({ ...prev, fromDate: e.target.value }));
                setPage(1);
              }}
              className="h-9 rounded-xl border border-zinc-200 px-3 text-xs text-zinc-900"
            />
            <span className="text-xs text-zinc-400">a</span>
            <input
              type="date"
              value={dateFilter.toDate}
              onChange={(e) => {
                setDateFilter((prev) => ({ ...prev, toDate: e.target.value }));
                setPage(1);
              }}
              className="h-9 rounded-xl border border-zinc-200 px-3 text-xs text-zinc-900"
            />
          </div>
        )}

        {resolvedDates.validationError && (
          <p className="mt-2 text-xs font-medium text-rose-600">
            {resolvedDates.validationError}
          </p>
        )}
      </div>

      {/* KPIs de solicitudes */}
      {metrics && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-[11px] font-semibold text-zinc-500">
              {resolvedDates.periodLabel}
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-zinc-950 tabular-nums">
              {metrics.requests}
            </p>
            <p className="mt-0.5 text-[11px] text-amber-700 font-medium">
              {metrics.openRequests} abiertas
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-[11px] font-semibold text-zinc-500">Vendidas</p>
            <p className="mt-1 font-display text-2xl font-bold text-emerald-700 tabular-nums">
              {metrics.closedRequests}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500 tabular-nums">
              Cierre:{" "}
              {metrics.closeRate !== null
                ? `${Math.round(metrics.closeRate * 100)}%`
                : "—"}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-[11px] font-semibold text-zinc-500">
              Canceladas
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-rose-600 tabular-nums">
              {metrics.cancelledRequests}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              En el periodo seleccionado
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-[11px] font-semibold text-zinc-500">
              Ventas cerradas
            </p>
            <p className="mt-1 font-display text-xl font-bold text-zinc-950 tabular-nums sm:text-2xl">
              {formatPrice(metrics.closedEstimatedValueUsd ?? 0)}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500 tabular-nums">
              Estimado total: {formatPrice(metrics.estimatedValueUsd ?? 0)}
            </p>
            {(metrics.totalAffiliateCommissionUsd ?? 0) > 0 && (
              <div className="mt-1 space-y-0.5 text-[11px] tabular-nums">
                {(metrics.pendingAffiliateCommissionUsd ?? 0) > 0 && (
                  <p className="font-bold text-amber-700">
                    Por pagar: {formatPrice(metrics.pendingAffiliateCommissionUsd ?? 0)}
                    {metrics.pendingCommissionOrders
                      ? ` (${metrics.pendingCommissionOrders})`
                      : ""}
                  </p>
                )}
                {(metrics.paidAffiliateCommissionUsd ?? 0) > 0 && (
                  <p className="font-semibold text-emerald-700">
                    Pagadas: {formatPrice(metrics.paidAffiliateCommissionUsd ?? 0)}
                  </p>
                )}
                {!(metrics.pendingAffiliateCommissionUsd ?? 0) &&
                  !(metrics.paidAffiliateCommissionUsd ?? 0) && (
                    <p className="font-semibold text-zinc-500">
                      Comisión est.: {formatPrice(metrics.totalAffiliateCommissionUsd ?? 0)}
                    </p>
                  )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Búsqueda y filtros */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por referencia (DE-...), comprador, teléfono, producto o vendedor..."
            className="h-10 w-full rounded-full border border-zinc-200 bg-white pl-10 pr-8 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setDebouncedQuery("");
                setPage(1);
              }}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-zinc-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-full border px-4 text-xs font-semibold transition ${
            showFilters || hasFilters
              ? "border-violet-300 bg-violet-50 text-violet-800"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros
        </button>
      </div>

      {showFilters && (
        <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(
                e.target.value as "all" | "requested" | "closed" | "cancelled"
              );
              setPage(1);
            }}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800"
          >
            <option value="all">Estado: Todos</option>
            <option value="requested">Solicitada (abierta)</option>
            <option value="closed">Vendida</option>
            <option value="cancelled">Cancelada</option>
          </select>

          <select
            value={commissionFilter}
            onChange={(e) => {
              setCommissionFilter(
                e.target.value as "all" | CommissionPayoutStatus
              );
              setPage(1);
            }}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800"
          >
            <option value="all">Comisiones: Todas</option>
            <option value="pending">Falta pagar comisión</option>
            <option value="paid">Comisión pagada (por confirmar)</option>
            <option value="confirmed">Comisión confirmada</option>
            <option value="disputed">Comisión reportada</option>
          </select>

          <select
            value={referralFilter}
            onChange={(e) => {
              setReferralFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800"
          >
            <option value="all">Origen: Todos</option>
            <option value="any">Con enlace de vendedor</option>
            <option value="none">Directas (sin referido)</option>
            {referralOptions.map((opt) => (
              <option key={opt.code} value={opt.code}>
                Vendedor: {opt.label} (?v={opt.code})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <select
              value={priceFilter}
              onChange={(e) => {
                setPriceFilter(
                  e.target.value as "all" | "unpriced" | "priced"
                );
                setPage(1);
              }}
              className="h-9 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800"
            >
              <option value="all">Precios: Todos</option>
              <option value="unpriced">Con artículos sin precio</option>
              <option value="priced">Todos con precio</option>
            </select>
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                title="Limpiar filtros"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {errorMsg && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
          {errorMsg}
        </p>
      )}

      {/* Lista de solicitudes */}
      {loading && orders.length === 0 ? (
        <div className="flex items-center justify-center py-14 text-sm text-zinc-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-violet-600" />
          Cargando solicitudes…
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/70 px-6 py-12 text-center">
          <ClipboardList className="mx-auto h-7 w-7 text-zinc-400" />
          <p className="mt-3 text-sm font-semibold text-zinc-800">
            No hay solicitudes de pedido para estos filtros.
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {orders.map((order) => {
            const effCommStatus = resolveEffectiveCommissionStatus(order);
            const commMeta = effCommStatus
              ? COMMISSION_STATUS_META[effCommStatus]
              : null;

            return (
              <li
                key={order.id}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-zinc-950">
                      #{order.reference}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        STATUS_STYLES[order.status] ?? "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                    {order.buyerDisplayName && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-800">
                        <User className="h-3 w-3 text-zinc-500" />
                        {order.buyerDisplayName}
                      </span>
                    )}
                    {(order.affiliateHandle || order.referralCode) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-800">
                        <Link2 className="h-3 w-3" />
                        {order.affiliateHandle
                          ? `Afiliado @${order.affiliateHandle}`
                          : order.referredByAdminName || order.referralCode}
                      </span>
                    )}
                    {commMeta ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold tabular-nums ${commMeta.badgeClass}`}
                      >
                        <DollarSign className="h-3 w-3" />
                        {commMeta.label}
                        {typeof order.totalAffiliateCommissionUsd === "number" &&
                        order.totalAffiliateCommissionUsd > 0
                          ? ` (${formatPrice(order.totalAffiliateCommissionUsd)})`
                          : ""}
                      </span>
                    ) : (
                      typeof order.totalAffiliateCommissionUsd === "number" &&
                      order.totalAffiliateCommissionUsd > 0 && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 tabular-nums">
                          Comisión est.:{" "}
                          {formatPrice(order.totalAffiliateCommissionUsd)}
                        </span>
                      )
                    )}
                    {order.whatsAppRouting === "affiliate" && (
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10.5px] font-semibold text-sky-800">
                        WA al afiliado
                      </span>
                    )}
                    {order.hasUnpricedItems && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-semibold text-amber-800">
                        Sin precio
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-500">
                    {formatDate(order.createdAt)} · {order.itemCount}{" "}
                    {order.itemCount === 1 ? "artículo" : "artículos"}
                    {order.items.length > 0 &&
                      ` — ${order.items
                        .slice(0, 2)
                        .map((i) => `${i.quantity}× ${i.productName}`)
                        .join(", ")}${order.items.length > 2 ? "…" : ""}`}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-zinc-100 pt-2.5 sm:justify-end sm:border-t-0 sm:pt-0">
                  <p className="font-display text-base font-bold text-zinc-950 tabular-nums">
                    {order.estimatedTotalUsd !== null
                      ? formatPrice(order.estimatedTotalUsd)
                      : "Por confirmar"}
                  </p>
                  <button
                    type="button"
                    onClick={() => void openOrderDetail(order)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-zinc-950 px-4 text-xs font-semibold text-white transition hover:bg-[#6018F8]"
                  >
                    {order.status === "requested" ? "Gestionar" : "Ver detalle"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <PaginationControls
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={ADMIN_PAGE_SIZE}
        onPageChange={setPage}
        disabled={loading}
      />

      {/* Modal detalle y cierre */}
      <AdminModal
        open={selectedOrder !== null}
        onClose={closeModal}
        title={
          selectedOrder ? `Solicitud #${selectedOrder.reference}` : "Solicitud"
        }
        description={
          detail
            ? `Creada el ${formatDate(detail.createdAt)} · Estado: ${STATUS_LABELS[detail.status] ?? detail.status}`
            : undefined
        }
        footer={
          canManageDetailOrder ? (
            <>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="inline-flex h-10 items-center rounded-full border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => void handleCloseOrder()}
                disabled={saving}
                className={`inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-xs font-semibold text-white transition disabled:opacity-50 ${
                  outcome === "closed"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {outcome === "closed"
                  ? "Confirmar venta"
                  : "Cancelar solicitud"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={closeModal}
              className="inline-flex h-10 items-center rounded-full border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              Cerrar
            </button>
          )
        }
      >
        {loadingDetail || !detail ? (
          <div className="flex items-center justify-center py-12 text-sm text-zinc-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-violet-600" />
            Cargando detalle de la solicitud…
          </div>
        ) : (
          <div className="space-y-5">
            {/* Datos del comprador (visible para dueño, afiliado acreditado y superadmin) */}
            {(detail.buyerDisplayName || detail.buyerWhatsAppPhone) && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/90 p-3.5">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Información del comprador
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-zinc-950">
                    <User className="h-4 w-4 text-[#6018F8]" />
                    {detail.buyerDisplayName || "Comprador registrado"}
                  </p>
                  {detail.buyerWhatsAppPhone && (
                    <p className="mt-0.5 font-mono text-xs text-zinc-600">
                      WhatsApp: +{detail.buyerWhatsAppPhone}
                    </p>
                  )}
                </div>
                {detail.buyerWhatsAppPhone &&
                  detail.buyerAdminUserId !== sellerProfile?.id && (
                    <a
                      href={buildStoreWhatsAppUrl(
                        detail.items.some(
                          (i) => i.affiliateUserId === sellerProfile?.id
                        ) && detail.ownerAdminUserId !== sellerProfile?.id
                          ? `Hola ${detail.buyerDisplayName || ""}, te escribo como afiliado de Deve Tienda respecto a tu solicitud #${detail.reference} para confirmar si pudiste finalizar tu compra.`
                          : `Hola ${detail.buyerDisplayName || ""}, te escribo respecto a tu solicitud #${detail.reference} en Deve Tienda.`,
                        detail.buyerWhatsAppPhone
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-700"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Escribir al comprador
                    </a>
                  )}
              </div>
            )}

            {(detail.affiliateHandle || detail.referralCode) && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800">
                  <Link2 className="h-3.5 w-3.5" />
                  Referido por:{" "}
                  {detail.referredByAdminName ||
                    detail.affiliateHandle ||
                    detail.referralCode}
                  {detail.affiliateHandle
                    ? ` (@${detail.affiliateHandle})`
                    : detail.referralCode
                      ? ` (?v=${detail.referralCode})`
                      : ""}
                </div>
                {typeof detail.totalAffiliateCommissionUsd === "number" &&
                  detail.totalAffiliateCommissionUsd > 0 && (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900 tabular-nums">
                      Comisión afiliado: {formatPrice(detail.totalAffiliateCommissionUsd)}
                    </span>
                  )}
                {detail.whatsAppRecipientName && (
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                    WhatsApp dirigido a: {detail.whatsAppRecipientName}
                  </span>
                )}
              </div>
            )}

            {/* Artículos */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Artículos solicitados
                </h3>
                {loadingImages && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Fotos…
                  </span>
                )}
              </div>

              {canManageDetailOrder ? (
                <ul className="space-y-2.5">
                  {editableLines.map((line, idx) => (
                    <li
                      key={line.productId}
                      className={`flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center ${
                        line.remove
                          ? "border-rose-200 bg-rose-50/50 opacity-60"
                          : "border-zinc-200 bg-white"
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <ZoomableThumb
                          src={productImages[line.productId]}
                          alt={line.productName}
                          onPreview={onPreviewImage}
                          className="h-12 w-12 rounded-xl"
                        />
                        <p
                          className={`min-w-0 flex-1 text-xs font-semibold text-zinc-950 ${
                            line.remove ? "line-through" : ""
                          }`}
                        >
                          {line.productName}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <QuantityStepper
                          value={line.quantity}
                          min={1}
                          max={99}
                          size="sm"
                          onChange={(qty) =>
                            setEditableLines((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, quantity: qty } : item
                              )
                            )
                          }
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          disabled={line.remove}
                          value={line.price}
                          onChange={(e) =>
                            setEditableLines((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? { ...item, price: e.target.value }
                                  : item
                              )
                            )
                          }
                          placeholder="Precio USD"
                          className="h-8 w-24 rounded-xl border border-zinc-200 px-2.5 text-xs text-zinc-950"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setEditableLines((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? { ...item, remove: !item.remove }
                                  : item
                              )
                            )
                          }
                          title={line.remove ? "Restaurar" : "Quitar de la venta"}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs ${
                            line.remove
                              ? "border-zinc-300 bg-white text-zinc-700"
                              : "border-rose-200 bg-rose-50 text-rose-600"
                          }`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="space-y-2">
                  {detail.items.map((line) => (
                    <li
                      key={line.productId}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3 text-xs"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <ZoomableThumb
                          src={productImages[line.productId]}
                          alt={line.productName}
                          onPreview={onPreviewImage}
                          className="h-11 w-11 rounded-lg"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-zinc-950">
                            {line.quantity} × {line.productName}
                          </p>
                          <p className="text-zinc-500">
                            {line.unitPriceUsd !== null
                              ? `${formatPrice(line.unitPriceUsd)} c/u`
                              : "Sin precio"}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-zinc-950 tabular-nums">
                        {formatPriceLabel(line.lineTotalUsd ?? 0)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {detail.removedItems.length > 0 && (
              <div>
                <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Artículos quitados al cerrar
                </h3>
                <ul className="space-y-1 text-xs text-zinc-500">
                  {detail.removedItems.map((line) => (
                    <li key={line.productId} className="line-through">
                      {line.originalQuantity} × {line.productName}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cierre si está abierta */}
            {canManageDetailOrder ? (
              <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Resultado del pedido
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOutcome("closed")}
                    className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition ${
                      outcome === "closed"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-zinc-200 bg-white text-zinc-600"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Vendida
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutcome("cancelled")}
                    className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition ${
                      outcome === "cancelled"
                        ? "border-rose-500 bg-rose-50 text-rose-700"
                        : "border-zinc-200 bg-white text-zinc-600"
                    }`}
                  >
                    <XCircle className="h-4 w-4" />
                    Cancelada
                  </button>
                </div>

                {outcome === "closed" && hasUnpricedFinal && (
                  <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-medium text-amber-950">
                    <input
                      type="checkbox"
                      checked={confirmUnpriced}
                      onChange={(e) => setConfirmUnpriced(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[#6018F8]"
                    />
                    <span>
                      Hay artículos sin precio final. Confirmo cerrar la venta
                      así (o escribe su precio unitario arriba).
                    </span>
                  </label>
                )}

                {outcome === "cancelled" && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700">
                        Motivo de cancelación *
                      </label>
                      <select
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="mt-1 h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900"
                      >
                        {CANCELLATION_REASONS.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700">
                        Nota adicional (opcional)
                      </label>
                      <textarea
                        rows={2}
                        value={cancelNote}
                        onChange={(e) => setCancelNote(e.target.value)}
                        placeholder="Detalles breves..."
                        className="mt-1 w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs space-y-1">
                <p className="font-bold text-zinc-950">
                  Total final:{" "}
                  {detail.estimatedTotalUsd !== null
                    ? formatPrice(detail.estimatedTotalUsd)
                    : "Sin precio"}
                </p>
                {detail.cancellationReason && (
                  <p className="text-rose-700">
                    Motivo:{" "}
                    {CANCELLATION_REASONS.find(
                      (r) => r.id === detail.cancellationReason
                    )?.label ?? detail.cancellationReason}
                  </p>
                )}
                {detail.cancellationNote && (
                  <p className="text-zinc-600">Nota: {detail.cancellationNote}</p>
                )}
              </div>
            )}

            {/* Liquidación de comisión de afiliado (cuando la venta está cerrada) */}
            {detail.status === "closed" &&
              (detail.affiliateHandle || detail.commissionStatus) &&
              (() => {
                const effStatus = resolveEffectiveCommissionStatus(detail);
                const meta = effStatus
                  ? COMMISSION_STATUS_META[effStatus]
                  : null;
                const isOrderOwnerOrAdmin =
                  sellerProfile?.role === "admin" ||
                  detail.ownerAdminUserId === sellerProfile?.id ||
                  detail.items.some(
                    (i) => i.ownerAdminUserId === sellerProfile?.id
                  );
                const isOrderAffiliate =
                  Boolean(sellerProfile?.id) &&
                  (detail.items.some(
                    (i) => i.affiliateUserId === sellerProfile?.id
                  ) ||
                    (Boolean(detail.affiliateHandle) &&
                      detail.affiliateHandle === sellerProfile?.handle));
                const canOwnerMarkPaid =
                  isOrderOwnerOrAdmin &&
                  (effStatus === "pending" || effStatus === "disputed");
                const canAffiliateConfirm =
                  (isOrderAffiliate || sellerProfile?.role === "admin") &&
                  (effStatus === "paid" || effStatus === "disputed");
                const canAffiliateDispute =
                  isOrderAffiliate &&
                  (effStatus === "pending" || effStatus === "paid");

                return (
                  <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-700">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        Liquidación de comisión (@{detail.affiliateHandle})
                      </p>
                      {meta && (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-zinc-600">
                      <p className="font-bold text-zinc-950 tabular-nums">
                        Monto a liquidar:{" "}
                        {typeof detail.totalAffiliateCommissionUsd === "number"
                          ? formatPrice(detail.totalAffiliateCommissionUsd)
                          : "Por acordar"}
                      </p>
                      {detail.commissionPaidAt && (
                        <p>
                          Marcada como pagada el{" "}
                          <strong>{formatDate(detail.commissionPaidAt)}</strong>
                        </p>
                      )}
                      {detail.commissionPaymentNote && (
                        <p>
                          Comprobante / nota del vendedor:{" "}
                          <span className="font-medium text-zinc-800">
                            {detail.commissionPaymentNote}
                          </span>
                        </p>
                      )}
                      {detail.commissionConfirmedAt && (
                        <p className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Confirmada recibida el{" "}
                          {formatDate(detail.commissionConfirmedAt)}
                        </p>
                      )}
                      {detail.commissionDisputeNote && (
                        <p className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-800">
                          <span className="font-bold">Reporte del afiliado: </span>
                          {detail.commissionDisputeNote}
                        </p>
                      )}
                    </div>

                    {canOwnerMarkPaid && (
                      <div className="space-y-2 border-t border-zinc-100 pt-3">
                        <input
                          type="text"
                          maxLength={500}
                          value={paymentNote}
                          onChange={(e) => setPaymentNote(e.target.value)}
                          placeholder="Nota opcional del pago (ej. Transfermóvil #8421, efectivo…)"
                          className="h-9 w-full rounded-xl border border-zinc-200 px-3 text-xs text-zinc-950 focus:border-violet-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={commissionBusy}
                          onClick={() => void handleMarkCommissionPaid()}
                          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {commissionBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Marcar comisión como pagada
                        </button>
                      </div>
                    )}

                    {(canAffiliateConfirm || canAffiliateDispute) && (
                      <div className="space-y-2 border-t border-zinc-100 pt-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {canAffiliateConfirm && (
                            <button
                              type="button"
                              disabled={commissionBusy}
                              onClick={() => void handleConfirmCommission()}
                              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#6018F8] px-4 text-xs font-semibold text-white transition hover:bg-[#5010E8] disabled:opacity-50"
                            >
                              {commissionBusy ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <BadgeCheck className="h-3.5 w-3.5" />
                              )}
                              Confirmar que recibí el pago
                            </button>
                          )}
                          {canAffiliateDispute && (
                            <button
                              type="button"
                              disabled={commissionBusy}
                              onClick={() => setDisputeOpen((v) => !v)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {disputeOpen
                                ? "Cancelar reporte"
                                : "No recibí el pago / Reportar"}
                            </button>
                          )}
                        </div>

                        {disputeOpen && canAffiliateDispute && (
                          <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3">
                            <textarea
                              rows={2}
                              maxLength={500}
                              value={disputeReason}
                              onChange={(e) => setDisputeReason(e.target.value)}
                              placeholder="Explica brevemente qué ocurrió (ej. No me llegó la transferencia aún)…"
                              className="w-full rounded-xl border border-rose-200 bg-white p-2.5 text-xs text-zinc-950 focus:border-rose-400 focus:outline-none"
                            />
                            <button
                              type="button"
                              disabled={commissionBusy}
                              onClick={() => void handleDisputeCommission()}
                              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-rose-600 px-4 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                            >
                              {commissionBusy && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              )}
                              Enviar reporte
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
          </div>
        )}
      </AdminModal>
    </div>
  );
}
