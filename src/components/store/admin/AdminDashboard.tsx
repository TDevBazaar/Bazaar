"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AlertTriangle,
  Bell,
  Boxes,
  ClipboardList,
  Copy,
  ExternalLink,
  FolderTree,
  Handshake,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Store,
  UserCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { AffiliationsTab } from "@/components/store/admin/AffiliationsTab";
import { CategoriesAdminTab } from "@/components/store/admin/CategoriesAdminTab";
import { ModerationTab } from "@/components/store/admin/ModerationTab";
import { NotificationsTab } from "@/components/store/admin/NotificationsTab";
import { OrdersAdminTab } from "@/components/store/admin/OrdersAdminTab";
import { ProductsAdminTab } from "@/components/store/admin/ProductsAdminTab";
import { SellerLinkTab } from "@/components/store/admin/SellerLinkTab";
import {
  ImagePreviewModal,
  type PreviewImageData,
} from "@/components/store/ImagePreviewModal";
import {
  fetchAdminCategories,
  fetchUnreadNotificationCount,
  registerCurrentSeller,
  type AdminSellerProfile,
  type OrderMetrics,
} from "@/lib/store/admin-api";
import { reloadCatalog } from "@/lib/store/catalog";
import { formatDate } from "@/lib/store/format";
import {
  ApiError,
  STORE_KEY,
  fetchCatalogMeta,
  fetchStoreCategoriesRaw,
  type ApiCategory,
} from "@/lib/store/powergy-api";
import { buildSellerProfileUrl, normalizeHandle } from "@/lib/store/referral";
import { getSupabaseClient } from "@/lib/store/supabase";

type AdminTab =
  | "productos"
  | "afiliaciones"
  | "pedidos"
  | "notificaciones"
  | "moderacion"
  | "categorias"
  | "enlace";

interface SessionIdentity {
  token: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  supabaseUserId: string;
}

