export const siteConfig = {
  name: "Deve",
  alternateName: "DevBazaar",
  tagline: "Desarrollo de Software y Soporte Técnico en Cuba",
  description:
    "Deve: desarrollo de software a medida, web, tiendas online y soporte técnico en Cuba. Atención remota nacional y taller en La Habana. Consulta gratis en 24h.",
  siteUrl: (
    process.env.NEXT_PUBLIC_SITE_URL || "https://deve-blush.vercel.app"
  ).replace(/\/$/, ""),
  locale: "es_CU",
  language: "es-CU",
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
