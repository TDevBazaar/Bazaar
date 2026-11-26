import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminDashboard } from "@/components/store/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin | Tienda",
  description: "Panel de administración de la tienda de Deve.",
  robots: { index: false, follow: false },
};

export default function TiendaAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-zinc-500">
          Cargando panel…
        </div>
      }
    >
      <AdminDashboard />
    </Suspense>
  );
}
