import {
  ApiError,
  STORE_KEY,
  apiGet,
  type ApiPublicSellerProfile,
} from "./powergy-api";
import { normalizeWhatsAppPhone } from "./whatsapp";

/* ── Atribución de afiliados (?aff=handle) y enlace legacy (?v=codigo) ──
   Recuerda el enlace visitado en localStorage durante 7 días (último toque)
   y permite validar la atribución por producto al llegar al checkout. */

export const REFERRAL_STORAGE_KEY = "deve-store-seller-ref";
export const AFFILIATE_QUERY_PARAM = "aff";
export const REFERRAL_QUERY_PARAM = "v";
export const REFERRAL_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REVALIDATE_INTERVAL_MS = 5 * 60 * 1000;
const FRESH_CHECKOUT_WINDOW_MS = 60 * 1000;

export interface PublicSellerResponse {
  referralCode: string;
  displayName: string;
  whatsAppPhone: string;
}

export interface StoredReferral {
  kind: "affiliate" | "legacy";
  /** Handle del afiliado (?aff=) o código legacy (?v=) */
  code: string;
  displayName?: string;
  whatsAppPhone?: string;
  capturedAt: number;
  expiresAt: number;
  resolvedAt?: number;
}

const VALID_CODE_RE = /^[a-z0-9][a-z0-9_-]{1,39}$/;
const VALID_HANDLE_RE = /^[a-z0-9](?:[a-z0-9_-]{1,48})[a-z0-9]$/;

export function normalizeReferralCode(raw?: string | null): string | null {
  const clean = raw?.trim().toLowerCase() ?? "";
  return VALID_CODE_RE.test(clean) ? clean : null;
}

export function normalizeHandle(raw?: string | null): string | null {
  const clean = raw?.trim().replace(/^@+/, "").toLowerCase() ?? "";
  if (!clean || clean.includes("--")) return null;
  return VALID_HANDLE_RE.test(clean) ? clean : null;
}

export function sanitizeReferralCodeInput(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/^[-_]+/, "")
    .slice(0, 40);
}

export function sanitizeHandleInput(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^[-_]+/, "")
    .slice(0, 50);
}

function getOrigin(originOverride?: string): string {
  return (
    originOverride ??
    (typeof window !== "undefined" ? window.location.origin : "")
  );
}

