'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

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
        const best = all.filter((p: Product) => p.badge === 'new').slice(0, 6);
        setProducts(best.length > 0 ? best : all.slice(0, 6));
      })
      .catch(() => {});
  }, []);

  return (
    <section className="collection-section">
      <div className="collection-header-centered reveal">
        <h2>Bestsellers</h2>
        <Link href="/shop" className="btn btn-outline btn-viewall">View All</Link>
      </div>
      <div className="container">
        <div className="product-grid-3">
          {products.map(p => (
            <ProductCard key={p.id} id={p.id} name={p.name} slug={p.slug} price={p.price}
              originalPrice={p.original_price} badge={p.badge} images={p.images} colors={p.colors} />
          ))}
        </div>
      </div>
    </section>
  );
}
