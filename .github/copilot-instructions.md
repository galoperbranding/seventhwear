# SEVENTHWEAR — Project Instructions

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

### CSS
- Estilos SOLO en `app/globals.css` — no crear archivos CSS adicionales
- Variables CSS en `:root` para colores, fonts, transiciones
- Design: Minimalista B&W, inspirado en nineyard.world
- Responsive con media queries al final del archivo

### Database
- 8 tablas: products, product_images, users, orders, order_items, newsletter_subscribers, sessions, cart_items
- Usar `better-sqlite3` directo (no ORM)
- Migraciones inline en `lib/db.ts`

### Auth
- JWT en cookie `auth-token`
- Admin protegido por verificación de rol en API routes
- Context `AuthContext` para estado client-side

## Build & Dev
```bash
npm run dev              # Dev server (Turbopack)
npm run build            # Production build (33 routes)
npm run seed             # Seed DB (12 products + admin)
npm run generate-secret  # Generate JWT secret
```

## Environment
Copiar `.env.example` a `.env.local`. Variables requeridas:
- `JWT_SECRET` (min 32 chars en producción)
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE`
- `SMTP_*` para email
- `DATABASE_PATH`

## Routes

### Pages
`/` `/shop` `/producto/[slug]` `/checkout` `/checkout/success` `/brand` `/cuenta` `/login` `/registro` `/blog` `/lookbook` `/envios` `/devoluciones` `/guia-tallas` `/faq` `/privacidad` `/terminos` `/admin` `/admin/productos` `/admin/pedidos`

### API
`/api/products` `/api/products/[slug]` `/api/orders` `/api/orders/capture` `/api/auth/login` `/api/auth/logout` `/api/auth/me` `/api/auth/register` `/api/newsletter` `/api/admin` `/api/admin/products` `/api/admin/orders` `/api/admin/upload`

## Security
- Headers de seguridad en `next.config.js` (HSTS, X-Frame-Options, etc.)
- `poweredByHeader: false`
- Validar JWT secret length en producción
- Template de producción en `.env.production.template`

## Reference
El sitio estático original en `../seventhwear_op/` sirve como referencia para diseño y comportamiento visual. Comparar CSS/HTML cuando haya dudas de estilo.
