import type { MetadataRoute } from "next";
import { services } from "@/data/services";
import { siteConfig } from "@/data/site";
import {
  STORE_KEY,
  getPowergyApiServerBase,
  type ApiPage,
  type ApiProduct,
} from "@/lib/store/powergy-api";
import {
  fetchPublicSellersDirectoryServer,
  fetchStoreCategoriesServer,
} from "@/lib/store/powergy-server";

export const revalidate = 3600;

async function fetchActiveProductEntries(): Promise<MetadataRoute.Sitemap> {
  const apiBase = getPowergyApiServerBase();
  const entries: MetadataRoute.Sitemap = [];

  try {
    for (let page = 1; page <= 3; page += 1) {
      const params = new URLSearchParams({
        store: STORE_KEY,
        page: String(page),
        pageSize: "100",
      });
      const res = await fetch(`${apiBase}/api/products?${params.toString()}`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(2500),
      });
      if (!res.ok) break;
      const data = (await res.json()) as ApiPage<ApiProduct>;
      for (const item of data.items) {
        if (!item?.slug) continue;
        entries.push({
          url: `${siteConfig.siteUrl}/tienda/${encodeURIComponent(item.slug)}`,
          lastModified: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
      if (page >= data.totalPages || data.items.length === 0) break;
    }
  } catch {
    /* Respaldo silencioso: nunca romper sitemap.xml si el API no responde */
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteConfig.siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.siteUrl}/servicios`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${siteConfig.siteUrl}/tienda`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${siteConfig.siteUrl}/consulta`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${siteConfig.siteUrl}/privacidad`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteConfig.siteUrl}/terminos`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${siteConfig.siteUrl}/servicios/${service.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  const [categories, productRoutes, sellers] = await Promise.all([
    fetchStoreCategoriesServer(3600),
    fetchActiveProductEntries(),
    fetchPublicSellersDirectoryServer(3600),
  ]);

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${siteConfig.siteUrl}/tienda/categoria/${encodeURIComponent(cat.slug)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.85,
  }));

  const sellerRoutes: MetadataRoute.Sitemap = sellers.map((seller) => ({
    url: `${siteConfig.siteUrl}/tienda/vendedor/${encodeURIComponent(seller.handle)}`,
    lastModified: seller.lastActivityAt ? new Date(seller.lastActivityAt) : now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [
    ...staticRoutes,
    ...serviceRoutes,
    ...categoryRoutes,
    ...sellerRoutes,
    ...productRoutes,
  ];
}
