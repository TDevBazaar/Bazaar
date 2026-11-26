import type { Metadata } from "next";
import { ProductDetailClient } from "@/components/store/ProductDetailClient";
import { siteConfig } from "@/data/site";
import { buildBreadcrumbJsonLd } from "@/lib/seo";
import { formatPriceLabel } from "@/lib/store/format";
import { fetchProductServerSide } from "@/lib/store/powergy-api";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = safeDecode(slug);
  const product = await fetchProductServerSide(cleanSlug);

  if (!product) {
    return {
      title: "Producto | Tienda",
      description: `Ficha de producto en ${siteConfig.name} Tienda.`,
    };
  }

  const priceText = formatPriceLabel(product.price);
  const description =
    product.description?.trim().slice(0, 155) ||
    `${product.name} (${priceText}) disponible en ${siteConfig.name} Tienda.`;

  return {
    title: product.name,
    description,
    alternates: {
      canonical: `/tienda/${encodeURIComponent(product.slug)}`,
    },
    openGraph: {
      title: `${product.name} · ${priceText}`,
      description,
      url: `${siteConfig.siteUrl}/tienda/${encodeURIComponent(product.slug)}`,
      images: product.image ? [{ url: product.image, alt: product.name }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const cleanSlug = safeDecode(slug);
  const initialProduct = await fetchProductServerSide(cleanSlug);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Inicio", href: "/" },
    { name: "Tienda", href: "/tienda" },
    ...(initialProduct
      ? [
          {
            name: initialProduct.name,
            href: `/tienda/${encodeURIComponent(initialProduct.slug)}`,
          },
        ]
      : []),
  ]);

  const productJsonLd = initialProduct
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: initialProduct.name,
        description: initialProduct.description || initialProduct.name,
        image: initialProduct.image || undefined,
        brand: initialProduct.brand
          ? { "@type": "Brand", name: initialProduct.brand }
          : undefined,
        category: initialProduct.categoryName,
        ...(initialProduct.price > 0
          ? {
              offers: {
                "@type": "Offer",
                priceCurrency: "USD",
                price: initialProduct.price,
                availability: "https://schema.org/InStock",
                url: `${siteConfig.siteUrl}/tienda/${encodeURIComponent(initialProduct.slug)}`,
              },
            }
          : {}),
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      <ProductDetailClient
        slugOrId={cleanSlug}
        initialProduct={initialProduct}
      />
    </>
  );
}
