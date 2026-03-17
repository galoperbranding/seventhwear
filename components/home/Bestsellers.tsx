'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import ProductCarousel from '@/components/ProductCarousel';
import TextReveal from '@/components/TextReveal';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  badge: string | null;
  images: string[];
  colors: string[];
}

export default function Bestsellers() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/products?limit=50')
      .then(res => res.json())
      .then(data => {
        const all = data.products || [];
        const best = all.filter((p: Product) => p.badge === 'new').slice(0, 8);
        setProducts(best.length > 0 ? best : all.slice(0, 8));
      })
      .catch(() => {});
  }, []);

  return (
    <section className="collection-section">
      <div className="collection-header-centered reveal">
        <TextReveal as="h2" className="collection-title">Bestsellers</TextReveal>
        <Link href="/shop" className="btn btn-outline btn-viewall">View All</Link>
      </div>
      <ProductCarousel>
        {products.map(p => (
          <ProductCard key={p.id} id={p.id} name={p.name} slug={p.slug} price={p.price}
            originalPrice={p.original_price} badge={p.badge} images={p.images} colors={p.colors} />
        ))}
      </ProductCarousel>
    </section>
  );
}
