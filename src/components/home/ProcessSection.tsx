import { ClipboardCheck, MessageSquareText, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MessageSquareText,
    title: "Cuéntanos tu caso o proyecto",
    description:
      "Envía tu consulta gratis desde el formulario (incluso con fotos del fallo) o escríbenos directo por WhatsApp.",
  },
  {
    number: "02",
    icon: ClipboardCheck,
    title: "Diagnóstico y propuesta clara",
    description:
      "En menos de 24 horas recibes una evaluación técnica honesta, tiempos estimados y precio transparente sin sorpresas.",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Ejecución rápida con garantía",
    description:
      "Reparamos tu equipo o lanzamos tu plataforma digital con pruebas completas y respaldo post-entrega.",
  },
];

export function ProcessSection() {
  return (
    <section className="border-t border-zinc-200/60 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
            Cómo trabajamos
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-zinc-950 sm:text-4xl">
            De tu problema a una solución en 3 pasos simples
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative rounded-3xl border border-zinc-200/90 bg-white/90 p-7 shadow-2xs backdrop-blur-xs transition hover:border-violet-200 hover:bg-white hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-display text-3xl font-bold text-violet-300">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-xl font-bold text-zinc-950">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-700">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
