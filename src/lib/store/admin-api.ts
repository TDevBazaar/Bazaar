/* ── Administración y panel de vendedor de Deve Tienda contra POWERGY API ── */

import {
  STORE_KEY,
  apiGet,
  apiSend,
  type AffiliateCommissionType,
  type AffiliateOrderRouting,
  type ApiCategory,
  type ApiPage,
  type ApiProduct,
} from "./powergy-api";

export const STORE_QUERY = `store=${encodeURIComponent(STORE_KEY)}`;

export type UserRole = "admin" | "seller";

export interface AdminOrderLine {
  productId: string;
  productName: string;
  productSlug: string;
  categoryName: string;
  quantity: number;
  originalQuantity: number;
  unitPriceUsd: number | null;
  lineTotalUsd: number | null;
  ownerAdminUserId?: string | null;
  ownerDisplayName?: string | null;
  affiliateUserId?: string | null;
  affiliateHandle?: string | null;
  affiliateCommissionType?: AffiliateCommissionType | null;
  affiliateCommissionValue?: number | null;
  affiliateCommissionUsd?: number | null;
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
  ownerAdminUserId?: string | null;
  ownerDisplayName?: string | null;
  affiliateHandle?: string | null;
  whatsAppRouting?: string | null;
  whatsAppRecipientPhone?: string | null;
  whatsAppRecipientName?: string | null;
  totalAffiliateCommissionUsd?: number | null;
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
  ownerAdminUserId?: string | null;
  ownerDisplayName?: string | null;
  affiliateHandle?: string | null;
  whatsAppRouting?: string | null;
  whatsAppRecipientPhone?: string | null;
  whatsAppRecipientName?: string | null;
  totalAffiliateCommissionUsd?: number | null;
}

export interface AdminSellerProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  referralCode: string | null;
  whatsAppPhone: string | null;
  role: UserRole;
  allowedStore: string | null;
  handle: string | null;
  avatarUrl: string | null;
  bio: string | null;
  affiliateOrderRouting: AffiliateOrderRouting;
  warningCount: number;
  suspendedUntil: string | null;
  suspensionReason: string | null;
  isSuspended: boolean;
  supabaseUserId: string;
}

export interface UpdateAdminSellerProfilePayload {
  displayName: string | null;
  referralCode?: string | null;
  handle?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  whatsAppPhone: string | null;
  affiliateOrderRouting?: AffiliateOrderRouting;
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
  totalAffiliateCommissionUsd?: number | null;
  closedAffiliateCommissionUsd?: number | null;
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
  allowAffiliates: boolean;
  affiliateCommissionType: AffiliateCommissionType | null;
  affiliateCommissionValue: number | null;
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
    allowAffiliates: Boolean(product.allow_affiliates),
    affiliateCommissionType: product.allow_affiliates
      ? (product.affiliate_commission_type ?? null)
      : null,
    affiliateCommissionValue: product.allow_affiliates
      ? (product.affiliate_commission_value ?? null)
      : null,
    ...overrides,
  };
}

export interface RenewProductsPayload {
  mode: "all" | "selected";
  productIds?: string[];
}

export interface RenewedProductItem {
  productId: string;
  name: string;
  bumpedAt: string;
  nextRenewableAt: string;
  renewCount: number;
}

export interface SkippedRenewProductItem {
  productId: string;
  name: string;
  reason: string;
  nextRenewableAt: string | null;
}

export interface RenewProductsResult {
  renewed: RenewedProductItem[];
  skipped: SkippedRenewProductItem[];
  totalRenewed: number;
  totalSkipped: number;
}

export interface MyAffiliationItem {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  primaryImage: string;
  categoryName: string;
  effectivePriceUsd: number | null;
  productIsActive: boolean;
  allowAffiliates: boolean;
  commissionType: AffiliateCommissionType | null;
  commissionValue: number | null;
  estimatedCommissionUsd: number | null;
  ownerId: string | null;
  ownerHandle: string | null;
  ownerDisplayName: string;
  ownerWhatsAppPhone: string | null;
  ownerAffiliateOrderRouting: AffiliateOrderRouting;
  createdAt: string;
}

