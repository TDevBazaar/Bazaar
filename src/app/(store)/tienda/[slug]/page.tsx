import type { Metadata } from "next";
import { ProductDetailClient } from "@/components/store/ProductDetailClient";
import { siteConfig } from "@/data/site";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo";
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
      description: `Ficha de producto en ${siteConfig.name} Tienda en Cuba.`,
    };
  }

  const priceText = formatPriceLabel(product.price);
  const description =
    product.description?.trim().slice(0, 155) ||
    `${product.name} (${priceText}) disponible en ${siteConfig.name} Tienda en Cuba.`;
  const canonicalPath = `/tienda/${encodeURIComponent(product.slug)}`;

  return {
    title: `${product.name} · ${product.categoryName}`,
    description,
    keywords: [
      product.name,
      product.categoryName,
      ...(product.brand ? [`${product.brand} Cuba`] : []),
      `${product.categoryName} Cuba`,
      `${siteConfig.name} tienda`,
    ],
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${product.name} · ${priceText}`,
      description,
      url: `${siteConfig.siteUrl}${canonicalPath}`,
      images: product.image
        ? [{ url: product.image, alt: product.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} · ${priceText}`,
      description,
      images: product.image ? [product.image] : undefined,
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
            name: initialProduct.categoryName,
            href: `/tienda/categoria/${encodeURIComponent(initialProduct.category)}`,
          },
          {
            name: initialProduct.name,
            href: `/tienda/${encodeURIComponent(initialProduct.slug)}`,
          },
        ]
      : []),
  ]);

  const productJsonLd = initialProduct
    ? buildProductJsonLd(initialProduct)
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
