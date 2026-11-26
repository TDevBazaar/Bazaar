import { MessageCircle } from "lucide-react";
import { getWhatsAppUrl } from "@/data/site";

export function WhatsAppFloat() {
  return (
    <a
      href={getWhatsAppUrl(
        "Hola Deve, necesito información sobre sus servicios."
      )}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar a Deve por WhatsApp"
      className="group fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
