"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Loader2,
  PackageOpen,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { PaginationControls } from "@/components/store/PaginationControls";
import { ProductCard } from "@/components/store/ProductCard";
import {
  DEFAULT_FILTERS,
  SORT_OPTIONS,
  activeFilterCount,
  priceCeilingFromMax,
  useCatalogMeta,
  useCategories,
} from "@/lib/store/catalog";
import { formatPrice } from "@/lib/store/format";
import type { FilterState, SortId } from "@/lib/store/types";
import { useCatalogFeed } from "@/lib/store/useCatalogFeed";

function parseSort(raw: string | null): SortId {
  if (
    raw === "destacados" ||
    raw === "precio-asc" ||
    raw === "precio-desc" ||
    raw === "nuevos"
  ) {
    return raw;
  }
  return "destacados";
}

export function StoreCatalogClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categories = useCategories();
  const meta = useCatalogMeta();

  const urlCat = searchParams.get("categoria")?.trim() ?? "";
  const urlQ = searchParams.get("q")?.trim() ?? "";
  const urlOffers = searchParams.get("ofertas") === "1";
  const urlSort = parseSort(searchParams.get("orden"));
  const urlKey = `${urlCat}|${urlQ}|${urlOffers ? "1" : "0"}|${urlSort}`;

  const urlFilters = useMemo<FilterState>(
    () => ({
      ...DEFAULT_FILTERS,
      q: urlQ,
      cats: urlCat ? [urlCat] : [],
      onlyOffers: urlOffers,
      sort: urlSort,
    }),
    [urlCat, urlQ, urlOffers, urlSort]
  );

  const [override, setOverride] = useState<{
    key: string;
    filters: FilterState;
  } | null>(null);
  const filters =
    override && override.key === urlKey ? override.filters : urlFilters;

  const setFilters = (
    updater: FilterState | ((prev: FilterState) => FilterState)
  ) => {
    setOverride((prev) => {
      const current = prev && prev.key === urlKey ? prev.filters : urlFilters;
      const next = typeof updater === "function" ? updater(current) : updater;
      return { key: urlKey, filters: next };
    });
  };

  const [showFilters, setShowFilters] = useState(false);

  const ceiling = useMemo(
    () => priceCeilingFromMax(meta?.maxPriceUsd),
    [meta?.maxPriceUsd]
  );

  const {
    items: feedItems,
    totalItems: feedTotalItems,
    page: feedPage,
    totalPages: feedTotalPages,
    pageSize: feedPageSize,
    setPage: setFeedPage,
    isPaginated: feedIsPaginated,
    hasMore: feedHasMore,
    loadingInitial: feedLoadingInitial,
    loadingMore: feedLoadingMore,
    error: feedError,
    loadMoreError: feedLoadMoreError,
    retry: feedRetry,
    loadMore: feedLoadMore,
    sentinelRef,
  } = useCatalogFeed({
    filters,
    pageSize: 20,
    cursorLimit: 12,
  });

  const activeCount = activeFilterCount(filters);
  const hasAnyFilter = activeCount > 0 || Boolean(filters.q.trim());

  const updateUrl = (next: FilterState) => {
    const params = new URLSearchParams();
    if (next.cats.length === 1) params.set("categoria", next.cats[0]);
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.onlyOffers) params.set("ofertas", "1");
    if (next.sort !== "destacados") params.set("orden", next.sort);
    const qs = params.toString();
    router.replace(qs ? `/tienda?${qs}` : "/tienda", { scroll: false });
  };

  const selectSingleCategory = (slug: string | null) => {
    const next: FilterState = {
      ...filters,
      cats: slug ? [slug] : [],
    };
    setFilters(next);
    updateUrl(next);
  };

  const toggleCategory = (slug: string) => {
    const exists = filters.cats.includes(slug);
    const nextCats = exists
      ? filters.cats.filter((c) => c !== slug)
      : [...filters.cats, slug];
    const next: FilterState = { ...filters, cats: nextCats };
    setFilters(next);
    updateUrl(next);
  };

  const toggleOffers = () => {
    const next: FilterState = { ...filters, onlyOffers: !filters.onlyOffers };
    setFilters(next);
    updateUrl(next);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    router.replace("/tienda", { scroll: false });
  };

  const activeCategoryObj =
    filters.cats.length === 1
      ? categories.find((c) => c.slug === filters.cats[0])
      : null;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10 lg:px-8">
      {/* Cabecera editorial de la tienda */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-white/90 p-6 shadow-xs backdrop-blur-xs sm:p-8 lg:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-500/12 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800">
              <Sparkles className="h-3.5 w-3.5 text-violet-600" />
              Deve Tienda · Tecnología, Equipos y Accesorios
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl lg:text-[2.6rem]">
              {activeCategoryObj
                ? activeCategoryObj.name
                : filters.onlyOffers
                  ? "Ofertas y rebajas activas"
                  : "Catálogo de tecnología y repuestos"}
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-zinc-600 sm:text-base">
              Equipos, accesorios y componentes verificados por nuestro equipo
              técnico en La Habana. Arma tu carrito y confirma tu pedido
              directamente por WhatsApp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-700">
            {meta && meta.totalActive > 0 && (
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 tabular-nums">
                {meta.totalActive}{" "}
                {meta.totalActive === 1
                  ? "producto disponible"
                  : "productos disponibles"}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              Pedidos con confirmación por WhatsApp
            </span>
          </div>
        </div>

        {/* Buscador y controles principales */}
        <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={filters.q}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, q: e.target.value }))
              }
              placeholder="Buscar por nombre, marca, modelo o especificaciones..."
              aria-label="Buscar productos"
              className="h-11 w-full rounded-full border border-zinc-200 bg-white pl-10 pr-9 text-sm text-zinc-950 placeholder:text-zinc-400 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
            {filters.q && (
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, q: "" }))}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filters.sort}
              onChange={(e) => {
                const next: FilterState = {
                  ...filters,
                  sort: parseSort(e.target.value),
                };
                setFilters(next);
                updateUrl(next);
              }}
              aria-label="Ordenar productos"
              className="h-11 rounded-full border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-800 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              className={`inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold transition ${
                showFilters || activeCount > 0
                  ? "border-violet-300 bg-violet-50 text-violet-800"
                  : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filtros</span>
              {activeCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6018F8] px-1.5 text-[10px] font-bold text-white">
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pills rápidos de categorías */}
        {categories.length > 0 && (
          <div className="relative mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => selectSingleCategory(null)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                filters.cats.length === 0
                  ? "bg-zinc-950 text-white shadow-xs"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
              }`}
            >
              Todo
            </button>
            {categories.map((cat) => {
              const selected = filters.cats.includes(cat.slug);
              return (
                <button
                  key={cat.apiId}
                  type="button"
                  onClick={() => selectSingleCategory(selected ? null : cat.slug)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    selected
                      ? "bg-[#6018F8] text-white shadow-xs shadow-violet-600/25"
                      : "border border-zinc-200 bg-white text-zinc-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
            <button
              type="button"
              onClick={toggleOffers}
              className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                filters.onlyOffers
                  ? "bg-rose-600 text-white shadow-xs"
                  : "border border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100"
              }`}
            >
              <Tag className="h-3 w-3" />
              Solo ofertas
            </button>
          </div>
        )}

        {/* Panel desplegable de filtros avanzados */}
        {showFilters && (
          <div className="mt-4 grid gap-5 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                Categorías (selección múltiple)
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {categories.length === 0 ? (
                  <p className="text-xs text-zinc-500">
                    Sin categorías activas todavía.
                  </p>
                ) : (
                  categories.map((cat) => {
                    const checked = filters.cats.includes(cat.slug);
                    return (
                      <button
                        key={cat.apiId}
                        type="button"
                        onClick={() => toggleCategory(cat.slug)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          checked
                            ? "bg-[#6018F8] text-white"
                            : "border border-zinc-200 bg-white text-zinc-700 hover:border-violet-300"
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="max-price-range"
                  className="text-xs font-bold uppercase tracking-wider text-zinc-700"
                >
                  Precio máximo
                </label>
                <span className="text-xs font-semibold text-violet-700 tabular-nums">
                  {filters.maxPrice > 0
                    ? `Hasta ${formatPrice(filters.maxPrice)}`
                    : "Sin límite"}
                </span>
              </div>
              <input
                id="max-price-range"
                type="range"
                min={0}
                max={ceiling}
                step={Math.max(5, Math.round(ceiling / 40))}
                value={filters.maxPrice}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    maxPrice: Number(e.target.value),
                  }))
                }
                className="mt-3 w-full accent-[#6018F8]"
              />
              <div className="mt-1 flex justify-between text-[11px] text-zinc-500 tabular-nums">
                <span>Sin límite</span>
                <span>{formatPrice(ceiling)}</span>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-800">
                <span className="inline-flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-rose-600" />
                  Mostrar solo productos en oferta
                </span>
                <input
                  type="checkbox"
                  checked={filters.onlyOffers}
                  onChange={toggleOffers}
                  className="h-4 w-4 rounded accent-[#6018F8]"
                />
              </label>

              {hasAnyFilter && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-100"
                >
                  <X className="h-3.5 w-3.5" />
                  Limpiar todos los filtros
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Resumen de resultados */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-zinc-600">
        <div>
          {!feedLoadingInitial && !feedError && (
            <span>
              {typeof feedTotalItems === "number"
                ? `${feedTotalItems} ${feedTotalItems === 1 ? "producto encontrado" : "productos encontrados"}`
                : `${feedItems.length} ${feedItems.length === 1 ? "producto" : "productos"}`}
            </span>
          )}
        </div>
        {hasAnyFilter && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 font-semibold text-violet-700 hover:text-violet-900"
          >
            <X className="h-3.5 w-3.5" />
            Quitar filtros
          </button>
        )}
      </div>

      {/* Estado de carga inicial */}
      {feedLoadingInitial ? (
        <div className="mt-5 grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
            >
              <div className="aspect-[4/3] animate-pulse bg-zinc-200/70" />
              <div className="space-y-2.5 p-4">
                <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-200/70" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-200/70" />
                <div className="h-8 w-full animate-pulse rounded-full bg-zinc-100" />
              </div>
            </div>
          ))}
        </div>
      ) : feedError ? (
        <div className="mt-8 rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-xs">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertCircle className="h-6 w-6" />
          </span>
          <h2 className="mt-4 font-display text-lg font-bold text-zinc-950">
            No pudimos cargar el catálogo
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-zinc-600">
            {feedError}
          </p>
          <button
            type="button"
            onClick={feedRetry}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#6018F8] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5010E8]"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      ) : feedItems.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-zinc-200 bg-white px-6 py-14 text-center shadow-xs">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            <PackageOpen className="h-7 w-7" />
          </span>
          <h2 className="mt-4 font-display text-xl font-bold text-zinc-950">
            {hasAnyFilter
              ? "No encontramos productos con esos filtros"
              : "Aún no hay productos publicados"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
            {hasAnyFilter
              ? "Prueba ajustando la búsqueda o limpiando los filtros activos."
              : "Cuando publiques categorías y productos en el panel de administración de Deve aparecerán aquí automáticamente."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {hasAnyFilter ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 rounded-full bg-[#6018F8] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5010E8]"
              >
                Ver todo el catálogo
              </button>
            ) : (
              <Link
                href="/tienda/admin"
                className="inline-flex items-center gap-2 rounded-full bg-[#6018F8] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5010E8]"
              >
                <ShieldCheck className="h-4 w-4" />
                Ir al panel Admin
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {feedItems.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 4}
              />
            ))}
          </div>

          {feedIsPaginated ? (
            <PaginationControls
              page={feedPage}
              totalPages={feedTotalPages}
              totalItems={feedTotalItems}
              pageSize={feedPageSize}
              onPageChange={(nextPage) => {
                setFeedPage(nextPage);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ) : (
            <div className="mt-8 flex flex-col items-center">
              <div ref={sentinelRef} className="h-1 w-full" />
              {feedLoadingMore && (
                <p className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                  Cargando más productos…
                </p>
              )}
              {feedLoadMoreError && (
                <button
                  type="button"
                  onClick={feedRetry}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Error al cargar más · Reintentar
                </button>
              )}
              {!feedLoadingMore && feedHasMore && !feedLoadMoreError && (
                <button
                  type="button"
                  onClick={feedLoadMore}
                  className="rounded-full border border-zinc-200 bg-white px-5 py-2 text-xs font-semibold text-zinc-800 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
                >
                  Cargar más productos
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