export function AdminDashboard() {
  const searchParams = useSearchParams();
  const targetOrder = searchParams.get("order");
  const initialTabParam = searchParams.get("tab") as AdminTab | null;

  const supabaseInit = useMemo<{
    client: SupabaseClient | null;
    error: string;
  }>(() => {
    try {
      return { client: getSupabaseClient(), error: "" };
    } catch (err) {
      return {
        client: null,
        error:
          err instanceof Error
            ? err.message
            : "Falta configurar Supabase en las variables de entorno.",
      };
    }
  }, []);

  const supabase = supabaseInit.client;
  const [session, setSession] = useState<SessionIdentity | null>(null);
  const [initializing, setInitializing] = useState(() =>
    Boolean(supabaseInit.client)
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [loginError, setLoginError] = useState(() => supabaseInit.error);
  const [loggingIn, setLoggingIn] = useState(false);
  const [googleLoggingIn, setGoogleLoggingIn] = useState(false);

  const [tabOverride, setTabOverride] = useState<{
    target: string | null;
    tab: AdminTab;
  } | null>(null);
  const [deepLinkOrderId, setDeepLinkOrderId] = useState<string | null>(null);
  const effectiveTargetOrder = deepLinkOrderId ?? targetOrder;

  const defaultTab: AdminTab = effectiveTargetOrder
    ? "pedidos"
    : initialTabParam &&
        [
          "productos",
          "afiliaciones",
          "pedidos",
          "notificaciones",
          "moderacion",
          "categorias",
          "enlace",
        ].includes(initialTabParam)
      ? initialTabParam
      : "productos";

  const activeTab: AdminTab =
    tabOverride && tabOverride.target === effectiveTargetOrder
      ? tabOverride.tab
      : defaultTab;

  const setActiveTab = (tab: AdminTab) =>
    setTabOverride({ target: effectiveTargetOrder, tab });

  const [refreshTick, setRefreshTick] = useState(0);

  const [sellerProfile, setSellerProfile] = useState<AdminSellerProfile | null>(
    null
  );
  const [accountBlockedError, setAccountBlockedError] = useState("");
  const [loadedProfileKey, setLoadedProfileKey] = useState("");

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loadedCatKey, setLoadedCatKey] = useState("");
  const [activeProductsCount, setActiveProductsCount] = useState<number | null>(
    null
  );
  const [totalProductsCount, setTotalProductsCount] = useState<number | null>(
    null
  );
  const [metricsSummary, setMetricsSummary] = useState<OrderMetrics | null>(
    null
  );
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const token = session?.token ?? "";
  const profileFetchKey = token ? `${token}:${refreshTick}` : "";
  const loadingProfile =
    Boolean(profileFetchKey) && loadedProfileKey !== profileFetchKey;

  const isSuperAdmin = sellerProfile?.role === "admin";
  const isSuspended = Boolean(sellerProfile?.isSuspended);

  const catFetchKey =
    token && sellerProfile
      ? `${token}:${sellerProfile.role}:${refreshTick}`
      : "";
  const loadingCategories = Boolean(catFetchKey) && loadedCatKey !== catFetchKey;

  const [previewImage, setPreviewImage] = useState<PreviewImageData | null>(
    null
  );
  const [productImages, setProductImages] = useState<Record<string, string>>(
    {}
  );
  const productImagesRef = useRef<Record<string, string>>({});

  const mergeProductImages = useCallback((entries: Record<string, string>) => {
    const updates: Record<string, string> = {};
    for (const [id, src] of Object.entries(entries)) {
      const clean = src?.trim();
      if (id && clean && productImagesRef.current[id] !== clean) {
        updates[id] = clean;
      }
    }
    if (Object.keys(updates).length === 0) return;
    productImagesRef.current = { ...productImagesRef.current, ...updates };
    setProductImages(productImagesRef.current);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    const applySession = (
      s: {
        access_token: string;
        user: {
          id: string;
          email?: string;
          user_metadata?: Record<string, unknown>;
        };
      } | null
    ) => {
      if (!active) return;
      if (!s) {
        setSession(null);
      } else {
        const meta = s.user.user_metadata ?? {};
        const displayName =
          (typeof meta.full_name === "string" && meta.full_name) ||
          (typeof meta.name === "string" && meta.name) ||
          null;
        const avatarUrl =
          (typeof meta.avatar_url === "string" && meta.avatar_url) ||
          (typeof meta.picture === "string" && meta.picture) ||
          null;
        setSession({
          token: s.access_token,
          email: s.user.email ?? "",
          displayName,
          avatarUrl,
          supabaseUserId: s.user.id,
        });
      }
      setInitializing(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    supabase.auth
      .getSession()
      .then(({ data }) => applySession(data.session))
      .catch(() => {
        if (active) setInitializing(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // 1. Auto-registro / carga del perfil de vendedor o superadmin + notificaciones
  useEffect(() => {
    if (!token || !session) return;
    let active = true;
    const key = profileFetchKey;

    registerCurrentSeller(token, {
      displayName: session.displayName,
      avatarUrl: session.avatarUrl,
    })
      .then((profile) => {
        if (!active) return;
        setAccountBlockedError("");
        setSellerProfile(profile);
        return fetchUnreadNotificationCount(token)
          .then((res) => {
            if (active) setUnreadNotifications(res.unreadCount);
          })
          .catch(() => {});
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 403) {
          setAccountBlockedError(err.message);
          setSellerProfile(null);
        } else {
          toast.error(
            err instanceof Error
              ? err.message
              : "No se pudo cargar tu perfil de vendedor."
          );
        }
      })
      .finally(() => {
        if (active) setLoadedProfileKey(key);
      });

    return () => {
      active = false;
    };
  }, [token, session, profileFetchKey]);

  // 2. Carga categorías según el rol (admin usa categories/admin, seller usa categories público)
  useEffect(() => {
    if (!token || !sellerProfile) return;
    let active = true;
    const controller = new AbortController();
    const key = catFetchKey;

    Promise.all([
      sellerProfile.role === "admin"
        ? fetchAdminCategories(token)
        : fetchStoreCategoriesRaw(controller.signal),
      fetchCatalogMeta(controller.signal),
    ])
      .then(([cats, meta]) => {
        if (!active) return;
        setCategories(cats);
        setActiveProductsCount(meta.totalActive);
      })
      .catch((err) => {
        if (!active || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        toast.error(
          err instanceof Error ? err.message : "Error cargando categorías."
        );
      })
      .finally(() => {
        if (active) setLoadedCatKey(key);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [token, sellerProfile, catFetchKey]);

  const handleGoogleLogin = async () => {
    if (!supabase) return;
    setGoogleLoggingIn(true);
    setLoginError("");
    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=/tienda/admin`,
        },
      });
      if (error) {
        setLoginError(error.message);
        setGoogleLoggingIn(false);
      }
    } catch (err) {
      setLoginError(
        err instanceof Error
          ? err.message
          : "No se pudo iniciar sesión con Google."
      );
      setGoogleLoggingIn(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoggingIn(true);
    setLoginError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setLoginError(error.message);
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : "No se pudo iniciar sesión."
      );
    } finally {
      setLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setCategories([]);
    setSellerProfile(null);
    setMetricsSummary(null);
    setAccountBlockedError("");
    setUnreadNotifications(0);
  };

  const triggerReload = useCallback((syncStorefront = false) => {
    setRefreshTick((t) => t + 1);
    if (syncStorefront) reloadCatalog();
  }, []);

  const copyMyStoreUrl = async () => {
    const clean = normalizeHandle(sellerProfile?.handle);
    if (!clean) {
      setActiveTab("enlace");
      toast.info("Configura primero tu @usuario en «Mi perfil».");
      return;
    }
    const url = buildSellerProfileUrl(clean);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace de tu tienda copiado", { description: url });
    } catch {
      toast.info("Tu enlace:", { description: url });
    }
  };

  if (initializing) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-24">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600">
          <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
          Comprobando sesión…
        </p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
        <header className="mb-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-800">
            <Store className="h-3.5 w-3.5" />
            Deve Tienda · Marketplace & Afiliados
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold text-zinc-950 sm:text-4xl">
            Publica tus productos o vende como afiliado
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-600">
            Crea tu cuenta en segundos con Google para subir anuncios, renovar
            tus publicaciones cada 24h, definir comisiones para referidos o
            afiliarte a productos de otros vendedores.
          </p>
        </header>

        <div className="mx-auto max-w-md space-y-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs sm:p-8">
          <button
            type="button"
            onClick={() => void handleGoogleLogin()}
            disabled={googleLoggingIn || !supabase}
            className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border border-zinc-300 bg-white px-5 text-sm font-bold text-zinc-900 shadow-2xs transition hover:border-violet-400 hover:bg-violet-50/40 disabled:opacity-50"
          >
            {googleLoggingIn ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#6018F8]" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.15 3.57-8.64Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.44 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.3v3.09A12 12 0 0 0 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.29 14.29A7.22 7.22 0 0 1 4.91 12c0-.79.14-1.56.38-2.29V6.62H1.3A12 12 0 0 0 0 12c0 1.94.46 3.77 1.3 5.38l3.99-3.09Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.76c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.3 6.62l3.99 3.09c.94-2.84 3.59-4.95 6.71-4.95Z"
                />
              </svg>
            )}
            Continuar con Google
          </button>

          {loginError && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
              {loginError}
            </p>
          )}

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center">
              <button
                type="button"
                onClick={() => setShowEmailLogin((v) => !v)}
                className="bg-white px-3 text-[11px] font-semibold text-zinc-500 hover:text-violet-700"
              >
                {showEmailLogin
                  ? "Ocultar acceso con correo"
                  : "¿Eres administrador? Entrar con correo y contraseña"}
              </button>
            </div>
          </div>

          {showEmailLogin && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-semibold text-zinc-800"
                >
                  Correo electrónico
                </label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@deve.com"
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold text-zinc-800"
                >
                  Contraseña
                </label>
                <input
                  id="admin-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loggingIn || !supabase}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#6018F8] text-xs font-semibold text-white transition hover:bg-[#5010E8] disabled:opacity-50"
              >
                {loggingIn && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Entrar con correo
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (accountBlockedError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="rounded-3xl border border-rose-200 bg-white p-8 shadow-xs">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <ShieldAlert className="h-6 w-6" />
          </span>
          <h1 className="mt-4 font-display text-xl font-bold text-zinc-950">
            Acceso restringido
          </h1>
          <p className="mt-2 text-sm text-rose-700">{accountBlockedError}</p>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  if (loadingProfile && !sellerProfile) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-24">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600">
          <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
          Preparando tu cuenta en Deve Tienda…
        </p>
      </div>
    );
  }

  const activeCategoriesCount = categories.filter((c) => c.isActive).length;
  const storageFolder =
    !isSuperAdmin && session?.supabaseUserId
      ? `${STORE_KEY}/${session.supabaseUserId}`
      : STORE_KEY;

  const tabs: {
    id: AdminTab;
    label: string;
    icon: typeof Boxes;
    badge?: number;
  }[] = [
    {
      id: "productos",
      label: isSuperAdmin ? "Productos" : "Mis productos",
      icon: Boxes,
    },
    { id: "afiliaciones", label: "Mis afiliaciones", icon: Handshake },
    { id: "pedidos", label: "Solicitudes", icon: ClipboardList },
    {
      id: "notificaciones",
      label: "Notificaciones",
      icon: Bell,
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    },
    ...(isSuperAdmin
      ? [
          { id: "moderacion" as const, label: "Moderación", icon: ShieldAlert },
          { id: "categorias" as const, label: "Categorías", icon: FolderTree },
        ]
      : []),
    { id: "enlace", label: "Mi perfil", icon: UserCircle2 },
  ];

  const safeActiveTab: AdminTab =
    !isSuperAdmin &&
    (activeTab === "categorias" || activeTab === "moderacion")
      ? "productos"
      : activeTab;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      {/* Cabecera */}
      <header className="mb-5 flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                isSuperAdmin
                  ? "bg-violet-50 text-violet-800"
                  : "bg-emerald-50 text-emerald-800"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {isSuperAdmin ? `Superadmin · ${STORE_KEY}` : "Vendedor · Deve Tienda"}
            </span>
            {sellerProfile?.handle && (
              <Link
                href={`/tienda/vendedor/${encodeURIComponent(sellerProfile.handle)}`}
                target="_blank"
                className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-violet-700 hover:underline"
              >
                @{sellerProfile.handle}
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
            {session?.email && (
              <span className="text-xs font-medium text-zinc-500">
                {session.email}
              </span>
            )}
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-zinc-950 sm:text-3xl">
            {sellerProfile?.displayName
              ? `Hola, ${sellerProfile.displayName}`
              : "Panel de Deve Tienda"}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void copyMyStoreUrl()}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3.5 text-xs font-semibold text-violet-800 transition hover:bg-violet-100"
          >
            <Copy className="h-3.5 w-3.5" />
            Compartir mi tienda
          </button>
          <button
            type="button"
            onClick={() => triggerReload(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="h-3.5 w-3.5" />
            Salir
          </button>
        </div>
      </header>

      {/* Banner de suspensión si aplica */}
      {isSuspended && sellerProfile && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <p className="font-bold">
              Tu cuenta tiene una suspensión activa
              {sellerProfile.suspendedUntil
                ? ` hasta el ${formatDate(sellerProfile.suspendedUntil)}`
                : ""}
            </p>
            {sellerProfile.suspensionReason && (
              <p className="mt-1">Motivo: {sellerProfile.suspensionReason}</p>
            )}
            <p className="mt-1 text-rose-800/80">
              Mientras dure la medida no podrás publicar, editar ni renovar
              anuncios.
            </p>
          </div>
        </div>
      )}

      {/* Aviso de onboarding si aún no configuró WhatsApp */}
      {sellerProfile && !sellerProfile.whatsAppPhone && !isSuspended && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-950">
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            Configura tu número de WhatsApp en «Mi perfil» para recibir los
            pedidos de tus productos directamente en tu teléfono.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("enlace")}
            className="rounded-full bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          >
            Configurar WhatsApp
          </button>
        </div>
      )}

      {/* Resumen rápido */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-[11px] font-semibold text-zinc-500">
            {isSuperAdmin ? "Productos visibles" : "Mis productos"}
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-zinc-950 tabular-nums">
            {isSuperAdmin
              ? (activeProductsCount ?? "—")
              : (totalProductsCount ?? "—")}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500 tabular-nums">
            {isSuperAdmin
              ? `Total en catálogo: ${totalProductsCount ?? "—"}`
              : `Catálogo global: ${activeProductsCount ?? "—"}`}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-[11px] font-semibold text-zinc-500">
            Notificaciones sin leer
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-violet-700 tabular-nums">
            {unreadNotifications}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {isSuperAdmin
              ? `Categorías activas: ${activeCategoriesCount}`
              : "Pedidos, afiliados y avisos"}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-[11px] font-semibold text-zinc-500">
            Solicitudes abiertas
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-amber-700 tabular-nums">
            {metricsSummary?.openRequests ?? "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Pendientes de cierre
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-[11px] font-semibold text-zinc-500">
            Ventas cerradas
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-emerald-700 tabular-nums">
            {metricsSummary?.closedRequests ?? "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">En periodo activo</p>
        </div>
      </div>

      {/* Pestañas */}
      <div className="mb-5 flex flex-wrap gap-1.5 border-b border-zinc-200 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = safeActiveTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
                active
                  ? "bg-[#6018F8] text-white shadow-xs shadow-violet-600/25"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={`inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ${
                    active
                      ? "bg-white/25 text-white"
                      : "bg-rose-600 text-white"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Contenido de la pestaña activa */}
      {safeActiveTab === "productos" && (
        <ProductsAdminTab
          token={token}
          supabase={supabase}
          categories={categories}
          isSuperAdmin={isSuperAdmin}
          isSuspended={isSuspended}
          storageFolder={storageFolder}
          refreshTick={refreshTick}
          onMutated={() => triggerReload(true)}
          onTotalUpdated={setTotalProductsCount}
          onImagesDiscovered={mergeProductImages}
          onPreviewImage={setPreviewImage}
          onGoToCategories={
            isSuperAdmin ? () => setActiveTab("categorias") : undefined
          }
        />
      )}

      {safeActiveTab === "afiliaciones" && (
        <AffiliationsTab
          token={token}
          sellerProfile={sellerProfile}
          refreshTick={refreshTick}
          onPreviewImage={setPreviewImage}
          onMutated={() => triggerReload(false)}
        />
      )}

      {safeActiveTab === "pedidos" && (
        <OrdersAdminTab
          token={token}
          targetOrder={effectiveTargetOrder}
          refreshTick={refreshTick}
          sellerProfile={sellerProfile}
          productImages={productImages}
          onImagesDiscovered={mergeProductImages}
          onPreviewImage={setPreviewImage}
          onMetricsLoaded={setMetricsSummary}
          onMutated={() => triggerReload(false)}
        />
      )}

      {safeActiveTab === "notificaciones" && (
        <NotificationsTab
          token={token}
          isSuperAdmin={isSuperAdmin}
          refreshTick={refreshTick}
          onUnreadCountChanged={setUnreadNotifications}
          onOpenOrder={(orderId) => {
            setDeepLinkOrderId(orderId);
            setTabOverride({ target: orderId, tab: "pedidos" });
          }}
          onGoToModeration={
            isSuperAdmin ? () => setActiveTab("moderacion") : undefined
          }
        />
      )}

      {safeActiveTab === "moderacion" && isSuperAdmin && (
        <ModerationTab
          token={token}
          refreshTick={refreshTick}
          onPreviewImage={setPreviewImage}
          onMutated={() => triggerReload(true)}
        />
      )}

      {safeActiveTab === "categorias" && isSuperAdmin && (
        <CategoriesAdminTab
          token={token}
          categories={categories}
          loading={loadingCategories}
          onMutated={() => triggerReload(true)}
        />
      )}

      {safeActiveTab === "enlace" && (
        <SellerLinkTab
          key={`${sellerProfile?.id ?? "none"}-${sellerProfile?.handle ?? ""}-${sellerProfile?.whatsAppPhone ?? ""}-${sellerProfile?.displayName ?? ""}-${sellerProfile?.affiliateOrderRouting ?? "owner"}`}
          token={token}
          profile={sellerProfile}
          available={true}
          loading={loadingProfile}
          onUpdated={setSellerProfile}
        />
      )}

      <ImagePreviewModal
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}
