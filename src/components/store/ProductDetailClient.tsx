"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileText,
  Heart,
  MessageCircle,
  PackageOpen,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import {
  ImagePreviewModal,
  type PreviewImageData,
} from "@/components/store/ImagePreviewModal";
import { LazyImage } from "@/components/store/LazyImage";
import { ProductCard } from "@/components/store/ProductCard";
import { QuantityStepper } from "@/components/store/QuantityStepper";
import { useShopStore } from "@/lib/store/cart-store";
import { useCategoryMap, useProductBySlugOrId } from "@/lib/store/catalog";
import { formatPrice, formatPriceLabel } from "@/lib/store/format";
import { fetchProductsPage, type ProductView } from "@/lib/store/powergy-api";
import { buildStoreWhatsAppUrl } from "@/lib/store/whatsapp";

interface ProductDetailClientProps {
  slugOrId: string;
  initialProduct?: ProductView | null;
}

export function ProductDetailClient({
  slugOrId,
  initialProduct = null,
}: ProductDetailClientProps) {
  const { product, loading } = useProductBySlugOrId(slugOrId, initialProduct);
  const categoryMap = useCategoryMap();
  const addToCart = useShopStore((s) => s.addToCart);
  const toggleFavorite = useShopStore((s) => s.toggleFavorite);
  const favorites = useShopStore((s) => s.favorites);
  const hydrated = useShopStore((s) => s.hydrated);

  const [qty, setQty] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [previewImage, setPreviewImage] = useState<PreviewImageData | null>(
    null
  );
  const [related, setRelated] = useState<ProductView[]>([]);

  useEffect(() => {
    if (!product?.category) return;
    const controller = new AbortController();
    fetchProductsPage(
      { categories: [product.category], page: 1, pageSize: 5 },
      categoryMap,
      controller.signal
    )
      .then((res) => {
        if (controller.signal.aborted) return;
        setRelated(res.items.filter((item) => item.id !== product.id).slice(0, 4));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [product?.category, product?.id, categoryMap]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-3xl bg-zinc-200/70" />
          <div className="space-y-4 py-4">
            <div className="h-4 w-28 animate-pulse rounded bg-zinc-200/70" />
            <div className="h-9 w-3/4 animate-pulse rounded bg-zinc-200/70" />
            <div className="h-8 w-40 animate-pulse rounded bg-zinc-200/70" />
            <div className="h-28 w-full animate-pulse rounded-2xl bg-zinc-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-xs">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            <PackageOpen className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-zinc-950">
            Producto no encontrado
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Este producto puede haber sido ocultado o ya no está disponible en el
            catálogo.
          </p>
          <Link
            href="/tienda"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#6018F8] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5010E8]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const isFav = hydrated && favorites.includes(product.id);
  const hasDiscount =
    product.onSale &&
    product.discountPercent !== null &&
    product.discountPercent > 0 &&
    product.price > 0 &&
    product.originalPrice > product.price;
  const savings = hasDiscount ? product.originalPrice - product.price : 0;

  const handleAdd = () => {
    addToCart({ productId: product.id, qty });
    setAddedFeedback(true);
    toast.success("Añadido al carrito", {
      description: `${qty} × ${product.name}`,
    });
    window.setTimeout(() => setAddedFeedback(false), 1600);
  };

  const directWhatsAppUrl = buildStoreWhatsAppUrl(
    `Hola Deve, me interesa el producto: ${product.name} (${formatPriceLabel(
      product.price
    )}). ¿Tienen disponibilidad?`
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 sm:pt-8 lg:px-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Ruta de navegación"
        className="mb-6 flex flex-wrap items-center gap-1.5 text-xs font-medium text-zinc-500"
      >
        <Link href="/tienda" className="hover:text-violet-700">
          Tienda
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/tienda/categoria/${encodeURIComponent(product.category)}`}
          className="hover:text-violet-700"
        >
          {product.categoryName}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate font-semibold text-zinc-900">
          {product.name}
        </span>
      </nav>

      <div className="grid gap-8 rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-xs sm:p-8 lg:grid-cols-12 lg:gap-10">
        {/* Columna izquierda: imagen */}
        <div className="lg:col-span-6">
          <button
            type="button"
            onClick={() =>
              product.image &&
              setPreviewImage({ src: product.image, alt: product.name })
            }
            disabled={!product.image}
            className="group relative block aspect-square w-full overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50 text-left disabled:cursor-default"
          >
            <LazyImage
              src={product.image}
              alt={product.name}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              wrapperClassName="h-full w-full"
              className="transition-transform duration-500 group-hover:scale-103"
            />
            <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
              {hasDiscount ? (
                <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                  -{product.discountPercent}% OFF
                </span>
              ) : product.onSale ? (
                <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                  Oferta
                </span>
              ) : null}
              {product.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-950/85 px-3 py-1 text-xs font-semibold text-white">
                  <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                  Destacado
                </span>
              )}
            </div>
            {product.image && (
              <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-zinc-950/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xs">
                <ZoomIn className="h-3.5 w-3.5" />
                Ampliar
              </span>
            )}
          </button>
        </div>

        {/* Columna derecha: ficha */}
        <div className="flex flex-col justify-between lg:col-span-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/tienda/categoria/${encodeURIComponent(product.category)}`}
                className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-800 transition hover:bg-violet-100"
              >
                {product.categoryName}
              </Link>
              {product.subcategory && product.subcategory !== "General" && (
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                  {product.subcategory}
                </span>
              )}
            </div>

            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
              {product.name}
            </h1>

            {(product.brand || product.model) && (
              <p className="mt-1.5 text-sm font-medium text-zinc-500">
                {[product.brand, product.model].filter(Boolean).join(" · ")}
              </p>
            )}

            {/* Precio */}
            <div className="mt-5 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4">
              {hasDiscount ? (
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="font-display text-3xl font-bold text-rose-600 tabular-nums">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-base font-medium text-zinc-400 line-through tabular-nums">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 tabular-nums">
                    Ahorras {formatPrice(savings)}
                  </span>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-display text-3xl font-bold tabular-nums ${
                      product.price > 0 ? "text-zinc-950" : "text-violet-700"
                    }`}
                  >
                    {formatPriceLabel(product.price)}
                  </span>
                  {product.price <= 0 && (
                    <span className="text-xs font-medium text-zinc-500">
                      (confirmamos precio y disponibilidad por WhatsApp)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Badges técnicos de Garantía / Transporte / Factura */}
            {(product.warranty || product.transport || product.invoice) && (
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {product.warranty && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs font-semibold text-emerald-900">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Garantía incluida</span>
                  </div>
                )}
                {product.transport && (
                  <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/70 px-3 py-2 text-xs font-semibold text-violet-900">
                    <Truck className="h-4 w-4 shrink-0 text-violet-600" />
                    <span>Transporte disponible</span>
                  </div>
                )}
                {product.invoice && (
                  <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-800">
                    <FileText className="h-4 w-4 shrink-0 text-zinc-600" />
                    <span>Factura disponible</span>
                  </div>
                )}
              </div>
            )}

            {/* Especificaciones */}
            {product.description && (
              <div className="mt-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Especificaciones y detalles
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-700">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* Controles de compra */}
          <div className="mt-8 space-y-3 border-t border-zinc-200 pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <QuantityStepper value={qty} onChange={setQty} min={1} max={99} />

              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#6018F8] px-6 text-sm font-semibold text-white shadow-md shadow-violet-600/25 transition hover:bg-[#5010E8] active:scale-[0.99]"
              >
                {addedFeedback ? (
                  <>
                    <Check className="h-4 w-4" />
                    Añadido al carrito
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Añadir al carrito
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  toggleFavorite(product.id);
                  toast(
                    isFav ? "Quitado de favoritos" : "Guardado en favoritos",
                    { description: product.name }
                  );
                }}
                aria-label={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${
                  isFav
                    ? "border-rose-200 bg-rose-50 text-rose-600"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-rose-200 hover:text-rose-600"
                }`}
              >
                <Heart className={`h-4.5 w-4.5 ${isFav ? "fill-current" : ""}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Link
                href="/tienda/carrito"
                className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-800 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
              >
                Ver carrito y finalizar pedido
              </Link>
              <a
                href={directWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-4 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                <MessageCircle className="h-4 w-4" />
                Consultar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Productos relacionados */}
      {related.length > 0 && (
        <section className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
                Más en {product.categoryName}
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-zinc-950">
                Productos relacionados
              </h2>
            </div>
            <Link
              href={`/tienda/categoria/${encodeURIComponent(product.category)}`}
              className="text-xs font-semibold text-violet-700 hover:text-violet-900"
            >
              Ver toda la categoría →
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      <ImagePreviewModal
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}
