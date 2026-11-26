"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Stethoscope } from "lucide-react";
import {
  isCustomVisualService,
  ServiceTileArt,
} from "@/components/visuals/ServiceTileArt";
import { services, type ServiceVertical } from "@/data/services";

type FilterValue = "all" | ServiceVertical;

const tabs: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "desarrollo", label: "Desarrollo Digital" },
  { value: "soporte", label: "Soporte Técnico" },
];

export function ServicesShowcase({
  initialFilter = "all",
  heading = "Soluciones pensadas para impulsar tu negocio",
}: {
  initialFilter?: FilterValue;
  heading?: string;
}) {
  const [filter, setFilter] = useState<FilterValue>(initialFilter);

  const visibleServices =
    filter === "all"
      ? services
      : services.filter((service) => service.vertical === filter);

  return (
    <section
      id="servicios"
      className="border-t border-zinc-200/60 bg-violet-50/30 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
              Servicios
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-zinc-950 sm:text-4xl">
              {heading}
            </h2>
          </div>

          {/* Filter pills */}
          <div
            role="tablist"
            aria-label="Filtrar servicios por categoría"
            className="inline-flex flex-wrap gap-1.5 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-sm"
          >
            {tabs.map((tab) => {
              const active = filter === tab.value;
              return (
                <button
                  key={tab.value}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setFilter(tab.value)}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold transition sm:text-sm ${
                    active
                      ? "bg-[#6018F8] text-white shadow-sm shadow-violet-600/25"
                      : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic photo & custom-UI mosaic grid */}
        <div
          key={filter}
          className="animate-fade-up mt-10 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4"
        >
          {/* Consulta Gratis tile */}
          {filter !== "desarrollo" && (
            <Link
              href="/consulta"
              className="group relative flex h-52 flex-col justify-between overflow-hidden rounded-2xl bg-zinc-900 p-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/15 sm:h-64 sm:p-5"
            >
              <Image
                src="/images/services/v2-consulta.webp"
                alt="Consulta técnica gratuita y diagnóstico online en Deve"
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/92 via-zinc-950/45 to-zinc-950/20 transition-opacity duration-300 group-hover:via-zinc-950/55" />

              <div className="relative z-10 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                  <Stethoscope className="h-3 w-3" />
                  Gratis
                </span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950/50 text-white backdrop-blur-md transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-emerald-600">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>

              <div className="relative z-10">
                <h3 className="font-display text-lg font-bold text-white drop-shadow-xs sm:text-xl">
                  Consulta Gratis
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-100 opacity-95 transition-all duration-300 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                  Diagnóstico técnico sin costo en menos de 24 horas.
                </p>
              </div>
            </Link>
          )}

          {visibleServices.map((service) => {
            const useCustomArt = isCustomVisualService(service.slug);
            return (
              <Link
                key={service.slug}
                href={`/servicios/${service.slug}`}
                className="group relative flex h-52 flex-col justify-between overflow-hidden rounded-2xl bg-[#140736] p-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-900/20 sm:h-64 sm:p-5"
              >
                <div className="absolute inset-0">
                  {useCustomArt ? (
                    <ServiceTileArt slug={service.slug} variant="tile" />
                  ) : (
                    <Image
                      src={service.thumbnail}
                      alt={service.title}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  )}
                </div>

                <div
                  className={`absolute inset-0 transition-opacity duration-300 ${
                    useCustomArt
                      ? "bg-gradient-to-t from-[#0d0424]/95 via-[#0d0424]/25 to-transparent"
                      : "bg-gradient-to-t from-zinc-950/92 via-zinc-950/45 to-zinc-950/20 group-hover:via-violet-950/55"
                  }`}
                />

                <div className="relative z-10 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md ${
                      service.vertical === "desarrollo"
                        ? "bg-white/15 text-white border border-white/20"
                        : "border border-white/25 bg-zinc-950/70 text-white"
                    }`}
                  >
                    {service.vertical === "desarrollo"
                      ? "Desarrollo"
                      : "Soporte"}
                  </span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950/45 text-white backdrop-blur-md transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-[#6018F8]">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>

                <div className="relative z-10">
                  <h3 className="font-display text-lg font-bold text-white drop-shadow-xs sm:text-xl">
                    {service.shortTitle}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-100 opacity-95 transition-all duration-300 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                    {service.subtitle}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
