import type { ServiceVertical } from "@/data/services";

export interface PricingTier {
  id: string;
  vertical: ServiceVertical;
  name: string;
  tag: string;
  priceRange: string;
  turnaround: string;
  subtitle: string;
  highlighted?: boolean;
  features: string[];
  whatsappMessage: string;
}

export const pricingTiers: PricingTier[] = [
  // Soporte Técnico (La Habana)
  {
    id: "celulares",
    vertical: "soporte",
    name: "Celulares",
    tag: "Soporte Móvil",
    priceRange: "500 – 9,000 CUP",
    turnaround: "Entrega habitual: en el día / 24h",
    subtitle: "Software, mantenimiento y recuperación para dispositivos móviles.",
    features: [
      "Desbloqueo general de equipos",
      "Actualizaciones de sistema y aplicaciones",
      "Instalación de aplicaciones y utilidades",
      "Flasheo e instalación limpia de firmware",
      "Recuperación y gestión de cuentas de Google",
    ],
    whatsappMessage:
      "Hola Deve, quiero consultar por el servicio técnico para celulares.",
  },
  {
    id: "computadoras",
    vertical: "soporte",
    name: "Computadoras y Laptops",
    tag: "Más solicitado",
    priceRange: "500 – 18,000 CUP",
    turnaround: "Diagnóstico gratis en < 24h · 90 días garantía",
    subtitle: "Mantenimiento profundo y reparación de software y hardware.",
    highlighted: true,
    features: [
      "Instalación de sistemas operativos, drivers y programas",
      "Limpieza profunda interna y mantenimiento térmico",
      "Actualización de antivirus y protección anti-malware",
      "Optimización y aceleración del sistema",
      "Recuperación de acceso y eliminación de contraseñas",
    ],
    whatsappMessage:
      "Hola Deve, necesito consultar por soporte técnico o mantenimiento para mi computadora.",
  },
  {
    id: "planes-oficina",
    vertical: "soporte",
    name: "Mantenimiento Empresas",
    tag: "Oficinas y Equipos",
    priceRange: "Planes a medida",
    turnaround: "Visitas mensuales o trimestrales",
    subtitle: "Prevención de fallos y soporte prioritario para varios equipos.",
    features: [
      "Limpieza y revisión programada por flota",
      "Actualizaciones de seguridad y copias preventivas",
      "Informes técnicos del estado de cada PC",
      "Atención prioritaria ante emergencias",
      "Tarifas preferenciales en reparaciones",
    ],
    whatsappMessage:
      "Hola Deve, quiero consultar por un plan de mantenimiento para los equipos de mi negocio.",
  },

  // Desarrollo Digital
  {
    id: "catalogo-web",
    vertical: "desarrollo",
    name: "Catálogo Digital / Landing",
    tag: "Inicio Rápido",
    priceRange: "Desde 8,000 CUP",
    turnaround: "Entrega estimada: 1 – 2 semanas",
    subtitle: "Presencia profesional en Google y pedidos directos a WhatsApp.",
    features: [
      "Diseño moderno adaptable a móviles (Mobile-First)",
      "Catálogo de productos con filtros y búsqueda rápida",
      "Botones de consulta y pedido directo a WhatsApp",
      "SEO técnico inicial y alta velocidad de carga",
      "Guía sencilla para actualizar tus ofertas",
    ],
    whatsappMessage:
      "Hola Deve, quiero consultar por un Catálogo Digital o Landing Page para mi negocio.",
  },
  {
    id: "ecommerce-pro",
    vertical: "desarrollo",
    name: "Tienda E-commerce",
    tag: "Recomendado",
    priceRange: "Según catálogo y funciones",
    turnaround: "Entrega estimada: 2 – 4 semanas",
    subtitle: "Tienda online completa con carrito, panel admin y SEO avanzado.",
    highlighted: true,
    features: [
      "Carrito de compras e inventario en tiempo real",
      "Panel administrativo para productos, precios y pedidos",
      "SEO avanzado por producto, sitemap y OpenGraph",
      "Integración con pasarelas de pago o cierre por WhatsApp",
      "Soporte post-lanzamiento y certificado SSL",
    ],
    whatsappMessage:
      "Hola Deve, quiero consultar para desarrollar una Tienda E-commerce.",
  },
  {
    id: "software-medida",
    vertical: "desarrollo",
    name: "Software y Apps a Medida",
    tag: "Empresas",
    priceRange: "Hasta 100,000+ CUP",
    turnaround: "Entregas por fases semanales",
    subtitle: "Sistemas de reservas, gestión interna, APIs y apps Android.",
    features: [
      "Desarrollo de software a medida (Web + Android)",
      "Sistemas de reservas y automatización de agenda",
      "Refactorización de sistemas legacy y mejora de velocidad",
      "Control de usuarios, roles y reportes ejecutivos",
      "Mantenimiento continuo y consultoría técnica",
    ],
    whatsappMessage:
      "Hola Deve, quiero consultar por un proyecto de software o app a medida.",
  },
];
