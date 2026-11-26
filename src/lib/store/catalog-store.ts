"use client";

import { useEffect, useMemo } from "react";
import { create } from "zustand";
import {
  fetchCatalogMeta,
  fetchProductBySlugOrId,
  fetchProductsByIds,
  fetchStoreCategories,
  type ApiCatalogMeta,
  type CategoryMap,
  type CategoryView,
  type ProductView,
} from "./powergy-api";

export type LoadStatus = "idle" | "loading" | "ready" | "error";

interface CatalogState {
  categories: CategoryView[];
  categoriesStatus: LoadStatus;
  categoriesError: string | null;

  meta: ApiCatalogMeta | null;
  metaStatus: LoadStatus;

  productsById: Record<string, ProductView>;
  unresolvedKeys: Record<string, true>;
  version: number;

  loadCategories: (force?: boolean) => void;
  loadMeta: (force?: boolean) => void;
  registerProducts: (items: ProductView[]) => void;
  ensureProductsByIds: (ids: string[]) => void;
  ensureProductBySlugOrId: (slugOrId: string) => void;
  reload: () => void;
}

const inFlightKeys = new Set<string>();

function buildCategoryMap(categories: CategoryView[]): CategoryMap {
  return new Map(
    categories.map((c) => [c.apiId, { slug: c.slug, name: c.name }])
  );
}

function mergeProducts(
  current: Record<string, ProductView>,
  items: ProductView[]
): Record<string, ProductView> {
  if (items.length === 0) return current;
  let changed = false;
  const next = { ...current };
  for (const item of items) {
    const prev = next[item.id];
    if (
      !prev ||
      prev.createdAt !== item.createdAt ||
      prev.bumpedAt !== item.bumpedAt ||
      prev.price !== item.price ||
      prev.originalPrice !== item.originalPrice ||
      prev.discountPercent !== item.discountPercent ||
      prev.onSale !== item.onSale ||
      prev.warranty !== item.warranty ||
      prev.transport !== item.transport ||
      prev.invoice !== item.invoice ||
      prev.image !== item.image ||
      prev.name !== item.name ||
      prev.category !== item.category ||
      prev.allowAffiliates !== item.allowAffiliates ||
      prev.affiliateCommissionType !== item.affiliateCommissionType ||
      prev.affiliateCommissionValue !== item.affiliateCommissionValue ||
      prev.owner?.handle !== item.owner?.handle ||
      prev.owner?.whatsAppPhone !== item.owner?.whatsAppPhone
    ) {
      next[item.id] = item;
      changed = true;
    }
  }
  return changed ? next : current;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  categories: [],
  categoriesStatus: "idle",
  categoriesError: null,

  meta: null,
  metaStatus: "idle",

  productsById: {},
  unresolvedKeys: {},
  version: 0,

  loadCategories: (force = false) => {
    const { categoriesStatus } = get();
    if (!force && categoriesStatus !== "idle" && categoriesStatus !== "error") {
      return;
    }
    set({ categoriesStatus: "loading", categoriesError: null });

    fetchStoreCategories()
      .then((categories) => {
        set({
          categories,
          categoriesStatus: "ready",
          categoriesError: null,
        });
      })
      .catch((error: unknown) => {
        set({
          categoriesStatus: "error",
          categoriesError:
            error instanceof Error
              ? error.message
              : "No se pudieron cargar las categorías.",
        });
      });
  },

  loadMeta: (force = false) => {
    const { metaStatus } = get();
    if (!force && metaStatus !== "idle" && metaStatus !== "error") return;
    set({ metaStatus: "loading" });

    fetchCatalogMeta()
      .then((meta) => {
        set({ meta, metaStatus: "ready" });
      })
      .catch(() => {
        set({ metaStatus: "error" });
      });
  },

  registerProducts: (items) => {
    if (items.length === 0) return;
    set((state) => {
      const merged = mergeProducts(state.productsById, items);
      return merged === state.productsById ? state : { productsById: merged };
    });
  },

  ensureProductsByIds: (ids) => {
    const state = get();
    const missing = [...new Set(ids.map((id) => id.trim()).filter(Boolean))].filter(
      (id) =>
        !state.productsById[id] &&
        !state.unresolvedKeys[id] &&
        !inFlightKeys.has(id)
    );
    if (missing.length === 0) return;

    for (const id of missing) inFlightKeys.add(id);
    const catMap = buildCategoryMap(state.categories);

    fetchProductsByIds(missing, catMap)
      .then((found) => {
        const foundSet = new Set(found.map((item) => item.id));
        const notFound = missing.filter((id) => !foundSet.has(id));
        set((curr) => {
          const nextUnresolved = { ...curr.unresolvedKeys };
          for (const id of notFound) nextUnresolved[id] = true;
          return {
            productsById: mergeProducts(curr.productsById, found),
            unresolvedKeys: nextUnresolved,
          };
        });
      })
      .catch(() => {
        /* Permite reintentar en la siguiente consulta */
      })
      .finally(() => {
        for (const id of missing) inFlightKeys.delete(id);
      });
  },

  ensureProductBySlugOrId: (slugOrId) => {
    const clean = slugOrId.trim();
    if (!clean) return;
    const state = get();
    const alreadyCached =
      state.productsById[clean] ||
      Object.values(state.productsById).some((p) => p.slug === clean);
    if (alreadyCached || state.unresolvedKeys[clean] || inFlightKeys.has(clean)) {
      return;
    }

    inFlightKeys.add(clean);
    const catMap = buildCategoryMap(state.categories);

    fetchProductBySlugOrId(clean, catMap)
      .then((product) => {
        set((curr) => {
          if (!product) {
            return {
              unresolvedKeys: { ...curr.unresolvedKeys, [clean]: true },
            };
          }
          return {
            productsById: mergeProducts(curr.productsById, [product]),
          };
        });
      })
      .catch(() => {
        set((curr) => ({
          unresolvedKeys: { ...curr.unresolvedKeys, [clean]: true },
        }));
      })
      .finally(() => {
        inFlightKeys.delete(clean);
      });
  },

  reload: () => {
    set((state) => ({
      categoriesStatus: "idle",
      metaStatus: "idle",
      productsById: {},
      unresolvedKeys: {},
      version: state.version + 1,
    }));
    get().loadCategories(true);
    get().loadMeta(true);
  },
}));

