import Link from "next/link";
import { ArrowRight, ChevronDown, MessageCircle, ShoppingBag } from "lucide-react";
import { DeveWordmark } from "@/components/brand/DeveWordmark";
import { HeroMorphArt } from "@/components/visuals/HeroMorphArt";
import { getWhatsAppUrl } from "@/data/site";

export function HeroSection() {
  const whatsappUrl = getWhatsAppUrl(
    "Hola Deve, estoy interesado en consultar por sus servicios."
  );

  return (
    <section className="relative flex min-h-[82vh] items-center overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-20">
      <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12">
          {/* Text column closer to the morphing visual */}
          <div className="order-2 flex flex-col items-start lg:order-1">
            <span
              className="animate-hero-reveal inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-xs font-semibold text-violet-800"
              style={{ animationDelay: "0.05s" }}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              La Habana, Cuba · Atención presencial y remota
            </span>

            <h1
              className="animate-hero-reveal mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight text-zinc-950 sm:text-5xl lg:text-[3.5rem]"
              style={{ animationDelay: "0.18s" }}
            >
              Bienvenido a{" "}
              <DeveWordmark
                size="hero"
                textColorClass="text-[#5B21B6]"
                priority
              />
            </h1>

            <p
              className="animate-hero-reveal mt-5 max-w-lg text-base leading-relaxed text-zinc-700 sm:text-lg"
              style={{ animationDelay: "0.34s" }}
            >
              Brindamos soluciones informáticas a tu medida: desarrollo web,
              tiendas online y software empresarial, además de reparación y
              mantenimiento técnico con diagnóstico gratuito en menos de 24
              horas.
            </p>

            <div
              className="animate-hero-reveal mt-7 flex flex-wrap items-center gap-3.5"
              style={{ animationDelay: "0.48s" }}
            >
              <Link
                href="/consulta"
                className="inline-flex items-center gap-2 rounded-full bg-[#6018F8] px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-violet-600/25 transition-all hover:bg-[#5010E8] hover:shadow-lg hover:shadow-violet-600/30"
              >
                Consultar Gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/tienda"
                className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-6 py-3.5 text-sm font-semibold text-violet-900 shadow-2xs transition-all hover:border-violet-300 hover:bg-violet-100"
              >
                <ShoppingBag className="h-4 w-4 text-[#6018F8]" />
                Ir a la Tienda
              </Link>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-900 shadow-xs transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-900"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                WhatsApp
              </a>
            </div>
          </div>

          {/* Right column: Bespoke Deve morphing studio visual */}
          <div className="order-1 flex justify-center lg:order-2">
            <HeroMorphArt />
          </div>
        </div>
      </div>

      {/* Minimalist scroll indicator */}
      <a
        href="#servicios"
        aria-label="Desplazarse a los servicios"
        className="animate-scroll-bounce absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-zinc-500 transition hover:text-violet-700 sm:inline-flex"
      >
        <span className="h-8 w-5 rounded-full border-2 border-current p-1">
          <span className="block h-1.5 w-full rounded-full bg-current" />
        </span>
        <ChevronDown className="h-4 w-4" />
      </a>
    </section>
  );
}
