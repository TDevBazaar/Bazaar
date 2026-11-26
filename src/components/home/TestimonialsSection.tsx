import { Star } from "lucide-react";

const testimonials = [
  {
    initials: "ML",
    author: "María López",
    role: "Tienda online minorista",
    serviceTag: "E-commerce",
    quote:
      "Mi tienda quedó mucho mejor de lo que esperaba. Carga rapidísimo desde el móvil y el equipo respondió cada duda con claridad.",
  },
  {
    initials: "CR",
    author: "Carlos Rodríguez",
    role: "Cliente en La Habana",
    serviceTag: "Reparación Técnica",
    quote:
      "Salvaron mi laptop en un solo día cuando en otros sitios me decían que no tenía solución. Precio transparente y garantía cumplida.",
  },
  {
    initials: "RM",
    author: "Roberto Martínez",
    role: "Administrador de restaurante",
    serviceTag: "Sistema de Reservas",
    quote:
      "Las reservas ahora se organizan solas y los recordatorios redujeron las ausencias notablemente. Nos ahorró horas cada semana.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="border-t border-zinc-200/60 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
            Opiniones Reales
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-zinc-950 sm:text-4xl">
            Negocios y clientes que confían en Deve
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.author}
              className="flex flex-col justify-between rounded-3xl border border-zinc-200 bg-white/95 p-7 shadow-2xs backdrop-blur-xs transition hover:border-violet-200 hover:bg-white hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-amber-400"
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-800">
                    {t.serviceTag}
                  </span>
                </div>

                <blockquote className="mt-5 text-sm leading-relaxed text-zinc-700">
                  “{t.quote}”
                </blockquote>
              </div>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-zinc-200/80 pt-4">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#6018F8] font-display text-xs font-bold text-white">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-950">{t.author}</p>
                  <p className="text-xs text-zinc-600">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