export function useCategories(): CategoryView[] {
  const status = useCatalogStore((s) => s.categoriesStatus);
  const load = useCatalogStore((s) => s.loadCategories);

  useEffect(() => {
    if (status === "idle") load();
  }, [status, load]);

  return useCatalogStore((s) => s.categories);
}

export function useCategoriesStatus(): LoadStatus {
  const status = useCatalogStore((s) => s.categoriesStatus);
  const load = useCatalogStore((s) => s.loadCategories);

  useEffect(() => {
    if (status === "idle") load();
  }, [status, load]);

  return status;
}

export function useCategoryMap(): CategoryMap {
  const categories = useCategories();
  return useMemo(() => buildCategoryMap(categories), [categories]);
}

export function useCatalogMeta(): ApiCatalogMeta | null {
  const status = useCatalogStore((s) => s.metaStatus);
  const load = useCatalogStore((s) => s.loadMeta);

  useEffect(() => {
    if (status === "idle") load();
  }, [status, load]);

  return useCatalogStore((s) => s.meta);
}

export function useProductsByIds(ids: string[]): {
  productsById: Record<string, ProductView>;
  pending: boolean;
} {
  const ensure = useCatalogStore((s) => s.ensureProductsByIds);
  const productsById = useCatalogStore((s) => s.productsById);
  const unresolvedKeys = useCatalogStore((s) => s.unresolvedKeys);
  const cleanIds = useMemo(
    () => [...new Set(ids.map((id) => id.trim()).filter(Boolean))],
    [ids]
  );
  const key = cleanIds.join(",");

  useEffect(() => {
    if (!key) return;
    ensure(key.split(","));
  }, [key, ensure]);

  const pending = cleanIds.some(
    (id) => !productsById[id] && !unresolvedKeys[id]
  );

  return { productsById, pending };
}

export function useProductBySlugOrId(
  slugOrId: string,
  initialProduct?: ProductView | null
): {
  product: ProductView | undefined;
  loading: boolean;
} {
  const registerProducts = useCatalogStore((s) => s.registerProducts);
  const ensure = useCatalogStore((s) => s.ensureProductBySlugOrId);
  const productsById = useCatalogStore((s) => s.productsById);
  const unresolvedKeys = useCatalogStore((s) => s.unresolvedKeys);

  useEffect(() => {
    if (initialProduct) {
      registerProducts([initialProduct]);
    }
  }, [initialProduct, registerProducts]);

  const cached =
    productsById[slugOrId] ??
    Object.values(productsById).find((p) => p.slug === slugOrId);

  const product = cached ?? initialProduct ?? undefined;

  useEffect(() => {
    if (!product && !unresolvedKeys[slugOrId]) {
      ensure(slugOrId);
    }
  }, [slugOrId, product, unresolvedKeys, ensure]);

  const loading = !product && !unresolvedKeys[slugOrId];
  return { product, loading };
}

export function useCatalogVersion(): number {
  return useCatalogStore((s) => s.version);
}

export function reloadCatalog(): void {
  useCatalogStore.getState().reload();
}
