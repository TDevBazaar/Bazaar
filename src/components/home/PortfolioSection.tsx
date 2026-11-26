import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ExternalLink, MessageCircle } from "lucide-react";
import { portfolioProjects } from "@/data/portfolio";
import { getWhatsAppUrl } from "@/data/site";

export function PortfolioSection() {
  return (
    <section
      id="proyectos"
      className="border-t border-zinc-200/60 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
              Catálogo de Proyectos
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-zinc-950 sm:text-4xl">
              Aplicaciones y plataformas creadas por Deve
            </h2>
          </div>
          <Link
            href="/servicios?categoria=desarrollo"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 transition hover:text-violet-900"
          >
            Ver servicios de Desarrollo
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Compact, scalable 3-column grid (ready to add many projects!) */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {portfolioProjects.map((project) => (
            <article
              key={project.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-900/10"
            >
              {/* Pure clean image — no macOS/Apple window bar */}
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir ${project.title}`}
                className="relative block aspect-[16/10] w-full overflow-hidden border-b border-zinc-100 bg-zinc-50"
              >
                <Image
                  src={project.image}
                  alt={`Captura de ${project.title}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
              </a>

              {/* Compact card body */}
              <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-bold text-violet-800">
                      {project.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      En vivo
                    </span>
                  </div>

                  <h3 className="mt-2.5 font-display text-lg font-bold text-zinc-950">
                    {project.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-600 sm:text-sm">
                    {project.summary}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.stack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3.5">
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#6018F8] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#5010E8]"
                  >
                    Ver app
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <a
                    href={getWhatsAppUrl(project.whatsappText)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
                  >
                    <MessageCircle className="h-3 w-3" />
                    Consultar
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
