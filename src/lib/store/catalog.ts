"use client";

import { useMemo } from "react";
import { useProductsByIds } from "./catalog-store";
import { useShopStore } from "./cart-store";
import type { CartItem, CartLine, FilterState, Product, SortId } from "./types";

export {
  useCategories,
  useCategoriesStatus,
  useCategoryMap,
  useCatalogMeta,
  useProductsByIds,
  useProductBySlugOrId,
  useCatalogVersion,
  useCatalogStore,
  reloadCatalog,
} from "./catalog-store";

export function useCartLinesState(): {
  lines: CartLine[];
  pending: boolean;
  hydrated: boolean;
} {
  const cart = useShopStore((s) => s.cart);
  const hydrated = useShopStore((s) => s.hydrated);
  const ids = useMemo(() => cart.map((item) => item.productId), [cart]);
  const { productsById, pending } = useProductsByIds(ids);

  const lines = useMemo(() => {
    return cart
      .map((item) => {
        const product = productsById[item.productId];
        if (!product) return null;
        return { ...item, product, lineTotal: product.price * item.qty };
      })
      .filter((l): l is CartLine => l !== null);
  }, [cart, productsById]);

  return { lines, pending: !hydrated || pending, hydrated };
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((acc, l) => acc + l.lineTotal, 0);
}

export function cartCount(cart: CartItem[]): number {
  return cart.reduce((acc, c) => acc + c.qty, 0);
}

export function isUnpriced(product: Product): boolean {
  return !(product.price > 0);
}

export function hasUnpricedLines(lines: CartLine[]): boolean {
  return lines.some((line) => !(line.product.price > 0));
}

export const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: "recientes", label: "Más recientes" },
  { id: "destacados", label: "Destacados" },
  { id: "precio-asc", label: "Precio: menor a mayor" },
  { id: "precio-desc", label: "Precio: mayor a menor" },
  { id: "nuevos", label: "Nuevos ingresos" },
];

export const DEFAULT_FILTERS: FilterState = {
  q: "",
  cats: [],
  maxPrice: 0,
  sort: "recientes",
  onlyOffers: false,
  onlyAffiliates: false,
};

export function priceCeilingFromMax(
  maxPriceUsd: number | null | undefined
): number {
  const max = maxPriceUsd && maxPriceUsd > 0 ? maxPriceUsd : 0;
  return Math.max(50, Math.ceil(max / 10) * 10);
}

export function activeFilterCount(f: FilterState): number {
  return (
    f.cats.length +
    (f.maxPrice > 0 ? 1 : 0) +
    (f.onlyOffers ? 1 : 0) +
    (f.onlyAffiliates ? 1 : 0)
  );
}
