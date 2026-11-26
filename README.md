# Deve Web (Next.js App Router)

Plataforma oficial de servicios digitales y soporte técnico de **Deve** (La Habana, Cuba), migrada de Angular 18 a **Next.js App Router + TypeScript + Tailwind CSS v4** con enfoque en SEO técnico, rendimiento y conversión.

> La versión anterior en Angular 18 se conserva intacta en la rama `backup/angular-v1`.

## Arquitectura y SEO

- **Route Groups (`src/app/(marketing)` y `src/app/(store)`)**: Separan la landing de servicios de la tienda integrada (`/tienda`, `/tienda/[slug]`, `/tienda/carrito`, `/tienda/checkout`, `/tienda/favoritos`, `/tienda/admin`).
- **Tienda conectada al API de POWERGY (`/api/powergy/[...path]`)**:
  - Usa la clave de tienda `deve` (`NEXT_PUBLIC_STORE_KEY`, pedidos `DE-XXXXXXXX`) compartiendo infraestructura con el API de POWERGY sin CORS en el navegador.
  - Catálogo con búsqueda, filtros (categorías, precio máximo, solo ofertas, orden), scroll infinito / paginación, badges técnicos (`Garantía`, `Transporte`, `Factura`), favoritos y carrito en `localStorage`.
  - Checkout con registro de pedido en el API, enlace visual Open Graph (`/p/[ref]` + `/api/order-preview/[ref]`), enlaces de referido (`?v=codigo`) y confirmación por WhatsApp.
  - Panel de administración (`/tienda/admin`) con login de Supabase, gestión de productos (incluyendo compresión WebP y optimizador en lote a Supabase Storage), categorías, solicitudes con métricas/cierre y enlace personal de vendedor.
- **SEO Técnico nativo**:
  - `Metadata` dinámica y canonical por ruta (`generateMetadata`) + `generateStaticParams` en `/servicios/[slug]`.
  - `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/manifest.ts`, iconos (`src/app/icon.png`, `src/app/apple-icon.png`) y generación dinámica de `opengraph-image.tsx` / `twitter-image.tsx`.
  - Datos estructurados JSON-LD: `ProfessionalService` (`LocalBusiness`), `Service`, `FAQPage` y `BreadcrumbList`.
  - Redirecciones 301 en `next.config.ts` para conservar enlaces antiguos (`/info/Ecommerce` → `/servicios/desarrollo-ecommerce`, `/info/Consulta` → `/consulta`, etc.).
- **Proxy seguro de tickets (`/api/tickets`)**: Valida datos y adjuntos en servidor y reenvía al backend de tickets (`TICKET_API_URL`), evitando problemas de CORS.

## Variables de entorno

Copia `.env.example` a `.env.local` y configura tus valores:

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_SITE_URL`: URL pública de producción (ej. `https://deve.com`).
- `TICKET_API_URL`: URL base del backend de tickets (por defecto `https://fixtic.somee.com`).
- `NEXT_PUBLIC_WHATSAPP_NUMBER`: Número de WhatsApp sin `+`.
- `NEXT_PUBLIC_ANDROID_APP_URL`: Enlace directo al APK o Play Store de la app Android.
- `POWERGY_API_URL`: URL base del API de POWERGY (por defecto `https://powergy.somee.com`). Usada por el proxy `/api/powergy`.
- `NEXT_PUBLIC_STORE_KEY`: Clave de tienda en el API de POWERGY (por defecto `deve`).
- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase (panel `/tienda/admin` y Storage).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Clave anon/publishable de Supabase.
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`: Bucket público para imágenes de producto (por defecto `powergy-product-images`).

## Desarrollo local

```bash
npm install
npm run dev
```

## Verificación y Build de producción

```bash
npm run lint
npm run typecheck
npm run build
npm run start
```

## CI/CD con Vercel

El workflow **Bazaar CI** (`.github/workflows/ci.yml`) ejecuta `npm ci`, ESLint (`npm run lint`), comprobación de TypeScript (`npm run typecheck`) y build de producción (`npm run build`) en cada push y pull request.

Vercel administra los despliegues automáticamente mediante su integración Git (sin guardar tokens de Vercel en GitHub Actions):
- Cada push a una rama o pull request genera un **Preview Deployment**.
- Cada push o merge en `main` genera un **Production Deployment**.

Para conectarlo en Vercel:

1. Importa el repositorio `TDevBazaar/Bazaar` en Vercel.
2. Mantén **Root Directory** en `./` (raíz del repositorio) y el framework **Next.js**.
3. En **Settings → Environment Variables**, añade las variables de `.env.example` para Production, Preview y Development (incluyendo `POWERGY_API_URL`, `NEXT_PUBLIC_STORE_KEY=deve`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`).
4. En **Settings → Git**, confirma `main` como **Production Branch**.
