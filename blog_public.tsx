import { Metadata } from 'next';
import Link from 'next/link';
import BlogGrid from './BlogGrid';

export const metadata: Metadata = {
  title: 'Blog — SEVENTHWEAR',
  description: 'Noticias, cultura streetwear & ridewear, y novedades de SEVENTHWEAR.',
};

const posts = [
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

export default function BlogPage() {
  return (
    <>
      <div className="page-header">
        <h1>Blog</h1>
        <p>Cultura, producto y novedades</p>
      </div>

      <div className="container" style={{ padding: '60px 0' }}>
        <BlogGrid posts={posts} />

        <div style={{ textAlign: 'center', marginTop: '60px', padding: '40px 0', borderTop: '1px solid var(--color-border)' }} className="reveal">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>Más contenido próximamente</p>
          <Link href="/shop" className="btn btn-primary">Explorar la tienda</Link>
        </div>
      </div>
    </>
  );
}
