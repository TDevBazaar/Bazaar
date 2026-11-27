"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Copy,
  ExternalLink,
  Handshake,
  Link2,
  Loader2,
  MessageCircle,
  Store,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  updateAdminSellerProfile,
  type AdminSellerProfile,
} from "@/lib/store/admin-api";
import type { AffiliateOrderRouting } from "@/lib/store/powergy-api";
import {
  buildAffiliateShowcaseUrl,
  buildSellerProfileUrl,
  buildShareReferralUrl,
  normalizeHandle,
  normalizeReferralCode,
  sanitizeHandleInput,
  sanitizeReferralCodeInput,
} from "@/lib/store/referral";
import { normalizeWhatsAppPhone } from "@/lib/store/whatsapp";

interface SellerLinkTabProps {
  token: string;
  profile: AdminSellerProfile | null;
  available: boolean;
  loading: boolean;
  onUpdated: (profile: AdminSellerProfile) => void;
}

export function SellerLinkTab({
  token,
  profile,
  available,
  loading,
  onUpdated,
}: SellerLinkTabProps) {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [handle, setHandle] = useState(profile?.handle ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [whatsAppPhone, setWhatsAppPhone] = useState(
    profile?.whatsAppPhone ?? ""
  );
  const [routing, setRouting] = useState<AffiliateOrderRouting>(
    profile?.affiliateOrderRouting ?? "owner"
  );
  const [referralCode, setReferralCode] = useState(profile?.referralCode ?? "");
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = profile?.role === "admin";

  if (!available) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
        El perfil de vendedor no está habilitado en el servidor actual.
      </div>
    );
  }

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-zinc-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-violet-600" />
        Cargando tu perfil…
      </div>
    );
  }

  const copyUrl = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(label, { description: url });
    } catch {
      toast.info("Copia manualmente:", { description: url });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = displayName.trim();
    if (cleanName.length < 2) {
      toast.error(
        "Ingresa tu nombre visible o nombre de tienda (mínimo 2 caracteres)."
      );
      return;
    }

    const rawHandle = handle.trim();
    const validHandle = rawHandle ? normalizeHandle(rawHandle) : null;
    if (rawHandle && !validHandle) {
      toast.error(
        "El @usuario debe tener entre 3 y 50 caracteres (letras minúsculas, números, - o _)."
      );
      return;
    }

    const rawPhone = whatsAppPhone.trim();
    const validPhone = rawPhone ? normalizeWhatsAppPhone(rawPhone) : null;
    if (!validPhone) {
      toast.error(
        "Tu número de WhatsApp con código de país es obligatorio para comprar y vender (7 a 15 dígitos, ej. 5352529615)."
      );
      return;
    }

    const rawCode = referralCode.trim();
    const validCode = isSuperAdmin && rawCode ? normalizeReferralCode(rawCode) : null;
    if (isSuperAdmin && rawCode && !validCode) {
      toast.error(
        "El código legacy debe tener entre 2 y 40 caracteres (letras, números, - o _)."
      );
      return;
    }
    if (isSuperAdmin && validCode && !validPhone) {
      toast.error("Ingresa tu WhatsApp si deseas mantener un código legacy (?v=).");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateAdminSellerProfile(token, {
        displayName: cleanName,
        handle: validHandle,
        bio: bio.trim() || null,
        whatsAppPhone: validPhone,
        affiliateOrderRouting: routing,
        ...(isSuperAdmin ? { referralCode: validCode } : {}),
      });
      onUpdated(updated);
      toast.success("Perfil de vendedor actualizado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const activeHandle = normalizeHandle(profile?.handle);
  const activeLegacyCode = normalizeReferralCode(profile?.referralCode);

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xs sm:p-6 lg:col-span-7"
      >
        <div>
          <h2 className="font-display text-lg font-bold text-zinc-950">
            Mi perfil público de vendedor y afiliados
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">
            Configura tu nombre, tu <span className="font-mono font-semibold">@usuario</span>{" "}
            público, tu número de WhatsApp para recibir pedidos y cómo prefieres
            atender las ventas traídas por tus afiliados.
          </p>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-800">
              Nombre visible o tienda
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ej. Carlos Tech Habana"
              className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-800">
              @usuario público (URL de tu tienda)
            </label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm font-bold text-zinc-400">
                @
              </span>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(sanitizeHandleInput(e.target.value))}
                placeholder="carlos-tech"
                className="h-10 w-full rounded-xl border border-zinc-200 pl-7 pr-3 font-mono text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-800">
            WhatsApp para recibir pedidos (con código de país) *
          </label>
          <input
            type="tel"
            value={whatsAppPhone}
            onChange={(e) => setWhatsAppPhone(e.target.value)}
            placeholder="Ej. 5352529615"
            className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-zinc-500">
            Los clientes que compren tus productos abrirán WhatsApp a este
            número (sin espacios ni símbolos, con código de país).
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-800">
            Descripción corta / Bio (opcional)
          </label>
          <textarea
            rows={2}
            maxLength={400}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Ej. Venta de laptops, SSDs y accesorios originales en La Habana con garantía."
            className="mt-1 w-full rounded-xl border border-zinc-200 p-3 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
          />
        </div>

        {/* Enrutamiento WhatsApp para pedidos de afiliados */}
        <div className="space-y-2.5 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
            <MessageCircle className="h-4 w-4 text-emerald-600" />
            ¿A quién le llega el WhatsApp cuando un afiliado vende un producto tuyo?
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer flex-col gap-1 rounded-2xl border p-3 transition ${
                routing === "owner"
                  ? "border-[#6018F8] bg-violet-50/80 ring-1 ring-[#6018F8]/30"
                  : "border-zinc-200 bg-white hover:bg-zinc-50"
              }`}
            >
              <span className="flex items-center justify-between text-xs font-bold text-zinc-950">
                <span className="inline-flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-[#6018F8]" />
                  A mi WhatsApp (Dueño)
                </span>
                <input
                  type="radio"
                  name="affiliateOrderRouting"
                  value="owner"
                  checked={routing === "owner"}
                  onChange={() => setRouting("owner")}
                  className="accent-[#6018F8]"
                />
              </span>
              <span className="text-[11px] leading-relaxed text-zinc-600">
                Atiendes directo al cliente. El pedido indica quién fue el
                afiliado + su comisión, y el afiliado recibe una notificación
                automática.
              </span>
            </label>

            <label
              className={`flex cursor-pointer flex-col gap-1 rounded-2xl border p-3 transition ${
                routing === "affiliate"
                  ? "border-[#6018F8] bg-violet-50/80 ring-1 ring-[#6018F8]/30"
                  : "border-zinc-200 bg-white hover:bg-zinc-50"
              }`}
            >
              <span className="flex items-center justify-between text-xs font-bold text-zinc-950">
                <span className="inline-flex items-center gap-1.5">
                  <Handshake className="h-3.5 w-3.5 text-emerald-600" />
                  Al WhatsApp del afiliado
                </span>
                <input
                  type="radio"
                  name="affiliateOrderRouting"
                  value="affiliate"
                  checked={routing === "affiliate"}
                  onChange={() => setRouting("affiliate")}
                  className="accent-[#6018F8]"
                />
              </span>
              <span className="text-[11px] leading-relaxed text-zinc-600">
                El afiliado atiende al cliente y coordina la entrega contigo.
                Ambos reciben notificación y el pedido queda registrado.
              </span>
            </label>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-3.5">
            <label className="block text-xs font-semibold text-zinc-700">
              Código legacy de administrador (?v=) — opcional
            </label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) =>
                setReferralCode(sanitizeReferralCodeInput(e.target.value))
              }
              placeholder="Ej. deve"
              className="mt-1 h-9 w-full rounded-xl border border-zinc-200 px-3 font-mono text-xs text-zinc-950"
            />
          </div>
        )}

        <div className="pt-1">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#6018F8] px-6 text-xs font-semibold text-white transition hover:bg-[#5010E8] disabled:opacity-50"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Guardar perfil
          </button>
        </div>
      </form>

      <aside className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xs sm:p-6 lg:col-span-5">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
          <Link2 className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-base font-bold text-zinc-950">
            Tus enlaces públicos
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            Comparte tu página para que clientes compren tus artículos o para
            que otros vendedores se afilien a tus productos elegibles.
          </p>
        </div>

        {activeHandle ? (
          <div className="space-y-3">
            {[
              {
                label: "Mi tienda / perfil de vendedor",
                icon: Store,
                url: buildSellerProfileUrl(activeHandle),
                href: `/tienda/vendedor/${encodeURIComponent(activeHandle)}`,
              },
              {
                label: "Mi vitrina de afiliados (?aff=)",
                icon: Handshake,
                url: buildAffiliateShowcaseUrl(activeHandle),
                href: `/tienda/vendedor/${encodeURIComponent(activeHandle)}?tab=afiliados&aff=${encodeURIComponent(activeHandle)}`,
              },
              ...(isSuperAdmin && activeLegacyCode
                ? [
                    {
                      label: "Enlace legacy (?v=)",
                      icon: Link2,
                      url: buildShareReferralUrl(activeLegacyCode, "/tienda"),
                      href: `/tienda?v=${encodeURIComponent(activeLegacyCode)}`,
                    },
                  ]
                : []),
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5"
                >
                  <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                    <Icon className="h-3.5 w-3.5 text-violet-600" />
                    {item.label}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-zinc-900">
                    {item.url}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void copyUrl(item.url, `${item.label} copiado`)
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-semibold text-violet-800 hover:bg-violet-50"
                    >
                      <Copy className="h-3 w-3" />
                      Copiar
                    </button>
                    <Link
                      href={item.href}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Abrir
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-zinc-500">
            Define tu <span className="font-mono font-semibold">@usuario</span>{" "}
            a la izquierda para generar tu página pública de vendedor y enlaces
            de afiliado.
          </p>
        )}
      </aside>
    </div>
  );
}
