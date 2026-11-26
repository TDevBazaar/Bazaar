import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — Soluciones Digitales y Soporte Técnico`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#7c3aed",
    lang: "es",
    icons: [
      {
        src: "/brand/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
