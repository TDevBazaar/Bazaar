export type ServiceVertical = "desarrollo" | "soporte";

export type ServiceIconKey =
  | "shopping-cart"
  | "credit-card"
  | "smartphone"
  | "bar-chart"
  | "truck"
  | "shield"
  | "layout-grid"
  | "filter"
  | "search"
  | "refresh"
  | "calendar"
  | "bell"
  | "pie-chart"
  | "pen-tool"
  | "settings"
  | "layers"
  | "headphones"
  | "wrench"
  | "cpu"
  | "home"
  | "stethoscope"
  | "sparkles"
  | "zap"
  | "file-text"
  | "download";

export interface ServiceFeature {
  icon: ServiceIconKey;
  title: string;
  description: string;
}

export interface ServiceSubItem {
  name: string;
  priceRange?: string;
  frequency?: string;
  description?: string;
  includes?: string[];
  bestFor?: string;
}

export interface ServiceTestimonial {
  author: string;
  role: string;
  rating: number;
  quote: string;
}

export interface ServiceItem {
  slug: string;
  legacyId: string;
  vertical: ServiceVertical;
  badge: string;
  shortTitle: string;
  title: string;
  subtitle: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  thumbnail: string;
  coverImage: string;
  gallery: string[];
  priceLabel: string;
  deliveryInfo: string;
  warrantyOrSla: string;
  features: ServiceFeature[];
  subItemsTitle?: string;
  subItems?: ServiceSubItem[];
  benefits?: string[];
  supportedOS?: string[];
  testimonials: ServiceTestimonial[];
}

