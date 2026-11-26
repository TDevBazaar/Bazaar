import { siteConfig } from "@/data/site";

/* ── WhatsApp para la tienda Deve ───────────────────────────────
   Usa el número principal de Deve (NEXT_PUBLIC_WHATSAPP_NUMBER) por
   defecto, o el teléfono de un vendedor referido (?v=codigo) al
   confirmar un pedido. */

export const STORE_WHATSAPP_PHONE = siteConfig.contact.whatsappNumber;

/** Deja solo dígitos (7-15) para enlaces wa.me válidos; null si el formato es inválido. */
export function normalizeWhatsAppPhone(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/[^0-9+\-().\s]/.test(trimmed)) return null;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? digits : null;
}

export function buildStoreWhatsAppUrl(
  message: string,
  phoneOverride?: string | null
): string {
  const target = normalizeWhatsAppPhone(phoneOverride) ?? STORE_WHATSAPP_PHONE;
  return `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
}