export interface SubscribeAffiliateResult {
  subscribedCount: number;
  alreadySubscribedCount: number;
  skippedCount: number;
  subscribedProductIds: string[];
}

export interface UserNotificationItem {
  id: string;
  store: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResult {
  items: UserNotificationItem[];
  unreadCount: number;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ModerationProductItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  primaryImage: string;
  priceUsd: number | null;
  isActive: boolean;
  allowAffiliates: boolean;
  affiliateCommissionType: AffiliateCommissionType | null;
  affiliateCommissionValue: number | null;
  createdAt: string;
  bumpedAt: string;
  moderatedAt: string | null;
  moderationReason: string | null;
  ownerId: string | null;
  ownerHandle: string | null;
  ownerDisplayName: string;
  ownerEmail: string | null;
  ownerRole: string | null;
  ownerWarningCount: number;
  ownerIsActive: boolean;
  ownerSuspendedUntil: string | null;
}

export interface ModerationSellerItem {
  id: string;
  email: string | null;
  displayName: string;
  handle: string | null;
  avatarUrl: string | null;
  whatsAppPhone: string | null;
  role: string;
  allowedStore: string | null;
  isActive: boolean;
  warningCount: number;
  suspendedUntil: string | null;
  suspensionReason: string | null;
  isSuspended: boolean;
  activeProductCount: number;
  hiddenProductCount: number;
  createdAt: string;
}

export type SellerModerationAction =
  | "notify"
  | "warn"
  | "suspend"
  | "ban"
  | "unsuspend";

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
  | "recientes"
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
  allowAffiliates?: boolean;
  sort?: AdminProductSort;
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

export interface AdminOrdersQuery {
  status?: string;
  q?: string;
  referral?: string;
  scope?: "all" | "owner" | "affiliate";
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
  scope?: "all" | "owner" | "affiliate";
  signal?: AbortSignal;
}

export function registerCurrentSeller(
  token: string,
  payload?: { displayName?: string | null; avatarUrl?: string | null }
): Promise<AdminSellerProfile> {
  return apiSend<AdminSellerProfile>("sellers/me/register", {
    method: "POST",
    body: {
      store: STORE_KEY,
      displayName: payload?.displayName ?? undefined,
      avatarUrl: payload?.avatarUrl ?? undefined,
    },
    token,
  });
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
  if (query.allowAffiliates !== undefined) {
    params.set("allowAffiliates", String(query.allowAffiliates));
  }
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

export function renewProducts(
  token: string,
  payload: RenewProductsPayload
): Promise<RenewProductsResult> {
  return apiSend<RenewProductsResult>("products/renew", {
    method: "POST",
    body: { store: STORE_KEY, ...payload },
    token,
  });
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
  if (options.scope && options.scope !== "all") {
    params.set("scope", options.scope);
  }
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
  if (options.scope && options.scope !== "all") {
    params.set("scope", options.scope);
  }

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

/* ── Afiliaciones ─────────────────────────────────────────────── */

export function subscribeAffiliates(
  token: string,
  payload: { sellerHandle?: string; productIds?: string[] }
): Promise<SubscribeAffiliateResult> {
  return apiSend<SubscribeAffiliateResult>("affiliates/subscribe", {
    method: "POST",
    body: { store: STORE_KEY, ...payload },
    token,
  });
}

export function unsubscribeAffiliate(
  token: string,
  productId: string
): Promise<void> {
  return apiSend<void>(
    `affiliates/${encodeURIComponent(productId)}?${STORE_QUERY}`,
    {
      method: "DELETE",
      token,
    }
  );
}

export function fetchMyAffiliations(
  token: string,
  signal?: AbortSignal
): Promise<MyAffiliationItem[]> {
  return apiGet<MyAffiliationItem[]>(
    `affiliates/mine?${STORE_QUERY}`,
    token,
    signal
  );
}

export function fetchMyAffiliatedProductIds(
  token: string,
  signal?: AbortSignal
): Promise<string[]> {
  return apiGet<string[]>(
    `affiliates/my-ids?${STORE_QUERY}`,
    token,
    signal
  );
}

/* ── Notificaciones ───────────────────────────────────────────── */

export function fetchNotifications(
  token: string,
  options: { unreadOnly?: boolean; page?: number; pageSize?: number; signal?: AbortSignal } = {}
): Promise<NotificationListResult> {
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    pageSize: String(options.pageSize ?? 30),
  });
  if (options.unreadOnly) params.set("unreadOnly", "true");
  return apiGet<NotificationListResult>(
    `notifications?${params.toString()}`,
    token,
    options.signal
  );
}

export function fetchUnreadNotificationCount(
  token: string,
  signal?: AbortSignal
): Promise<{ unreadCount: number }> {
  return apiGet<{ unreadCount: number }>(
    "notifications/unread-count",
    token,
    signal
  );
}

export function markNotificationRead(token: string, id: string): Promise<void> {
  return apiSend<void>(`notifications/${encodeURIComponent(id)}/read`, {
    method: "POST",
    token,
  });
}

export function markAllNotificationsRead(token: string): Promise<void> {
  return apiSend<void>("notifications/read-all", {
    method: "POST",
    token,
  });
}

/* ── Moderación (solo superadmin) ─────────────────────────────── */

export function fetchModerationRecentProducts(
  token: string,
  options: {
    onlySellers?: boolean;
    isActive?: boolean;
    q?: string;
    page?: number;
    pageSize?: number;
    signal?: AbortSignal;
  } = {}
): Promise<ApiPage<ModerationProductItem>> {
  const params = new URLSearchParams({
    store: STORE_KEY,
    onlySellers: String(options.onlySellers ?? true),
    page: String(options.page ?? 1),
    pageSize: String(options.pageSize ?? 25),
  });
  if (options.isActive !== undefined) {
    params.set("isActive", String(options.isActive));
  }
  if (options.q?.trim()) params.set("q", options.q.trim());

  return apiGet<ApiPage<ModerationProductItem>>(
    `admin/moderation/recent-products?${params.toString()}`,
    token,
    options.signal
  );
}

export function hideProductModeration(
  token: string,
  productId: string,
  payload: { reason: string; warnSeller?: boolean }
): Promise<void> {
  return apiSend<void>(
    `admin/moderation/products/${encodeURIComponent(productId)}/hide`,
    {
      method: "POST",
      body: { store: STORE_KEY, ...payload },
      token,
    }
  );
}

export function restoreProductModeration(
  token: string,
  productId: string
): Promise<void> {
  return apiSend<void>(
    `admin/moderation/products/${encodeURIComponent(productId)}/restore?${STORE_QUERY}`,
    {
      method: "POST",
      token,
    }
  );
}

export function fetchModerationSellers(
  token: string,
  options: {
    q?: string;
    status?: "all" | "active" | "suspended" | "banned";
    page?: number;
    pageSize?: number;
    signal?: AbortSignal;
  } = {}
): Promise<ApiPage<ModerationSellerItem>> {
  const params = new URLSearchParams({
    store: STORE_KEY,
    page: String(options.page ?? 1),
    pageSize: String(options.pageSize ?? 25),
  });
  if (options.q?.trim()) params.set("q", options.q.trim());
  if (options.status && options.status !== "all") {
    params.set("status", options.status);
  }
  return apiGet<ApiPage<ModerationSellerItem>>(
    `admin/moderation/sellers?${params.toString()}`,
    token,
    options.signal
  );
}

export function applySellerModerationAction(
  token: string,
  sellerId: string,
  payload: {
    action: SellerModerationAction;
    title?: string;
    reason: string;
    durationHours?: number;
    hideActiveProducts?: boolean;
  }
): Promise<ModerationSellerItem> {
  return apiSend<ModerationSellerItem>(
    `admin/moderation/sellers/${encodeURIComponent(sellerId)}/action`,
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
