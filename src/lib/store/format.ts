/* ── Formato de precios y fechas ──────────────────────────────── */

/** Precio en formato "$45.99 USD" */
export function formatPrice(n: number): string {
  return `$${(Math.round(n * 100) / 100).toFixed(2)} USD`;
}

/** Precio o "Consultar" cuando todavía no está definido (0 o null) */
export function formatPriceLabel(n: number): string {
  return n > 0 ? formatPrice(n) : "Consultar";
}

/** Fecha corta en español, p.ej. "10 oct 2026" */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Precio con porcentaje entero de rebaja aplicado (igual que el API) */
export function calculateDiscountedPrice(
  originalPrice: number,
  discountPercent: number
): number {
  const pct = Math.min(99, Math.max(1, Math.round(discountPercent)));
  const cents = Math.round(
    (Math.round(originalPrice * 100) * (100 - pct)) / 100 + 1e-9
  );
  return Math.max(1, cents) / 100;
}
