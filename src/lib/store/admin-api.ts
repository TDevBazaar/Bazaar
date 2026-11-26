/* ── Administración de la tienda Deve contra el API de POWERGY ──── */

import {
  STORE_KEY,
  apiGet,
  apiSend,
  type ApiCategory,
  type ApiPage,
  type ApiProduct,
} from "./powergy-api";

export const STORE_QUERY = `store=${encodeURIComponent(STORE_KEY)}`;

export interface AdminOrderLine {
  productId: string;
  productName: string;
  productSlug: string;
  categoryName: string;
  quantity: number;
  originalQuantity: number;
  unitPriceUsd: number | null;
  lineTotalUsd: number | null;
}

export interface AdminRemovedLine extends AdminOrderLine {
  removedAt: string | null;
}

export interface AdminOrderHistory {
  previousStatus: string | null;
  status: string;
  changedByAdminUserId: string | null;
  changedAt: string;
}

export interface AdminOrderListItem {
  id: string;
  reference: string;
  status: "requested" | "closed" | "cancelled";
  store: string;
  estimatedTotalUsd: number | null;
  originalEstimatedTotalUsd: number | null;
  itemCount: number;
  createdAt: string;
  closedAt: string | null;
  closedByAdminUserId: string | null;
  cancellationReason: string | null;
  hasUnpricedItems: boolean;
  items: AdminOrderLine[];
  referralCode?: string | null;
  referredByAdminName?: string | null;
}

export interface AdminOrder {
  id: string;
  reference: string;
  status: "requested" | "closed" | "cancelled";
  store: string;
  estimatedTotalUsd: number | null;
  originalEstimatedTotalUsd: number | null;
  createdAt: string;
  closedAt: string | null;
  closedByAdminUserId: string | null;
  cancellationReason: string | null;
  cancellationNote: string | null;
  hasUnpricedItems: boolean;
  items: AdminOrderLine[];
  removedItems: AdminRemovedLine[];
  history: AdminOrderHistory[];
  referralCode?: string | null;
  referredByAdminName?: string | null;
}

export interface AdminSellerProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  referralCode: string | null;
  whatsAppPhone: string | null;
}

export interface UpdateAdminSellerProfilePayload {
  displayName: string | null;
  referralCode: string | null;
  whatsAppPhone: string | null;
}

export interface OrderMetrics {
  from: string;
  to: string;
  requests: number;
  closedRequests: number;
  cancelledRequests: number;
  openRequests: number;
  estimatedValueUsd: number | null;
  originalEstimatedValueUsd: number | null;
  closedEstimatedValueUsd: number | null;
  cancelledEstimatedValueUsd: number | null;
  closedWithoutPriceRequests: number;
  closeRate: number | null;
  closedDuringPeriod: number;
}

export interface ProductPayload {
  id?: string;
  slug: string;
  categoryId: string;
  subcategory: string;
  brand: string;
  model: string;
  name: string;
  priceUsd: number | null;
  specifications: string;
  primaryImage: string;
  onSale: boolean;
  discountPercent: number | null;
  warranty: boolean;
  transport: boolean;
  invoice: boolean;
  topRank: number | null;
  isActive: boolean;
}

export function buildProductPayloadFromApi(
  product: ApiProduct,
  overrides: Partial<ProductPayload> = {}
): ProductPayload {
  return {
    id: product.id,
    slug: product.slug,
    categoryId: product.categoryId,
    subcategory: product.subcategory,
    brand: product.brand,
    model: product.model,
    name: product.name,
    priceUsd: product.original_price_usd ?? product.price_usd,
    specifications: product.specifications,
    primaryImage: product.primary_image,
    onSale: product.oferta,
    discountPercent: product.discount_percent ?? null,
    warranty: product.garantia,
    transport: product.transporte,
    invoice: product.factura,
    topRank: product.top_rank,
    isActive: product.isActive,
    ...overrides,
  };
}

export interface CategoryPayload {
  name: string;
  slug: string;
  sortOrder: number;
}

export interface CloseOrderPayload {
  outcome: "closed" | "cancelled";
  items?: {
    productId: string;
    quantity: number;
    unitPriceUsd?: number | null;
  }[];
  cancellationReason?: string | null;
  cancellationNote?: string | null;
}

export type AdminProductVisibility = "all" | "visible" | "hidden";
export type AdminProductSort =
  | "destacados"
  | "precio-asc"
  | "precio-desc"
  | "nuevos";

