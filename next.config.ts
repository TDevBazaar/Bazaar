import type { NextConfig } from "next";

const supabaseHosts = new Set<string>(["fqyrdzljxsdhgeysdhoc.supabase.co"]);
try {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (configuredUrl) {
    supabaseHosts.add(new URL(configuredUrl).hostname);
  }
} catch {
  // Ignorar variable de entorno inválida al construir la config de imágenes.
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  turbopack: {
    root: __dirname,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [384, 640, 750, 828, 1080, 1200, 1600],
    imageSizes: [64, 128, 256, 384],
    minimumCacheTTL: 2678400,
    remotePatterns: Array.from(supabaseHosts).map((hostname) => ({
      protocol: "https",
      hostname,
      pathname: "/storage/v1/object/public/**",
    })),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/info/Consulta",
        destination: "/consulta",
        permanent: true,
      },
      {
        source: "/info/Ecommerce",
        destination: "/servicios/desarrollo-ecommerce",
        permanent: true,
      },
      {
        source: "/info/Catalogo",
        destination: "/servicios/catalogo-digital",
        permanent: true,
      },
      {
        source: "/info/Reservacion",
        destination: "/servicios/sistema-de-reservas",
        permanent: true,
      },
      {
        source: "/info/Personalizado",
        destination: "/servicios/software-a-medida",
        permanent: true,
      },
      {
        source: "/info/Reparacion",
        destination: "/servicios/reparacion-tecnica",
        permanent: true,
      },
      {
        source: "/info/Mantenimiento",
        destination: "/servicios/mantenimiento-preventivo",
        permanent: true,
      },
      {
        source: "/info/Utilidades",
        destination: "/servicios/paquete-utilidades",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
