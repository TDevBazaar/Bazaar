"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Boxes,
  ClipboardList,
  Copy,
  FolderTree,
  Link2,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { CategoriesAdminTab } from "@/components/store/admin/CategoriesAdminTab";
import { OrdersAdminTab } from "@/components/store/admin/OrdersAdminTab";
import { ProductsAdminTab } from "@/components/store/admin/ProductsAdminTab";
import { SellerLinkTab } from "@/components/store/admin/SellerLinkTab";
import {
  ImagePreviewModal,
  type PreviewImageData,
} from "@/components/store/ImagePreviewModal";
import {
  fetchAdminCategories,
  fetchAdminSellerProfile,
  type AdminSellerProfile,
  type OrderMetrics,
} from "@/lib/store/admin-api";
import { reloadCatalog } from "@/lib/store/catalog";
import {
  ApiError,
  STORE_KEY,
  fetchCatalogMeta,
  type ApiCategory,
} from "@/lib/store/powergy-api";
import {
  buildShareReferralUrl,
  normalizeReferralCode,
} from "@/lib/store/referral";
import { getSupabaseClient } from "@/lib/store/supabase";

type AdminTab = "productos" | "categorias" | "pedidos" | "enlace";

export function AdminDashboard() {
  const searchParams = useSearchParams();
  const targetOrder = searchParams.get("order");

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
  const [token, setToken] = useState("");
  const [sessionEmail, setSessionEmail] = useState("");
  const [initializing, setInitializing] = useState(() => Boolean(supabaseInit.client));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(() => supabaseInit.error);
  const [loggingIn, setLoggingIn] = useState(false);

  const [tabOverride, setTabOverride] = useState<{
    target: string | null;
    tab: AdminTab;
  } | null>(null);
  const activeTab: AdminTab =
    tabOverride && tabOverride.target === targetOrder
      ? tabOverride.tab
      : targetOrder
        ? "pedidos"
        : "productos";
  const setActiveTab = (tab: AdminTab) =>
    setTabOverride({ target: targetOrder, tab });

  const [refreshTick, setRefreshTick] = useState(0);

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

  const [sellerProfile, setSellerProfile] = useState<AdminSellerProfile | null>(
    null
  );
  const [sellerEndpointAvailable, setSellerEndpointAvailable] = useState(true);
  const [loadedSellerKey, setLoadedSellerKey] = useState("");

  const catFetchKey = token ? `${token}:${refreshTick}` : "";
  const loadingCategories = Boolean(catFetchKey) && loadedCatKey !== catFetchKey;
  const loadingSeller = Boolean(catFetchKey) && loadedSellerKey !== catFetchKey;

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setToken(session?.access_token ?? "");
      setSessionEmail(session?.user?.email ?? "");
      setInitializing(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Carga categorías y resumen
  useEffect(() => {
    if (!token) return;
    let active = true;
    const controller = new AbortController();
    const key = `${token}:${refreshTick}`;

    Promise.all([
      fetchAdminCategories(token),
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
  }, [token, refreshTick]);

  // Carga perfil de vendedor
  useEffect(() => {
    if (!token) return;
    let active = true;
    const controller = new AbortController();
    const key = `${token}:${refreshTick}`;

    fetchAdminSellerProfile(token, controller.signal)
      .then((profile) => {
        if (!active) return;
        setSellerEndpointAvailable(true);
        setSellerProfile(profile);
      })
      .catch((err) => {
        if (!active || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        if (err instanceof ApiError && (err.status === 404 || err.status === 502)) {
          setSellerEndpointAvailable(false);
          setSellerProfile(null);
        }
      })
      .finally(() => {
        if (active) setLoadedSellerKey(key);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [token, refreshTick]);

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
    setToken("");
    setSessionEmail("");
    setCategories([]);
    setSellerProfile(null);
    setMetricsSummary(null);
  };

  const triggerReload = useCallback((syncStorefront = false) => {
    setRefreshTick((t) => t + 1);
    if (syncStorefront) reloadCatalog();
  }, []);

  const copyQuickReferral = async () => {
    const clean = normalizeReferralCode(sellerProfile?.referralCode);
    if (!clean) {
      setActiveTab("enlace");
      toast.info("Configura primero tu código y WhatsApp en «Mi enlace».");
      return;
    }
    const url = buildShareReferralUrl(clean, "/tienda");
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace de vendedor copiado", { description: url });
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
            <ShieldCheck className="h-3.5 w-3.5" />
            Deve Tienda · Admin ({STORE_KEY})
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold text-zinc-950 sm:text-4xl">
            Panel de gestión
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Inicia sesión con tu cuenta de administrador de Supabase para
            gestionar categorías, productos y pedidos.
          </p>
        </header>

        <form
          onSubmit={handleLogin}
          className="mx-auto max-w-md space-y-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs sm:p-8"
        >
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
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
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
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          {loginError && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
              {loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={loggingIn || !supabase}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#6018F8] text-sm font-semibold text-white shadow-md shadow-violet-600/25 transition hover:bg-[#5010E8] disabled:opacity-50"
          >
            {loggingIn && <Loader2 className="h-4 w-4 animate-spin" />}
            Entrar al panel
          </button>
        </form>
      </div>
    );
  }

  const activeCategoriesCount = categories.filter((c) => c.isActive).length;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      {/* Cabecera Admin */}
      <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-violet-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin · store: {STORE_KEY}
            </span>
            {sessionEmail && (
              <span className="text-xs font-medium text-zinc-500">
                {sessionEmail}
              </span>
            )}
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-zinc-950 sm:text-3xl">
            Gestión de Deve Tienda
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sellerEndpointAvailable && (
            <button
              type="button"
              onClick={() => void copyQuickReferral()}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3.5 text-xs font-semibold text-violet-800 transition hover:bg-violet-100"
            >
              <Copy className="h-3.5 w-3.5" />
              Copiar mi enlace
            </button>
          )}
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

      {/* Resumen rápido */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-[11px] font-semibold text-zinc-500">
            Productos visibles
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-zinc-950 tabular-nums">
            {activeProductsCount ?? "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500 tabular-nums">
            Total en catálogo: {totalProductsCount ?? "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-[11px] font-semibold text-zinc-500">
            Categorías activas
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-zinc-950 tabular-nums">
            {activeCategoriesCount}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500 tabular-nums">
            Total registradas: {categories.length}
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
        {(
          [
            { id: "productos", label: "Productos", icon: Boxes },
            { id: "categorias", label: "Categorías", icon: FolderTree },
            { id: "pedidos", label: "Solicitudes", icon: ClipboardList },
            { id: "enlace", label: "Mi enlace (?v=)", icon: Link2 },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
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
            </button>
          );
        })}
      </div>

      {/* Contenido de la pestaña activa */}
      {activeTab === "productos" && (
        <ProductsAdminTab
          token={token}
          supabase={supabase}
          categories={categories}
          refreshTick={refreshTick}
          onMutated={() => triggerReload(true)}
          onTotalUpdated={setTotalProductsCount}
          onImagesDiscovered={mergeProductImages}
          onPreviewImage={setPreviewImage}
          onGoToCategories={() => setActiveTab("categorias")}
        />
      )}

      {activeTab === "categorias" && (
        <CategoriesAdminTab
          token={token}
          categories={categories}
          loading={loadingCategories}
          onMutated={() => triggerReload(true)}
        />
      )}

      {activeTab === "pedidos" && (
        <OrdersAdminTab
          token={token}
          targetOrder={targetOrder}
          refreshTick={refreshTick}
          sellerProfile={sellerProfile}
          productImages={productImages}
          onImagesDiscovered={mergeProductImages}
          onPreviewImage={setPreviewImage}
          onMetricsLoaded={setMetricsSummary}
          onMutated={() => triggerReload(false)}
        />
      )}

      {activeTab === "enlace" && (
        <SellerLinkTab
          key={`${sellerProfile?.id ?? "none"}-${sellerProfile?.referralCode ?? ""}-${sellerProfile?.whatsAppPhone ?? ""}-${sellerProfile?.displayName ?? ""}`}
          token={token}
          profile={sellerProfile}
          available={sellerEndpointAvailable}
          loading={loadingSeller}
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
