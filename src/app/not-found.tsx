import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-700">
        <Compass className="h-8 w-8" />
      </div>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
        Error 404
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-zinc-950 sm:text-5xl">
        Página no encontrada
      </h1>
      <p className="mt-4 max-w-md text-sm text-zinc-600">
        La ruta que buscas no existe o fue movida. Puedes volver al inicio o
        explorar nuestro catálogo de servicios.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Ir al inicio
        </Link>
        <Link
          href="/servicios"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
        >
          Ver servicios
        </Link>
      </div>
    </div>
  );
}
