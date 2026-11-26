import type { Metadata } from "next";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description:
    "Condiciones de servicio, diagnósticos y garantías de Deve.",
  alternates: {
    canonical: "/terminos",
  },
};

export default function TerminosPage() {
  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-zinc-950 sm:text-4xl">
          Términos y Condiciones
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          Última actualización: {new Date().getFullYear()} · {siteConfig.name}
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-600">
          <section>
            <h2 className="font-display text-lg font-semibold text-zinc-950">
              1. Diagnósticos y presupuestos
            </h2>
            <p className="mt-2">
              Las tarifas publicadas en el sitio web son referenciales. Todo
              servicio de reparación técnica o desarrollo de software recibe un
              presupuesto concreto tras la evaluación inicial gratuita y solo se
              ejecuta con la confirmación expresa del cliente.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-zinc-950">
              2. Garantía de servicios
            </h2>
            <p className="mt-2">
              Las reparaciones técnicas incluyen hasta 90 días de garantía sobre
              el trabajo realizado y componentes instalados, siempre que el
              equipo no presente daños físicos posteriores, líquidos o
              manipulación por terceros. Los proyectos de desarrollo web y
              software se entregan con alcance y soporte acordados por escrito.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-zinc-950">
              3. Propiedad y legalidad de equipos
            </h2>
            <p className="mt-2">
              Los servicios de desbloqueo, recuperación de acceso o
              mantenimiento se realizan únicamente sobre equipos de propiedad
              legítima del cliente solicitante.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
