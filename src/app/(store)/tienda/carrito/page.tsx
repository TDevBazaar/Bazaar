import type { Metadata } from "next";
import { CartClient } from "@/components/store/CartClient";

export const metadata: Metadata = {
  title: "Carrito | Tienda",
  description: "Revisa los artículos de tu carrito en Deve Tienda.",
  robots: { index: false, follow: false },
};

export default function CarritoPage() {
  return <CartClient />;
}
