import type { Metadata } from "next";
import { CtaSection } from "@/components/home/CtaSection";
import { ServicesShowcase } from "@/components/home/ServicesShowcase";
import type { ServiceVertical } from "@/data/services";
import { siteConfig } from "@/data/site";
import { buildBreadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Servicios de Desarrollo de Software y Soporte Técnico en Cuba",
  description:
    "Servicios de Deve en Cuba: desarrollo de software a medida, tiendas e-commerce, catálogos digitales, sistemas de reservas y soporte técnico para PCs, laptops y celulares.",
  keywords: [
    "servicios de desarrollo de software en Cuba",
    "soporte técnico informático en Cuba",
    "desarrollo web y tiendas online Cuba",
    "reparación y mantenimiento de computadoras Cuba",
  ],
  alternates: {
    canonical: "/servicios",
  },
  openGraph: {
    title: `Servicios de Desarrollo de Software y Soporte Técnico en Cuba | ${siteConfig.name}`,
    description:
      "Soluciones de software a medida, desarrollo web y soporte técnico informático en Cuba.",
    url: `${siteConfig.siteUrl}/servicios`,
  },
};

export default async function ServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const initialFilter: "all" | ServiceVertical =
    categoria === "desarrollo" || categoria === "soporte" ? categoria : "all";

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Inicio", href: "/" },
    { name: "Servicios", href: "/servicios" },
  ]);

  return (
    <div className="pt-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
          {siteConfig.name} · Portafolio de Servicios
        </p>
        <h1 className="mt-2 max-w-3xl font-display text-4xl font-bold text-zinc-950 sm:text-5xl">
          Desarrollo Digital y Soporte Técnico Especializado
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600">
          Elige el área que necesitas: soluciones de software para hacer crecer
          tu negocio online o reparación y mantenimiento para tus equipos en La
          Habana.
        </p>
      </div>

      <ServicesShowcase
        initialFilter={initialFilter}
        heading="Explora cada servicio en detalle"
      />
      <CtaSection />
    </div>
  );
}
