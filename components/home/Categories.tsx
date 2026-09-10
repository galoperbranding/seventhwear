'use client';

import Link from 'next/link';

const categories = [
  {
    name: 'Tees',
    slug: 'tees',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop',
  },
  {
    name: 'Hoodies',
    slug: 'hoodies',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop',
  },
  {
    name: 'Pants',
    slug: 'pants',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=600&fit=crop',
  },
];

export default function Categories() {
  return (
    <section className="categories-section reveal">
      <div className="container">
        <div className="section-header">
          <h2>Categorías</h2>
        </div>
      </div>
      <div className="categories-grid">
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
