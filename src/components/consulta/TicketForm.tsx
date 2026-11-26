"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Send,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { getWhatsAppUrl } from "@/data/site";

const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface FormState {
  titulo: string;
  descripcion: string;
  email: string;
  telefono: string;
}

const initialState: FormState = {
  titulo: "",
  descripcion: "",
  email: "",
  telefono: "",
};

export function TicketForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [files, setFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormState | "imagenes", string>>
  >({});
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [serverMessage, setServerMessage] = useState("");

  function validate(): boolean {
    const errors: Partial<Record<keyof FormState | "imagenes", string>> = {};

    if (form.titulo.trim().length < 5) {
      errors.titulo = "Escribe un título de al menos 5 caracteres.";
    } else if (form.titulo.trim().length > 100) {
      errors.titulo = "El título no puede superar los 100 caracteres.";
    }

    if (form.descripcion.trim().length < 10) {
      errors.descripcion =
        "Describe el problema o requerimiento (mínimo 10 caracteres).";
    } else if (form.descripcion.trim().length > 1500) {
      errors.descripcion = "La descripción no puede superar los 1500 caracteres.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim()) || form.email.trim().length > 254) {
      errors.email = "Introduce un correo electrónico válido.";
    }

    if (form.telefono.trim().length < 6 || form.telefono.trim().length > 25) {
      errors.telefono = "Introduce un número de teléfono o WhatsApp válido.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    const merged = [...files];
    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setFieldErrors((prev) => ({
          ...prev,
          imagenes: "Solo se permiten imágenes JPG, PNG o WebP.",
        }));
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFieldErrors((prev) => ({
          ...prev,
          imagenes: `El archivo "${file.name}" supera el límite de 5 MB.`,
        }));
        return;
      }
      if (merged.length < MAX_FILES) {
        merged.push(file);
      }
    }

    setFieldErrors((prev) => ({ ...prev, imagenes: undefined }));
    setFiles(merged);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerMessage("");

    if (!validate()) return;

    setStatus("submitting");
    try {
      const formData = new FormData();
      formData.append("Titulo", form.titulo.trim());
      formData.append("Descripcion", form.descripcion.trim());
      formData.append("Usuario.Email", form.email.trim());
      formData.append("Usuario.Telefono", form.telefono.trim());
      for (const file of files) {
        formData.append("Imagen", file, file.name);
      }

      const response = await fetch("/api/tickets", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No pudimos registrar la consulta en este momento. Puedes enviarnos tu mensaje directo por WhatsApp."
        );
      }

      setStatus("success");
      setServerMessage(
        "¡Consulta enviada con éxito! Un especialista de Deve revisará tu caso y te contactará en menos de 24 horas."
      );
      setForm(initialState);
      setFiles([]);
      setFieldErrors({});
    } catch (err) {
      setStatus("error");
      setServerMessage(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado al enviar tu consulta."
      );
    }
  }

  const fallbackWhatsApp = getWhatsAppUrl(
    `Hola Deve, quiero hacer una consulta gratuita.\nTítulo: ${form.titulo || "Consulta técnica"}\nDescripción: ${form.descripcion || "Necesito asesoría"}`
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {status === "success" && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-950">¡Consulta creada!</p>
            <p className="mt-1">{serverMessage}</p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div>
              <p className="font-semibold text-rose-950">
                No se pudo enviar al servidor de tickets
              </p>
              <p className="mt-1">{serverMessage}</p>
              <a
                href={fallbackWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
              >
                <MessageCircle className="h-4 w-4" />
                Enviar estos datos por WhatsApp ahora
              </a>
            </div>
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="titulo"
          className="mb-2 block text-sm font-semibold text-zinc-800"
        >
          Título de la consulta <span className="text-violet-600">*</span>
        </label>
        <input
          id="titulo"
          type="text"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          placeholder="Ej: Mi laptop se apaga por calor / Quiero consultar por una tienda online"
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-600/20"
          required
        />
        {fieldErrors.titulo && (
          <p className="mt-1.5 text-xs font-medium text-rose-600">
            {fieldErrors.titulo}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="descripcion"
          className="mb-2 block text-sm font-semibold text-zinc-800"
        >
          Descripción detallada <span className="text-violet-600">*</span>
        </label>
        <textarea
          id="descripcion"
          rows={5}
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          placeholder="Cuéntanos el modelo del equipo, qué fallo presenta o qué necesitas desarrollar..."
          className="w-full resize-y rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-600/20"
          required
        />
        {fieldErrors.descripcion && (
          <p className="mt-1.5 text-xs font-medium text-rose-600">
            {fieldErrors.descripcion}
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-semibold text-zinc-800"
          >
            Correo electrónico <span className="text-violet-600">*</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="tucorreo@ejemplo.com"
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-600/20"
            required
          />
          {fieldErrors.email && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="telefono"
            className="mb-2 block text-sm font-semibold text-zinc-800"
          >
            Teléfono / WhatsApp <span className="text-violet-600">*</span>
          </label>
          <input
            id="telefono"
            type="tel"
            autoComplete="tel"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            placeholder="+53 5XXX XXXX"
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-600/20"
            required
          />
          {fieldErrors.telefono && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">
              {fieldErrors.telefono}
            </p>
          )}
        </div>
      </div>

      {/* File uploader */}
      <div>
        <label
          htmlFor="imagenes"
          className="mb-2 block text-sm font-semibold text-zinc-800"
        >
          Adjuntar fotos o capturas (opcional)
        </label>
        <label
          htmlFor="imagenes"
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/70 px-6 py-8 text-center transition hover:border-violet-400 hover:bg-violet-50/50"
        >
          <UploadCloud className="h-8 w-8 text-violet-600" />
          <p className="mt-3 text-sm font-semibold text-zinc-800">
            Haz clic para subir imágenes
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            JPG, PNG o WebP · Máx. {MAX_FILES} archivos de 5 MB cada uno
          </p>
          <input
            id="imagenes"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>
        {fieldErrors.imagenes && (
          <p className="mt-1.5 text-xs font-medium text-rose-600">
            {fieldErrors.imagenes}
          </p>
        )}

        {files.length > 0 && (
          <ul className="mt-3 space-y-2">
            {files.map((file, idx) => (
              <li
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-700"
              >
                <span className="truncate">
                  {file.name}{" "}
                  <span className="text-zinc-500">
                    ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  aria-label={`Quitar ${file.name}`}
                  className="rounded-lg p-1 text-zinc-500 transition hover:bg-rose-100 hover:text-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-4 text-sm font-semibold text-white shadow-md shadow-violet-600/25 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando consulta...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Enviar Consulta Gratuita
          </>
        )}
      </button>
    </form>
  );
}
