"use client";

import Link from "next/link";
import {
  FileText,
  Heart,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { LazyImage } from "@/components/store/LazyImage";
import { useShopStore } from "@/lib/store/cart-store";
import { formatPrice, formatPriceLabel } from "@/lib/store/format";
import type { Product } from "@/lib/store/types";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const addToCart = useShopStore((s) => s.addToCart);
  const toggleFavorite = useShopStore((s) => s.toggleFavorite);
  const favorites = useShopStore((s) => s.favorites);
  const cart = useShopStore((s) => s.cart);
  const hydrated = useShopStore((s) => s.hydrated);

  const isFav = hydrated && favorites.includes(product.id);
  const cartQty = hydrated
    ? cart.find((item) => item.productId === product.id)?.qty ?? 0
    : 0;

  const hasDiscount =
    product.onSale &&
    product.discountPercent !== null &&
    product.discountPercent > 0 &&
    product.price > 0 &&
    product.originalPrice > product.price;

  const detailHref = `/tienda/${encodeURIComponent(product.slug || product.id)}`;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ productId: product.id, qty: 1 });
    toast.success("Añadido al carrito", { description: product.name });
  };

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.id);
    toast(isFav ? "Quitado de favoritos" : "Guardado en favoritos", {
      description: product.name,
    });
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xs transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-900/10">
      <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-zinc-100 bg-zinc-50">
        <Link href={detailHref} className="block h-full w-full">
          <LazyImage
            src={product.image}
            alt={product.name}
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            wrapperClassName="h-full w-full"
            className="transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Badges superiores izquierda */}
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-wrap items-center gap-1">
          {hasDiscount ? (
            <span className="inline-flex items-center rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs tabular-nums">
              -{product.discountPercent}%
            </span>
          ) : product.onSale ? (
            <span className="inline-flex items-center rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
              Oferta
            </span>
          ) : null}

          {product.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-950/85 px-2.5 py-0.5 text-[10.5px] font-semibold text-white backdrop-blur-xs">
              <Sparkles className="h-3 w-3 text-violet-300" />
              Top
            </span>
          )}
        </div>

        {/* Botón de favorito */}
        <button
          type="button"
          onClick={handleFav}
          aria-label={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
          className={`absolute right-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-xs backdrop-blur-xs transition ${
            isFav
              ? "border-rose-200 bg-rose-50 text-rose-600"
              : "border-zinc-200/80 bg-white/90 text-zinc-600 hover:border-rose-200 hover:text-rose-600"
          }`}
        >
          <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[11px] font-bold uppercase tracking-wider text-violet-700">
              {product.categoryName}
            </span>
            {product.brand && (
              <span className="truncate text-[11px] font-medium text-zinc-500">
                {product.brand}
              </span>
            )}
          </div>

          <Link href={detailHref} className="mt-1.5 block">
            <h3 className="line-clamp-2 font-display text-sm font-bold leading-snug text-zinc-950 transition group-hover:text-violet-700 sm:text-[15px]">
              {product.name}
            </h3>
          </Link>

          {/* Insignias técnicas (Garantía / Transporte / Factura) */}
          {(product.warranty || product.transport || product.invoice) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {product.warranty && (
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200/80 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                  <ShieldCheck className="h-3 w-3" />
                  Garantía
                </span>
              )}
              {product.transport && (
                <span className="inline-flex items-center gap-1 rounded-md border border-violet-200/80 bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-800">
                  <Truck className="h-3 w-3" />
                  Transporte
                </span>
              )}
              {product.invoice && (
                <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700">
                  <FileText className="h-3 w-3" />
                  Factura
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-3.5 flex items-end justify-between gap-2 border-t border-zinc-100 pt-3">
          <div className="min-w-0">
            {hasDiscount ? (
              <>
                <p className="text-[11px] font-medium text-zinc-400 line-through tabular-nums">
                  {formatPrice(product.originalPrice)}
                </p>
                <p className="font-display text-base font-bold text-rose-600 tabular-nums sm:text-lg">
                  {formatPrice(product.price)}
                </p>
              </>
            ) : (
              <p
                className={`font-display text-base font-bold tabular-nums sm:text-lg ${
                  product.price > 0 ? "text-zinc-950" : "text-violet-700"
                }`}
              >
                {formatPriceLabel(product.price)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#6018F8] px-3 py-2 text-xs font-semibold text-white shadow-xs shadow-violet-600/20 transition hover:bg-[#5010E8] active:scale-[0.98]"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>{cartQty > 0 ? `(${cartQty})` : "Añadir"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
