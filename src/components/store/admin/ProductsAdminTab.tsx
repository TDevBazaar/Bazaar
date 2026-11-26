"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Eye,
  EyeOff,
  FileText,
  ImageDown,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Truck,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AdminModal } from "@/components/store/admin/AdminModal";
import { OptimizeCatalogImagesDialog } from "@/components/store/admin/OptimizeCatalogImagesDialog";
import {
  ZoomableThumb,
  type PreviewImageData,
} from "@/components/store/ImagePreviewModal";
import { PaginationControls } from "@/components/store/PaginationControls";
import {
  buildProductPayloadFromApi,
  createProduct,
  deactivateProduct,
  fetchAdminProducts,
  updateProduct,
  type AdminProductSort,
  type AdminProductVisibility,
} from "@/lib/store/admin-api";
import {
  calculateDiscountedPrice,
  formatPrice,
  formatPriceLabel,
} from "@/lib/store/format";
import {
  MAX_SOURCE_IMAGE_BYTES,
  fetchRemoteImageBlob,
  formatFileSize,
  inspectRemoteImageWeight,
  isHeavyImageMeta,
  isSupportedImageFile,
  optimizeImageBlob,
  uploadOptimizedImageToStorage,
} from "@/lib/store/image-upload";
import {
  STORE_KEY,
  slugify,
  type ApiCategory,
  type ApiProduct,
} from "@/lib/store/powergy-api";
import { STORAGE_BUCKET } from "@/lib/store/supabase";

const ADMIN_PAGE_SIZE = 20;

interface ProductForm {
  id: string | null;
  name: string;
  categoryId: string;
  subcategory: string;
  brand: string;
  model: string;
  price: string;
  image: string;
  specifications: string;
  onSale: boolean;
  discountPercent: string;
  warranty: boolean;
  transport: boolean;
  invoice: boolean;
  topVentas: boolean;
  active: boolean;
}

const emptyProduct: ProductForm = {
  id: null,
  name: "",
  categoryId: "",
  subcategory: "",
  brand: "",
  model: "",
  price: "",
  image: "",
  specifications: "",
  onSale: false,
  discountPercent: "",
  warranty: false,
  transport: false,
  invoice: false,
  topVentas: false,
  active: true,
};

interface ProductsAdminTabProps {
  token: string;
  supabase: SupabaseClient | null;
  categories: ApiCategory[];
  refreshTick: number;
  onMutated: () => void;
  onTotalUpdated: (total: number) => void;
  onImagesDiscovered: (entries: Record<string, string>) => void;
  onPreviewImage: (image: PreviewImageData) => void;
  onGoToCategories: () => void;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export function ProductsAdminTab({
  token,
  supabase,
  categories,
  refreshTick,
  onMutated,
  onTotalUpdated,
  onImagesDiscovered,
  onPreviewImage,
  onGoToCategories,
}: ProductsAdminTabProps) {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadedKey, setLoadedKey] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [visibility, setVisibility] = useState<AdminProductVisibility>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState<"all" | "priced" | "unpriced">(
    "all"
  );
  const [tagFilter, setTagFilter] = useState<"all" | "onSale" | "featured">(
    "all"
  );
  const [sort, setSort] = useState<AdminProductSort>("destacados");
  const [showFilters, setShowFilters] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [optimizingCurrent, setOptimizingCurrent] = useState(false);
  const [optimizeDialogOpen, setOptimizeDialogOpen] = useState(false);

