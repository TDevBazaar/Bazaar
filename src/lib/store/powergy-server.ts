import {
  STORE_KEY,
  getPowergyApiServerBase,
  mapCategory,
  mapProduct,
  type ApiCatalogMeta,
  type ApiCategory,
  type ApiPage,
  type ApiProduct,
  type CategoryView,
  type ProductQueryOptions,
  type ProductView,
} from "@/lib/store/powergy-api";

const SERVER_TIMEOUT_MS = 2500;
const DEFAULT_REVALIDATE = 120;

export async function fetchStoreCategoriesServer(
  revalidate = DEFAULT_REVALIDATE
): Promise<CategoryView[]> {
  const base = getPowergyApiServerBase();
  try {
    const res = await fetch(
      `${base}/api/categories?store=${encodeURIComponent(STORE_KEY)}`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate },
        signal: AbortSignal.timeout(SERVER_TIMEOUT_MS),
      }
    );
    if (!res.ok) return [];
    const raw = (await res.json()) as ApiCategory[];
    return raw.map(mapCategory);
  } catch {
    return [];
  }
}

export async function fetchCatalogMetaServer(
  revalidate = DEFAULT_REVALIDATE
): Promise<ApiCatalogMeta | null> {
  const base = getPowergyApiServerBase();
  try {
    const res = await fetch(
      `${base}/api/products/meta?store=${encodeURIComponent(STORE_KEY)}`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate },
        signal: AbortSignal.timeout(SERVER_TIMEOUT_MS),
      }
    );
    if (!res.ok) return null;
    return (await res.json()) as ApiCatalogMeta;
  } catch {
    return null;
  }
}

export async function fetchStoreProductsServer(
  opts: ProductQueryOptions = {},
  categories: CategoryView[] = [],
  revalidate = DEFAULT_REVALIDATE
): Promise<ApiPage<ProductView>> {
  const base = getPowergyApiServerBase();
  const params = new URLSearchParams({
    store: STORE_KEY,
    page: String(opts.page ?? 1),
    pageSize: String(opts.pageSize ?? 12),
  });

  const cats = (opts.categories ?? []).map((c) => c.trim()).filter(Boolean);
  if (cats.length === 1) {
    params.set("category", cats[0]);
  } else if (cats.length > 1) {
    params.set("categories", cats.join(","));
  }
  if (opts.q?.trim()) params.set("q", opts.q.trim());
  if (opts.maxPrice && opts.maxPrice > 0) {
    params.set("maxPrice", String(opts.maxPrice));
  }
  if (opts.onSale) params.set("onSale", "true");
  if (opts.featured !== undefined) params.set("featured", String(opts.featured));
  if (opts.sort) params.set("sort", opts.sort);

  const catMap = new Map(
    categories.map((c) => [c.apiId, { slug: c.slug, name: c.name }])
  );

  try {
    const res = await fetch(`${base}/api/products?${params.toString()}`, {
      headers: { Accept: "application/json" },
      next: { revalidate },
      signal: AbortSignal.timeout(SERVER_TIMEOUT_MS),
    });
    if (!res.ok) {
      return {
        items: [],
        page: opts.page ?? 1,
        pageSize: opts.pageSize ?? 12,
        totalItems: 0,
        totalPages: 0,
      };
    }
    const raw = (await res.json()) as ApiPage<ApiProduct>;
    return {
      ...raw,
      items: raw.items.map((item) => mapProduct(item, catMap)),
    };
  } catch {
    return {
      items: [],
      page: opts.page ?? 1,
      pageSize: opts.pageSize ?? 12,
      totalItems: 0,
      totalPages: 0,
    };
  }
}

export async function fetchStoreHomeSnapshotServer(limit = 4): Promise<{
  categories: CategoryView[];
  products: ProductView[];
  totalActive: number;
}> {
  const [categories, meta] = await Promise.all([
    fetchStoreCategoriesServer(),
    fetchCatalogMetaServer(),
  ]);

  const page = await fetchStoreProductsServer(
    { page: 1, pageSize: limit, sort: "destacados" },
    categories
  );

  return {
    categories,
    products: page.items,
    totalActive: meta?.totalActive ?? page.totalItems,
  };
}
