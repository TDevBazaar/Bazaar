import Image from "next/image";
import { CheckCircle2, Code2, ShoppingBag, Sparkles, Wrench } from "lucide-react";
import { siteConfig } from "@/data/site";

export function HeroMorphArt() {
  return (
    <div className="relative">
      {/* Ambient soft violet halo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 rounded-full bg-gradient-to-tr from-[#6018F8]/25 via-violet-300/30 to-indigo-300/25 blur-2xl"
      />

      {/* Organic morphing canvas (user's signature animation, now cohesive with Deve brand!) */}
      <div className="animate-hero-morph relative flex h-64 w-64 items-center justify-center overflow-hidden bg-gradient-to-br from-[#1b0848] via-[#4612c9] to-[#7c3aed] p-5 shadow-2xl shadow-violet-950/25 ring-4 ring-white sm:h-80 sm:w-80 lg:h-[375px] lg:w-[375px]">
        {/* Architectural dot/grid pattern inside morph */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.65) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />

        {/* Floating pixel squares echoing Deve's D logo */}
        <span
          aria-hidden="true"
          className="absolute left-7 top-9 h-4 w-4 rounded-md bg-white/25 backdrop-blur-xs"
        />
        <span
          aria-hidden="true"
          className="absolute left-13 top-6 h-2.5 w-2.5 rounded-sm bg-violet-200/50"
        />
        <span
          aria-hidden="true"
          className="absolute bottom-11 right-8 h-5 w-5 rounded-md bg-white/20 backdrop-blur-xs"
        />
        <span
          aria-hidden="true"
          className="absolute bottom-20 right-5 h-2.5 w-2.5 rounded-sm bg-emerald-300/60"
        />

        {/* Clean miniature Deve workspace interface */}
        <div className="relative z-10 w-full max-w-[255px] space-y-2.5">
          {/* Top mini browser window */}
          <div className="rounded-2xl border border-white/20 bg-white/95 p-3.5 shadow-xl shadow-violet-950/30 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <div className="flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-[#5B21B6]">
                <Image
                  src={siteConfig.logo}
                  alt=""
                  aria-hidden="true"
                  width={12}
                  height={10}
                  className="h-2.5 w-auto object-contain"
                />
                deve.studio
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-violet-50 p-2.5">
                <div className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[#6018F8] text-white">
                  <ShoppingBag className="h-3.5 w-3.5" />
                </div>
                <p className="mt-2 text-[11px] font-bold text-zinc-900">
                  Web &amp; Apps
                </p>
                <p className="text-[10px] text-zinc-500">SEO + Velocidad</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-2.5">
                <div className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <Wrench className="h-3.5 w-3.5" />
                </div>
                <p className="mt-2 text-[11px] font-bold text-zinc-900">
                  Soporte PC
                </p>
                <p className="text-[10px] text-zinc-500">Garantía 90d</p>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between rounded-xl bg-zinc-950 px-3 py-2 text-[10px] font-medium text-zinc-200">
              <span className="inline-flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-violet-400" />
                next · seo · mobile
              </span>
              <span className="font-bold text-emerald-400">99/100</span>
            </div>
          </div>

          {/* Bottom live status pill */}
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/25 bg-[#12062b]/80 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur-md">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Diagnóstico gratis &lt; 24h</span>
            <Sparkles className="h-3 w-3 text-violet-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
