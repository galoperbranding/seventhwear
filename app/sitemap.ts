import type { MetadataRoute } from 'next';
import getDb from '@/lib/db';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.seventhwear.com';

// Páginas públicas. Las de /admin, /cuenta, /checkout y /login quedan fuera
// a propósito: son privadas o no aportan nada en búsqueda.
const STATIC_PATHS = [
  { path: '', priority: 1.0, changeFrequency: 'daily' as const },
  { path: '/shop', priority: 0.9, changeFrequency: 'daily' as const },
  { path: '/lookbook', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/blog', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/brand', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: '/guia-tallas', priority: 0.5, changeFrequency: 'monthly' as const },
  { path: '/envios', priority: 0.4, changeFrequency: 'monthly' as const },
  { path: '/devoluciones', priority: 0.4, changeFrequency: 'monthly' as const },
  { path: '/faq', priority: 0.4, changeFrequency: 'monthly' as const },
  { path: '/terminos', priority: 0.2, changeFrequency: 'yearly' as const },
  { path: '/privacidad', priority: 0.2, changeFrequency: 'yearly' as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${BASE_URL}${p.path}`,
    lastModified: new Date(),
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  // Si la DB no está disponible durante el build, el sitemap estático
  // sigue siendo válido: mejor eso que romper la generación.
  try {
    const products = getDb()
      .prepare('SELECT slug, updated_at FROM products WHERE is_active = 1')
      .all() as Array<{ slug: string; updated_at: string | null }>;

    for (const product of products) {
      entries.push({
        url: `${BASE_URL}/producto/${product.slug}`,
        lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  } catch (error) {
    console.error('Sitemap: no se pudieron cargar los productos', error);
  }

  return entries;
}
