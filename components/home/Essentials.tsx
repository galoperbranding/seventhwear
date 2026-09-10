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
  collection: string;
}

export default function Essentials() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/products?collection=essentials&limit=3')
      .then(res => res.json())
      .then(data => setProducts(data.products || []))
      .catch(() => {});
  }, []);

  return (
    <section className="collection-section">
      <div className="collection-header-centered reveal">
        <h2>Essentials</h2>
        <Link href="/shop?collection=essentials" className="btn btn-outline btn-viewall">View All</Link>
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
