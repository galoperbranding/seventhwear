'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
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

export default function Collections() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/products?limit=50')
      .then(res => res.json())
      .then(data => setProducts(data.products || []))
      .catch(() => {});
  }, []);

  const streetProducts = products.filter(p => p.collection === 'street-collection').slice(0, 3);
  const rideProducts = products.filter(p => p.collection === 'ride-collection').slice(0, 3);

  return (
    <>
      {/* Street Collection */}
      <section className="collection-section">
        <div className="collection-header-centered reveal">
          <TextReveal as="h2" className="collection-title">Street Collection</TextReveal>
          <Link href="/shop?collection=street-collection" className="btn btn-outline btn-viewall">View All</Link>
        </div>
        <div className="container">
          <div className="product-grid-3 reveal-stagger">
            {streetProducts.map(p => (
              <ProductCard key={p.id} id={p.id} name={p.name} slug={p.slug} price={p.price}
                originalPrice={p.original_price} badge={p.badge} images={p.images} colors={p.colors} />
            ))}
          </div>
        </div>
      </section>

      {/* Ride Collection */}
      <section className="collection-section">
        <div className="collection-header-centered reveal">
          <TextReveal as="h2" className="collection-title">Ride Collection</TextReveal>
          <Link href="/shop?collection=ride-collection" className="btn btn-outline btn-viewall">View All</Link>
        </div>
        <div className="container">
          <div className="product-grid-3 reveal-stagger">
            {rideProducts.map(p => (
              <ProductCard key={p.id} id={p.id} name={p.name} slug={p.slug} price={p.price}
                originalPrice={p.original_price} badge={p.badge} images={p.images} colors={p.colors} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Banner */}
      <section className="featured-banner reveal-scale">
        <div className="featured-banner-bg">
          <video
            className="featured-banner-video"
            src="/video/seventhwear_jersey.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
        </div>
        <div className="featured-banner-overlay"></div>
        <div className="featured-banner-content reveal-left">
          <p className="featured-banner-tag">Producto destacado</p>
          <h2>Ride Jersey<br />&quot;Velocity&quot;</h2>
          <p>Jersey técnico de manga larga para MTB/MX. Tejido moisture-wicking con protección UV. Corte ergonómico diseñado para la posición de ride.</p>
          <Link href="/producto/ride-jersey-velocity" className="btn btn-primary">Comprar ahora</Link>
        </div>
      </section>
    </>
  );
}
