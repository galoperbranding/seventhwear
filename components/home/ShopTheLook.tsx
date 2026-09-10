'use client';

import Link from 'next/link';

const looks = [
  {
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&h=800&fit=crop',
    alt: 'Look 1',
    items: [
      { name: 'Oversized Tee', slug: 'oversized-tee-urban' },
      { name: 'Cargo Pants', slug: 'cargo-pants-tactical' },
    ],
  },
  {
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
    alt: 'Look 2',
    items: [
      { name: 'Heavy Hoodie', slug: 'heavy-hoodie-dark' },
      { name: 'Cargo Pants', slug: 'cargo-pants-tactical' },
    ],
  },
  {
    image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&h=800&fit=crop',
    alt: 'Look 3',
    items: [
      { name: 'Graphic Tee', slug: 'graphic-tee-skull-rider' },
      { name: 'Windbreaker', slug: 'windbreaker-reflective' },
    ],
  },
];

export default function ShopTheLook() {
  return (
    <section className="shop-the-look">
      <div className="container">
        <div className="section-header reveal">
          <h2>Shop the Look — Style Guide</h2>
        </div>
        <div className="style-grid">
          {looks.map((look, i) => (
            <div className="style-card reveal" key={i}>
              <div className="style-card-image">
                <img src={look.image} alt={look.alt} loading="lazy" />
              </div>
              <div className="style-card-overlay">
                {look.items.map((item, j) => (
                  <Link href={`/producto/${item.slug}`} key={j}>{item.name}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
