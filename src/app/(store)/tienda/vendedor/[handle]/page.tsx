import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Store } from "lucide-react";
import { SellerProfileClient } from "@/components/store/SellerProfileClient";
import { siteConfig } from "@/data/site";
import { buildBreadcrumbJsonLd, buildStoreCollectionJsonLd } from "@/lib/seo";
import {
  fetchPublicAffiliateShowcaseServer,
  fetchPublicSellerProfileServer,
  fetchStoreCategoriesServer,
  fetchStoreProductsServer,
} from "@/lib/store/powergy-server";

export const revalidate = 60;

interface SellerPageProps {
  params: Promise<{ handle: string }>;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({
  params,
}: SellerPageProps): Promise<Metadata> {
  const { handle } = await params;
  const cleanHandle = safeDecode(handle).trim().replace(/^@+/, "");
  const seller = await fetchPublicSellerProfileServer(cleanHandle);

  if (!seller) {
    return {
      title: `Vendedor @${cleanHandle} | ${siteConfig.name} Tienda`,
      robots: { index: false, follow: true },
    };
  }

  const canonicalPath = `/tienda/vendedor/${encodeURIComponent(seller.handle)}`;
  const description =
    seller.bio?.trim() ||
    `Explora los ${seller.activeProductCount} productos de ${seller.displayName} (@${seller.handle}) en ${siteConfig.name} Tienda. Compra directo o afíliate a sus productos disponibles.`;

  return {
    title: `${seller.displayName} (@${seller.handle}) · Tienda`,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `${seller.displayName} (@${seller.handle}) | ${siteConfig.name} Tienda`,
      description,
      url: `${siteConfig.siteUrl}${canonicalPath}`,
    },
  };
}

export default async function TiendaVendedorPage({ params }: SellerPageProps) {
  const { handle } = await params;
  const cleanHandle = safeDecode(handle).trim().replace(/^@+/, "");

  const [seller, categories] = await Promise.all([
    fetchPublicSellerProfileServer(cleanHandle),
    fetchStoreCategoriesServer(),
  ]);

  if (!seller) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-xs">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            <Store className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-zinc-950">
            Vendedor no encontrado
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            No encontramos ninguna tienda activa bajo el usuario{" "}
            <span className="font-mono font-semibold">@{cleanHandle}</span>.
          </p>
          <Link
            href="/tienda"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#6018F8] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#5010E8]"
          >
            <ArrowLeft className="h-4 w-4" />
            Explorar el catálogo
          </Link>
        </div>
      </div>
    );
  }

  const [productsPage, affiliateShowcase] = await Promise.all([
    fetchStoreProductsServer(
      { ownerHandle: seller.handle, sort: "recientes", page: 1, pageSize: 60 },
      categories,
      60
    ),
    fetchPublicAffiliateShowcaseServer(seller.handle, categories, 60),
  ]);

  const canonicalPath = `/tienda/vendedor/${encodeURIComponent(seller.handle)}`;
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Inicio", href: "/" },
    { name: "Tienda", href: "/tienda" },
    { name: seller.displayName, href: canonicalPath },
  ]);

  const collectionJsonLd = buildStoreCollectionJsonLd({
    name: `Productos de ${seller.displayName} | ${siteConfig.name} Tienda`,
    description:
      seller.bio?.trim() ||
      `Catálogo de ${seller.displayName} en ${siteConfig.name} Tienda.`,
    path: canonicalPath,
    products: productsPage.items,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="h-48 animate-pulse rounded-3xl bg-zinc-100" />
          </div>
        }
      >
        <SellerProfileClient
          seller={seller}
          products={productsPage.items}
          affiliatedShowcase={affiliateShowcase?.products ?? []}
        />
      </Suspense>
    </>
  );
}
