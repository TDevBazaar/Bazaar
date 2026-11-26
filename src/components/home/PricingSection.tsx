"use client";

import { useState } from "react";
import { Check, Clock, MessageCircle } from "lucide-react";
import { pricingTiers } from "@/data/pricing";
import type { ServiceVertical } from "@/data/services";
import { getWhatsAppUrl } from "@/data/site";

const verticalTabs: { value: ServiceVertical; label: string }[] = [
  { value: "soporte", label: "Soporte Técnico (La Habana)" },
  { value: "desarrollo", label: "Desarrollo Digital" },
];

export function PricingSection() {
  const [vertical, setVertical] = useState<ServiceVertical>("soporte");
  const visibleTiers = pricingTiers.filter((t) => t.vertical === vertical);

  return (
    <section
      id="precios"
      className="border-t border-zinc-200/60 bg-violet-50/30 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
            Tarifas Referenciales
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-zinc-950 sm:text-4xl">
            Precios y tiempos claros antes de comenzar
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-700 sm:text-base">
            Elige el área que necesitas. Cada equipo o proyecto recibe una
            evaluación transparente tras la consulta gratuita.
          </p>

          {/* Vertical switcher */}
          <div
            role="tablist"
            aria-label="Seleccionar categoría de tarifas"
            className="mt-8 inline-flex flex-wrap justify-center gap-1.5 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-sm"
          >
            {verticalTabs.map((tab) => {
              const active = vertical === tab.value;
              return (
                <button
                  key={tab.value}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setVertical(tab.value)}
                  className={`rounded-xl px-5 py-2.5 text-xs font-semibold transition sm:text-sm ${
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

        <div
          key={vertical}
          className="animate-fade-up mt-12 grid gap-6 lg:grid-cols-3"
        >
          {visibleTiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative flex flex-col justify-between rounded-3xl border p-7 transition-all duration-300 ${
                tier.highlighted
                  ? "border-[#6018F8] bg-white shadow-xl shadow-violet-900/10 ring-1 ring-[#6018F8]/20"
                  : "border-zinc-200 bg-white shadow-sm hover:border-violet-300 hover:shadow-md"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-xl font-bold text-zinc-950">
                    {tier.name}
                  </h3>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      tier.highlighted
                        ? "bg-[#6018F8] text-white"
                        : "border border-zinc-200 bg-zinc-100 text-zinc-800"
                    }`}
                  >
                    {tier.tag}
                  </span>
                </div>

                <p className="mt-5 font-display text-2xl font-bold text-zinc-950 sm:text-3xl">
                  {tier.priceRange}
                </p>

                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700">
                  <Clock className="h-3.5 w-3.5" />
                  {tier.turnaround}
                </p>

                <p className="mt-3 text-sm text-zinc-700">{tier.subtitle}</p>

                <ul className="mt-6 space-y-3 border-t border-zinc-100 pt-6">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-zinc-800"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={getWhatsAppUrl(tier.whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold transition ${
                  tier.highlighted
                    ? "bg-[#6018F8] text-white shadow-md shadow-violet-600/25 hover:bg-[#5010E8]"
                    : "border border-zinc-200 bg-zinc-50 text-zinc-900 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-900"
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                Consultar por WhatsApp
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