export interface AdminProductsQuery {
  term?: string;
  category?: string;
  visibility?: AdminProductVisibility;
  hasPrice?: boolean;
  onSale?: boolean;
  featured?: boolean;
  sort?: AdminProductSort;
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

export interface AdminOrdersQuery {
  status?: string;
  q?: string;
  referral?: string;
  hasUnpriced?: boolean;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

export interface OrderMetricsQuery {
  from?: string;
  to?: string;
  signal?: AbortSignal;
}

export function fetchAdminProducts(
  token: string,
  options: string | AdminProductsQuery = {}
): Promise<ApiPage<ApiProduct>> {
  const query = typeof options === "string" ? { term: options } : options;
  const visibility = query.visibility ?? "all";
  const params = new URLSearchParams({
    store: STORE_KEY,
    includeInactive: visibility === "visible" ? "false" : "true",
    page: String(query.page ?? 1),
    pageSize: String(query.pageSize ?? 20),
  });
  if (visibility === "visible") {
    params.set("isActive", "true");
  } else if (visibility === "hidden") {
    params.set("isActive", "false");
  }
  const cleanCategory = query.category?.trim();
  if (cleanCategory) params.set("category", cleanCategory);
  if (query.hasPrice !== undefined) params.set("hasPrice", String(query.hasPrice));
  if (query.onSale !== undefined) params.set("onSale", String(query.onSale));
  if (query.featured !== undefined) params.set("featured", String(query.featured));
  if (query.sort) params.set("sort", query.sort);
  const cleanTerm = query.term?.trim();
  if (cleanTerm) params.set("q", cleanTerm);

  return apiGet<ApiPage<ApiProduct>>(
    `products/admin?${params.toString()}`,
    token,
    query.signal
  );
}

export async function fetchAllAdminProducts(
  token: string,
  signal?: AbortSignal
): Promise<ApiProduct[]> {
  const first = await fetchAdminProducts(token, {
    visibility: "all",
    page: 1,
    pageSize: 100,
    signal,
  });
  if (first.totalPages <= 1) return first.items;

  const allItems = [...first.items];
  for (let page = 2; page <= first.totalPages; page += 1) {
    const res = await fetchAdminProducts(token, {
      visibility: "all",
      page,
      pageSize: 100,
      signal,
    });
    allItems.push(...res.items);
  }
  return allItems;
}

export function fetchAdminCategories(token: string): Promise<ApiCategory[]> {
  return apiGet<ApiCategory[]>(`categories/admin?${STORE_QUERY}`, token);
}

export function fetchAdminOrders(
  token: string,
  options: AdminOrdersQuery = {}
): Promise<ApiPage<AdminOrderListItem>> {
  const params = new URLSearchParams({
    store: STORE_KEY,
    page: String(options.page ?? 1),
    pageSize: String(options.pageSize ?? 20),
  });
  if (options.status?.trim()) params.set("status", options.status.trim());
  if (options.q?.trim()) params.set("q", options.q.trim());
  if (options.referral?.trim()) params.set("referral", options.referral.trim());
  if (options.hasUnpriced !== undefined) {
    params.set("hasUnpriced", String(options.hasUnpriced));
  }
  if (options.from?.trim()) params.set("from", options.from.trim());
  if (options.to?.trim()) params.set("to", options.to.trim());

  return apiGet<ApiPage<AdminOrderListItem>>(
    `admin/orders?${params.toString()}`,
    token,
    options.signal
  );
}

export function fetchOrderMetrics(
  token: string,
  options: OrderMetricsQuery = {}
): Promise<OrderMetrics> {
  const params = new URLSearchParams({ store: STORE_KEY });
  if (options.from?.trim()) params.set("from", options.from.trim());
  if (options.to?.trim()) params.set("to", options.to.trim());

  return apiGet<OrderMetrics>(
    `admin/orders/metrics?${params.toString()}`,
    token,
    options.signal
  );
}

export function fetchOrder(token: string, id: string): Promise<AdminOrder> {
  return apiGet<AdminOrder>(
    `admin/orders/${encodeURIComponent(id)}?${STORE_QUERY}`,
    token
  );
}

export function fetchAdminSellerProfile(
  token: string,
  signal?: AbortSignal
): Promise<AdminSellerProfile> {
  return apiGet<AdminSellerProfile>("admin/profile", token, signal);
}

export function updateAdminSellerProfile(
  token: string,
  payload: UpdateAdminSellerProfilePayload
): Promise<AdminSellerProfile> {
  return apiSend<AdminSellerProfile>("admin/profile", {
    method: "PUT",
    body: payload,
    token,
  });
}

export function createProduct(
  token: string,
  payload: ProductPayload
): Promise<ApiProduct> {
  return apiSend<ApiProduct>("products", { body: payload, token });
}

export function updateProduct(
  token: string,
  id: string,
  payload: ProductPayload
): Promise<ApiProduct> {
  return apiSend<ApiProduct>(`products/${encodeURIComponent(id)}?${STORE_QUERY}`, {
    method: "PUT",
    body: payload,
    token,
  });
}

export function deactivateProduct(token: string, id: string): Promise<void> {
  return apiSend<void>(`products/${encodeURIComponent(id)}?${STORE_QUERY}`, {
    method: "DELETE",
    token,
  });
}

export function createCategory(
  token: string,
  payload: CategoryPayload
): Promise<ApiCategory> {
  return apiSend<ApiCategory>("categories", { body: payload, token });
}

export function updateCategory(
  token: string,
  id: string,
  payload: CategoryPayload
): Promise<ApiCategory> {
  return apiSend<ApiCategory>(
    `categories/${encodeURIComponent(id)}?${STORE_QUERY}`,
    {
      method: "PUT",
      body: payload,
      token,
    }
  );
}

export function deactivateCategory(token: string, id: string): Promise<void> {
  return apiSend<void>(`categories/${encodeURIComponent(id)}?${STORE_QUERY}`, {
    method: "DELETE",
    token,
  });
}

export function closeOrder(
  token: string,
  id: string,
  payload: CloseOrderPayload
): Promise<AdminOrder> {
  return apiSend<AdminOrder>(
    `admin/orders/${encodeURIComponent(id)}/close?${STORE_QUERY}`,
    {
      method: "POST",
      body: payload,
      token,
    }
  );
}

export const CANCELLATION_REASONS: { id: string; label: string }[] = [
  { id: "price", label: "Precio (no le interesó)" },
  { id: "stock", label: "Sin existencias" },
  { id: "no_response", label: "No respondió" },
  { id: "regret", label: "Se arrepintió" },
  { id: "other", label: "Otro motivo" },
];

export const STATUS_LABELS: Record<string, string> = {
  requested: "Solicitada",
  closed: "Vendida",
  cancelled: "Cancelada",
};