  const [imageWeightInfo, setImageWeightInfo] = useState<{
    url: string;
    bytes: number | null;
    contentType: string | null;
    checking: boolean;
  } | null>(null);
  const lastUploadedWeightRef = useRef<{
    url: string;
    bytes: number;
    contentType: string;
  } | null>(null);

  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive),
    [categories]
  );

  const hasFilters = Boolean(
    debouncedQuery ||
      visibility !== "all" ||
      categoryFilter !== "all" ||
      priceFilter !== "all" ||
      tagFilter !== "all"
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

  const productsRequestKey = `${token}|${debouncedQuery}|${categoryFilter}|${visibility}|${priceFilter}|${tagFilter}|${sort}|${page}|${refreshTick}`;
  const loading = Boolean(token) && loadedKey !== productsRequestKey;

  useEffect(() => {
    if (!token) return;
    let active = true;
    const controller = new AbortController();
    const key = productsRequestKey;

    fetchAdminProducts(token, {
      term: debouncedQuery,
      category: categoryFilter === "all" ? undefined : categoryFilter,
      visibility,
      hasPrice:
        priceFilter === "priced"
          ? true
          : priceFilter === "unpriced"
            ? false
            : undefined,
      onSale: tagFilter === "onSale" ? true : undefined,
      featured: tagFilter === "featured" ? true : undefined,
      sort,
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
        setProducts(res.items);
        setTotalItems(res.totalItems);
        setTotalPages(safePages);
        if (!hasFilters) onTotalUpdated(res.totalItems);
        const imgs: Record<string, string> = {};
        for (const p of res.items) {
          if (p.primary_image) imgs[p.id] = p.primary_image;
        }
        onImagesDiscovered(imgs);
      })
      .catch((err) => {
        if (!active || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        setErrorMsg(errorMessage(err));
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
    debouncedQuery,
    categoryFilter,
    visibility,
    priceFilter,
    tagFilter,
    sort,
    page,
    refreshTick,
    hasFilters,
    productsRequestKey,
    onTotalUpdated,
    onImagesDiscovered,
  ]);

  useEffect(() => {
    const cleanUrl = form.image.trim();
    if (!modalOpen || !/^https?:\/\//i.test(cleanUrl)) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const cached = lastUploadedWeightRef.current;
      if (cached && cached.url === cleanUrl) {
        setImageWeightInfo({
          url: cleanUrl,
          bytes: cached.bytes,
          contentType: cached.contentType,
          checking: false,
        });
        return;
      }

      setImageWeightInfo({
        url: cleanUrl,
        bytes: null,
        contentType: null,
        checking: true,
      });
      const weight = await inspectRemoteImageWeight(cleanUrl, controller.signal);
      if (controller.signal.aborted) return;
      if (!weight) {
        setImageWeightInfo(null);
        return;
      }
      setImageWeightInfo({
        url: cleanUrl,
        bytes: weight.bytes,
        contentType: weight.contentType,
        checking: false,
      });
    }, 240);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [modalOpen, form.image]);

  const openNew = () => {
    setForm({
      ...emptyProduct,
      categoryId: activeCategories[0]?.id ?? "",
    });
    setModalOpen(true);
  };

  const openEdit = (p: ApiProduct) => {
    const basePrice = p.original_price_usd ?? p.price_usd;
    const activeDiscount =
      p.oferta && typeof p.discount_percent === "number" && p.discount_percent > 0
        ? String(Math.round(p.discount_percent))
        : "";
    setForm({
      id: p.id,
      name: p.name,
      categoryId: p.categoryId,
      subcategory: p.subcategory,
      brand: p.brand,
      model: p.model,
      price: basePrice === null ? "" : String(basePrice),
      image: p.primary_image,
      specifications: p.specifications,
      onSale: p.oferta,
      discountPercent: activeDiscount,
      warranty: p.garantia,
      transport: p.transporte,
      invoice: p.factura,
      topVentas: p.top_ventas || p.top_rank !== null,
      active: p.isActive,
    });
    setModalOpen(true);
  };

  const optimizeAndUploadBlob = async (blob: Blob, label: string) => {
    if (!supabase) return;
    const optimized = await optimizeImageBlob(blob);
    const { publicUrl } = await uploadOptimizedImageToStorage(
      supabase,
      STORAGE_BUCKET,
      STORE_KEY,
      optimized
    );
    lastUploadedWeightRef.current = {
      url: publicUrl,
      bytes: optimized.optimizedBytes,
      contentType: optimized.contentType,
    };
    setForm((prev) => ({ ...prev, image: publicUrl }));
    setImageWeightInfo({
      url: publicUrl,
      bytes: optimized.optimizedBytes,
      contentType: optimized.contentType,
      checking: false,
    });
    const savedBytes = optimized.originalBytes - optimized.optimizedBytes;
    const savedPct =
      optimized.originalBytes > 0
        ? Math.round((savedBytes / optimized.originalBytes) * 100)
        : 0;
    if (optimized.wasOptimized && savedBytes > 0 && savedPct >= 5) {
      toast.success(
        `${label} (${formatFileSize(optimized.originalBytes)} → ${formatFileSize(optimized.optimizedBytes)}, -${savedPct}%)`
      );
    } else {
      toast.success(`${label} (${formatFileSize(optimized.optimizedBytes)})`);
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !supabase) return;
    if (!isSupportedImageFile(file)) {
      toast.error("Usa una imagen JPG, PNG, WebP o AVIF.");
      return;
    }
    if (file.size > MAX_SOURCE_IMAGE_BYTES) {
      toast.error(
        `La imagen no puede superar los ${formatFileSize(MAX_SOURCE_IMAGE_BYTES)}.`
      );
      return;
    }
    setUploadingImage(true);
    try {
      await optimizeAndUploadBlob(file, "Imagen optimizada y subida");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOptimizeCurrentImage = async () => {
    const url = form.image.trim();
    if (!supabase || !url || optimizingCurrent || uploadingImage) return;
    setOptimizingCurrent(true);
    try {
      const blob = await fetchRemoteImageBlob(url);
      await optimizeAndUploadBlob(blob, "Imagen comprimida a WebP");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setOptimizingCurrent(false);
    }
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const slug = slugify(name);
    if (name.length < 3) {
      toast.error("El nombre necesita al menos 3 caracteres.");
      return;
    }
    if (!slug) {
      toast.error("El nombre debe contener letras o números.");
      return;
    }
    if (!form.categoryId) {
      toast.error("Elige una categoría (crea una en la pestaña Categorías si aún no existe).");
      return;
    }
    if (!form.image.trim()) {
      toast.error("Sube una imagen o pega su URL.");
      return;
    }

    const priceText = form.price.trim().replace(",", ".");
    const price = priceText === "" ? null : Number.parseFloat(priceText);
    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      toast.error("El precio no es válido.");
      return;
    }

    let discountPercent: number | null = null;
    if (form.onSale) {
      const discText = form.discountPercent.trim();
      if (discText !== "") {
        if (!/^\d+$/.test(discText)) {
          toast.error("El % de rebaja debe ser un número entero entre 1 y 99.");
          return;
        }
        const pct = Number.parseInt(discText, 10);
        if (pct < 1 || pct > 99) {
          toast.error("El % de rebaja debe estar entre 1 y 99.");
          return;
        }
        if (price === null || price <= 0) {
          toast.error("Define un precio mayor que 0 para aplicar un % de rebaja.");
          return;
        }
        discountPercent = pct;
      }
    }

    setSaving(true);
    try {
      const payload = {
        slug,
        categoryId: form.categoryId,
        subcategory: form.subcategory.trim() || "General",
        brand: form.brand.trim() || "Deve",
        model: form.model.trim() || name,
        name,
        priceUsd: price,
        specifications: form.specifications.trim() || name,
        primaryImage: form.image.trim(),
        onSale: form.onSale,
        discountPercent,
        warranty: form.warranty,
        transport: form.transport,
        invoice: form.invoice,
        topRank: form.topVentas ? 1 : null,
        isActive: form.active,
      };

      if (form.id) {
        await updateProduct(token, form.id, payload);
        onImagesDiscovered({ [form.id]: payload.primaryImage });
        toast.success("Producto actualizado");
      } else {
        const created = await createProduct(token, payload);
        onImagesDiscovered({ [created.id]: created.primary_image });
        toast.success("Producto creado");
      }
      setModalOpen(false);
      onMutated();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (p: ApiProduct) => {
    if (togglingId) return;
    setTogglingId(p.id);
    try {
      if (p.isActive) {
        await deactivateProduct(token, p.id);
        toast.info(`“${p.name}” oculto de la tienda`);
      } else {
        await updateProduct(
          token,
          p.id,
          buildProductPayloadFromApi(p, { isActive: true })
        );
        toast.success(`“${p.name}” visible nuevamente`);
      }
      onMutated();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setTogglingId(null);
    }
  };

  const resetFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setVisibility("all");
    setCategoryFilter("all");
    setPriceFilter("all");
    setTagFilter("all");
    setSort("destacados");
    setPage(1);
  };

  const previewBasePrice = Number.parseFloat(form.price.replace(",", "."));
  const previewDiscountPct = Number.parseInt(form.discountPercent, 10);
  const previewDiscountedPrice =
    form.onSale &&
    Number.isFinite(previewBasePrice) &&
    previewBasePrice > 0 &&
    Number.isFinite(previewDiscountPct) &&
    previewDiscountPct >= 1 &&
    previewDiscountPct <= 99
      ? calculateDiscountedPrice(previewBasePrice, previewDiscountPct)
      : null;

  const activeImageWeight =
    modalOpen && imageWeightInfo && imageWeightInfo.url === form.image.trim()
      ? imageWeightInfo
      : null;

  const isCurrentHeavy =
    activeImageWeight &&
    !activeImageWeight.checking &&
    isHeavyImageMeta(activeImageWeight.bytes, activeImageWeight.contentType);

  return (
    <div className="space-y-4">
      {/* Aviso si aún no hay categorías */}
      {activeCategories.length === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50/70 p-4 text-xs text-violet-950">
          <p className="font-medium">
            Aún no tienes categorías activas en la tienda{" "}
            <span className="font-mono font-bold">{STORE_KEY}</span>. Crea al
            menos una categoría antes de publicar tu primer producto.
          </p>
          <button
            type="button"
            onClick={onGoToCategories}
            className="rounded-full bg-[#6018F8] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#5010E8]"
          >
            Ir a Categorías
          </button>
        </div>
      )}

      {/* Barra de búsqueda y acciones */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar productos por nombre, marca o modelo..."
            className="h-10 w-full rounded-full border border-zinc-200 bg-white pl-10 pr-8 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition ${
              showFilters || hasFilters
                ? "border-violet-300 bg-violet-50 text-violet-800"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
          </button>

          <button
            type="button"
            onClick={() => setOptimizeDialogOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
          >
            <ImageDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Optimizar fotos</span>
          </button>

          <button
            type="button"
            onClick={openNew}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#6018F8] px-4 text-xs font-semibold text-white shadow-xs shadow-violet-600/25 transition hover:bg-[#5010E8]"
          >
            <Plus className="h-4 w-4" />
            Nuevo producto
          </button>
        </div>
      </div>

      {/* Filtros avanzados */}
      {showFilters && (
        <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <select
            value={visibility}
            onChange={(e) => {
              setVisibility(e.target.value as AdminProductVisibility);
              setPage(1);
            }}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800"
          >
            <option value="all">Visibilidad: Todos</option>
            <option value="visible">Solo visibles</option>
            <option value="hidden">Solo ocultos</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={priceFilter}
            onChange={(e) => {
              setPriceFilter(e.target.value as "all" | "priced" | "unpriced");
              setPage(1);
            }}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800"
          >
            <option value="all">Precio: Todos</option>
            <option value="priced">Con precio</option>
            <option value="unpriced">Sin precio (Consultar)</option>
          </select>

          <select
            value={tagFilter}
            onChange={(e) => {
              setTagFilter(e.target.value as "all" | "onSale" | "featured");
              setPage(1);
            }}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800"
          >
            <option value="all">Etiqueta: Todas</option>
            <option value="onSale">En oferta</option>
            <option value="featured">Top ventas</option>
          </select>

          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as AdminProductSort);
                setPage(1);
              }}
              className="h-9 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800"
            >
              <option value="destacados">Destacados</option>
              <option value="nuevos">Más recientes</option>
              <option value="precio-asc">Menor precio</option>
              <option value="precio-desc">Mayor precio</option>
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

      {/* Listado de productos */}
      {loading && products.length === 0 ? (
        <div className="flex items-center justify-center py-14 text-sm text-zinc-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-violet-600" />
          Cargando productos…
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/70 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-zinc-800">
            {hasFilters
              ? "Ningún producto coincide con los filtros."
              : "Todavía no hay productos en la tienda Deve."}
          </p>
          <button
            type="button"
            onClick={hasFilters ? resetFilters : openNew}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#6018F8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5010E8]"
          >
            {hasFilters ? "Limpiar filtros" : "Crear primer producto"}
          </button>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {products.map((p) => {
            const effectivePrice = p.price_usd ?? 0;
            const origPrice = p.original_price_usd ?? effectivePrice;
            const hasDiscount =
              p.oferta &&
              typeof p.discount_percent === "number" &&
              p.discount_percent > 0 &&
              effectivePrice > 0 &&
              origPrice > effectivePrice;

            return (
              <li
                key={p.id}
                className={`flex flex-col gap-3 rounded-2xl border bg-white p-3.5 transition sm:flex-row sm:items-center ${
                  p.isActive
                    ? "border-zinc-200"
                    : "border-zinc-200/70 bg-zinc-50/80 opacity-75"
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <ZoomableThumb
                    src={p.primary_image}
                    alt={p.name}
                    onPreview={onPreviewImage}
                    className="h-14 w-14 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                        {p.category}
                      </span>
                      {!p.isActive && (
                        <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-700">
                          Oculto
                        </span>
                      )}
                      {hasDiscount ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          -{Math.round(p.discount_percent!)}%
                        </span>
                      ) : p.oferta ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          Oferta
                        </span>
                      ) : null}
                      {(p.top_ventas || p.top_rank !== null) && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-white">
                          <Sparkles className="h-2.5 w-2.5 text-violet-300" />
                          Top
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm font-bold text-zinc-950">
                      {p.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500">
                      <span>
                        {[p.brand, p.model].filter(Boolean).join(" · ")}
                      </span>
                      {p.garantia && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-800">
                          <ShieldCheck className="h-3 w-3" /> Garantía
                        </span>
                      )}
                      {p.transporte && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-violet-50 px-1.5 py-0.5 font-semibold text-violet-800">
                          <Truck className="h-3 w-3" /> Transporte
                        </span>
                      )}
                      {p.factura && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-zinc-100 px-1.5 py-0.5 font-semibold text-zinc-700">
                          <FileText className="h-3 w-3" /> Factura
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-zinc-100 pt-2.5 sm:justify-end sm:border-t-0 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p
                      className={`text-sm font-bold tabular-nums ${
                        hasDiscount ? "text-rose-600" : "text-zinc-950"
                      }`}
                    >
                      {formatPriceLabel(effectivePrice)}
                    </p>
                    {hasDiscount && (
                      <p className="text-[11px] text-zinc-400 line-through tabular-nums">
                        {formatPrice(origPrice)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="inline-flex h-9 items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleToggleActive(p)}
                      disabled={togglingId === p.id}
                      title={p.isActive ? "Ocultar de la tienda" : "Mostrar en la tienda"}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50"
                    >
                      {togglingId === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : p.isActive ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4 text-emerald-700" />
                      )}
                    </button>
                  </div>
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

      {/* Modal Crear / Editar producto */}
      <AdminModal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={form.id ? "Editar producto" : "Nuevo producto"}
        description="Los cambios se guardan directamente en el API de POWERGY para la tienda Deve."
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={saving}
              className="inline-flex h-10 items-center rounded-full border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || uploadingImage}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#6018F8] px-5 text-xs font-semibold text-white transition hover:bg-[#5010E8] disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {form.id ? "Guardar cambios" : "Crear producto"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-800">
                Nombre del producto *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej. SSD NVMe Kingston 1TB PCIe 4.0"
                className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
              />
              {form.name.trim() && (
                <p className="mt-1 text-[11px] text-zinc-500">
                  Slug: <span className="font-mono">{slugify(form.name)}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800">
                Categoría *
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
              >
                <option value="">Selecciona una categoría…</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800">
                Subcategoría
              </label>
              <input
                type="text"
                value={form.subcategory}
                onChange={(e) =>
                  setForm({ ...form, subcategory: e.target.value })
                }
                placeholder="Ej. Almacenamiento, Cargadores..."
                className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800">
                Marca
              </label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="Ej. Kingston, Lenovo, Apple..."
                className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800">
                Modelo
              </label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="Ej. NV2 1TB"
                className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800">
                Precio base USD (vacío = Consultar)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="Ej. 65.00"
                className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
              />
            </div>

            {/* Imagen con compresión automática */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-800">
                Imagen del producto *
              </label>
              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                <ZoomableThumb
                  src={form.image}
                  alt={form.name || "Vista previa"}
                  onPreview={onPreviewImage}
                  className="h-16 w-16 rounded-xl"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3.5 text-xs font-semibold text-violet-800 transition hover:bg-violet-100">
                      {uploadingImage ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      {uploadingImage ? "Subiendo…" : "Subir foto (auto WebP)"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        onChange={handleUploadFile}
                        disabled={uploadingImage || !supabase}
                        className="sr-only"
                      />
                    </label>
                    {isCurrentHeavy && supabase && (
                      <button
                        type="button"
                        onClick={() => void handleOptimizeCurrentImage()}
                        disabled={optimizingCurrent}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                      >
                        {optimizingCurrent ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ImageDown className="h-3.5 w-3.5" />
                        )}
                        Comprimir ({formatFileSize(activeImageWeight?.bytes ?? 0)})
                      </button>
                    )}
                    {activeImageWeight &&
                      !activeImageWeight.checking &&
                      activeImageWeight.bytes !== null &&
                      !isCurrentHeavy && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                          Ligera · {formatFileSize(activeImageWeight.bytes)}
                        </span>
                      )}
                  </div>
                  <input
                    type="url"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="https://... o sube una foto arriba"
                    className="h-9 w-full rounded-xl border border-zinc-200 px-3 text-xs text-zinc-800 focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-800">
                Especificaciones / Descripción
              </label>
              <textarea
                rows={4}
                value={form.specifications}
                onChange={(e) =>
                  setForm({ ...form, specifications: e.target.value })
                }
                placeholder="Capacidad, compatibilidad, estado, qué incluye..."
                className="mt-1 w-full rounded-xl border border-zinc-200 p-3 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Oferta y descuento */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5 space-y-3">
            <label className="flex cursor-pointer items-center justify-between text-xs font-semibold text-zinc-900">
              <span>Marcar en oferta</span>
              <input
                type="checkbox"
                checked={form.onSale}
                onChange={(e) =>
                  setForm({
                    ...form,
                    onSale: e.target.checked,
                    discountPercent: e.target.checked ? form.discountPercent : "",
                  })
                }
                className="h-4 w-4 accent-[#6018F8]"
              />
            </label>
            {form.onSale && (
              <div className="grid gap-2 sm:grid-cols-2 sm:items-center">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600">
                    % de rebaja (opcional, 1–99)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={form.discountPercent}
                    onChange={(e) =>
                      setForm({ ...form, discountPercent: e.target.value })
                    }
                    placeholder="Ej. 15"
                    className="mt-1 h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950"
                  />
                </div>
                {previewDiscountedPrice !== null && (
                  <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                    Precio final en tienda:{" "}
                    <span className="font-bold">
                      {formatPrice(previewDiscountedPrice)}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Atributos técnicos y estado */}
          <div className="grid gap-2.5 sm:grid-cols-2">
            {[
              {
                key: "warranty" as const,
                label: "Garantía incluida",
              },
              {
                key: "transport" as const,
                label: "Transporte disponible",
              },
              {
                key: "invoice" as const,
                label: "Factura disponible",
              },
              {
                key: "topVentas" as const,
                label: "Destacado / Top ventas",
              },
              ...(form.id
                ? [{ key: "active" as const, label: "Visible en la tienda" }]
                : []),
            ].map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-800"
              >
                <span>{item.label}</span>
                <input
                  type="checkbox"
                  checked={form[item.key]}
                  onChange={(e) =>
                    setForm({ ...form, [item.key]: e.target.checked })
                  }
                  className="h-4 w-4 accent-[#6018F8]"
                />
              </label>
            ))}
          </div>
        </div>
      </AdminModal>

      <OptimizeCatalogImagesDialog
        open={optimizeDialogOpen}
        onClose={() => setOptimizeDialogOpen(false)}
        token={token}
        supabase={supabase}
        onCompleted={(updatedImages) => {
          onImagesDiscovered(updatedImages);
          onMutated();
        }}
      />
    </div>
  );
}
