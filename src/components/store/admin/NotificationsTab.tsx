"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Check,
  CheckCheck,
  ClipboardList,
  DollarSign,
  Handshake,
  Loader2,
  PackagePlus,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { PaginationControls } from "@/components/store/PaginationControls";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type UserNotificationItem,
} from "@/lib/store/admin-api";
import { formatDate } from "@/lib/store/format";

interface NotificationsTabProps {
  token: string;
  isSuperAdmin: boolean;
  refreshTick: number;
  onUnreadCountChanged: (count: number) => void;
  onOpenOrder?: (orderId: string) => void;
  onGoToModeration?: () => void;
}

const PAGE_SIZE = 25;

function notificationIcon(type: string) {
  switch (type) {
    case "affiliate_order_received":
    case "affiliate_order_closed":
      return {
        icon: Handshake,
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "affiliate_commission_paid":
      return {
        icon: DollarSign,
        badge: "bg-sky-50 text-sky-700 border-sky-200",
      };
    case "affiliate_commission_confirmed":
      return {
        icon: BadgeCheck,
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "affiliate_commission_disputed":
      return {
        icon: AlertTriangle,
        badge: "bg-rose-50 text-rose-700 border-rose-200",
      };
    case "seller_order_received":
      return {
        icon: ClipboardList,
        badge: "bg-violet-50 text-violet-700 border-violet-200",
      };
    case "new_product_published":
      return {
        icon: PackagePlus,
        badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
      };
    case "product_moderated":
    case "seller_warning":
      return {
        icon: AlertTriangle,
        badge: "bg-amber-50 text-amber-800 border-amber-200",
      };
    case "seller_suspended":
      return {
        icon: ShieldAlert,
        badge: "bg-rose-50 text-rose-700 border-rose-200",
      };
    default:
      return {
        icon: Bell,
        badge: "bg-zinc-100 text-zinc-700 border-zinc-200",
      };
  }
}

export function NotificationsTab({
  token,
  isSuperAdmin,
  refreshTick,
  onUnreadCountChanged,
  onOpenOrder,
  onGoToModeration,
}: NotificationsTabProps) {
  const [items, setItems] = useState<UserNotificationItem[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadedKey, setLoadedKey] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const requestKey = `${token}|${unreadOnly ? "1" : "0"}|${page}|${refreshTick}`;
  const loading = Boolean(token) && loadedKey !== requestKey;

  useEffect(() => {
    if (!token) return;
    let active = true;
    const controller = new AbortController();
    const key = requestKey;

    fetchNotifications(token, {
      unreadOnly,
      page,
      pageSize: PAGE_SIZE,
      signal: controller.signal,
    })
      .then((res) => {
        if (!active) return;
        setItems(res.items);
        setUnreadCount(res.unreadCount);
        setTotalItems(res.totalItems);
        setTotalPages(Math.max(1, res.totalPages));
        onUnreadCountChanged(res.unreadCount);
      })
      .catch((err) => {
        if (!active || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        toast.error(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las notificaciones."
        );
      })
      .finally(() => {
        if (active) setLoadedKey(key);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [token, unreadOnly, page, requestKey, onUnreadCountChanged]);

  const handleMarkRead = async (item: UserNotificationItem) => {
    if (item.isRead) return;
    try {
      await markNotificationRead(token, item.id);
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, isRead: true } : x))
      );
      const nextUnread = Math.max(0, unreadCount - 1);
      setUnreadCount(nextUnread);
      onUnreadCountChanged(nextUnread);
    } catch {
      /* Silencioso */
    }
  };

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead(token);
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
      setUnreadCount(0);
      onUnreadCountChanged(0);
      toast.success("Todas las notificaciones marcadas como leídas");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar.");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setUnreadOnly(false);
              setPage(1);
            }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              !unreadOnly
                ? "bg-[#6018F8] text-white"
                : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-violet-50"
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => {
              setUnreadOnly(true);
              setPage(1);
            }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              unreadOnly
                ? "bg-[#6018F8] text-white"
                : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-violet-50"
            }`}
          >
            Sin leer ({unreadCount})
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            disabled={markingAll}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            {markingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5 text-violet-600" />
            )}
            Marcar todas como leídas
          </button>
        )}
      </div>

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center py-14 text-sm text-zinc-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-violet-600" />
          Cargando notificaciones…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50/70 px-6 py-12 text-center">
          <Bell className="mx-auto h-7 w-7 text-zinc-400" />
          <p className="mt-3 text-sm font-semibold text-zinc-800">
            {unreadOnly
              ? "No tienes notificaciones pendientes."
              : "Todavía no tienes notificaciones."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => {
            const style = notificationIcon(item.type);
            const Icon = style.icon;
            return (
              <li
                key={item.id}
                className={`flex flex-col gap-3 rounded-2xl border p-4 transition sm:flex-row sm:items-start sm:justify-between ${
                  item.isRead
                    ? "border-zinc-200 bg-white"
                    : "border-violet-200 bg-violet-50/35"
                }`}
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span
                    className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${style.badge}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-zinc-950">
                        {item.title}
                      </p>
                      {!item.isRead && (
                        <span className="h-2 w-2 rounded-full bg-[#6018F8]" />
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-700">
                      {item.message}
                    </p>
                    <p className="mt-1.5 text-[11px] text-zinc-400">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0">
                  {item.entityType === "order" && item.entityId && onOpenOrder && (
                    <button
                      type="button"
                      onClick={() => {
                        void handleMarkRead(item);
                        onOpenOrder(item.entityId!);
                      }}
                      className="inline-flex h-8 items-center rounded-full border border-violet-200 bg-white px-3 text-xs font-semibold text-violet-800 hover:bg-violet-50"
                    >
                      Ver solicitud
                    </button>
                  )}
                  {isSuperAdmin &&
                    item.type === "new_product_published" &&
                    onGoToModeration && (
                      <button
                        type="button"
                        onClick={() => {
                          void handleMarkRead(item);
                          onGoToModeration();
                        }}
                        className="inline-flex h-8 items-center rounded-full border border-violet-200 bg-white px-3 text-xs font-semibold text-violet-800 hover:bg-violet-50"
                      >
                        Revisar en Moderación
                      </button>
                    )}
                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={() => void handleMarkRead(item)}
                      title="Marcar como leída"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
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
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        disabled={loading}
      />
    </div>
  );
}
