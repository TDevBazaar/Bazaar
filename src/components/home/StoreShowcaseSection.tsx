import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Cpu,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
import { fetchStoreHomeSnapshotServer } from "@/lib/store/powergy-server";

export async function StoreShowcaseSection() {
  const { categories, products, totalActive } =
    await fetchStoreHomeSnapshotServer(4);

  return (
    <section
      id="tienda"
      className="border-t border-zinc-200/60 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-800">
              <ShoppingBag className="h-3.5 w-3.5 text-[#6018F8]" />
              Tienda Online · Deve Cuba
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-zinc-950 sm:text-4xl">
              Tecnología, equipos y repuestos verificados
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-zinc-600 sm:text-base">
              Explora nuestro catálogo actualizado en tiempo real: componentes,
              accesorios y equipos probados por nuestros técnicos, listos para
              pedir directo por WhatsApp.
            </p>
          </div>

          <Link
            href="/tienda"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-[#6018F8] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-violet-600/20 transition hover:bg-[#5010E8] md:self-auto"
          >
            {totalActive > 0
              ? `Explorar tienda (${totalActive})`
              : "Explorar tienda"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Enlaces directos a categorías SEO (/tienda/categoria/[slug]) */}
        {categories.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Link
              href="/tienda"
              className="rounded-full bg-zinc-950 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#6018F8]"
            >
              Todo el catálogo
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.apiId}
                href={`/tienda/categoria/${encodeURIComponent(cat.slug)}`}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
              >
                {cat.name}
                <ArrowUpRight className="h-3 w-3 opacity-60" />
              </Link>
            ))}
          </div>
        )}

        {products.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-50/80 via-white to-indigo-50/60 p-6 shadow-xs sm:p-8 lg:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-800 shadow-2xs ring-1 ring-violet-200/80">
                  <Sparkles className="h-3.5 w-3.5 text-[#6018F8]" />
                  Catálogo integrado con pedido instantáneo
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold text-zinc-950 sm:text-3xl">
                  Equipos, accesorios y repuestos con respaldo técnico real
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
                  Armas tu carrito en segundos, recibes una referencia única{" "}
                  <span className="font-mono font-semibold text-zinc-900">
                    DE-…
                  </span>{" "}
                  y coordinas entrega y garantía directo por WhatsApp con
                  nuestro equipo en Cuba.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href="/tienda"
                    className="inline-flex items-center gap-2 rounded-full bg-[#6018F8] px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-violet-600/25 transition hover:bg-[#5010E8]"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Abrir catálogo
                  </Link>
                  <Link
                    href="/tienda?ofertas=1"
                    className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
                  >
                    Ver ofertas
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-1">
                {[
                  {
                    icon: Cpu,
                    title: "Hardware y accesorios verificados",
                    desc: "Componentes, repuestos y periféricos probados antes de entregar.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Garantía y respaldo técnico",
                    desc: "Asesoría de compatibilidad e instalación opcional por Deve.",
                  },
                  {
                    icon: Truck,
                    title: "Pedido ágil por WhatsApp",
                    desc: "Sin registros largos: resumen visual de tu pedido en un clic.",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 rounded-2xl border border-zinc-200/80 bg-white/95 p-4 shadow-2xs"
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-[#6018F8]">
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <p className="font-display text-sm font-bold text-zinc-950">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-zinc-600">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {products.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-5 py-3.5 text-xs text-zinc-600">
            <span className="inline-flex items-center gap-2 font-medium">
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              ¿Buscas un repuesto o equipo específico? Confirma disponibilidad
              con tu carrito por WhatsApp.
            </span>
            <Link
              href="/tienda"
              className="inline-flex items-center gap-1 font-semibold text-violet-700 hover:text-violet-900"
            >
              Ver todos los productos
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
