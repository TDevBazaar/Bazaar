"use client";

import { useState } from "react";
import { Copy, Link2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  updateAdminSellerProfile,
  type AdminSellerProfile,
} from "@/lib/store/admin-api";
import {
  buildShareReferralUrl,
  normalizeReferralCode,
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
  const [referralCode, setReferralCode] = useState(profile?.referralCode ?? "");
  const [whatsAppPhone, setWhatsAppPhone] = useState(
    profile?.whatsAppPhone ?? ""
  );
  const [saving, setSaving] = useState(false);

  if (!available) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
        El perfil de enlaces de referido no está habilitado en el servidor actual.
      </div>
    );
  }

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-zinc-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-violet-600" />
        Cargando perfil de vendedor…
      </div>
    );
  }

  const copyUrl = async (path: string) => {
    const clean = normalizeReferralCode(profile?.referralCode);
    if (!clean) {
      toast.info("Primero guarda un código de enlace y tu número de WhatsApp.");
      return;
    }
    const url = buildShareReferralUrl(clean, path);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado", { description: url });
    } catch {
      toast.info("Copia manualmente:", { description: url });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = displayName.trim() || null;
    const rawCode = referralCode.trim();
    const rawPhone = whatsAppPhone.trim();

    if (rawCode && !rawPhone) {
      toast.error("Ingresa tu número de WhatsApp para activar tu enlace.");
      return;
    }
    if (rawPhone && !rawCode) {
      toast.error("Define un código corto para tu enlace junto con tu WhatsApp.");
      return;
    }

    const validCode = rawCode ? normalizeReferralCode(rawCode) : null;
    if (rawCode && !validCode) {
      toast.error(
        "El código debe tener entre 2 y 40 caracteres (letras, números, - o _)."
      );
      return;
    }
    const validPhone = rawPhone ? normalizeWhatsAppPhone(rawPhone) : null;
    if (rawPhone && !validPhone) {
      toast.error(
        "Ingresa un número de WhatsApp válido con código de país (7 a 15 dígitos)."
      );
      return;
    }

    setSaving(true);
    try {
      const updated = await updateAdminSellerProfile(token, {
        displayName: cleanName,
        referralCode: validCode,
        whatsAppPhone: validPhone,
      });
      onUpdated(updated);
      toast.success("Configuración de vendedor guardada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    setSaving(true);
    try {
      const updated = await updateAdminSellerProfile(token, {
        displayName: displayName.trim() || null,
        referralCode: null,
        whatsAppPhone: null,
      });
      onUpdated(updated);
      toast.info("Enlace personal desactivado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo desactivar.");
    } finally {
      setSaving(false);
    }
  };

  const activeCode = normalizeReferralCode(profile?.referralCode);

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xs sm:p-6 lg:col-span-7"
      >
        <div>
          <h2 className="font-display text-lg font-bold text-zinc-950">
            Tu enlace personal de vendedor
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">
            Cuando compartas tu enlace{" "}
            <span className="font-mono font-semibold">?v=codigo</span>, los
            pedidos confirmados durante los siguientes 7 días llegarán
            directamente a tu WhatsApp y quedarán atribuidos a tu nombre.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-800">
            Nombre visible
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ej. Carlos (Ventas)"
            className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-800">
              Código (?v=)
            </label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) =>
                setReferralCode(sanitizeReferralCodeInput(e.target.value))
              }
              placeholder="Ej. carlos"
              className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 font-mono text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-800">
              WhatsApp (con código de país)
            </label>
            <input
              type="tel"
              value={whatsAppPhone}
              onChange={(e) => setWhatsAppPhone(e.target.value)}
              placeholder="Ej. 5352529615"
              className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#6018F8] px-5 text-xs font-semibold text-white transition hover:bg-[#5010E8] disabled:opacity-50"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Guardar enlace
          </button>

          {activeCode && (
            <button
              type="button"
              onClick={() => void handleDeactivate()}
              disabled={saving}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-4 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Desactivar enlace
            </button>
          )}
        </div>
      </form>

      <aside className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xs sm:p-6 lg:col-span-5">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
          <Link2 className="h-5 w-5" />
        </span>
        <h3 className="mt-3 font-display text-base font-bold text-zinc-950">
          Enlaces listos para compartir
        </h3>

        {activeCode ? (
          <div className="mt-4 space-y-3">
            {[
              { label: "Directo a la tienda", path: "/tienda" },
              { label: "Inicio de Deve (Landing)", path: "/" },
            ].map((item) => {
              const url = buildShareReferralUrl(activeCode, item.path);
              return (
                <div
                  key={item.path}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    {item.label}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-zinc-900">
                    {url}
                  </p>
                  <button
                    type="button"
                    onClick={() => void copyUrl(item.path)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-semibold text-violet-800 hover:bg-violet-50"
                  >
                    <Copy className="h-3 w-3" />
                    Copiar enlace
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            Aún no tienes un código activo. Define tu código y tu número de
            WhatsApp a la izquierda para generar tus enlaces personales.
          </p>
        )}
      </aside>
    </div>
  );
}
