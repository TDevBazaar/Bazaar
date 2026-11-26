"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { AdminModal } from "@/components/store/admin/AdminModal";
import {
  createCategory,
  deactivateCategory,
  updateCategory,
  type AdminProductVisibility,
} from "@/lib/store/admin-api";
import { slugify, type ApiCategory } from "@/lib/store/powergy-api";

interface CategoriesAdminTabProps {
  token: string;
  categories: ApiCategory[];
  loading: boolean;
  onMutated: () => void;
}

export function CategoriesAdminTab({
  token,
  categories,
  loading,
  onMutated,
}: CategoriesAdminTabProps) {
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<AdminProductVisibility>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    id: null as string | null,
    name: "",
    sortOrder: "0",
  });

  const filtered = useMemo(() => {
    const clean = query.trim().toLowerCase();
    return categories.filter((c) => {
      if (visibility === "visible" && !c.isActive) return false;
      if (visibility === "hidden" && c.isActive) return false;
      if (!clean) return true;
      return (
        c.name.toLowerCase().includes(clean) ||
        c.slug.toLowerCase().includes(clean)
      );
    });
  }, [categories, query, visibility]);

  const openNew = () => {
    setForm({
      id: null,
      name: "",
      sortOrder: String(categories.length + 1),
    });
    setModalOpen(true);
  };

  const openEdit = (cat: ApiCategory) => {
    setForm({
      id: cat.id,
      name: cat.name,
      sortOrder: String(cat.sortOrder),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const slug = slugify(name);
    const sortOrder = Number.parseInt(form.sortOrder, 10);
    if (name.length < 2) {
      toast.error("El nombre de la categoría es muy corto.");
      return;
    }
    if (!slug) {
      toast.error("El nombre debe contener letras o números.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        slug,
        sortOrder: Number.isFinite(sortOrder) ? Math.max(0, sortOrder) : 0,
      };
      if (form.id) {
        await updateCategory(token, form.id, payload);
        toast.success("Categoría actualizada");
      } else {
        await createCategory(token, payload);
        toast.success("Categoría creada");
      }
      setModalOpen(false);
      onMutated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (cat: ApiCategory) => {
    if (togglingId) return;
    setTogglingId(cat.id);
    try {
      if (cat.isActive) {
        await deactivateCategory(token, cat.id);
        toast.info(`Categoría “${cat.name}” desactivada`);
      } else {
        await updateCategory(token, cat.id, {
          name: cat.name,
          slug: cat.slug,
          sortOrder: cat.sortOrder,
        });
        toast.success(`Categoría “${cat.name}” activada`);
      }
      onMutated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrar categorías..."
              className="h-10 w-full rounded-full border border-zinc-200 bg-white pl-10 pr-4 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
            />
          </div>
          <select
            value={visibility}
            onChange={(e) =>
              setVisibility(e.target.value as AdminProductVisibility)
            }
            className="h-10 rounded-full border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700"
          >
            <option value="all">Todas</option>
            <option value="visible">Activas</option>
            <option value="hidden">Ocultas</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#6018F8] px-4 text-xs font-semibold text-white shadow-xs shadow-violet-600/25 transition hover:bg-[#5010E8]"
        >
          <Plus className="h-4 w-4" />
          Nueva categoría
        </button>
      </div>

      {loading && categories.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-sm text-zinc-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-violet-600" />
          Cargando categorías…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/70 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-zinc-800">
            {categories.length === 0
              ? "Todavía no has creado categorías para Deve Tienda."
              : "No hay categorías que coincidan con el filtro."}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Ejemplo: Laptops, Accesorios, Almacenamiento, Componentes, Redes.
          </p>
          <button
            type="button"
            onClick={openNew}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#6018F8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5010E8]"
          >
            <Plus className="h-3.5 w-3.5" />
            Crear categoría
          </button>
        </div>
      ) : (
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {filtered.map((cat) => (
            <li
              key={cat.id}
              className={`flex items-center justify-between gap-3 rounded-2xl border bg-white p-4 ${
                cat.isActive
                  ? "border-zinc-200"
                  : "border-zinc-200/70 bg-zinc-50 opacity-75"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-display text-sm font-bold text-zinc-950">
                    {cat.name}
                  </p>
                  {!cat.isActive && (
                    <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-700">
                      Oculta
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Slug: <span className="font-mono">{cat.slug}</span> · Orden:{" "}
                  {cat.sortOrder}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openEdit(cat)}
                  className="inline-flex h-8 items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
                >
                  <Pencil className="h-3 w-3" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void handleToggle(cat)}
                  disabled={togglingId === cat.id}
                  title={cat.isActive ? "Desactivar categoría" : "Activar categoría"}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
                >
                  {togglingId === cat.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : cat.isActive ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 text-emerald-700" />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AdminModal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        maxWidthClass="max-w-md"
        title={form.id ? "Editar categoría" : "Nueva categoría"}
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={saving}
              className="inline-flex h-10 items-center rounded-full border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#6018F8] px-5 text-xs font-semibold text-white hover:bg-[#5010E8] disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Guardar
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-800">
              Nombre *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej. Accesorios, Laptops, Repuestos..."
              className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
            />
            {form.name.trim() && (
              <p className="mt-1 text-[11px] text-zinc-500">
                URL slug:{" "}
                <span className="font-mono font-semibold">
                  {slugify(form.name)}
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-800">
              Orden de visualización
            </label>
            <input
              type="number"
              min="0"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-950 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
