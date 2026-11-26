import { faqItems } from "@/data/faq";
import { services, type ServiceItem } from "@/data/services";
import { siteConfig } from "@/data/site";
import type { ProductView } from "@/lib/store/powergy-api";

const ORGANIZATION_ID = `${siteConfig.siteUrl}/#organization`;
const WEBSITE_ID = `${siteConfig.siteUrl}/#website`;

export function buildLocalBusinessJsonLd() {
  const desarrolloServices = services.filter((s) => s.vertical === "desarrollo");
  const soporteServices = services.filter((s) => s.vertical === "soporte");

  return {
    "@context": "https://schema.org",
    "@type": ["ProfessionalService", "LocalBusiness"],
    "@id": ORGANIZATION_ID,
    name: siteConfig.name,
    alternateName: [siteConfig.alternateName, "Deve Cuba"],
    url: siteConfig.siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteConfig.siteUrl}${siteConfig.logoPng}`,
      width: 512,
      height: 512,
    },
    image: `${siteConfig.siteUrl}/opengraph-image`,
    description: siteConfig.description,
    telephone: `+${siteConfig.contact.whatsappNumber}`,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.addressLocality,
      addressLocality: siteConfig.contact.addressRegion,
      addressRegion: siteConfig.contact.addressRegion,
      addressCountry: siteConfig.contact.addressCountry,
    },
    areaServed: [
      { "@type": "Country", name: "Cuba" },
      { "@type": "City", name: "La Habana" },
    ],
    knowsAbout: [
      "Desarrollo de software en Cuba",
      "Software a medida",
      "Desarrollo web y tiendas e-commerce",
      "Catálogos digitales con WhatsApp",
      "Sistemas de reservas online",
      "Aplicaciones móviles Android",
      "Soporte técnico informático en Cuba",
      "Reparación de laptops, PCs y celulares",
      "Mantenimiento preventivo y correctivo de computadoras",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: `+${siteConfig.contact.whatsappNumber}`,
        contactType: "customer service",
        availableLanguage: ["Spanish"],
        areaServed: "CU",
      },
      {
        "@type": "ContactPoint",
        telephone: `+${siteConfig.contact.whatsappNumber}`,
        contactType: "technical support",
        availableLanguage: ["Spanish"],
        areaServed: "CU",
      },
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Servicios de Desarrollo de Software y Soporte Técnico en Cuba",
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: "Desarrollo de Software en Cuba",
          itemListElement: desarrolloServices.map((s) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: s.title,
              url: `${siteConfig.siteUrl}/servicios/${s.slug}`,
            },
          })),
        },
        {
          "@type": "OfferCatalog",
          name: "Soporte Técnico en Cuba",
          itemListElement: soporteServices.map((s) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: s.title,
              url: `${siteConfig.siteUrl}/servicios/${s.slug}`,
            },
          })),
        },
      ],
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "20:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday"],
        opens: "11:00",
        closes: "19:00",
      },
    ],
    sameAs: [
      siteConfig.social.facebook,
      siteConfig.social.instagram,
      siteConfig.social.github,
    ],
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: `${siteConfig.name} — ${siteConfig.tagline}`,
    alternateName: siteConfig.alternateName,
    url: siteConfig.siteUrl,
    inLanguage: siteConfig.language,
    publisher: {
      "@id": ORGANIZATION_ID,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.siteUrl}/tienda?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildServiceJsonLd(service: ServiceItem) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.seoDescription,
    serviceType:
      service.vertical === "desarrollo"
        ? "Desarrollo de Software en Cuba"
        : "Soporte Técnico en Cuba",
    url: `${siteConfig.siteUrl}/servicios/${service.slug}`,
    image: `${siteConfig.siteUrl}${service.coverImage}`,
    provider: {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: siteConfig.name,
      url: siteConfig.siteUrl,
    },
    areaServed:
      service.vertical === "soporte"
        ? [
            { "@type": "Country", name: "Cuba" },
            { "@type": "City", name: "La Habana" },
          ]
        : { "@type": "Country", name: "Cuba" },
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `${siteConfig.siteUrl}/consulta`,
      servicePhone: `+${siteConfig.contact.whatsappNumber}`,
      availableLanguage: ["Spanish"],
    },
  };
}

export function buildBreadcrumbJsonLd(
  items: { name: string; href: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: `${siteConfig.siteUrl}${item.href}`,
    })),
  };
}

export function buildStoreCollectionJsonLd({
  name,
  description,
  path,
  products,
}: {
  name: string;
  description: string;
  path: string;
  products: ProductView[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: `${siteConfig.siteUrl}${path}`,
    inLanguage: siteConfig.language,
    isPartOf: {
      "@id": WEBSITE_ID,
    },
    ...(products.length > 0
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: products.length,
            itemListElement: products.map((product, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `${siteConfig.siteUrl}/tienda/${encodeURIComponent(product.slug)}`,
              name: product.name,
              ...(product.image ? { image: product.image } : {}),
            })),
          },
        }
      : {}),
  };
}

export function buildProductJsonLd(product: ProductView) {
  const url = `${siteConfig.siteUrl}/tienda/${encodeURIComponent(product.slug)}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    sku: product.id,
    ...(product.model ? { mpn: product.model } : {}),
    ...(product.image ? { image: [product.image] } : {}),
    ...(product.brand
      ? { brand: { "@type": "Brand", name: product.brand } }
      : {}),
    category: product.categoryName,
    url,
    ...(product.price > 0
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "USD",
            price: product.price,
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
            url,
            seller: {
              "@type": "Organization",
              "@id": ORGANIZATION_ID,
              name: siteConfig.name,
              url: siteConfig.siteUrl,
            },
            areaServed: {
              "@type": "Country",
              name: "Cuba",
            },
          },
        }
      : {}),
  };
}
