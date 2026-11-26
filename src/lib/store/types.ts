import type { CategoryView, ProductView } from "./powergy-api";

export type Category = CategoryView;
export type Product = ProductView;

export interface CartItem {
  productId: string;
  qty: number;
}

export interface CartLine extends CartItem {
  product: Product;
  lineTotal: number;
}

export type SortId =
  | "recientes"
  | "destacados"
  | "precio-asc"
  | "precio-desc"
  | "nuevos";

export interface FilterState {
  q: string;
  cats: string[];
  maxPrice: number;
  sort: SortId;
  onlyOffers: boolean;
  onlyAffiliates?: boolean;
}

export interface OrderSummary {
  id: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  status: "requested" | "closed" | "cancelled";
  createdAt: string;
  sellerName?: string | null;
  whatsappUrl?: string;
  whatsappRouting?: string | null;
  whatsappRecipientName?: string | null;
  affiliateHandle?: string | null;
  totalAffiliateCommissionUsd?: number | null;
}
