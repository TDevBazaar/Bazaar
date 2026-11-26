import { Suspense } from "react";
import type { Metadata } from "next";
import { StoreCatalogClient } from "@/components/store/StoreCatalogClient";
import { siteConfig } from "@/data/site";
import { buildBreadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Tienda de Tecnología, Equipos y Accesorios",
  description:
    "Explora el catálogo online de Deve en La Habana: equipos, accesorios, repuestos y tecnología verificada. Arma tu carrito y confirma tu pedido por WhatsApp.",
  alternates: {
    canonical: "/tienda",
  },
  openGraph: {
    title: `Tienda | ${siteConfig.name}`,
    description:
      "Equipos, accesorios y repuestos de tecnología verificados por Deve en La Habana.",
    url: `${siteConfig.siteUrl}/tienda`,
  },
};

export default function TiendaPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Inicio", href: "/" },
    { name: "Tienda", href: "/tienda" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="h-52 animate-pulse rounded-3xl bg-zinc-100" />
          </div>
        }
      >
        <StoreCatalogClient />
      </Suspense>
    </>
  );
}
