"use client";

import { useState } from "react";
import { Loader2, LogOut, MessageCircle, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { AdminModal } from "@/components/store/admin/AdminModal";
import {
  updateAdminSellerProfile,
  type AdminSellerProfile,
} from "@/lib/store/admin-api";
import { normalizeWhatsAppPhone } from "@/lib/store/whatsapp";

interface CompleteProfileModalProps {
  open: boolean;
  token: string;
  profile: AdminSellerProfile | null;
  defaultName?: string | null;
  contextLabel?: string;
  onCompleted: (profile: AdminSellerProfile) => void;
  onSignOut?: () => void | Promise<void>;
}

/**
 * Popup obligatorio inicial (bloqueante): no se cierra hasta completar
 * el nombre visible y el número de WhatsApp en la cuenta.
 */
export function CompleteProfileModal({
  open,
  token,
  profile,
  defaultName,
  contextLabel = "comprar, publicar productos o afiliarte en Deve Tienda",
  onCompleted,
  onSignOut,
}: CompleteProfileModalProps) {
  const [displayName, setDisplayName] = useState(
    profile?.displayName?.trim() || defaultName?.trim() || ""
  );
  const [whatsAppPhone, setWhatsAppPhone] = useState(
    profile?.whatsAppPhone?.trim() || ""
  );
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!open || !profile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanName = displayName.trim();
    if (cleanName.length < 2) {
      setErrorMsg("Escribe tu nombre completo o nombre de tienda (mínimo 2 caracteres).");
      return;
    }

    const cleanPhone = normalizeWhatsAppPhone(whatsAppPhone.trim());
    if (!cleanPhone) {
      setErrorMsg(
        "Ingresa un número de WhatsApp válido con código de país (7 a 15 dígitos, ej. 5352529615)."
      );
      return;
    }

    setSaving(true);
    try {
      const updated = await updateAdminSellerProfile(token, {
        displayName: cleanName,
        whatsAppPhone: cleanPhone,
        handle: profile.handle,
        bio: profile.bio,
        affiliateOrderRouting: profile.affiliateOrderRouting,
        ...(profile.role === "admin" && profile.referralCode
          ? { referralCode: profile.referralCode }
          : {}),
      });
      toast.success("¡Datos guardados! Ya puedes comprar y vender en Deve Tienda.");
      onCompleted(updated);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "No se pudieron guardar tus datos. Inténtalo de nuevo."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal
      open={open}
      onClose={() => {}}
      closable={false}
      maxWidthClass="max-w-md"
      title={
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#6018F8]" />
          Completa tu perfil para continuar
        </span>
      }
      description={`Necesitamos tu nombre y número de WhatsApp para ${contextLabel}. Solo tendrás que llenarlo esta vez.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="onboarding-display-name"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800"
          >
            <User className="h-3.5 w-3.5 text-violet-600" />
            Nombre completo o nombre de tienda *
          </label>
          <input
            id="onboarding-display-name"
            type="text"
            required
            maxLength={100}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ej. Carlos Pérez"
            className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-[#6018F8] focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="onboarding-whatsapp"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800"
          >
            <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
            Número de WhatsApp (con código de país) *
          </label>
          <input
            id="onboarding-whatsapp"
            type="tel"
            required
            value={whatsAppPhone}
            onChange={(e) => setWhatsAppPhone(e.target.value)}
            placeholder="Ej. 5352529615"
            className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-[#6018F8] focus:outline-none"
          />
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            Se usará automáticamente en tus compras (para que el vendedor y el
            afiliado puedan contactarte) y en tus ventas como contacto oficial.
          </p>
        </div>

        {errorMsg && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
            {errorMsg}
          </p>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#6018F8] px-5 text-xs font-bold text-white shadow-sm shadow-violet-600/25 transition hover:bg-[#5010E8] disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar y continuar
          </button>

          {onSignOut && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void onSignOut()}
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full text-xs font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar sesión / cambiar de cuenta
            </button>
          )}
        </div>
      </form>
    </AdminModal>
  );
}
