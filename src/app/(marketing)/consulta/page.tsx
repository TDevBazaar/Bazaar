import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { TicketForm } from "@/components/consulta/TicketForm";
import { getWhatsAppUrl, siteConfig } from "@/data/site";
import { buildBreadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Consulta Gratuita de Software y Soporte Técnico en Cuba",
  description:
    "Solicita un diagnóstico gratuito con Deve en Cuba: cotiza tu software a medida o consulta la reparación de tu PC, laptop o celular. Respuesta en menos de 24 horas.",
  keywords: [
    "consulta técnica gratuita Cuba",
    "cotizar desarrollo de software Cuba",
    "diagnóstico reparación laptop La Habana",
    "soporte técnico online Cuba",
  ],
  alternates: {
    canonical: "/consulta",
  },
  openGraph: {
    title: `Consulta Gratuita de Software y Soporte Técnico en Cuba | ${siteConfig.name}`,
    description:
      "Diagnóstico sin compromiso para proyectos de software y reparación de equipos en Cuba.",
    url: `${siteConfig.siteUrl}/consulta`,
  },
};

export default function ConsultaPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Inicio", href: "/" },
    { name: "Consulta Gratis", href: "/consulta" },
  ]);

  return (
    <div className="pb-20 pt-24 sm:pt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-violet-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-12">
          {/* Left intro & trust */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-700">
              <Stethoscope className="h-3.5 w-3.5" />
              Diagnóstico sin costo ni compromiso
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold text-zinc-950 sm:text-4xl">
              Consulta Técnica Gratuita
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600 sm:text-base">
              ¿Tienes un problema con tu laptop, PC o celular, o quieres
              consultar por una tienda online o software a medida? Completa el
              formulario y adjunta fotos o capturas si lo necesitas.
            </p>

            <div className="mt-8 space-y-4 rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-xs">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                <div>
                  <p className="font-semibold text-zinc-950">
                    Respuesta en menos de 24 horas
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Un especialista evalúa tu consulta y te contacta por correo
                    o WhatsApp.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-semibold text-zinc-950">
                    Propuesta transparente
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Nunca realizamos ningún servicio ni cargo sin tu aprobación
                    previa.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                <div>
                  <p className="font-semibold text-zinc-950">
                    {siteConfig.contact.addressFull}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    Soporte presencial en La Habana y desarrollo web para toda
                    Cuba.
                  </p>
                  <div className="mt-2.5 space-y-1 text-xs text-zinc-700">
                    {siteConfig.contact.hours.map((h) => (
                      <p key={h.days}>
                        <span className="font-semibold text-zinc-900">
                          {h.days}:
                        </span>{" "}
                        {h.time}
                      </p>
                    ))}
                  </div>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Luyano+10+de+Octubre+La+Habana+Cuba"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 transition hover:text-violet-900"
                  >
                    Ver zona en Google Maps
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5">
              <p className="text-sm font-semibold text-zinc-950">
                ¿Prefieres atención inmediata?
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                Escríbenos o llámanos directamente en horario laboral.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={getWhatsAppUrl(
                    "Hola Deve, quiero hacer una consulta gratuita."
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  Escribir por WhatsApp
                </a>
                <a
                  href={siteConfig.contact.phoneHref}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-100"
                >
                  <Phone className="h-4 w-4 text-violet-600" />
                  {siteConfig.contact.phoneDisplay}
                </a>
              </div>
            </div>
          </div>

          {/* Right ticket form */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-md shadow-zinc-900/5 sm:p-8">
              <TicketForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
