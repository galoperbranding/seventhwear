'use client';

import Link from 'next/link';
import TextReveal from '@/components/TextReveal';

const looks = [
  {
    image: '/img/tshirt/polo_seventhwear_2.webp',
    alt: 'Look 1',
    items: [
      { name: 'Oversized Tee', slug: 'oversized-tee-urban' },
      { name: 'Cargo Pants', slug: 'cargo-pants-tactical' },
    ],
  },
  {
    image: '/img/tshirt/polo_seventhwear_3.webp',
    alt: 'Look 2',
    items: [
      { name: 'Heavy Hoodie', slug: 'heavy-hoodie-dark' },
      { name: 'Cargo Pants', slug: 'cargo-pants-tactical' },
    ],
  },
  {
    image: '/img/tshirt/polo_seventhwear_4.webp',
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
          <TextReveal as="h2">Shop the Look — Style Guide</TextReveal>
        </div>
        <div className="style-grid reveal-stagger-scale">
          {looks.map((look, i) => (
            <div className="style-card" key={i}>
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
