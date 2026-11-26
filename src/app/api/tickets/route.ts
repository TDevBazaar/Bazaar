import { NextResponse } from "next/server";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const incoming = await request.formData();

    const titulo = String(incoming.get("Titulo") ?? "").trim();
    const descripcion = String(incoming.get("Descripcion") ?? "").trim();
    const email = String(incoming.get("Usuario.Email") ?? "").trim();
    const telefono = String(incoming.get("Usuario.Telefono") ?? "").trim();

    if (titulo.length < 5 || titulo.length > 100) {
      return NextResponse.json(
        { error: "El título debe tener entre 5 y 100 caracteres." },
        { status: 400 }
      );
    }

    if (descripcion.length < 10 || descripcion.length > 1500) {
      return NextResponse.json(
        { error: "La descripción debe tener entre 10 y 1500 caracteres." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: "El correo electrónico no es válido." },
        { status: 400 }
      );
    }

    if (telefono.length < 6 || telefono.length > 25) {
      return NextResponse.json(
        { error: "El número de teléfono no es válido." },
        { status: 400 }
      );
    }

    const files = incoming
      .getAll("Imagen")
      .filter((item): item is File => item instanceof File && item.size > 0);

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Puedes adjuntar un máximo de ${MAX_FILES} imágenes.` },
        { status: 400 }
      );
    }

    const outbound = new FormData();
    outbound.append("Titulo", titulo);
    outbound.append("Descripcion", descripcion);
    outbound.append("Usuario.Email", email);
    outbound.append("Usuario.Telefono", telefono);

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: "Solo se permiten imágenes JPG, PNG o WebP." },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `El archivo ${file.name} supera el límite de 5 MB.` },
          { status: 400 }
        );
      }
      outbound.append("Imagen", file, file.name);
    }

    const baseUrl = (
      process.env.TICKET_API_URL || "https://fixtic.somee.com"
    ).replace(/\/$/, "");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const upstream = await fetch(`${baseUrl}/api/Ticket`, {
      method: "POST",
      body: outbound,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error:
            "El servidor de tickets devolvió un error temporal. Por favor, contáctanos por WhatsApp para atención inmediata.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        error:
          "No se pudo conectar con el servidor de tickets. Puedes enviarnos tu consulta directamente por WhatsApp.",
      },
      { status: 502 }
    );
  }
}
