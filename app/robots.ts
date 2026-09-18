import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.seventhwear.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Zonas privadas o sin valor en búsqueda. No es una medida de
      // seguridad (para eso está el middleware), solo evita indexarlas.
      disallow: ['/admin', '/api/', '/cuenta', '/checkout', '/login', '/registro'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
