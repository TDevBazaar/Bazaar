/* ── Cliente del API de POWERGY para la tienda Deve ─────────────
   Comparte infraestructura con el API de POWERGY usando store="deve"
   (pedidos DE-XXXXXXXX). El catálogo, las categorías y los pedidos
   viven en el API; el carrito y favoritos se guardan en localStorage. */

export const STORE_KEY =
  process.env.NEXT_PUBLIC_STORE_KEY?.trim() || "deve";

export const API_BASE = "/api/powergy";

const DEFAULT_POWERGY_API = "https://powergy.somee.com";

export function getPowergyApiServerBase(): string {
  return (
    process.env.POWERGY_API_URL?.trim() || DEFAULT_POWERGY_API
  ).replace(/\/+$/, "");
}

/* ── Contratos del API ────────────────────────────────────────── */

export interface ApiProduct {
  id: string;
  slug: string;
  category: string;
  categoryId: string;
  subcategory: string;
  brand: string;
  model: string;
  name: string;
  /** Precio actual en USD (con descuento aplicado si tiene); null o 0 = "Consultar" */
  price_usd: number | null;
  /** Precio base en USD antes de descuento */
  original_price_usd?: number | null;
  /** Porcentaje de descuento activo (1-99) */
  discount_percent?: number | null;
  specifications: string;
  primary_image: string;
  oferta: boolean;
  garantia: boolean;
  transporte: boolean;
  factura: boolean;
  top_ventas: boolean;
  top_rank: number | null;
  isActive: boolean;
  store: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  store: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiCursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  pageSize: number;
  totalItems: number | null;
}

export interface ApiCatalogMeta {
  totalActive: number;
  maxPriceUsd: number | null;
}

export interface ApiOrderLine {
  productId: string;
  productName: string;
  productSlug: string;
  categoryName: string;
  quantity: number;
  originalQuantity: number;
  unitPriceUsd: number | null;
  lineTotalUsd: number | null;
}

export interface ApiOrder {
  id: string;
  reference: string;
  status: "requested" | "closed" | "cancelled";
  store: string;
  estimatedTotalUsd: number | null;
  originalEstimatedTotalUsd: number | null;
  createdAt: string;
  closedAt: string | null;
  closedByAdminUserId: string | null;
  cancellationReason: string | null;
  cancellationNote: string | null;
  hasUnpricedItems: boolean;
  items: ApiOrderLine[];
  removedItems?: ApiOrderLine[];
  referralCode?: string | null;
  referredByAdminName?: string | null;
}

/* ── Mapeo al modelo de la tienda ─────────────────────────────── */

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface CategoryView {
  id: string;
  apiId: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductView {
  id: string;
  slug: string;
  name: string;
  /** 0 = precio por confirmar ("Consultar"); con rebaja ya aplicada cuando hay descuento */
  price: number;
  /** Precio original antes de aplicar el % de rebaja */
  originalPrice: number;
  /** Porcentaje entero (1-99) si tiene oferta con rebaja */
  discountPercent: number | null;
  category: string;
  categoryName: string;
  categoryId: string;
  brand: string;
  model: string;
  subcategory: string;
  description: string;
  image: string;
  images: string[];
  tags: string[];
  badge?: "oferta" | "populares";
  featured: boolean;
  onSale: boolean;
  warranty: boolean;
  transport: boolean;
  invoice: boolean;
  topRank: number | null;
  isActive: boolean;
  createdAt: string;
}

export type CategoryMap = Map<string, { slug: string; name: string }>;

export function mapCategory(category: ApiCategory): CategoryView {
  return {
    id: category.slug,
    apiId: category.id,
    name: category.name,
    slug: category.slug,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
  };
}

export function mapProduct(
  product: ApiProduct,
  categoriesById: CategoryMap = new Map()
): ProductView {
  const category = categoriesById.get(product.categoryId);
  const categorySlug = category?.slug ?? slugify(product.category);
  const categoryName = category?.name ?? product.category;
  const image = product.primary_image?.trim() ?? "";
  const effectivePrice = product.price_usd ?? 0;
  const rawOriginal = product.original_price_usd ?? product.price_usd ?? 0;
  const discountPercent =
    product.oferta &&
    effectivePrice > 0 &&
    rawOriginal > effectivePrice &&
    typeof product.discount_percent === "number" &&
    product.discount_percent > 0
      ? Math.round(product.discount_percent)
      : null;
  const originalPrice = discountPercent ? rawOriginal : effectivePrice;
  const isFeatured = Boolean(product.top_ventas || product.top_rank !== null);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: effectivePrice,
    originalPrice,
    discountPercent,
    category: categorySlug,
    categoryName,
    categoryId: product.categoryId,
    brand: product.brand,
    model: product.model,
    subcategory: product.subcategory,
    description: product.specifications,
    image,
    images: image ? [image] : [],
    tags: [product.brand, product.model, product.subcategory]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value)),
    badge: product.oferta ? "oferta" : isFeatured ? "populares" : undefined,
    featured: isFeatured,
    onSale: Boolean(product.oferta),
    warranty: Boolean(product.garantia),
    transport: Boolean(product.transporte),
    invoice: Boolean(product.factura),
    topRank: product.top_rank,
    isActive: product.isActive,
    createdAt: product.createdAt,
  };
}

/* ── Llamadas cliente (a través de /api/powergy) ──────────────── */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      detail?: string;
      title?: string;
      errors?: Record<string, string[]>;
    };
    if (data.detail) return data.detail;
    if (data.errors) {
      const first = Object.values(data.errors)[0];
      if (first?.[0]) return first[0];
    }
    if (data.title) return data.title;
  } catch {
    /* Respuesta sin JSON */
  }
  return `Error ${response.status}`;
}

