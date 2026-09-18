# SEVENTHWEAR — Project brief

## Overview
Este repositorio es el ecommerce principal de SEVENTHWEAR, una marca StreetRideWear. Es una migración desde un sitio estático HTML/CSS/JS a Next.js App Router.

## Stack principal
- Next.js 16 + App Router
- React 19 + TypeScript
- SQLite con better-sqlite3
- Auth con JWT + bcryptjs + cookies
- PayPal REST API
- nodemailer para email
- CSS global en app/globals.css (sin Tailwind)

## Estructura clave
- app/ → páginas y API routes
- components/ → componentes reutilizables
- context/ → AuthContext, CartContext, ToastContext
- lib/ → db, auth, email, paypal, security
- public/ → assets e imágenes
- data/ → base SQLite

## Rutas importantes
- Home: /
- Shop: /shop
- Producto: /producto/[slug]
- Checkout: /checkout
- Cuenta: /cuenta
- Login: /login
- Registro: /registro
- Blog: /blog
- Admin: /admin

## APIs clave
- /api/products
- /api/products/[slug]
- /api/auth/login
- /api/auth/register
- /api/auth/me
- /api/orders
- /api/orders/capture
- /api/admin/products
- /api/admin/orders
- /api/admin/upload

## Comandos útiles
```bash
npm run dev
npm run build
npm run seed
```

## Reglas de trabajo del proyecto
- Todo el contenido UI y texto principal está en español.
- El código usa nombres en inglés, pero contenido visible en español.
- No crear CSS modular; usar app/globals.css
- Mantener compatibilidad con App Router de Next.js.
- Siempre validar con `npm run build` antes de cerrar cambios importantes.

## Estado actual
La app está funcionando como ecommerce principal. El proyecto landing está separado en `web_seventhwear_lista` y no es el ecommerce.

## Prioridades cuando vuelvas
1. Revisar primero `app/`, `components/`, `lib/` y `context/`
2. No empezar desde cero; reutilizar uso de Auth, Cart y productos
3. Si aparece un error de build, revisar primero `lib/` y rutas API
4. Mantener el diseño minimalista + B/W + streetwear

## Archivos de referencia
- [app/layout.tsx](app/layout.tsx)
- [app/globals.css](app/globals.css)
- [lib/db.ts](lib/db.ts)
- [lib/auth.ts](lib/auth.ts)
- [context/AuthContext.tsx](context/AuthContext.tsx)
- [context/CartContext.tsx](context/CartContext.tsx)
