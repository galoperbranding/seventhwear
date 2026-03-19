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
  collection: string;
}

export default function Essentials() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/products?collection=essentials&limit=4')
      .then(res => res.json())
      .then(data => setProducts((data.products || []).slice(0, 4)))
      .catch(() => {});
  }, []);

  // Rellenar con el primer producto si hay menos de 4
  let displayProducts = products;
  if (products.length > 0 && products.length < 4) {
    displayProducts = [
      ...products,
      ...Array(4 - products.length).fill(products[0])
    ];
  }
  return (
    <section className="collection-section">
      <div className="collection-header-centered reveal">
        <TextReveal as="h2" className="collection-title">Essentials</TextReveal>
        <Link href="/shop?collection=essentials" className="btn btn-outline btn-viewall">View All</Link>
      </div>
      <ProductCarousel>
        {displayProducts.map((p, i) => (
          <ProductCard key={p.id + '-' + i} id={p.id} name={p.name} slug={p.slug} price={p.price}
            originalPrice={p.original_price} badge={p.badge} images={p.images} colors={p.colors} />
        ))}
      </ProductCarousel>
    </section>
  );
}
