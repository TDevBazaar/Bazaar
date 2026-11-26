import type { Metadata } from "next";
import { FavoritesClient } from "@/components/store/FavoritesClient";

export const metadata: Metadata = {
  title: "Favoritos | Tienda",
  description: "Productos guardados en tu lista de favoritos de Deve Tienda.",
  robots: { index: false, follow: false },
};

export default function FavoritosPage() {
  return <FavoritesClient />;
}
