import {
  STORE_KEY,
  getPowergyApiServerBase,
  type ApiProduct,
} from "@/lib/store/powergy-api";
import {
  decodeOrderPreviewToken,
  type OrderPreviewData,
  type OrderPreviewItemInput,
  type OrderPreviewLine,
} from "@/lib/store/order-preview";

const MAX_OG_IMAGE_BYTES = 5 * 1024 * 1024;

function firstHeaderValue(raw: string | null): string {
  return raw?.split(",")[0]?.trim() ?? "";
}

export function getRequestOrigin(hdrs: Headers): string {
  const host =
    firstHeaderValue(hdrs.get("x-forwarded-host")) ||
    firstHeaderValue(hdrs.get("host")) ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "";

  if (!host) return "";

  const cleanHost = host.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const forwardedProto = firstHeaderValue(hdrs.get("x-forwarded-proto"));
  const isLocal =
    cleanHost.startsWith("localhost") ||
    cleanHost.startsWith("127.0.0.1") ||
    cleanHost.startsWith("[::1]");
  const proto = forwardedProto || (isLocal ? "http" : "https");

  return `${proto}://${cleanHost}`;
}

function entryHasSnapshot(entry: OrderPreviewItemInput): boolean {
  return Boolean(entry.name?.trim());
}

export async function fetchPreviewOrderData(
  reference: string,
  rawToken?: string | null,
  options: { preferSnapshot?: boolean } = {}
): Promise<OrderPreviewData> {
  const cleanRef = reference.trim() || "Pedido";
  const entries = decodeOrderPreviewToken(rawToken);
  if (entries.length === 0) {
    return {
      reference: cleanRef,
      lines: [],
      totalQty: 0,
      subtotal: 0,
      hasUnpriced: false,
    };
  }

  const allHaveSnapshot = entries.every(entryHasSnapshot);
  const productMap = new Map<string, ApiProduct>();

  if (!(options.preferSnapshot && allHaveSnapshot)) {
    const apiBase = getPowergyApiServerBase();
    const ids = entries.map((e) => e.productId);
    const attemptTimeoutMs = allHaveSnapshot ? 1600 : 4000;
    const maxAttempts = allHaveSnapshot ? 1 : 2;

    try {
      for (let i = 0; i < ids.length; i += 50) {
        const chunk = ids.slice(i, i + 50);
        const params = new URLSearchParams({
          store: STORE_KEY,
          ids: chunk.join(","),
        });
        const url = `${apiBase}/api/products/batch?${params.toString()}`;
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          try {
            const res = await fetch(url, {
              headers: { Accept: "application/json", Connection: "close" },
              next: { revalidate: 120 },
              signal: AbortSignal.timeout(attemptTimeoutMs),
            });
            if (!res.ok) continue;
            const items = (await res.json()) as ApiProduct[];
            for (const item of items) {
              if (item?.id) productMap.set(item.id, item);
            }
            break;
          } catch {
            /* Respaldo con snapshot */
          }
        }
      }
    } catch {
      /* Respaldo seguro */
    }
  }

  const lines: OrderPreviewLine[] = entries.map((entry) => {
    const product = productMap.get(entry.productId);
    const hasSnapshot = entryHasSnapshot(entry);

    if (product) {
      const unitPrice =
        typeof product.price_usd === "number" && product.price_usd > 0
          ? product.price_usd
          : 0;
      return {
        productId: product.id,
        slug: product.slug || product.id,
        name: product.name?.trim() || entry.name || `Artículo ${product.id}`,
        categoryName: product.category?.trim() || entry.categoryName || "Deve",
        brand: product.brand?.trim() || "",
        model: product.model?.trim() || "",
        image: product.primary_image?.trim() || entry.image || "",
        qty: entry.qty,
        unitPrice,
        lineTotal: unitPrice * entry.qty,
        available: true,
        hasSnapshot,
      };
    }

    if (hasSnapshot) {
      const unitPrice =
        typeof entry.price === "number" && entry.price > 0 ? entry.price : 0;
      return {
        productId: entry.productId,
        slug: entry.slug || entry.productId,
        name: entry.name?.trim() || `Artículo ${entry.productId}`,
        categoryName: entry.categoryName?.trim() || "Deve",
        brand: "",
        model: "",
        image: entry.image?.trim() || "",
        qty: entry.qty,
        unitPrice,
        lineTotal: unitPrice * entry.qty,
        available: true,
        hasSnapshot: true,
      };
    }

    return {
      productId: entry.productId,
      slug: entry.productId,
      name: `Artículo ${entry.productId}`,
      categoryName: "Catálogo",
      brand: "",
      model: "",
      image: "",
      qty: entry.qty,
      unitPrice: 0,
      lineTotal: 0,
      available: false,
      hasSnapshot: false,
    };
  });

  const totalQty = lines.reduce((sum, l) => sum + l.qty, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const hasUnpriced = lines.some((l) => l.unitPrice <= 0);

  return {
    reference: cleanRef,
    lines,
    totalQty,
    subtotal,
    hasUnpriced,
  };
}

function detectSupportedOgImageMime(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return "image/gif";
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

function isAllowedRemoteImageUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "::1" ||
      host === "[::1]" ||
      host.startsWith("127.") ||
      host.startsWith("169.254.") ||
      host === "0.0.0.0"
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function fetchSafeOgDataUri(
  rawUrl?: string | null
): Promise<string | null> {
  const clean = rawUrl?.trim();
  if (!clean || !isAllowedRemoteImageUrl(clean)) return null;

  try {
    const response = await fetch(clean, {
      headers: {
        Accept: "image/jpeg,image/png,image/webp,image/gif,*/*;q=0.5",
      },
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;

    const declaredLen = Number(response.headers.get("content-length") || "0");
    if (declaredLen > MAX_OG_IMAGE_BYTES) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_OG_IMAGE_BYTES) return null;

    const mime = detectSupportedOgImageMime(buffer);
    if (!mime) return null;

    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}
