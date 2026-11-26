"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
import { useShopStore } from "@/lib/store/cart-store";
import { useProductsByIds } from "@/lib/store/catalog";

export function FavoritesClient() {
  const favorites = useShopStore((s) => s.favorites);
  const hydrated = useShopStore((s) => s.hydrated);
  const { productsById, pending } = useProductsByIds(favorites);

  const items = favorites
    .map((id) => productsById[id])
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const isLoading = !hydrated || (pending && items.length === 0 && favorites.length > 0);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
          Deve Tienda
        </p>
        <h1 className="mt-1.5 font-display text-3xl font-bold text-zinc-950 sm:text-4xl">
          Tus favoritos
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Productos que guardaste en este navegador para revisarlos o pedirlos
          más tarde.
        </p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-16 text-center shadow-xs">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            <Heart className="h-7 w-7" />
          </span>
          <h2 className="mt-4 font-display text-xl font-bold text-zinc-950">
            Todavía no tienes favoritos
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
            Toca el icono del corazón en cualquier equipo o accesorio para
            guardarlo aquí.
          </p>
          <Link
            href="/tienda"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#6018F8] px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-600/25 transition hover:bg-[#5010E8]"
          >
            <ShoppingBag className="h-4 w-4" />
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
