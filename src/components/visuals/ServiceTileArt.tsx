import {
  Bell,
  CalendarCheck,
  Check,
  Code2,
  Filter,
  MessageCircle,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  TrendingUp,
} from "lucide-react";

interface ServiceTileArtProps {
  slug: string;
  variant?: "tile" | "banner";
}

export function isCustomVisualService(slug: string): boolean {
  return (
    slug === "desarrollo-ecommerce" ||
    slug === "catalogo-digital" ||
    slug === "sistema-de-reservas" ||
    slug === "software-a-medida"
  );
}

export function ServiceTileArt({
  slug,
  variant = "tile",
}: ServiceTileArtProps) {
  const isBanner = variant === "banner";

  if (slug === "desarrollo-ecommerce") {
    return (
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#190840] via-[#3b0fb8] to-[#6d28d9]">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
        <div
          className={`relative flex h-full w-full items-center justify-center px-4 ${
            isBanner ? "pb-24 pt-6" : "pb-10 pt-8"
          }`}
        >
          <div
            className={`w-full rounded-xl border border-white/20 bg-white/95 p-3 shadow-2xl transition-transform duration-500 group-hover:scale-105 ${
              isBanner ? "max-w-lg p-5" : "max-w-[220px]"
            }`}
          >
            {/* Mini store header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-600" />
                <span className="text-[10px] font-bold text-zinc-900">
                  Mi Tienda Online
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-bold text-violet-800">
                <ShoppingCart className="h-2.5 w-2.5" />3
              </span>
            </div>

            {/* Product cards row */}
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-2">
                <div className="h-8 rounded-md bg-gradient-to-br from-violet-200 to-indigo-100" />
                <div className="mt-1.5 h-1.5 w-12 rounded bg-zinc-800" />
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-violet-700">
                    $45.00
                  </span>
                  <span className="rounded bg-violet-600 px-1 py-0.5 text-[8px] font-bold text-white">
                    +
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-2">
                <div className="h-8 rounded-md bg-gradient-to-br from-fuchsia-200 to-violet-100" />
                <div className="mt-1.5 h-1.5 w-10 rounded bg-zinc-800" />
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-violet-700">
                    $89.00
                  </span>
                  <span className="rounded bg-emerald-600 px-1 py-0.5 text-[8px] font-bold text-white">
                    ✓
                  </span>
                </div>
              </div>
            </div>

            {isBanner && (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-zinc-950 px-3 py-2 text-xs text-white">
                <span>Checkout rápido · SSL + WhatsApp</span>
                <span className="font-bold text-emerald-400">Listo 24/7</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (slug === "catalogo-digital") {
    return (
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#130b33] via-[#2b157a] to-[#5b21b6]">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div
          className={`relative flex h-full w-full items-center justify-center px-4 ${
            isBanner ? "pb-24 pt-6" : "pb-10 pt-8"
          }`}
        >
          <div
            className={`w-full rounded-xl border border-white/20 bg-white/95 p-3 shadow-2xl transition-transform duration-500 group-hover:scale-105 ${
              isBanner ? "max-w-lg p-5" : "max-w-[220px]"
            }`}
          >
            {/* Search & filter bar */}
            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-[9px] text-zinc-500">
              <Search className="h-3 w-3 text-violet-600" />
              <span className="flex-1 truncate">Buscar producto...</span>
              <SlidersHorizontal className="h-3 w-3 text-zinc-400" />
            </div>

            {/* Category filter chips */}
            <div className="mt-2 flex items-center gap-1">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-600 px-2 py-0.5 text-[8px] font-semibold text-white">
                <Filter className="h-2 w-2" />
                Todos
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[8px] font-medium text-zinc-700">
                Ofertas
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[8px] font-medium text-zinc-700">
                Nuevos
              </span>
            </div>

            {/* 3-col visual catalog tiles */}
            <div className="mt-2.5 grid grid-cols-3 gap-1.5">
              <div className="rounded-lg bg-violet-100/90 p-1.5">
                <div className="h-6 rounded bg-violet-300/70" />
                <div className="mt-1 h-1.5 w-8 rounded bg-zinc-700" />
              </div>
              <div className="rounded-lg bg-indigo-100/90 p-1.5">
                <div className="h-6 rounded bg-indigo-300/70" />
                <div className="mt-1 h-1.5 w-7 rounded bg-zinc-700" />
              </div>
              <div className="rounded-lg bg-emerald-100/90 p-1.5">
                <div className="h-6 rounded bg-emerald-300/70" />
                <div className="mt-1 flex items-center justify-center gap-0.5 text-[8px] font-bold text-emerald-800">
                  <MessageCircle className="h-2 w-2" />
                  Pedir
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (slug === "sistema-de-reservas") {
    return (
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#0f1035] via-[#27187e] to-[#4f46e5]">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.65) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div
          className={`relative flex h-full w-full items-center justify-center px-4 ${
            isBanner ? "pb-24 pt-6" : "pb-10 pt-8"
          }`}
        >
          <div
            className={`w-full rounded-xl border border-white/20 bg-white/95 p-3 shadow-2xl transition-transform duration-500 group-hover:scale-105 ${
              isBanner ? "max-w-lg p-5" : "max-w-[220px]"
            }`}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-900">
                <CalendarCheck className="h-3.5 w-3.5 text-violet-600" />
                Agenda Inteligente
              </span>
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Bell className="h-3 w-3" />
              </span>
            </div>

            {/* Time slot pills */}
            <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center text-[9px] font-semibold">
              <span className="rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 text-zinc-500">
                09:00
              </span>
              <span className="rounded-lg bg-[#6018F8] py-1.5 text-white shadow-sm">
                10:30 ✓
              </span>
              <span className="rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 text-zinc-700">
                14:00
              </span>
            </div>

            {/* Auto-confirmation banner */}
            <div className="mt-2.5 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[9px] font-semibold text-emerald-800">
              <span className="inline-flex items-center gap-1">
                <Check className="h-3 w-3 text-emerald-600" />
                Cita confirmada
              </span>
              <span className="text-emerald-600">Auto</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // software-a-medida
  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#0d0a1f] via-[#220e5c] to-[#5b21b6]">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        className={`relative flex h-full w-full items-center justify-center px-4 ${
          isBanner ? "pb-24 pt-6" : "pb-10 pt-8"
        }`}
      >
        <div
          className={`w-full rounded-xl border border-white/15 bg-zinc-950/90 p-3 shadow-2xl backdrop-blur-md transition-transform duration-500 group-hover:scale-105 ${
            isBanner ? "max-w-lg p-5" : "max-w-[220px]"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-zinc-200">
              <Terminal className="h-3 w-3 text-violet-400" />
              app.deve.ts
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[8px] font-bold text-emerald-300">
              <Sparkles className="h-2.5 w-2.5" />
              Live
            </span>
          </div>

          <div className="mt-2.5 space-y-1.5 font-mono text-[9px]">
            <div className="flex items-center gap-1.5 text-violet-300">
              <Code2 className="h-3 w-3 shrink-0" />
              <span>deploy(&quot;a-medida&quot;)</span>
            </div>
            <div className="grid grid-cols-4 items-end gap-1 pt-1">
              <div className="h-4 rounded-t bg-violet-500/40" />
              <div className="h-6 rounded-t bg-violet-500/60" />
              <div className="h-8 rounded-t bg-violet-500/80" />
              <div className="flex h-10 items-start justify-center rounded-t bg-emerald-400 pt-1 text-zinc-950">
                <TrendingUp className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
