export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "¿La consulta y defectación técnica realmente es gratuita?",
    answer:
      "Sí. Puedes enviarnos un ticket desde la web con una descripción y fotos del problema, o escribirnos por WhatsApp. Evaluamos tu caso sin costo y te respondemos en menos de 24 horas con un diagnóstico inicial y presupuesto claro antes de realizar cualquier trabajo.",
  },
  {
    question: "¿Dónde están ubicados y atienden fuera de La Habana?",
    answer:
      "Para soporte técnico presencial de hardware, laptops y celulares estamos en 10 de Octubre (Luyanó), La Habana, Cuba. Para desarrollo web, tiendas online, software a medida y asesoría remota trabajamos con clientes de toda Cuba y del exterior.",
  },
  {
    question: "¿Qué garantía ofrecen en reparaciones y proyectos de software?",
    answer:
      "Las reparaciones técnicas cuentan con hasta 90 días de garantía sobre la intervención realizada. En proyectos de desarrollo web y software a medida incluimos pruebas completas, entrega documentada y soporte post-lanzamiento.",
  },
  {
    question: "¿Cuánto demora desarrollar una tienda online o catálogo digital?",
    answer:
      "Un catálogo digital profesional puede estar listo en 1 a 2 semanas; una tienda e-commerce o sistema de reservas completo suele tomar entre 2 y 5 semanas según las integraciones y el volumen de funcionalidades.",
  },
  {
    question: "¿Cómo puedo consultar por un servicio o dar seguimiento a mi caso?",
    answer:
      "Tienes dos vías directas: llenar el formulario de Consulta Gratis (donde puedes adjuntar imágenes del problema o requerimientos) o escribirnos directamente por WhatsApp al +53 5252 9615 para atención inmediata.",
  },
];
