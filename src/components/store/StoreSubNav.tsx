"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tag,
} from "lucide-react";
import { cartCount } from "@/lib/store/catalog";
import { useShopStore } from "@/lib/store/cart-store";

export function StoreSubNav() {
  const pathname = usePathname();
  const cart = useShopStore((s) => s.cart);
  const favorites = useShopStore((s) => s.favorites);
  const hydrated = useShopStore((s) => s.hydrated);

  const totalCart = hydrated ? cartCount(cart) : 0;
  const totalFavs = hydrated ? favorites.length : 0;

  const isCatalog =
    pathname === "/tienda" ||
    (pathname.startsWith("/tienda/") &&
      !pathname.startsWith("/tienda/carrito") &&
      !pathname.startsWith("/tienda/checkout") &&
      !pathname.startsWith("/tienda/favoritos") &&
      !pathname.startsWith("/tienda/admin"));

  return (
    <div className="sticky top-16 z-40 border-b border-zinc-200/80 bg-white/92 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          <Link
            href="/tienda"
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              isCatalog
                ? "bg-violet-50 text-violet-800"
                : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
            }`}
          >
            <Store className="h-3.5 w-3.5" />
            Catálogo
          </Link>
          <Link
            href="/tienda?ofertas=1"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-rose-50 hover:text-rose-700"
          >
            <Tag className="h-3.5 w-3.5 text-rose-600" />
            Ofertas
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href="/tienda/favoritos"
            aria-label="Favoritos"
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              pathname === "/tienda/favoritos"
                ? "border-violet-300 bg-violet-50 text-violet-800"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
            }`}
          >
            <Heart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Favoritos</span>
            {totalFavs > 0 && (
              <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-violet-100 px-1 text-[10px] font-bold text-violet-800 tabular-nums">
                {totalFavs}
              </span>
            )}
          </Link>

          <Link
            href="/tienda/carrito"
            aria-label="Carrito de compras"
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              pathname === "/tienda/carrito" || pathname === "/tienda/checkout"
                ? "bg-[#6018F8] text-white shadow-xs shadow-violet-600/25"
                : "border border-zinc-200 bg-zinc-950 text-white hover:bg-[#6018F8] hover:border-[#6018F8]"
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Carrito</span>
            {totalCart > 0 && (
              <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[10px] font-bold text-white tabular-nums">
                {totalCart}
              </span>
            )}
          </Link>

          <Link
            href="/tienda/admin"
            aria-label="Mi cuenta: compras, ventas y afiliaciones"
            title="Mi cuenta: compras, publicar productos y afiliaciones"
            className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-full border px-3 transition ${
              pathname === "/tienda/admin"
                ? "border-violet-300 bg-violet-50 text-violet-800"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[#6018F8]" />
            <span className="text-xs font-semibold">Mi cuenta</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
