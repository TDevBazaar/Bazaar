import type { Metadata } from "next";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Política de privacidad y manejo de datos de contacto en Deve.",
  alternates: {
    canonical: "/privacidad",
  },
};

export default function PrivacidadPage() {
  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-zinc-950 sm:text-4xl">
          Política de Privacidad
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          Última actualización: {new Date().getFullYear()} · {siteConfig.name}
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-600">
          <section>
            <h2 className="font-display text-lg font-semibold text-zinc-950">
              1. Datos que recopilamos
            </h2>
            <p className="mt-2">
              Cuando envías una consulta técnica gratuita en nuestro sitio web,
              recopilamos únicamente los datos que nos proporcionas
              voluntariamente: título, descripción del problema o proyecto,
              correo electrónico, número de teléfono y las imágenes que decidas
              adjuntar.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-zinc-950">
              2. Uso de la información
            </h2>
            <p className="mt-2">
              Utilizamos tus datos exclusivamente para evaluar tu caso, enviarte
              el diagnóstico o respuesta solicitada y coordinar la prestación
              del servicio técnico o de desarrollo. No vendemos ni cedemos tus
              datos a terceros con fines publicitarios.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-zinc-950">
              3. Eliminación y contacto
            </h2>
            <p className="mt-2">
              Puedes solicitar la actualización o eliminación de tus datos de
              consulta en cualquier momento contactándonos al{" "}
              <a
                href={siteConfig.contact.phoneHref}
                className="font-medium text-violet-700 underline"
              >
                {siteConfig.contact.phoneDisplay}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
