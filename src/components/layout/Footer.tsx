import Link from "next/link";
import { MapPin, Clock, Phone, MessageCircle, ArrowUpRight } from "lucide-react";
import { DeveWordmark } from "@/components/brand/DeveWordmark";
import { services } from "@/data/services";
import { getWhatsAppUrl, siteConfig } from "@/data/site";

export function Footer() {
  const year = new Date().getFullYear();
  const desarrollo = services.filter((s) => s.vertical === "desarrollo");
  const soporte = services.filter((s) => s.vertical === "soporte");

  return (
    <footer className="border-t border-zinc-200 bg-white/85 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand column */}
          <div className="lg:col-span-4">
            <Link href="/" aria-label="Deve — Inicio" className="inline-flex">
              <DeveWordmark size="md" textColorClass="text-zinc-950" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-700">
              Impulsamos negocios con desarrollo web, e-commerce y software a
              medida, y cuidamos tu tecnología con soporte técnico especializado
              en La Habana.
            </p>
            <div className="mt-6 flex items-center gap-2.5">
              <a
                href={siteConfig.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook de Deve"
                className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-300 bg-white px-3.5 text-xs font-semibold text-zinc-800 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-800"
              >
                Facebook
              </a>
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de Deve"
                className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-300 bg-white px-3.5 text-xs font-semibold text-zinc-800 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-800"
              >
                Instagram
              </a>
              <a
                href={siteConfig.social.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub de Deve"
                className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-300 bg-white px-3.5 text-xs font-semibold text-zinc-800 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-800"
              >
                GitHub
              </a>
            </div>
          </div>

          {/* Desarrollo Digital */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950">
              Desarrollo Digital
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-700">
              {desarrollo.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/servicios/${service.slug}`}
                    className="transition hover:text-violet-700"
                  >
                    {service.shortTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Soporte Técnico */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950">
              Soporte Técnico
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-700">
              {soporte.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/servicios/${service.slug}`}
                    className="transition hover:text-violet-700"
                  >
                    {service.shortTitle}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/tienda"
                  className="inline-flex items-center gap-1 font-semibold text-violet-700 transition hover:text-violet-900"
                >
                  Tienda Online
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </li>
              <li>
                <Link
                  href="/consulta"
                  className="inline-flex items-center gap-1 font-semibold text-violet-700 transition hover:text-violet-900"
                >
                  Consulta Gratis
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto y Ubicación */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950">
              Ubicación y Contacto
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-700">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet-700" />
                <span>{siteConfig.contact.addressFull}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-violet-700" />
                <div className="space-y-0.5">
                  {siteConfig.contact.hours.map((h) => (
                    <p key={h.days}>
                      <span className="font-semibold text-zinc-900">
                        {h.days}:
                      </span>{" "}
                      {h.time}
                    </p>
                  ))}
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-violet-700" />
                <a
                  href={siteConfig.contact.phoneHref}
                  className="font-semibold text-zinc-950 transition hover:text-violet-700"
                >
                  {siteConfig.contact.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={getWhatsAppUrl(
                    "Hola Deve, quiero hacer una consulta sobre sus servicios."
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
                >
                  <MessageCircle className="h-4 w-4" />
                  Atención inmediata por WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-8 text-xs font-medium text-zinc-600 sm:flex-row">
          <p>
            © {year} {siteConfig.name}. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/tienda" className="transition hover:text-zinc-950">
              Tienda
            </Link>
            <Link href="/tienda/admin" className="transition hover:text-zinc-950">
              Admin
            </Link>
            <Link href="/privacidad" className="transition hover:text-zinc-950">
              Política de Privacidad
            </Link>
            <Link href="/terminos" className="transition hover:text-zinc-950">
              Términos y Condiciones
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
