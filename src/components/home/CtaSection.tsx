import Link from "next/link";
import { ArrowRight, CalendarCheck, Clock, MessageCircle, ShieldCheck } from "lucide-react";
import { getWhatsAppUrl } from "@/data/site";

export function CtaSection() {
  return (
    <section className="border-t border-zinc-200/60 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-b from-violet-50/90 via-white to-violet-50/40 px-6 py-14 text-center shadow-sm sm:px-12 sm:py-16">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-200 bg-white text-violet-600 shadow-xs">
            <CalendarCheck className="h-7 w-7" />
          </div>

          <h2 className="mt-6 font-display text-3xl font-bold text-zinc-950 sm:text-4xl">
            ¿Tienes una duda técnica o quieres consultar por tu proyecto?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base">
            Envía tu consulta gratuita ahora mismo. Un especialista revisará tu
            caso y te responderá con un plan de acción claro en menos de 24
            horas.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3.5 sm:flex-row">
            <Link
              href="/consulta"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-violet-600/25 transition hover:bg-violet-700"
            >
              Consultar Gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={getWhatsAppUrl(
                "Hola Deve, quiero agendar una consulta gratuita."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-8 py-3.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Directo
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium text-zinc-600">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-violet-600" />
              Respuesta en &lt; 24 horas
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Sin costo ni compromiso
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
