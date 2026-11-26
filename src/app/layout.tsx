import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { ReferralCapture } from "@/components/store/ReferralCapture";
import { siteConfig } from "@/data/site";
import { buildLocalBusinessJsonLd } from "@/lib/seo";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: `${siteConfig.name} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "Deve",
    "desarrollo web Cuba",
    "tiendas ecommerce La Habana",
    "catálogo digital WhatsApp",
    "sistema de reservas online",
    "software a medida Cuba",
    "reparación de laptops La Habana",
    "reparación de celulares 10 de Octubre",
    "mantenimiento de computadoras Cuba",
  ],
  authors: [{ name: siteConfig.name, url: siteConfig.siteUrl }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.siteUrl,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: siteConfig.googleSiteVerification,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localBusinessJsonLd = buildLocalBusinessJsonLd();

  return (
    <html
      lang="es"
      className={`${plusJakarta.variable} ${spaceGrotesk.variable}`}
    >
      <body className="relative min-h-screen bg-white text-zinc-950 antialiased selection:bg-violet-600/20 selection:text-violet-950">
        {/* Global architectural grid + soft ambient violet glow across the entire site */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 bg-white bg-grid-light"
        >
          <div className="absolute inset-x-0 top-0 h-[560px] radial-glow-light" />
          <div className="absolute -right-40 top-1/3 h-[420px] w-[420px] rounded-full bg-violet-200/25 blur-3xl" />
          <div className="absolute -left-40 bottom-1/4 h-[420px] w-[420px] rounded-full bg-indigo-200/20 blur-3xl" />
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessJsonLd),
          }}
        />
        <Suspense fallback={null}>
          <ReferralCapture />
        </Suspense>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
