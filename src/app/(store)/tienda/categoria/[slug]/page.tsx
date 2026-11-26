import { Suspense } from "react";
import type { Metadata } from "next";
import { StoreCatalogClient } from "@/components/store/StoreCatalogClient";
import { siteConfig } from "@/data/site";
import { buildBreadcrumbJsonLd, buildStoreCollectionJsonLd } from "@/lib/seo";
import {
  fetchCatalogMetaServer,
  fetchStoreCategoriesServer,
  fetchStoreProductsServer,
} from "@/lib/store/powergy-server";

export const revalidate = 120;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function humanizeSlug(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = safeDecode(slug).trim();
  const categories = await fetchStoreCategoriesServer();
  const matched = categories.find((c) => c.slug === cleanSlug);
  const categoryName = matched?.name ?? humanizeSlug(cleanSlug);
  const canonicalPath = `/tienda/categoria/${encodeURIComponent(cleanSlug)}`;

  const title = `${categoryName} en Cuba · Tienda`;
  const description = `Compra ${categoryName.toLowerCase()} en Cuba con garantía y respaldo técnico de ${siteConfig.name}. Consulta disponibilidad, precios en USD y confirma tu pedido por WhatsApp.`;

  return {
    title,
    description,
    keywords: [
      `${categoryName} Cuba`,
      `comprar ${categoryName.toLowerCase()} La Habana`,
      `${categoryName.toLowerCase()} tienda online Cuba`,
      `${siteConfig.name} tienda`,
    ],
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${categoryName} en Cuba | ${siteConfig.name} Tienda`,
      description,
      url: `${siteConfig.siteUrl}${canonicalPath}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${categoryName} en Cuba | ${siteConfig.name} Tienda`,
      description,
    },
  };
}

export default async function TiendaCategoriaPage({
  params,
}: CategoryPageProps) {
  const { slug } = await params;
  const cleanSlug = safeDecode(slug).trim();

  const [initialCategories, initialMeta] = await Promise.all([
    fetchStoreCategoriesServer(),
    fetchCatalogMetaServer(),
  ]);
  const matched = initialCategories.find((c) => c.slug === cleanSlug);
  const categoryName = matched?.name ?? humanizeSlug(cleanSlug);

  const initialPage = await fetchStoreProductsServer(
    { categories: [cleanSlug], page: 1, pageSize: 20, sort: "destacados" },
    initialCategories
  );

  const canonicalPath = `/tienda/categoria/${encodeURIComponent(cleanSlug)}`;

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Inicio", href: "/" },
    { name: "Tienda", href: "/tienda" },
    { name: categoryName, href: canonicalPath },
  ]);

  const collectionJsonLd = buildStoreCollectionJsonLd({
    name: `${categoryName} en Cuba | ${siteConfig.name} Tienda`,
    description: `Catálogo de ${categoryName.toLowerCase()} disponibles en ${siteConfig.name} Tienda en Cuba.`,
    path: canonicalPath,
    products: initialPage.items,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="h-52 animate-pulse rounded-3xl bg-zinc-100" />
          </div>
        }
      >
        <StoreCatalogClient
          lockedCategory={cleanSlug}
          lockedCategoryName={categoryName}
          initialCategories={initialCategories}
          initialProducts={initialPage.items}
          initialTotalItems={initialPage.totalItems}
          initialTotalPages={initialPage.totalPages}
          initialMeta={initialMeta}
        />
      </Suspense>
    </>
  );
}
