"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Check,
  CheckSquare,
  ChevronRight,
  Copy,
  Handshake,
  Loader2,
  MessageCircle,
  PackageOpen,
  Share2,
  Square,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "@/components/store/ProductCard";
import {
  fetchMyAffiliatedProductIds,
  registerCurrentSeller,
  subscribeAffiliates,
  type AdminSellerProfile,
} from "@/lib/store/admin-api";
import {
  formatCommissionText,
  type ApiPublicSellerProfile,
  type ProductView,
} from "@/lib/store/powergy-api";
import {
  buildAffiliateProductUrl,
  buildSellerProfileUrl,
} from "@/lib/store/referral";
import { getSupabaseClient } from "@/lib/store/supabase";
import { buildStoreWhatsAppUrl } from "@/lib/store/whatsapp";

interface SellerProfileClientProps {
  seller: ApiPublicSellerProfile;
  products: ProductView[];
  affiliatedShowcase: ProductView[];
}

export function SellerProfileClient({
  seller,
  products,
  affiliatedShowcase,
}: SellerProfileClientProps) {
  const searchParams = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "afiliados" && affiliatedShowcase.length > 0
      ? "afiliados"
      : "publicados";

  const [activeTab, setActiveTab] = useState<"publicados" | "afiliados">(
    initialTab
  );
  const [authToken, setAuthToken] = useState("");
  const [viewerProfile, setViewerProfile] = useState<AdminSellerProfile | null>(
    null
  );
  const [myAffiliatedIds, setMyAffiliatedIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subscribingMode, setSubscribingMode] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let client;
    try {
      client = getSupabaseClient();
    } catch {
      return;
    }

    client.auth
      .getSession()
      .then(({ data }) => {
        if (!active || !data.session?.access_token) return;
        const tok = data.session.access_token;
        setAuthToken(tok);
        const meta = data.session.user.user_metadata ?? {};
        const displayName =
          (typeof meta.full_name === "string" && meta.full_name) ||
          (typeof meta.name === "string" && meta.name) ||
          null;
        const avatarUrl =
          (typeof meta.avatar_url === "string" && meta.avatar_url) ||
          (typeof meta.picture === "string" && meta.picture) ||
          null;

        Promise.all([
          registerCurrentSeller(tok, { displayName, avatarUrl }),
          fetchMyAffiliatedProductIds(tok),
        ])
          .then(([profile, ids]) => {
            if (!active) return;
            setViewerProfile(profile);
            setMyAffiliatedIds(ids);
          })
          .catch(() => {});
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const isOwnProfile = Boolean(viewerProfile && viewerProfile.id === seller.id);

  const eligibleProducts = useMemo(
    () => products.filter((p) => p.allowAffiliates),
    [products]
  );

  const unaffiliatedEligible = useMemo(
    () => eligibleProducts.filter((p) => !myAffiliatedIds.includes(p.id)),
    [eligibleProducts, myAffiliatedIds]
  );

  const toggleSelect = (productId: string) => {
    setSelectedIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAllUnaffiliated = () => {
    const ids = unaffiliatedEligible.map((p) => p.id);
    if (ids.length === 0) return;
    const allSelected = ids.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : ids);
  };

  const triggerGoogleLogin = async () => {
    try {
      const client = getSupabaseClient();
      const origin = window.location.origin;
      const nextPath = `/tienda/vendedor/${encodeURIComponent(seller.handle)}`;
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });
      if (error) toast.error(error.message);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No pudimos iniciar sesión con Google."
      );
    }
  };

  const handleAffiliateAll = async () => {
    if (subscribingMode) return;
    if (!authToken) {
      await triggerGoogleLogin();
      return;
    }

    setSubscribingMode("all");
    try {
      const res = await subscribeAffiliates(authToken, {
        sellerHandle: seller.handle,
      });
      setMyAffiliatedIds((prev) => [
        ...new Set([...prev, ...res.subscribedProductIds]),
      ]);
      setSelectedIds([]);
      if (res.subscribedCount > 0) {
        toast.success(
          `¡Te afiliaste a ${res.subscribedCount} ${res.subscribedCount === 1 ? "producto" : "productos"} de ${seller.displayName}!`,
          {
            description:
              "Ya puedes copiar tus enlaces desde aquí o desde «Mis afiliaciones» en tu panel.",
          }
        );
      } else {
        toast.info("Ya estabas afiliado a todos los productos disponibles.");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo completar la afiliación."
      );
    } finally {
      setSubscribingMode(null);
    }
  };

  const handleAffiliateSelected = async (ids: string[]) => {
    if (subscribingMode) return;
    if (!authToken) {
      await triggerGoogleLogin();
      return;
    }
    if (ids.length === 0) {
      toast.info("Selecciona al menos un producto elegible.");
      return;
    }

    const modeKey = ids.length === 1 ? ids[0] : "selected";
    setSubscribingMode(modeKey);
    try {
      const res = await subscribeAffiliates(authToken, { productIds: ids });
      setMyAffiliatedIds((prev) => [
        ...new Set([...prev, ...res.subscribedProductIds]),
      ]);
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      if (res.subscribedCount > 0) {
        toast.success(
          `¡Te afiliaste a ${res.subscribedCount} ${res.subscribedCount === 1 ? "producto" : "productos"}!`
        );
      } else {
        toast.info("Ya estabas afiliado a los productos seleccionados.");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo completar la afiliación."
      );
    } finally {
      setSubscribingMode(null);
    }
  };

  const copyAffiliateLink = async (product: ProductView) => {
    if (!viewerProfile?.handle) {
      toast.info("Configura tu @usuario en tu panel para copiar enlaces.");
      return;
    }
    const url = buildAffiliateProductUrl(
      viewerProfile.handle,
      product.slug || product.id
    );
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace de afiliado copiado", { description: url });
    } catch {
      toast.info("Tu enlace de afiliado:", { description: url });
    }
  };

  const copyProfileUrl = async () => {
    const url = buildSellerProfileUrl(seller.handle);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace del perfil copiado", { description: url });
    } catch {
      toast.info("Enlace del perfil:", { description: url });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Ruta de navegación"
        className="mb-5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-zinc-500"
      >
        <Link href="/tienda" className="hover:text-violet-700">
          Tienda
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-zinc-900">
          {seller.displayName} (@{seller.handle})
        </span>
      </nav>

      {/* Cabecera del vendedor */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            {seller.avatarUrl ? (
              <img
                src={seller.avatarUrl}
                alt={seller.displayName}
                className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-2 ring-violet-100 sm:h-20 sm:w-20"
              />
            ) : (
              <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 sm:h-20 sm:w-20">
                <Store className="h-8 w-8" />
              </span>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-zinc-950 sm:text-3xl">
                  {seller.displayName}
                </h1>
                <span className="rounded-full bg-violet-50 px-2.5 py-0.5 font-mono text-xs font-semibold text-violet-800">
                  @{seller.handle}
                </span>
              </div>
              {seller.bio && (
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-600">
                  {seller.bio}
                </p>
              )}
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-600">
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 tabular-nums">
                  {seller.activeProductCount}{" "}
                  {seller.activeProductCount === 1
                    ? "producto publicado"
                    : "productos publicados"}
                </span>
                {seller.affiliateEligibleCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800 tabular-nums">
                    <Handshake className="h-3.5 w-3.5" />
                    {seller.affiliateEligibleCount} con comisión para afiliados
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {seller.whatsAppPhone && (
              <a
                href={buildStoreWhatsAppUrl(
                  `Hola ${seller.displayName}, vi tus productos en Deve Tienda.`,
                  seller.whatsAppPhone
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700"
              >
                <MessageCircle className="h-4 w-4" />
                Contactar por WhatsApp
              </a>
            )}
            <button
              type="button"
              onClick={() => void copyProfileUrl()}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
              <Share2 className="h-3.5 w-3.5" />
              Compartir
            </button>
          </div>
        </div>

        {/* Barra de afiliación masiva / selectiva */}
        {!isOwnProfile && eligibleProducts.length > 0 && activeTab === "publicados" && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-white to-violet-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                <Handshake className="h-4 w-4 text-emerald-600" />
                Afíliate a los productos de {seller.displayName} y gana comisión
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-600">
                Puedes afiliarte de una sola vez a todos los disponibles o
                marcar únicamente los productos que quieras promocionar.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {unaffiliatedEligible.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAllUnaffiliated}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  {unaffiliatedEligible.every((p) => selectedIds.includes(p.id)) ? (
                    <>
                      <CheckSquare className="h-3.5 w-3.5 text-[#6018F8]" />
                      Quitar selección
                    </>
                  ) : (
                    <>
                      <Square className="h-3.5 w-3.5" />
                      Seleccionar todos ({unaffiliatedEligible.length})
                    </>
                  )}
                </button>
              )}

              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => void handleAffiliateSelected(selectedIds)}
                  disabled={Boolean(subscribingMode)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-zinc-950 px-4 text-xs font-bold text-white transition hover:bg-zinc-800 disabled:opacity-50"
                >
                  {subscribingMode === "selected" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Handshake className="h-3.5 w-3.5" />
                  )}
                  Afiliarme a seleccionados ({selectedIds.length})
                </button>
              )}

              <button
                type="button"
                onClick={() => void handleAffiliateAll()}
                disabled={
                  Boolean(subscribingMode) ||
                  (Boolean(authToken) && unaffiliatedEligible.length === 0)
                }
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {subscribingMode === "all" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : unaffiliatedEligible.length === 0 && authToken ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Handshake className="h-3.5 w-3.5" />
                )}
                {unaffiliatedEligible.length === 0 && authToken
                  ? "Afiliado a todos ✓"
                  : authToken
                    ? `Afiliarme a todos (${unaffiliatedEligible.length})`
                    : `Afiliarme a todos (${eligibleProducts.length})`}
              </button>
            </div>
          </div>
        )}

        {/* Pestañas del perfil */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab("publicados")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              activeTab === "publicados"
                ? "bg-[#6018F8] text-white"
                : "border border-zinc-200 bg-white text-zinc-700 hover:bg-violet-50"
            }`}
          >
            <Store className="h-3.5 w-3.5" />
            Publicados ({products.length})
          </button>
          {affiliatedShowcase.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("afiliados")}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                activeTab === "afiliados"
                  ? "bg-emerald-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-emerald-50"
              }`}
            >
              <Handshake className="h-3.5 w-3.5" />
              Recomendados / Afiliados ({affiliatedShowcase.length})
            </button>
          )}
        </div>
      </section>

      {/* Grid de productos */}
      {activeTab === "publicados" ? (
        products.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-zinc-200 bg-white px-6 py-14 text-center">
            <PackageOpen className="mx-auto h-10 w-10 text-zinc-400" />
            <p className="mt-3 font-display text-lg font-bold text-zinc-900">
              Este vendedor aún no tiene productos activos
            </p>
            <Link
              href="/tienda"
              className="mt-5 inline-flex items-center rounded-full bg-[#6018F8] px-5 py-2 text-xs font-semibold text-white hover:bg-[#5010E8]"
            >
              Volver al catálogo general
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              const isAffiliated = myAffiliatedIds.includes(product.id);
              const isSelected = selectedIds.includes(product.id);
              const commText = product.allowAffiliates
                ? formatCommissionText(
                    product.affiliateCommissionType,
                    product.affiliateCommissionValue,
                    product.price > 0 ? product.price : undefined
                  )
                : null;

              return (
                <div key={product.id} className="flex flex-col gap-2">
                  <ProductCard product={product} />

                  {/* Barra de afiliación individual debajo de la tarjeta */}
                  {!isOwnProfile && product.allowAffiliates && commText && (
                    <div
                      className={`flex items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-xs ${
                        isAffiliated
                          ? "border-emerald-200 bg-emerald-50/70"
                          : isSelected
                            ? "border-[#6018F8] bg-violet-50/70"
                            : "border-zinc-200 bg-white"
                      }`}
                    >
                      {!isAffiliated ? (
                        <label className="flex min-w-0 cursor-pointer items-center gap-2 font-semibold text-zinc-800">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(product.id)}
                            className="h-4 w-4 shrink-0 accent-[#6018F8]"
                          />
                          <span className="truncate text-[11px] text-emerald-800">
                            Comisión: {commText}
                          </span>
                        </label>
                      ) : (
                        <span className="truncate text-[11px] font-bold text-emerald-800">
                          ✓ Afiliado ({commText})
                        </span>
                      )}

                      {isAffiliated ? (
                        <button
                          type="button"
                          onClick={() => void copyAffiliateLink(product)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800"
                        >
                          <Copy className="h-3 w-3" />
                          Enlace
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            void handleAffiliateSelected([product.id])
                          }
                          disabled={Boolean(subscribingMode)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-zinc-950 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#6018F8] disabled:opacity-50"
                        >
                          {subscribingMode === product.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Afiliarme"
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="mt-6">
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-xs text-emerald-950">
            Vitrina de productos recomendados por{" "}
            <strong>{seller.displayName}</strong> (@{seller.handle}). Las
            compras realizadas desde aquí acreditan automáticamente su
            referencia de afiliado.
          </div>
          <div className="grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {affiliatedShowcase.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                hrefQuery={`?aff=${encodeURIComponent(seller.handle)}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
