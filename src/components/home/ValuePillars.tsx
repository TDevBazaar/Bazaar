import Link from "next/link";
import { ArrowUpRight, Code2, Stethoscope, Wrench } from "lucide-react";

const pillars = [
  {
    icon: Stethoscope,
    accent: "text-emerald-700 bg-emerald-50 border-emerald-200",
    title: "Consulta y Defectación Gratis",
    subtitle: "Diagnóstico claro sin compromiso",
    description:
      "¿Tu equipo o sistema no rinde como debería? Envía tu ticket online con fotos o agenda una cita para identificar fallos críticos, cuellos de botella y la mejor solución.",
    href: "/consulta",
    cta: "Consultar gratis",
  },
  {
    icon: Wrench,
    accent: "text-amber-700 bg-amber-50 border-amber-200",
    title: "Reparación y Mantenimiento",
    subtitle: "Hardware y software en La Habana",
    description:
      "¿Un fallo imprevisto detuvo tu trabajo? Reparamos laptops, computadoras y celulares con precisión, limpieza profunda, instalación de sistemas y hasta 90 días de garantía.",
    href: "/servicios/reparacion-tecnica",
    cta: "Ver soporte técnico",
  },
  {
    icon: Code2,
    accent: "text-violet-700 bg-violet-50 border-violet-200",
    title: "Desarrollo a la Medida",
    subtitle: "Tiendas online, webs y apps",
    description:
      "Transformamos tus ideas en productos digitales rápidos, seguros y posicionados en Google: e-commerce, catálogos interactivos, sistemas de reservas y aplicaciones Android/Web.",
    href: "/servicios/desarrollo-ecommerce",
    cta: "Explorar desarrollo",
  },
];

export function ValuePillars() {
  return (
    <section id="nosotros" className="border-t border-zinc-200/60 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
            Lo que ofrecemos
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-zinc-950 sm:text-4xl">
            Un solo aliado técnico para crecer en digital y mantener tus equipos al 100%
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {pillars.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200/90 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-900/5"
              >
                <div>
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${item.accent}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 font-display text-xl font-bold text-zinc-950">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-violet-600">
                    {item.subtitle}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-700">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 transition group-hover:text-violet-700">
                  {item.cta}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
