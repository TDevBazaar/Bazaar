"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AdminModal({
  open,
  onClose,
  title,
  description,
  maxWidthClass = "max-w-2xl",
  children,
  footer,
}: AdminModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-3 backdrop-blur-xs sm:p-5"
      onClick={onClose}
    >
      <div
        className={`flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl ${maxWidthClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200/80 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-zinc-950">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-600">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-200/80 bg-zinc-50/70 px-5 py-3.5 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
