import { faqItems } from "@/data/faq";
import { ServiceItem } from "@/data/services";
import { siteConfig } from "@/data/site";

export function buildLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: siteConfig.name,
    url: siteConfig.siteUrl,
    logo: `${siteConfig.siteUrl}${siteConfig.logoPng}`,
    image: `${siteConfig.siteUrl}/opengraph-image`,
    description: siteConfig.description,
    telephone: `+${siteConfig.contact.whatsappNumber}`,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.addressLocality,
      addressLocality: siteConfig.contact.addressRegion,
      addressCountry: siteConfig.contact.addressCountry,
    },
    areaServed: [
      { "@type": "City", name: "La Habana" },
      { "@type": "Country", name: "Cuba" },
    ],
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
    serviceType: service.badge,
    url: `${siteConfig.siteUrl}/servicios/${service.slug}`,
    image: `${siteConfig.siteUrl}${service.coverImage}`,
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.siteUrl,
    },
    areaServed:
      service.vertical === "soporte"
        ? { "@type": "City", name: "La Habana" }
        : { "@type": "Country", name: "Cuba" },
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