export async function apiGet<T>(
  path: string,
  token?: string | null,
  signal?: AbortSignal
): Promise<T> {
  const response = await fetch(`${API_BASE}/${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
  return (await response.json()) as T;
}

export async function apiSend<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {}
): Promise<T> {
  const { method = "POST", body, token } = options;
  const response = await fetch(`${API_BASE}/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function fetchStoreCategories(
  signal?: AbortSignal
): Promise<CategoryView[]> {
  const categories = await apiGet<ApiCategory[]>(
    `categories?store=${encodeURIComponent(STORE_KEY)}`,
    undefined,
    signal
  );
  return categories.map(mapCategory);
}

export interface ProductQueryOptions {
  categories?: string[];
  q?: string;
  maxPrice?: number;
  onSale?: boolean;
  featured?: boolean;
  sort?: "destacados" | "precio-asc" | "precio-desc" | "nuevos";
  page?: number;
  pageSize?: number;
  cursor?: string | null;
  limit?: number;
}

function buildProductSearchParams(opts: ProductQueryOptions): URLSearchParams {
  const params = new URLSearchParams({ store: STORE_KEY });

  const cats = (opts.categories ?? []).map((c) => c.trim()).filter(Boolean);
  if (cats.length === 1) {
    params.set("category", cats[0]);
  } else if (cats.length > 1) {
    params.set("categories", cats.join(","));
  }

  const q = opts.q?.trim();
  if (q) params.set("q", q);

  if (opts.maxPrice && opts.maxPrice > 0) {
    params.set("maxPrice", String(opts.maxPrice));
  }
  if (opts.onSale) params.set("onSale", "true");
  if (opts.featured !== undefined) params.set("featured", String(opts.featured));
  if (opts.sort) params.set("sort", opts.sort);

  return params;
}

export async function fetchProductsPage(
  opts: ProductQueryOptions,
  categoriesById: CategoryMap = new Map(),
  signal?: AbortSignal
): Promise<ApiPage<ProductView>> {
  const params = buildProductSearchParams(opts);
  params.set("page", String(opts.page ?? 1));
  params.set("pageSize", String(opts.pageSize ?? 20));

  const result = await apiGet<ApiPage<ApiProduct>>(
    `products?${params.toString()}`,
    undefined,
    signal
  );

  return {
    ...result,
    items: result.items.map((item) => mapProduct(item, categoriesById)),
  };
}

export async function fetchProductsCursor(
  opts: ProductQueryOptions,
  categoriesById: CategoryMap = new Map(),
  signal?: AbortSignal
): Promise<ApiCursorPage<ProductView>> {
  const params = buildProductSearchParams(opts);
  params.set("limit", String(opts.limit ?? 12));
  if (opts.cursor) params.set("cursor", opts.cursor);

  const result = await apiGet<ApiCursorPage<ApiProduct>>(
    `products/cursor?${params.toString()}`,
    undefined,
    signal
  );

  return {
    ...result,
    items: result.items.map((item) => mapProduct(item, categoriesById)),
  };
}

export async function fetchCatalogMeta(
  signal?: AbortSignal
): Promise<ApiCatalogMeta> {
  return apiGet<ApiCatalogMeta>(
    `products/meta?store=${encodeURIComponent(STORE_KEY)}`,
    undefined,
    signal
  );
}

/** Busca un producto por slug (primario en URLs /tienda/[slug]) con respaldo por ID */
export async function fetchProductBySlugOrId(
  slugOrId: string,
  categoriesById: CategoryMap = new Map(),
  signal?: AbortSignal
): Promise<ProductView | null> {
  const clean = slugOrId.trim();
  if (!clean) return null;

  try {
    const bySlug = await apiGet<ApiProduct>(
      `products/${encodeURIComponent(clean)}?store=${encodeURIComponent(STORE_KEY)}`,
      undefined,
      signal
    );
    return mapProduct(bySlug, categoriesById);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      try {
        const byId = await apiGet<ApiProduct>(
          `products/by-id/${encodeURIComponent(clean)}?store=${encodeURIComponent(STORE_KEY)}`,
          undefined,
          signal
        );
        return mapProduct(byId, categoriesById);
      } catch (idError) {
        if (idError instanceof ApiError && idError.status === 404) {
          return null;
        }
        throw idError;
      }
    }
    throw error;
  }
}

export async function fetchProductsByIds(
  ids: string[],
  categoriesById: CategoryMap = new Map(),
  signal?: AbortSignal
): Promise<ProductView[]> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) return [];

  const results: ProductView[] = [];
  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50);
    const params = new URLSearchParams({
      store: STORE_KEY,
      ids: chunk.join(","),
    });
    const items = await apiGet<ApiProduct[]>(
      `products/batch?${params.toString()}`,
      undefined,
      signal
    );
    results.push(...items.map((item) => mapProduct(item, categoriesById)));
  }
  return results;
}

/** Lectura server-side para SEO/metadata de /tienda/[slug] */
export async function fetchProductServerSide(
  slugOrId: string
): Promise<ProductView | null> {
  const clean = slugOrId.trim();
  if (!clean) return null;

  const base = getPowergyApiServerBase();
  const qs = `store=${encodeURIComponent(STORE_KEY)}`;

  for (const url of [
    `${base}/api/products/${encodeURIComponent(clean)}?${qs}`,
    `${base}/api/products/by-id/${encodeURIComponent(clean)}?${qs}`,
  ]) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const raw = (await res.json()) as ApiProduct;
        return mapProduct(raw);
      }
    } catch {
      /* Respaldo silencioso: el cliente reintentará a través del proxy */
    }
  }
  return null;
}
