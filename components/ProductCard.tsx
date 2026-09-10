'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number | null;
  badge?: string | null;
  images: string[];
  colors: string[];
}

export default function ProductCard({
  id, name, slug, price, originalPrice, badge, images, colors,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  // Badge text in Spanish
  const badgeText = badge === 'new' ? 'Nuevo' : badge === 'sale' ? 'Oferta' : badge || '';

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: id,
      name,
      price,
      image: images[0] || '',
      size: 'M',
      color: '',
    }, 1);
    showToast(`${name} añadido al carrito`);
  }

  return (
    <Link href={`/producto/${slug}`} className="product-card">
      <div className="product-card-image">
        {badge && (
          <span className={`product-badge ${badge}`}>
            {badgeText}
          </span>
        )}
        <img src={images[0]} alt={name} loading="lazy" />
        {images[1] && (
          <img src={images[1]} alt={name} className="product-card-hover-img" loading="lazy" />
        )}
        <div className="quick-view-btn" onClick={handleQuickAdd}>Vista Rápida</div>
      </div>
      <div className="product-card-info">
        <h4 className="product-card-title">{name}</h4>
        <div className="product-card-price">
          {originalPrice ? (
            <>
              <span className="original-price">€{originalPrice.toFixed(2)}</span>
              <span className="sale-price">€{price.toFixed(2)}</span>
            </>
          ) : (
            <span className="current-price">€{price.toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
