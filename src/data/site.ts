export const siteConfig = {
  name: "Deve",
  tagline: "Desarrollo Web, Software a Medida y Soporte Técnico en La Habana",
  description:
    "Deve: expertos en desarrollo web, tiendas e-commerce, catálogos digitales, sistemas de reservas y soporte técnico especializado en La Habana, Cuba. Consulta y diagnóstico gratuito en menos de 24 horas.",
  siteUrl: (
    process.env.NEXT_PUBLIC_SITE_URL || "https://deve.vercel.app"
  ).replace(/\/$/, ""),
  locale: "es_CU",
  logo: "/brand/logo.webp",
  logoPng: "/brand/logo.png",
  googleSiteVerification: "ZJBgs5uRRdwMXnTWziBzkoM8xVjRimTIMcBDCL9FToc",
  contact: {
    whatsappNumber: (
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5352529615"
    ).replace(/[^\d]/g, ""),
    phoneDisplay: process.env.NEXT_PUBLIC_PHONE_DISPLAY || "+53 5252 9615",
    phoneHref: `tel:+${(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5352529615").replace(/[^\d]/g, "")}`,
    addressLocality: "10 de Octubre, Luyanó",
    addressRegion: "La Habana",
    addressCountry: "CU",
    addressFull: "10 de Octubre, Luyanó, La Habana, Cuba",
    hours: [
      { days: "Lunes a Viernes", time: "9:00 AM – 8:00 PM" },
      { days: "Sábado y Domingo", time: "11:00 AM – 7:00 PM" },
    ],
  },
  social: {
    facebook: "https://www.facebook.com/profile.php?id=61577291160335",
    instagram: "https://www.instagram.com/dev.bazaar/",
    github: "https://github.com/TDevBazaar",
  },
  androidAppUrl: process.env.NEXT_PUBLIC_ANDROID_APP_URL?.trim() || "",
  storeUrl: process.env.NEXT_PUBLIC_STORE_URL?.trim() || "",
} as const;

export function getWhatsAppUrl(message: string): string {
  return `https://wa.me/${siteConfig.contact.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
