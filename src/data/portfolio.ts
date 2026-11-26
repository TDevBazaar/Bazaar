export interface PortfolioProject {
  id: string;
  title: string;
  category: string;
  summary: string;
  liveUrl: string;
  image: string;
  stack: string[];
  serviceHref: string;
  whatsappText: string;
}

export const portfolioProjects: PortfolioProject[] = [
  {
    id: "nova-moda",
    title: "NOVA MODA",
    category: "Catálogo & E-commerce",
    summary:
      "Tienda online de ropa y accesorios con búsqueda, filtros por categoría y precio, y cierre de pedidos por WhatsApp.",
    liveUrl: "https://novamoda.vercel.app/catalogo",
    image: "/images/portfolio/novamoda-real.webp",
    stack: ["Next.js", "Catálogo", "WhatsApp"],
    serviceHref: "/servicios/catalogo-digital",
    whatsappText:
      "Hola Deve, vi NOVA MODA en tu portafolio y quiero consultar por un catálogo o tienda online similar.",
  },
  {
    id: "copyded3",
    title: "CopyDed3",
    category: "Software Windows",
    summary:
      "Sistema de escritorio para monitoreo USB, control de dispositivos, auditoría forense y gestión de actividad en Windows.",
    liveUrl: "https://tdevbazaar.github.io/Copyded/",
    image: "/images/portfolio/copyded3-real.webp",
    stack: ["Windows", "Monitoreo USB", "Auditoría"],
    serviceHref: "/servicios/software-a-medida",
    whatsappText:
      "Hola Deve, vi CopyDed3 en tu portafolio y quiero consultar por un software a medida para mi negocio.",
  },
];
