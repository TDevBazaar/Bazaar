"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  totalItems?: number | null;
  pageSize?: number;
  onPageChange: (nextPage: number) => void;
  disabled?: boolean;
}

export function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  disabled = false,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "ellipsis")[] = [];
  for (let p = 1; p <= totalPages; p += 1) {
    if (
      p === 1 ||
      p === totalPages ||
      (p >= page - 1 && p <= page + 1)
    ) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "ellipsis") {
      pages.push("ellipsis");
    }
  }

  const start =
    typeof totalItems === "number" && pageSize
      ? (page - 1) * pageSize + 1
      : null;
  const end =
    typeof totalItems === "number" && pageSize
      ? Math.min(totalItems, page * pageSize)
      : null;

  return (
    <nav
      aria-label="Paginación"
      className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-zinc-200/80 pt-5 sm:flex-row"
    >
      {start !== null && end !== null && typeof totalItems === "number" ? (
        <p className="text-xs font-medium text-zinc-600 tabular-nums">
          Mostrando {start}–{end} de {totalItems}
        </p>
      ) : (
        <p className="text-xs font-medium text-zinc-600 tabular-nums">
          Página {page} de {totalPages}
        </p>
      )}

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={disabled || page <= 1}
          aria-label="Página anterior"
          className="inline-flex h-9 items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Anterior
        </button>

        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((entry, idx) =>
            entry === "ellipsis" ? (
              <span
                key={`el-${idx}`}
                className="px-1.5 text-xs text-zinc-400"
              >
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                onClick={() => onPageChange(entry)}
                disabled={disabled}
                aria-current={entry === page ? "page" : undefined}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2.5 text-xs font-semibold tabular-nums transition ${
                  entry === page
                    ? "bg-[#6018F8] text-white shadow-xs shadow-violet-600/25"
                    : "border border-zinc-200 bg-white text-zinc-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
                }`}
              >
                {entry}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={disabled || page >= totalPages}
          aria-label="Página siguiente"
          className="inline-flex h-9 items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </nav>
  );
}
