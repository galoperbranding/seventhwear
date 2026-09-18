'use client';

import Link from 'next/link';
import TextReveal from '@/components/TextReveal';

const categories = [
  {
    name: 'Tees',
    slug: 'tees',
    image: '/img/tees_seventhwear.png',
  },
  {
    name: 'Hoodies',
    slug: 'hoodies',
    image: '/img/hoodie_seventhwear.png',
  },
  {
    name: 'Pants',
    slug: 'pants',
    image: '/img/pants_seventhwear.png',
  },
];

export default function Categories() {
  return (
    <section className="categories-section">
      <div className="container">
        <div className="section-header reveal">
          <TextReveal as="h2">Categorías</TextReveal>
        </div>
      </div>
      <div className="categories-grid reveal-stagger-scale">
        {categories.map(cat => (
          <Link href={`/shop?category=${cat.slug}`} className="category-card" key={cat.slug}>
            <img src={cat.image} alt={cat.name} loading="lazy" />
            <div className="category-card-overlay">
              <h3>{cat.name}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
