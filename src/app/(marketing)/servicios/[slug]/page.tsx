import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Stethoscope,
} from "lucide-react";
import { ServiceGallery } from "@/components/services/ServiceGallery";
import { ServiceIcon } from "@/components/services/ServiceIcon";
import {
  isCustomVisualService,
  ServiceTileArt,
} from "@/components/visuals/ServiceTileArt";
import { getServiceBySlug, services } from "@/data/services";
import { getWhatsAppUrl, siteConfig } from "@/data/site";
import { buildBreadcrumbJsonLd, buildServiceJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return { title: "Servicio no encontrado" };

  return {
    title: service.seoTitle,
    description: service.seoDescription,
    keywords: service.seoKeywords,
    alternates: {
      canonical: `/servicios/${service.slug}`,
    },
    openGraph: {
      title: `${service.seoTitle} | ${siteConfig.name}`,
      description: service.seoDescription,
      url: `${siteConfig.siteUrl}/servicios/${service.slug}`,
      images: [
        {
          url: service.coverImage,
          width: 1200,
          height: 630,
          alt: service.title,
        },
      ],
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const related = services
    .filter((s) => s.slug !== service.slug && s.vertical === service.vertical)
    .slice(0, 3);

  const serviceJsonLd = buildServiceJsonLd(service);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Inicio", href: "/" },
    { name: "Servicios", href: "/servicios" },
    { name: service.shortTitle, href: `/servicios/${service.slug}` },
  ]);

  const whatsappUrl = getWhatsAppUrl(
    `Hola Deve, quiero consultar por el servicio: ${service.title}`
  );

  return (
    <article className="pb-20 pt-24 sm:pt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Ruta de navegación" className="mb-6">
          <Link
            href="/servicios"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a todos los servicios
          </Link>
        </nav>

        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-[#140736] shadow-lg">
          <div className="relative h-72 w-full sm:h-96">
            {isCustomVisualService(service.slug) ? (
              <ServiceTileArt slug={service.slug} variant="banner" />
            ) : (
              <Image
                src={service.coverImage}
                alt={service.title}
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/92 via-zinc-950/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
              <span className="inline-flex rounded-full bg-violet-600 px-3.5 py-1 text-xs font-semibold text-white shadow-sm">
                {service.badge}
              </span>
              <h1 className="mt-4 max-w-4xl font-display text-3xl font-bold text-white sm:text-5xl">
                {service.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-zinc-200 sm:text-base">
                {service.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          {/* Main description & features */}
          <div className="lg:col-span-8">
            <section aria-labelledby="desc-heading">
              <h2
                id="desc-heading"
                className="font-display text-2xl font-bold text-zinc-950"
              >
                ¿Qué incluye este servicio?
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-600">
                {service.description}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {service.features.map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs transition hover:border-violet-300 hover:shadow-md"
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-700">
                      <ServiceIcon name={feature.icon} className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-base font-bold text-zinc-950">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Sub-items / Maintenance Plans / Repair Breakdown */}
            {service.subItems && service.subItems.length > 0 && (
              <section className="mt-12">
                <h2 className="font-display text-2xl font-bold text-zinc-950">
                  {service.subItemsTitle || "Opciones disponibles"}
                </h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {service.subItems.map((sub) => (
                    <div
                      key={sub.name}
                      className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-lg font-bold text-zinc-950">
                          {sub.name}
                        </h3>
                        {(sub.priceRange || sub.frequency) && (
                          <span className="shrink-0 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
                            {sub.priceRange || sub.frequency}
                          </span>
                        )}
                      </div>
                      {sub.bestFor && (
                        <p className="mt-1 text-xs font-semibold text-emerald-700">
                          Ideal para: {sub.bestFor}
                        </p>
                      )}
                      {sub.description && (
                        <p className="mt-2.5 text-sm text-zinc-600">
                          {sub.description}
                        </p>
                      )}
                      {sub.includes && (
                        <ul className="mt-4 space-y-2">
                          {sub.includes.map((inc) => (
                            <li
                              key={inc}
                              className="flex items-start gap-2 text-xs text-zinc-700"
                            >
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                              <span>{inc}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Benefits */}
            {service.benefits && (
              <section className="mt-12 rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
                <h2 className="font-display text-xl font-bold text-zinc-950">
                  Beneficios principales
                </h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {service.benefits.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-start gap-2.5 text-sm text-zinc-700"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {service.supportedOS && (
              <section className="mt-8 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Sistemas compatibles:
                </span>
                {service.supportedOS.map((os) => (
                  <span
                    key={os}
                    className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800"
                  >
                    {os}
                  </span>
                ))}
              </section>
            )}

            {/* Gallery */}
            <ServiceGallery images={service.gallery} title={service.title} />

            {/* Client feedback */}
            {service.testimonials.length > 0 && (
              <section className="mt-12">
                <h2 className="font-display text-2xl font-bold text-zinc-950">
                  Opiniones de clientes
                </h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {service.testimonials.map((t) => (
                    <div
                      key={t.author}
                      className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6"
                    >
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: t.rating }).map((_, idx) => (
                          <Star
                            key={idx}
                            className="h-4 w-4 fill-amber-400"
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
                        “{t.quote}”
                      </p>
                      <div className="mt-4 border-t border-zinc-200/80 pt-3">
                        <p className="text-sm font-semibold text-zinc-950">
                          {t.author}
                        </p>
                        <p className="text-xs text-zinc-500">{t.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sticky conversion sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-5">
              <div className="rounded-3xl border border-violet-200 bg-white p-6 shadow-lg shadow-violet-900/5">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Disponible ahora
                </div>

                <p className="mt-4 font-display text-xl font-bold text-zinc-950">
                  {service.priceLabel}
                </p>

                <ul className="mt-5 space-y-3 border-y border-zinc-100 py-5 text-sm text-zinc-600">
                  <li className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                    <span>{service.deliveryInfo}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{service.warrantyOrSla}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <span>Respuesta inicial en menos de 24 horas</span>
                  </li>
                </ul>

                <div className="mt-6 space-y-3">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Consultar por WhatsApp
                  </a>
                  <Link
                    href="/consulta"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-3.5 text-sm font-semibold text-zinc-900 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
                  >
                    <Stethoscope className="h-4 w-4 text-violet-600" />
                    Consultar Gratis en Línea
                  </Link>
                </div>
              </div>

              {/* Brand card */}
              <div className="flex items-center gap-4 rounded-3xl border border-zinc-200 bg-zinc-50/70 p-5">
                <Image
                  src={siteConfig.logo}
                  alt={siteConfig.name}
                  width={44}
                  height={37}
                  className="h-10 w-auto shrink-0 object-contain"
                />
                <div>
                  <p className="font-display text-base font-bold text-zinc-950">
                    Equipo {siteConfig.name}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {siteConfig.contact.addressFull}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Related services */}
        {related.length > 0 && (
          <section className="mt-20 border-t border-zinc-200 pt-14">
            <h2 className="font-display text-2xl font-bold text-zinc-950">
              Otros servicios relacionados
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/servicios/${item.slug}`}
                  className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs transition hover:border-violet-300 hover:shadow-md"
                >
                  <span className="text-xs font-semibold text-violet-600">
                    {item.badge}
                  </span>
                  <h3 className="mt-2 font-display text-lg font-bold text-zinc-950 group-hover:text-violet-700">
                    {item.shortTitle}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-xs text-zinc-600">
                    {item.subtitle}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-zinc-800 group-hover:text-violet-700">
                    Ver servicio
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
