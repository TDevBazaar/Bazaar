import Image from "next/image";
import { Download, Gift, MessageCircle, Smartphone } from "lucide-react";
import { getWhatsAppUrl, siteConfig } from "@/data/site";

export function AppBanner() {
  const hasDirectLink = Boolean(siteConfig.androidAppUrl);
  const ctaHref = hasDirectLink
    ? siteConfig.androidAppUrl
    : getWhatsAppUrl(
        "Hola Deve, quiero descargar la app Android y aprovechar el descuento."
      );

  return (
    <section className="border-t border-zinc-200/60 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Signature dark editorial contrast block using Deve logo's deep indigo #200078 */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#140533] via-[#200078] to-[#12062b] p-8 shadow-2xl shadow-violet-950/20 sm:p-12 lg:p-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#6018F8]/40 blur-3xl"
          />

          <div className="relative grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-violet-100 backdrop-blur-md">
                <Smartphone className="h-3.5 w-3.5 text-emerald-300" />
                App Android Oficial de {siteConfig.name}
              </div>
              <h2 className="mt-5 font-display text-3xl font-bold text-white sm:text-4xl">
                Lleva {siteConfig.name} en tu móvil y obtén hasta{" "}
                <span className="text-violet-300">20% de descuento</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-violet-100/85 sm:text-base">
                Gestiona tus consultas técnicas, accede a promociones exclusivas
                y recibe avisos sobre tus servicios directo en tu teléfono
                Android.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href={ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-lg transition hover:bg-violet-100"
                >
                  {hasDirectLink ? (
                    <>
                      <Download className="h-4 w-4 text-[#6018F8]" />
                      Descargar App Android
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4 text-emerald-600" />
                      Solicitar App Android (APK)
                    </>
                  )}
                </a>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-200">
                  <Gift className="h-4 w-4 text-emerald-300" />
                  Beneficios exclusivos para usuarios de la app
                </span>
              </div>
            </div>

            {/* Crisp elevated light phone mockup contrasting against deep indigo */}
            <div className="flex justify-center lg:col-span-5 lg:justify-end">
              <div className="relative w-60 rounded-[2.5rem] border-[6px] border-white/20 bg-white p-4 shadow-2xl shadow-black/40">
                <div className="mx-auto mb-5 h-4 w-20 rounded-full bg-zinc-200" />
                <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50/70 p-5 text-center">
                  <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <Image
                      src={siteConfig.logo}
                      alt={siteConfig.name}
                      width={32}
                      height={27}
                      className="h-7 w-auto object-contain"
                    />
                  </div>
                  <p className="mt-3 font-display text-lg font-bold text-zinc-950">
                    {siteConfig.name} App
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-violet-700">
                    Hasta 20% OFF en servicios
                  </p>
                  <div className="mt-5 space-y-2 text-left text-[11px] font-medium text-zinc-800">
                    <div className="rounded-xl border border-violet-100 bg-white px-3 py-2 shadow-2xs">
                      ✓ Seguimiento de consultas
                    </div>
                    <div className="rounded-xl border border-violet-100 bg-white px-3 py-2 shadow-2xs">
                      ✓ Promos y regalos activos
                    </div>
                    <div className="rounded-xl border border-violet-100 bg-white px-3 py-2 shadow-2xs">
                      ✓ Contacto técnico en 1 toque
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
