import type { Metadata } from "next";
import { CheckoutClient } from "@/components/store/CheckoutClient";

export const metadata: Metadata = {
  title: "Confirmar Pedido | Tienda",
  description: "Confirma tu pedido de Deve Tienda y continúa por WhatsApp.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
