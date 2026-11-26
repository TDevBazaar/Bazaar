import { Suspense } from "react";
import type { Metadata } from "next";
import { StoreCatalogClient } from "@/components/store/StoreCatalogClient";
import { siteConfig } from "@/data/site";
import { buildBreadcrumbJsonLd } from "@/lib/seo";

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
