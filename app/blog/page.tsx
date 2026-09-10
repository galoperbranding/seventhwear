import { Metadata } from 'next';
import Link from 'next/link';
import BlogGrid from './BlogGrid';
import getDb from '@/lib/db';

export const metadata: Metadata = {
  title: 'Blog — SEVENTHWEAR',
  description: 'Noticias, cultura streetwear & ridewear, y novedades de SEVENTHWEAR.',
};

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  cover_image: string;
  published_at: string;
  category: string;
}

const STATIC_POSTS = [
  {
    slug: 'streetridewear-la-fusion',
    title: 'StreetRideWear: La fusión que define una generación',
    excerpt: 'Nacimos de la necesidad de unir dos mundos: la cultura urbana del streetwear y la adrenalina del ridewear. Así nació SEVENTHWEAR.',
    image: '/img/seventhwear_brand_2.jpg',
    date: '15 Feb 2026',
    category: 'Cultura',
  },
  {
    slug: 'calidad-sin-compromisos',
    title: 'Calidad sin compromisos: Nuestros materiales',
    excerpt: 'Algodón orgánico 280gsm, tejidos técnicos moisture-wicking con protección UV. Cada material está seleccionado para durar y rendir.',
    image: '/img/seventhwear_brand_4.jpg',
    date: '8 Feb 2026',
    category: 'Producto',
  },
  {
    slug: 'ride-collection-ss26',
    title: 'Ride Collection SS26: Diseñada para la adrenalina',
    excerpt: 'Nuestra nueva Ride Collection combina cortes ergonómicos con tejidos técnicos de alto rendimiento. Diseñada para riders, por riders.',
    image: '/img/seventhwear_jersey.jpg',
    date: '1 Feb 2026',
    category: 'Colección',
  },
];

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr.replace(' ', 'T')).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function BlogPage() {
  // Fetch posts from DB
  let dbPosts: { slug: string; title: string; excerpt: string; image: string; date: string; category: string }[] = [];
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT slug, title, excerpt, cover_image, published_at, category
      FROM cms_posts
      WHERE status = 'published'
      ORDER BY published_at DESC
    `).all() as Post[];

    dbPosts = rows.map(p => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      image: p.cover_image || '/img/seventhwear_brand_2.jpg',
      date: p.published_at ? formatDate(p.published_at) : '',
      category: p.category || 'Blog',
    }));
  } catch {
    // DB not ready, use static posts
  }

  // Merge: DB posts first, then static posts (avoid duplicates by slug)
  const dbSlugs = new Set(dbPosts.map(p => p.slug));
  const staticFiltered = STATIC_POSTS.filter(p => !dbSlugs.has(p.slug));
  const allPosts = [...dbPosts, ...staticFiltered];

  return (
    <>
      <div className="page-header">
        <h1>Blog</h1>
        <p>Cultura, producto y novedades</p>
      </div>

      <div className="container" style={{ padding: '60px 0' }}>
        <BlogGrid posts={allPosts} />

        <div style={{ textAlign: 'center', marginTop: '60px', padding: '40px 0', borderTop: '1px solid var(--color-border)' }} className="reveal">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>Más contenido próximamente</p>
          <Link href="/shop" className="btn btn-primary">Explorar la tienda</Link>
        </div>
      </div>
    </>
  );
}
