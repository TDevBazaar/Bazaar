import { Clock, Code2, MapPin, ShieldCheck } from "lucide-react";

const metrics = [
  {
    icon: Clock,
    value: "< 24 horas",
    label: "Diagnóstico inicial gratuito",
  },
  {
    icon: ShieldCheck,
    value: "Hasta 90 días",
    label: "Garantía real en reparaciones",
  },
  {
    icon: Code2,
    value: "2 verticales",
    label: "Desarrollo Digital + Taller Técnico",
  },
  {
    icon: MapPin,
    value: "La Habana y Remoto",
    label: "10 de Octubre, Luyanó · Toda Cuba",
  },
];

export function TrustStrip() {
  return (
    <section
      aria-label="Indicadores de confianza de Deve"
      className="border-y border-zinc-200/80 bg-white/75 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {metrics.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.value} className="flex items-center gap-3.5">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-200/80 bg-white text-[#6018F8] shadow-2xs">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-display text-base font-bold text-zinc-950 sm:text-lg">
                    {item.value}
                  </p>
                  <p className="text-xs text-zinc-600">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