export function buildShareReferralUrl(
  code: string,
  path = "/tienda",
  originOverride?: string
): string {
  const clean = normalizeReferralCode(code) ?? sanitizeReferralCodeInput(code);
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${getOrigin(originOverride)}${cleanPath}?${REFERRAL_QUERY_PARAM}=${encodeURIComponent(clean)}`;
}

export function buildSellerProfileUrl(
  handle: string,
  originOverride?: string
): string {
  const clean = normalizeHandle(handle) ?? sanitizeHandleInput(handle);
  return `${getOrigin(originOverride)}/tienda/vendedor/${encodeURIComponent(clean)}`;
}

export function buildAffiliateProductUrl(
  handle: string,
  productSlug: string,
  originOverride?: string
): string {
  const clean = normalizeHandle(handle) ?? sanitizeHandleInput(handle);
  return `${getOrigin(originOverride)}/tienda/${encodeURIComponent(productSlug)}?${AFFILIATE_QUERY_PARAM}=${encodeURIComponent(clean)}`;
}

export function buildAffiliateShowcaseUrl(
  handle: string,
  originOverride?: string
): string {
  const clean = normalizeHandle(handle) ?? sanitizeHandleInput(handle);
  return `${getOrigin(originOverride)}/tienda/vendedor/${encodeURIComponent(clean)}?tab=afiliados&${AFFILIATE_QUERY_PARAM}=${encodeURIComponent(clean)}`;
}

export function readStoredReferral(): StoredReferral | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredReferral> | null;
    const kind: "affiliate" | "legacy" =
      parsed?.kind === "affiliate" ? "affiliate" : "legacy";
    const code =
      kind === "affiliate"
        ? normalizeHandle(parsed?.code)
        : normalizeReferralCode(parsed?.code);
    if (
      !code ||
      typeof parsed?.expiresAt !== "number" ||
      !Number.isFinite(parsed.expiresAt)
    ) {
      window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
      return null;
    }

    if (Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
      return null;
    }

    const capturedAt =
      typeof parsed.capturedAt === "number" && Number.isFinite(parsed.capturedAt)
        ? parsed.capturedAt
        : Date.now();
    const resolvedAt =
      typeof parsed.resolvedAt === "number" && Number.isFinite(parsed.resolvedAt)
        ? parsed.resolvedAt
        : undefined;
    const displayName =
      typeof parsed.displayName === "string" && parsed.displayName.trim()
        ? parsed.displayName.trim()
        : undefined;
    const whatsAppPhone =
      normalizeWhatsAppPhone(parsed.whatsAppPhone) ?? undefined;

    return {
      kind,
      code,
      displayName,
      whatsAppPhone,
      capturedAt,
      expiresAt: parsed.expiresAt,
      resolvedAt,
    };
  } catch {
    return null;
  }
}

function writeStoredReferral(entry: StoredReferral | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!entry) {
      window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
    } else {
      window.localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(entry));
    }
  } catch {
    /* Almacenamiento restringido */
  }
}

const inFlightLookups = new Map<string, Promise<StoredReferral | null>>();

export function resolveReferralIdentity(
  kind: "affiliate" | "legacy",
  code: string
): Promise<StoredReferral | null> {
  const cleanCode =
    kind === "affiliate" ? normalizeHandle(code) : normalizeReferralCode(code);
  if (!cleanCode || typeof window === "undefined") {
    return Promise.resolve(null);
  }

  const cacheKey = `${kind}:${cleanCode}`;
  const pending = inFlightLookups.get(cacheKey);
  if (pending) return pending;

  const task = (async (): Promise<StoredReferral | null> => {
    try {
      let displayName: string;
      let phone: string | undefined;

      if (kind === "affiliate") {
        const profile = await apiGet<ApiPublicSellerProfile>(
          `sellers/public/${encodeURIComponent(cleanCode)}?store=${encodeURIComponent(STORE_KEY)}`
        );
        displayName = profile.displayName?.trim() || `@${cleanCode}`;
        phone = normalizeWhatsAppPhone(profile.whatsAppPhone) ?? undefined;
      } else {
        const seller = await apiGet<PublicSellerResponse>(
          `sellers/${encodeURIComponent(cleanCode)}`
        );
        displayName = seller.displayName?.trim() || cleanCode;
        phone = normalizeWhatsAppPhone(seller.whatsAppPhone) ?? undefined;
        if (!phone) {
          const latest = readStoredReferral();
          if (latest?.kind === "legacy" && latest.code === cleanCode) {
            writeStoredReferral(null);
          }
          return null;
        }
      }

      const latest = readStoredReferral();
      if (latest && (latest.kind !== kind || latest.code !== cleanCode)) {
        return latest;
      }

      const now = Date.now();
      const updated: StoredReferral = {
        kind,
        code: cleanCode,
        displayName,
        whatsAppPhone: phone,
        capturedAt:
          latest?.kind === kind && latest.code === cleanCode
            ? latest.capturedAt
            : now,
        expiresAt:
          latest?.kind === kind && latest.code === cleanCode
            ? latest.expiresAt
            : now + REFERRAL_TTL_MS,
        resolvedAt: now,
      };
      writeStoredReferral(updated);
      return updated;
    } catch (error) {
      const latest = readStoredReferral();
      if (error instanceof ApiError && error.status === 404) {
        if (latest?.kind === kind && latest.code === cleanCode) {
          writeStoredReferral(null);
        }
        return null;
      }
      return latest?.kind === kind && latest.code === cleanCode ? latest : null;
    } finally {
      inFlightLookups.delete(cacheKey);
    }
  })();

  inFlightLookups.set(cacheKey, task);
  return task;
}

export function captureReferralFromUrl(): StoredReferral | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const fromAff = normalizeHandle(params.get(AFFILIATE_QUERY_PARAM));
  const fromLegacy = normalizeReferralCode(params.get(REFERRAL_QUERY_PARAM));
  const existing = readStoredReferral();

  if (fromAff) {
    const now = Date.now();
    const isSame = existing?.kind === "affiliate" && existing.code === fromAff;
    const entry: StoredReferral = {
      kind: "affiliate",
      code: fromAff,
      displayName: isSame ? existing.displayName : undefined,
      whatsAppPhone: isSame ? existing.whatsAppPhone : undefined,
      capturedAt: now,
      expiresAt: now + REFERRAL_TTL_MS,
      resolvedAt: isSame ? existing.resolvedAt : undefined,
    };
    writeStoredReferral(entry);
    void resolveReferralIdentity("affiliate", fromAff);
    return entry;
  }

  if (fromLegacy) {
    const now = Date.now();
    const isSame = existing?.kind === "legacy" && existing.code === fromLegacy;
    const entry: StoredReferral = {
      kind: "legacy",
      code: fromLegacy,
      displayName: isSame ? existing.displayName : undefined,
      whatsAppPhone: isSame ? existing.whatsAppPhone : undefined,
      capturedAt: now,
      expiresAt: now + REFERRAL_TTL_MS,
      resolvedAt: isSame ? existing.resolvedAt : undefined,
    };
    writeStoredReferral(entry);
    void resolveReferralIdentity("legacy", fromLegacy);
    return entry;
  }

  if (existing) {
    const isStale =
      !existing.resolvedAt ||
      Date.now() - existing.resolvedAt > REVALIDATE_INTERVAL_MS;
    if (isStale) {
      void resolveReferralIdentity(existing.kind, existing.code);
    }
    return existing;
  }

  return null;
}

export async function resolveActiveReferralForCheckout(
  timeoutMs = 1500
): Promise<StoredReferral | null> {
  if (typeof window === "undefined") return null;

  captureReferralFromUrl();
  const stored = readStoredReferral();
  if (!stored) return null;

  if (
    stored.resolvedAt &&
    Date.now() - stored.resolvedAt < FRESH_CHECKOUT_WINDOW_MS
  ) {
    return stored;
  }

  return Promise.race([
    resolveReferralIdentity(stored.kind, stored.code),
    new Promise<StoredReferral | null>((resolve) =>
      window.setTimeout(() => resolve(readStoredReferral()), timeoutMs)
    ),
  ]);
}
