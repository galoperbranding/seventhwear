# SEVENTHWEAR — Claude Code Instructions

## Overview
E-commerce para SEVENTHWEAR (StreetRideWear). Migrado de sitio estático HTML/CSS/JS a Next.js App Router. El sitio original está en `../seventhwear_op/` como referencia visual.

## Tech Stack
- **Next.js 16** (App Router, Turbopack), React 19, TypeScript 5.9
- **Database**: SQLite via better-sqlite3 (WAL mode), path: `./data/seventhwear.db`
- **Payments**: PayPal REST API (sandbox/live)
- **Email**: nodemailer (SMTP)
- **Auth**: JWT (bcryptjs + jsonwebtoken) en cookies
- **CSS**: Un solo archivo `app/globals.css` (~2500 líneas). NO Tailwind, NO CSS modules
- **Fonts**: Gobold (custom woff2 en `/public/fonts/`) + Inter (Google Fonts)

## Architecture
```
app/                    → Pages y API routes (App Router)
components/             → React components (PascalCase.tsx)
  home/                 → Components exclusivos del homepage
  product/              → Product detail client
  shop/                 → Shop filters/content
context/                → React Context providers (Auth, Cart, Toast)
lib/                    → Server utilities (db.ts, auth.ts, email.ts, paypal.ts)
public/                 → Static assets (img/, fonts/, uploads/)
data/                   → SQLite database
```

## Key Conventions

### Language
- **UI, rutas, contenido**: Todo en español (producto, cuenta, envios, etc.)
- **Code**: Variables y funciones en inglés

### Naming
- Components: PascalCase (`ProductCard.tsx`)
- API routes: `route.ts` con `NextRequest`/`NextResponse`
- Pages: `page.tsx` en carpeta con nombre de ruta

### CSS — MUY IMPORTANTE
- Estilos SOLO en `app/globals.css` — **no crear archivos CSS adicionales**
- Variables CSS en `:root` para colores, fonts, transiciones
- Design: Minimalista B&W, inspirado en nineyard.world
- Responsive con media queries al final del archivo
- **No sugerir ni usar Tailwind ni CSS Modules**

### Database
- 17 tablas:
  - **Tienda**: `products`, `orders`, `order_items`, `cart_items`, `discount_codes`
  - **Usuarios**: `users`, `sessions`, `addresses`, `newsletter_subscribers`
  - **CRM**: `customer_notes`, `customer_tags`, `customer_tag_assignments`
  - **CMS**: `cms_pages`, `cms_posts`, `cms_banners`, `cms_lookbook`
  - **Auditoría**: `audit_log`
- Usar `better-sqlite3` directo — **sin ORM**
- Migraciones inline en `lib/db.ts`

### Auth
- JWT en cookie `auth_token`
- Admin protegido en dos capas: `middleware.ts` (runtime nodejs, verifica firma
  del JWT y `role === 'admin'`) + verificación de rol en cada API route
- Context `AuthContext` para estado client-side

## Rules — Lo que NUNCA debes hacer
- ❌ No crear archivos CSS adicionales (todo va en `globals.css`)
- ❌ No usar Tailwind ni CSS Modules
- ❌ No usar un ORM (Prisma, Drizzle, etc.) — solo `better-sqlite3` directo
- ❌ No cambiar la estructura de carpetas sin preguntar
- ❌ No instalar dependencias sin confirmar primero
- ❌ No modificar `next.config.js` o `tsconfig.json` sin avisar
- ❌ No usar `any` en TypeScript

## Build & Dev
```bash
npm run dev              # Dev server (Turbopack)
npm run build            # Production build
npm run seed             # Seed DB (12 products + admin)
npm run generate-secret  # Generate JWT secret
```

## Environment
Copiar `.env.example` a `.env.local`. Variables requeridas:
- `JWT_SECRET` (min 32 chars en producción)
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE`
- `SMTP_*` para email
- `DATABASE_PATH`

Opcionales: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (login con Google),
`CRON_SECRET` (tareas programadas), `NEXT_PUBLIC_BASE_URL`.

## Routes

### Pages
`/` `/admin` `/admin/analytics` `/admin/clientes` `/admin/clientes/[id]` `/admin/cms` `/admin/cms/banners` `/admin/cms/blog` `/admin/cms/lookbook` `/admin/cms/paginas` `/admin/pedidos` `/admin/productos` `/blog` `/brand` `/checkout` `/checkout/success` `/cuenta` `/devoluciones` `/envios` `/faq` `/guia-tallas` `/login` `/lookbook` `/privacidad` `/producto/[slug]` `/registro` `/shop` `/terminos`

### API
`/api/admin` `/api/admin/analytics` `/api/admin/birthdays` `/api/admin/cms/banners` `/api/admin/cms/lookbook` `/api/admin/cms/pages` `/api/admin/cms/posts` `/api/admin/customers` `/api/admin/customers/[id]` `/api/admin/customers/[id]/notes` `/api/admin/customers/[id]/tags` `/api/admin/customers/export` `/api/admin/orders` `/api/admin/products` `/api/admin/tags` `/api/admin/upload` `/api/auth/check-email` `/api/auth/google` `/api/auth/google/callback` `/api/auth/login` `/api/auth/logout` `/api/auth/me` `/api/auth/register` `/api/auth/verify` `/api/discount/validate` `/api/newsletter` `/api/orders` `/api/orders/capture` `/api/products` `/api/products/[slug]`

## Security
- Headers de seguridad en `next.config.js` (HSTS, X-Frame-Options, etc.)
- `poweredByHeader: false`
- Validar JWT secret length en producción

## Reference
El sitio estático original en `../seventhwear_op/` sirve como referencia para diseño y comportamiento visual. Comparar CSS/HTML cuando haya dudas de estilo.