export const services: ServiceItem[] = [
  {
    slug: "desarrollo-ecommerce",
    legacyId: "Ecommerce",
    vertical: "desarrollo",
    badge: "Desarrollo Digital",
    shortTitle: "E-commerce",
    title: "Desarrollo de Tienda E-commerce Profesional",
    subtitle: "Vende 24/7 con catálogo optimizado, carrito ágil y SEO listo para Google.",
    description:
      "Tienda online completa diseñada para convertir visitas en ventas reales: carrito de compras rápido, gestión de inventario en tiempo real, panel administrativo, integración de pagos o pedidos por WhatsApp y arquitectura SEO optimizada para posicionarte en buscadores.",
    seoTitle: "Desarrollo de Tiendas E-commerce en Cuba",
    seoDescription:
      "Creamos tiendas online rápidas, seguras y optimizadas para SEO con carrito de compras, panel administrativo e integración con WhatsApp y pasarelas de pago.",
    seoKeywords: [
      "desarrollo ecommerce Cuba",
      "crear tienda online La Habana",
      "tienda virtual con carrito",
      "desarrollo web profesional",
    ],
    thumbnail: "/images/services/ecommerce-1.webp",
    coverImage: "/images/services/ecommerce-1.webp",
    gallery: [
      "/images/services/ecommerce-1.webp",
      "/images/services/ecommerce-2.webp",
      "/images/services/ecommerce-3.webp",
      "/images/services/ecommerce-4.webp",
    ],
    priceLabel: "Consulta personalizada según catálogo",
    deliveryInfo: "Entrega remota o cita presencial en La Habana",
    warrantyOrSla: "Soporte post-lanzamiento y certificado SSL incluido",
    features: [
      {
        icon: "shopping-cart",
        title: "Carrito e Inventario en Tiempo Real",
        description:
          "Experiencia de compra sin fricción con control automático de stock, variantes y pedidos.",
      },
      {
        icon: "credit-card",
        title: "Pagos y Pedidos Flexibles",
        description:
          "Integración con pasarelas de pago internacionales o cierre directo de pedidos por WhatsApp.",
      },
      {
        icon: "smartphone",
        title: "Diseño Mobile-First",
        description:
          "Navegación ultrarrápida pensada para usuarios desde teléfonos móviles y conexiones limitadas.",
      },
      {
        icon: "bar-chart",
        title: "Panel y Analíticas",
        description:
          "Control total de productos, categorías, precios y métricas de comportamiento de clientes.",
      },
      {
        icon: "truck",
        title: "Gestión de Envíos y Zonas",
        description:
          "Configuración de tarifas por municipio, entrega a domicilio o recogida en punto físico.",
      },
      {
        icon: "shield",
        title: "Seguridad y SEO Técnico",
        description:
          "HTTPS, estructura semántica, metadatos dinámicos por producto y carga optimizada.",
      },
    ],
    testimonials: [
      {
        author: "María López",
        role: "Propietaria de tienda minorista",
        rating: 5,
        quote:
          "Mi tienda online quedó mejor de lo que esperaba. El equipo fue muy profesional y respondió todas mis dudas con rapidez.",
      },
      {
        author: "Carlos Mendoza",
        role: "Emprendedor comercial",
        rating: 5,
        quote:
          "La funcionalidad de la tienda es impecable, carga rápido desde el móvil y las ventas aumentaron notablemente desde el primer mes.",
      },
    ],
  },
  {
    slug: "catalogo-digital",
    legacyId: "Catalogo",
    vertical: "desarrollo",
    badge: "Desarrollo Digital",
    shortTitle: "Catálogo Digital",
    title: "Desarrollo de Catálogo Digital Interactivo",
    subtitle: "Exhibe tus productos con filtros instantáneos y recibe pedidos por WhatsApp.",
    description:
      "Catálogo web interactivo diseñado para negocios, distribuidores y minoristas que desean mostrar sus ofertas de forma profesional sin perder tiempo enviando decenas de fotos por chat. Incluye búsqueda rápida, filtros por categoría/precio y carga ligera.",
    seoTitle: "Catálogo Digital Interactivo para Negocios",
    seoDescription:
      "Muestra tus productos en línea con un catálogo digital interactivo, filtros inteligentes, búsqueda rápida y botón directo de pedido por WhatsApp.",
    seoKeywords: [
      "catálogo digital interactivo",
      "catálogo web WhatsApp Cuba",
      "menú digital negocios",
      "catálogo online profesional",
    ],
    thumbnail: "/images/services/catalogo-1.webp",
    coverImage: "/images/services/catalogo-1.webp",
    gallery: [
      "/images/services/catalogo-1.webp",
      "/images/services/catalogo-2.webp",
      "/images/services/catalogo-3.webp",
      "/images/services/catalogo-4.webp",
    ],
    priceLabel: "Consulta según cantidad de productos",
    deliveryInfo: "Implementación rápida · Soporte remoto y en La Habana",
    warrantyOrSla: "Actualización sencilla desde panel de control",
    features: [
      {
        icon: "layout-grid",
        title: "Vistas Claras y Modernas",
        description:
          "Presenta productos en cuadrícula o fichas detalladas con galerías optimizadas en WebP.",
      },
      {
        icon: "filter",
        title: "Filtros Avanzados",
        description:
          "Tus clientes filtran al instante por categoría, rango de precio, marca o disponibilidad.",
      },
      {
        icon: "search",
        title: "Búsqueda Inteligente",
        description:
          "Encuentra productos por nombre, código o palabra clave en milisegundos.",
      },
      {
        icon: "refresh",
        title: "Precios y Stock Siempre al Día",
        description:
          "Modifica precios, ofertas o disponibilidad sin depender de diseñadores ni PDFs desactualizados.",
      },
      {
        icon: "smartphone",
        title: "Optimizado para Datos Móviles",
        description:
          "Imágenes comprimidas y carga progresiva ideal para compartir el enlace por WhatsApp y redes.",
      },
      {
        icon: "bar-chart",
        title: "Analítica de Interés",
        description:
          "Descubre qué productos generan más vistas y clics para enfocar tus campañas.",
      },
    ],
    testimonials: [
      {
        author: "Moda Express",
        role: "Tienda de confecciones",
        rating: 5,
        quote:
          "Nuestro catálogo digital aumentó los pedidos online en un 40%. Los clientes filtran por talla y estilo en segundos.",
      },
      {
        author: "Suministros Industriales Pro",
        role: "Distribuidor mayorista",
        rating: 5,
        quote:
          "Ideal para nuestro catálogo extenso. La búsqueda por referencia ahorra horas de atención cada semana.",
      },
    ],
  },
  {
    slug: "sistema-de-reservas",
    legacyId: "Reservacion",
    vertical: "desarrollo",
    badge: "Desarrollo Digital",
    shortTitle: "Automatización",
    title: "Desarrollo de Sistemas de Reservas y Automatización",
    subtitle: "Organiza citas, mesas o servicios con disponibilidad en tiempo real.",
    description:
      "Solución digital completa para restaurantes, clínicas, barberías, estudios y servicios profesionales que gestionan citas. Automatiza la agenda, envía confirmaciones y recordatorios, y consulta métricas de ocupación desde cualquier dispositivo.",
    seoTitle: "Sistema de Reservas y Citas Online a Medida",
    seoDescription:
      "Automatiza reservas para restaurantes, clínicas y negocios con calendario en tiempo real, recordatorios automáticos y panel de gestión.",
    seoKeywords: [
      "sistema de reservas online",
      "agenda de citas web",
      "automatización de negocios Cuba",
      "software de reservaciones",
    ],
    thumbnail: "/images/services/reservas-1.webp",
    coverImage: "/images/services/reservas-1.webp",
    gallery: [
      "/images/services/reservas-1.webp",
      "/images/services/reservas-2.webp",
      "/images/services/reservas-3.webp",
      "/images/services/reservas-4.webp",
    ],
    priceLabel: "Consulta según flujos y usuarios",
    deliveryInfo: "Despliegue en la nube + capacitación del equipo",
    warrantyOrSla: "Soporte técnico continuo y copias de seguridad",
    features: [
      {
        icon: "calendar",
        title: "Calendario Inteligente",
        description:
          "Disponibilidad en tiempo real con reglas de horario y bloqueo automático contra duplicados.",
      },
      {
        icon: "refresh",
        title: "Sincronización de Agenda",
        description:
          "Compatible con calendarios externos y vista centralizada para todo tu equipo.",
      },
      {
        icon: "smartphone",
        title: "Acceso Web y Móvil",
        description:
          "Tus clientes reservan en 30 segundos desde el móvil y tú administras todo desde tu panel.",
      },
      {
        icon: "bell",
        title: "Recordatorios Automáticos",
        description:
          "Reduce las ausencias confirmando citas por correo, notificaciones o WhatsApp.",
      },
      {
        icon: "credit-card",
        title: "Control de Depósitos y Pagos",
        description:
          "Registro de anticipos, estados de reserva y comprobantes en un solo lugar.",
      },
      {
        icon: "pie-chart",
        title: "Reportes de Ocupación",
        description:
          "Identifica horarios pico, clientes frecuentes y servicios más solicitados.",
      },
    ],
    testimonials: [
      {
        author: "Roberto Martínez",
        role: "Administrador de restaurante",
        rating: 5,
        quote:
          "Las reservas ahora se organizan solas y los recordatorios redujeron las ausencias drásticamente.",
      },
      {
        author: "Clínica Dental Sonrisa",
        role: "Dirección médica",
        rating: 5,
        quote:
          "Los pacientes eligen horario y especialista sin saturar nuestro teléfono. Nos cambió la operativa diaria.",
      },
    ],
  },
  {
    slug: "software-a-medida",
    legacyId: "Personalizado",
    vertical: "desarrollo",
    badge: "Desarrollo Digital",
    shortTitle: "Personalizado",
    title: "Desarrollo de Aplicaciones y Software a Medida",
    subtitle: "Arquitectura escalable diseñada exactamente para los procesos de tu negocio.",
    description:
      "Creamos aplicaciones web, móviles (Android) y sistemas internos diseñados desde cero para resolver retos específicos: control de inventario, facturación, CRM, refactorización de sistemas heredados e integraciones API.",
    seoTitle: "Desarrollo de Software a Medida y Apps Android",
    seoDescription:
      "Desarrollamos aplicaciones web, apps Android y sistemas empresariales a medida, refactorización de código y consultoría tecnológica.",
    seoKeywords: [
      "desarrollo de software a medida Cuba",
      "programación web y móvil",
      "aplicaciones Android a medida",
      "refactorización de software",
    ],
    thumbnail: "/images/services/v2-personalizado.webp",
    coverImage: "/images/services/v2-personalizado.webp",
    gallery: [
      "/images/services/personalizado-1.webp",
      "/images/services/personalizado-2.webp",
      "/images/services/personalizado-3.webp",
      "/images/services/personalizado-4.webp",
    ],
    priceLabel: "Desde 8,000 CUP · Consulta por alcance",
    deliveryInfo: "Entregas por fases con demos verificables",
    warrantyOrSla: "Código mantenible, documentado y soporte continuo",
    features: [
      {
        icon: "pen-tool",
        title: "Diseño UI/UX a Medida",
        description:
          "Interfaces claras pensadas para la productividad real de tus empleados y clientes.",
      },
      {
        icon: "settings",
        title: "Integración con tus Sistemas",
        description:
          "Conectamos bases de datos existentes, APIs externas, ERPs y flujos de trabajo.",
      },
      {
        icon: "layers",
        title: "Arquitectura Escalable",
        description:
          "Stack moderno preparado para crecer en usuarios, datos y funcionalidades.",
      },
      {
        icon: "smartphone",
        title: "Web y Móvil Multiplataforma",
        description:
          "Aplicaciones web modernas y apps Android nativas conectadas a un mismo backend.",
      },
      {
        icon: "shield",
        title: "Seguridad y Control de Roles",
        description:
          "Autenticación robusta, permisos por usuario y protección de datos sensibles.",
      },
      {
        icon: "headphones",
        title: "Mantenimiento y Evolución",
        description:
          "Acompañamiento técnico continuo, corrección de errores y nuevas mejoras.",
      },
    ],
    testimonials: [
      {
        author: "Logística Global",
        role: "Coordinación de operaciones",
        rating: 5,
        quote:
          "La aplicación a medida ordenó nuestra operación diaria y redujo tiempos y costos operativos en un 25%.",
      },
      {
        author: "Centro Médico Avanzado",
        role: "Gestión de pacientes",
        rating: 5,
        quote:
          "Un sistema adaptado exactamente a nuestro flujo de trabajo. Mejoró la eficiencia del equipo desde la primera semana.",
      },
    ],
  },
  {
    slug: "reparacion-tecnica",
    legacyId: "Reparacion",
    vertical: "soporte",
    badge: "Soporte Técnico · La Habana",
    shortTitle: "Reparación",
    title: "Servicio Técnico Especializado en Reparación de PCs y Celulares",
    subtitle: "Diagnóstico transparente, soluciones rápidas y garantía real en La Habana.",
    description:
      "Reparación profesional de laptops, computadoras de escritorio y smartphones. Resolvemos fallos de software, sistema operativo, pantallas, baterías, puertos de carga y hardware crítico con diagnóstico inicial gratuito y 90 días de garantía.",
    seoTitle: "Reparación de Laptops, PCs y Celulares en La Habana",
    seoDescription:
      "Servicio técnico especializado en La Habana (10 de Octubre, Luyanó): reparación de laptops, computadoras y celulares con diagnóstico gratis y garantía de 90 días.",
    seoKeywords: [
      "reparación de laptops La Habana",
      "reparación de celulares 10 de Octubre",
      "técnico de computadoras Cuba",
      "flasheo y desbloqueo de celulares",
    ],
    thumbnail: "/images/services/v2-reparacion.webp",
    coverImage: "/images/services/v2-reparacion.webp",
    gallery: [],
    priceLabel: "Desde 500 CUP · Diagnóstico gratuito",
    deliveryInfo: "Taller en 10 de Octubre, Luyanó, La Habana (y visitas coordinadas)",
    warrantyOrSla: "90 días de garantía en reparaciones realizadas",
    features: [
      {
        icon: "zap",
        title: "Reparaciones Express",
        description:
          "Solución en menos de 24 horas para los fallos más frecuentes de software y hardware.",
      },
      {
        icon: "shield",
        title: "90 Días de Garantía",
        description:
          "Respaldamos cada intervención con garantía clara sobre la reparación realizada.",
      },
      {
        icon: "cpu",
        title: "Componentes Verificados",
        description:
          "Trabajamos con repuestos confiables y pruebas de estrés antes de entregar tu equipo.",
      },
      {
        icon: "home",
        title: "Atención Flexible en La Habana",
        description:
          "Cita presencial en Luyanó o evaluación coordinada según el tipo de equipo.",
      },
      {
        icon: "stethoscope",
        title: "Diagnóstico y Defectación Gratis",
        description:
          "Envía un ticket online con fotos o trae tu equipo para recibir una evaluación sin compromiso.",
      },
      {
        icon: "headphones",
        title: "Asesoría Preventiva",
        description:
          "Te explicamos la causa raíz del fallo y cómo evitar que vuelva a ocurrir.",
      },
    ],
    subItemsTitle: "Servicios de Reparación Frecuentes",
    subItems: [
      {
        name: "Reparación de Laptops y PCs",
        priceRange: "500 – 18,000 CUP",
        description:
          "Sistema operativo, drivers, teclados, pantallas, fuentes de poder, almacenamiento SSD y recuperación de arranque.",
      },
      {
        name: "Software y Reparación de Smartphones",
        priceRange: "500 – 9,000 CUP",
        description:
          "Flasheo, actualización de sistema, desbloqueo general, recuperación de cuentas, baterías y puertos de carga.",
      },
      {
        name: "Recuperación de Sistema y Contraseñas",
        priceRange: "Según diagnóstico",
        description:
          "Eliminación segura de bloqueos en equipos propios, rescate de archivos y restauración del sistema.",
      },
    ],
    testimonials: [
      {
        author: "Carlos Rodríguez",
        role: "Cliente en La Habana",
        rating: 5,
        quote:
          "Salvaron mi laptop en un solo día cuando en otros lugares me dijeron que no tenía solución. Precio justo y garantía incluida.",
      },
    ],
  },
  {
    slug: "mantenimiento-preventivo",
    legacyId: "Mantenimiento",
    vertical: "soporte",
    badge: "Soporte Técnico · La Habana",
    shortTitle: "Mantenimiento",
    title: "Mantenimiento Preventivo y Correctivo de Equipos",
    subtitle: "Alarga la vida útil de tus computadoras y elimina sobrecalentamientos y lentitud.",
    description:
      "Servicio profesional de limpieza profunda, cambio de pasta térmica, diagnóstico de disco y memoria, optimización del sistema operativo y actualización de seguridad para equipos personales, oficinas y estudios creativos.",
    seoTitle: "Mantenimiento de Computadoras y Laptops en La Habana",
    seoDescription:
      "Limpieza profunda, optimización de rendimiento, antivirus y mantenimiento preventivo para PCs y oficinas en La Habana, Cuba.",
    seoKeywords: [
      "mantenimiento de computadoras La Habana",
      "limpieza interna laptop Cuba",
      "optimización de PC",
      "soporte técnico empresas Habana",
    ],
    thumbnail: "/images/services/v2-mantenimiento.webp",
    coverImage: "/images/services/v2-mantenimiento.webp",
    gallery: [],
    priceLabel: "Planes individuales y corporativos",
    deliveryInfo: "Cita presencial en La Habana o planes programados",
    warrantyOrSla: "Reporte detallado del estado de cada equipo",
    features: [
      {
        icon: "calendar",
        title: "Mantenimiento Programado",
        description:
          "Planes mensuales o trimestrales para prevenir paradas inesperadas en oficinas y negocios.",
      },
      {
        icon: "stethoscope",
        title: "Diagnóstico Hardware y Software",
        description:
          "Revisión de salud de discos SSD/HDD, temperaturas, RAM y procesos en segundo plano.",
      },
      {
        icon: "sparkles",
        title: "Limpieza Profunda y Refrigeración",
        description:
          "Eliminación de polvo interno y mantenimiento térmico para evitar apagones por calor.",
      },
      {
        icon: "refresh",
        title: "Drivers y Seguridad al Día",
        description:
          "Actualización de controladores, antivirus y parches críticos del sistema.",
      },
      {
        icon: "zap",
        title: "Optimización de Arranque",
        description:
          "Eliminación de software innecesario y ajuste fino para máxima fluidez.",
      },
      {
        icon: "file-text",
        title: "Informe de Estado",
        description:
          "Recomendaciones claras de actualización (RAM, SSD) solo cuando realmente aportan valor.",
      },
    ],
    subItemsTitle: "Planes de Mantenimiento",
    subItems: [
      {
        name: "Plan Básico",
        frequency: "Trimestral / Puntual",
        bestFor: "Equipos personales o de estudio",
        includes: [
          "Limpieza externa e interna",
          "Diagnóstico básico de hardware",
          "Actualización de drivers",
          "Reporte de estado",
        ],
      },
      {
        name: "Plan Profesional",
        frequency: "Mensual",
        bestFor: "Equipos de trabajo críticos y diseñadores",
        includes: [
          "Limpieza profunda completa",
          "Diagnóstico avanzado y optimización",
          "Actualización de seguridad y antivirus",
          "Prioridad en soporte técnico",
        ],
      },
      {
        name: "Plan Empresarial",
        frequency: "A medida",
        bestFor: "Flotas de equipos en oficinas y negocios",
        includes: [
          "Mantenimiento preventivo programado",
          "Asistencia prioritaria ante incidencias",
          "Informes ejecutivos por equipo",
          "Tarifas preferenciales en reparaciones",
        ],
      },
    ],
    benefits: [
      "Reduce costos de reparaciones mayores por sobrecalentamiento",
      "Extiende la vida útil de laptops y computadoras de escritorio",
      "Previene pérdida inesperada de datos importantes",
      "Mejora velocidad de arranque y fluidez en el trabajo diario",
    ],
    testimonials: [
      {
        author: "Estudio Creativo Digital",
        role: "Equipo de diseño gráfico",
        rating: 5,
        quote:
          "Nuestras estaciones de trabajo funcionan como nuevas después de cada mantenimiento y el rendimiento mejoró notablemente.",
      },
    ],
  },
  {
    slug: "paquete-utilidades",
    legacyId: "Utilidades",
    vertical: "soporte",
    badge: "Software y Optimización",
    shortTitle: "Utilidades",
    title: "Instalación y Paquete de Utilidades Esenciales",
    subtitle: "Deja tu equipo listo para trabajar con drivers, ofimática y seguridad optimizada.",
    description:
      "Configuración integral de tu computadora con todos los controladores oficiales, suite ofimática, herramientas de limpieza y seguridad, optimización del sistema y soporte de instalación sin bloatware ni programas dañinos.",
    seoTitle: "Instalación de Programas, Drivers y Utilidades PC",
    seoDescription:
      "Configuración completa de PC y laptops: drivers oficiales, antivirus, ofimática y utilidades de optimización para Windows, macOS y Linux.",
    seoKeywords: [
      "instalación de programas y drivers Cuba",
      "optimización Windows La Habana",
      "paquete de software PC",
      "antivirus y limpieza de PC",
    ],
    thumbnail: "/images/services/v2-utilidades.webp",
    coverImage: "/images/services/v2-utilidades.webp",
    gallery: [],
    priceLabel: "Tarifa fija accesible por equipo",
    deliveryInfo: "Instalación presencial en La Habana o asistencia remota",
    warrantyOrSla: "Software verificado y libre de malware",
    features: [
      {
        icon: "refresh",
        title: "Drivers Oficiales Completos",
        description:
          "Gráficos, audio, red Wi-Fi, impresoras y controladores USB configurados sin conflictos.",
      },
      {
        icon: "wrench",
        title: "Kit de Productividad y Sistema",
        description:
          "Suite ofimática, lectores/editores PDF, compresores y herramientas de respaldo.",
      },
      {
        icon: "shield",
        title: "Protección Anti-Malware",
        description:
          "Configuración de antivirus, firewall y eliminación de programas publicitarios.",
      },
      {
        icon: "sparkles",
        title: "Limpieza de Bloatware",
        description:
          "Quitamos apps preinstaladas que consumen RAM y batería sin aportar nada.",
      },
      {
        icon: "zap",
        title: "Arranque Rápido",
        description:
          "Ajustes de energía y servicios para aprovechar al máximo tu hardware actual.",
      },
      {
        icon: "download",
        title: "Software Especializado",
        description:
          "Instalación bajo pedido de herramientas para diseño, ingeniería o programación.",
      },
    ],
    supportedOS: ["Windows 10 / 11", "macOS 12+", "Linux (Ubuntu, Mint, Fedora)"],
    testimonials: [
      {
        author: "Ana Torres",
        role: "Profesional independiente",
        rating: 5,
        quote:
          "Actualizaron todos los drivers de mi PC antigua y la dejaron configurada para trabajar. Ahora corre como nueva.",
      },
    ],
  },
];

export function getServiceBySlug(slug: string): ServiceItem | undefined {
  return services.find((service) => service.slug === slug);
}

export function getServicesByVertical(vertical: ServiceVertical): ServiceItem[] {
  return services.filter((service) => service.vertical === vertical);
}
