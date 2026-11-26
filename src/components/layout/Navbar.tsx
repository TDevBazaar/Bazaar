"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ArrowUpRight, MessageCircle, ShoppingBag } from "lucide-react";
import { DeveWordmark } from "@/components/brand/DeveWordmark";
import { getWhatsAppUrl, siteConfig } from "@/data/site";
import { useShopStore } from "@/lib/store/cart-store";
import { cartCount } from "@/lib/store/catalog";

const navLinks = [
  { href: "/servicios", label: "Servicios" },
  { href: "/#proyectos", label: "Proyectos" },
  { href: "/#precios", label: "Precios" },
  { href: "/#preguntas", label: "FAQ" },
  { href: "/consulta", label: "Consulta Gratis" },
];

export function Navbar() {
  const pathname = usePathname();
  const [openedPath, setOpenedPath] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const cart = useShopStore((s) => s.cart);
  const hydrated = useShopStore((s) => s.hydrated);
  const itemsInCart = hydrated ? cartCount(cart) : 0;
  const isStoreActive = pathname.startsWith("/tienda");

  const open = openedPath === pathname;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const whatsappHref = getWhatsAppUrl(
    "Hola Deve, estoy interesado en consultar por sus servicios."
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? "border-b border-zinc-200 bg-white/95 backdrop-blur-xl shadow-sm shadow-zinc-900/5"
          : "border-b border-zinc-100/80 bg-white/80 backdrop-blur-md"
      }`}
    >
      <nav
        aria-label="Navegación principal"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        <Link
          href="/"
          aria-label="Deve — Inicio"
          className="group inline-flex items-center rounded-lg py-1 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
        >
          <DeveWordmark
            size="sm"
            textColorClass="text-zinc-950"
            priority
          />
        </Link>

        {/* Desktop navigation */}
        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((item) => {
            const isActive =
              item.href !== "/" &&
              !item.href.startsWith("/#") &&
              pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-violet-50 font-semibold text-violet-800"
                      : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            {siteConfig.storeUrl ? (
              <a
                href={siteConfig.storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
              >
                <ShoppingBag className="h-4 w-4 text-violet-700" />
                Tienda
              </a>
            ) : (
              <Link
                href="/tienda"
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  isStoreActive
                    ? "bg-violet-50 font-semibold text-violet-800"
                    : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                }`}
              >
                <ShoppingBag className="h-4 w-4 text-violet-700" />
                Tienda
                {itemsInCart > 0 && (
                  <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#6018F8] px-1 text-[10px] font-bold text-white tabular-nums">
                    {itemsInCart}
                  </span>
                )}
              </Link>
            )}
          </li>
        </ul>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2.5 md:flex">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition-all hover:bg-emerald-100"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <Link
            href="/consulta"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#6018F8] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-violet-600/25 transition-all hover:bg-[#5010E8]"
          >
            Consultar Gratis
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile burger button */}
        <button
          type="button"
          onClick={() => setOpenedPath(open ? null : pathname)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-900 transition hover:bg-zinc-100 md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div
          id="mobile-menu"
          className="border-t border-zinc-200 bg-white px-4 pb-6 pt-4 shadow-lg md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {navLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpenedPath(null)}
                  className="block rounded-xl px-4 py-3 text-base font-medium text-zinc-800 transition hover:bg-zinc-100 hover:text-zinc-950"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              {siteConfig.storeUrl ? (
                <a
                  href={siteConfig.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-base font-medium text-zinc-800 transition hover:bg-zinc-100 hover:text-zinc-950"
                >
                  <ShoppingBag className="h-4 w-4 text-violet-700" />
                  Tienda
                </a>
              ) : (
                <Link
                  href="/tienda"
                  onClick={() => setOpenedPath(null)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition ${
                    isStoreActive
                      ? "bg-violet-50 font-semibold text-violet-800"
                      : "text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-violet-700" />
                    Tienda
                  </span>
                  {itemsInCart > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6018F8] px-1.5 text-[11px] font-bold text-white tabular-nums">
                      {itemsInCart}
                    </span>
                  )}
                </Link>
              )}
            </li>
          </ul>
          <div className="mt-4 grid grid-cols-1 gap-2.5 border-t border-zinc-200 pt-4">
            <Link
              href="/consulta"
              onClick={() => setOpenedPath(null)}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#6018F8] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#5010E8]"
            >
              Consultar Gratis
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
            >
              <MessageCircle className="h-4 w-4" />
              Escribir por WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
