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

export const metadata: Metadata = {
  title: "Tienda de Tecnología, Equipos y Repuestos en Cuba",
  description:
    "Catálogo online de Deve en Cuba: equipos, accesorios, componentes y repuestos verificados por nuestro equipo técnico. Arma tu carrito y confirma por WhatsApp.",
  keywords: [
    "tienda de tecnología Cuba",
    "accesorios y repuestos PC La Habana",
    "comprar tecnología en Cuba",
    "Deve tienda online",
  ],
  alternates: {
    canonical: "/tienda",
  },
  openGraph: {
    title: `Tienda de Tecnología y Repuestos en Cuba | ${siteConfig.name}`,
    description:
      "Equipos, accesorios y repuestos de tecnología verificados por Deve en Cuba.",
    url: `${siteConfig.siteUrl}/tienda`,
  },
  twitter: {
    card: "summary_large_image",
    title: `Tienda de Tecnología y Repuestos en Cuba | ${siteConfig.name}`,
    description:
      "Equipos, accesorios y repuestos de tecnología verificados por Deve en Cuba.",
  },
};

export default async function TiendaPage() {
  const [initialCategories, initialMeta] = await Promise.all([
    fetchStoreCategoriesServer(),
    fetchCatalogMetaServer(),
  ]);
  const initialPage = await fetchStoreProductsServer(
    { page: 1, pageSize: 12, sort: "destacados" },
    initialCategories
  );

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Inicio", href: "/" },
    { name: "Tienda", href: "/tienda" },
  ]);

  const collectionJsonLd = buildStoreCollectionJsonLd({
    name: `Tienda de Tecnología y Repuestos en Cuba | ${siteConfig.name}`,
    description:
      "Catálogo de equipos, accesorios y repuestos verificados por Deve en Cuba.",
    path: "/tienda",
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
