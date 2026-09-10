'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import ProductCard from '@/components/ProductCard';
import ProductCarousel from '@/components/ProductCarousel';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price: number | null;
  badge: string | null;
  images: string[];
  colors: string[];
  sizes: string[];
  details: string[];
  category: string;
  collection: string;
  stock: number;
}

export default function ProductDetailClient({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);
  const { addToCart, openCart } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setProduct(data.product);
        setRelated(data.related || []);
        if (data.product.sizes?.length > 0) {
          setSelectedSize(data.product.sizes[0]);
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>Cargando...</div>;
  }

  if (!product) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <h2>Producto no encontrado</h2>
        <Link href="/shop" className="btn btn-primary">Volver a la tienda</Link>
      </div>
    );
  }

  function handleAddToCart() {
    if (!product) return;
    if (!selectedSize) {
      showToast('Selecciona una talla', 'error');
      return;
    }
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] || '',
      size: selectedSize,
      color: '',
    }, quantity);
    showToast(`${product.name} añadido al carrito`);
  }

  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  return (
    <section className="product-detail">
      <div className="container">
        {/* Breadcrumb */}
        <div className="product-breadcrumb">
          <Link href="/">Inicio</Link>
          <span>/</span>
          <Link href="/shop">Tienda</Link>
          <span>/</span>
          <span>{product.name}</span>
        </div>

        <div className="product-detail-grid">
          {/* Gallery */}
          <div className="product-gallery">
            <div className="product-gallery-thumbs">
              {product.images.map((img, i) => (
                <div
                  key={i}
                  className={`product-gallery-thumb${mainImage === i ? ' active' : ''}`}
                  onClick={() => setMainImage(i)}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} />
                </div>
              ))}
            </div>
            <div className="product-gallery-main">
              <img src={product.images[mainImage] || product.images[0]} alt={product.name} />
            </div>
          </div>

          {/* Info */}
          <div className="product-info">
            <h1>{product.name}</h1>

            <div className="product-price-block">
              {product.original_price ? (
                <>
                  <span className="original">€{product.original_price.toFixed(2)}</span>
                  <span className="price">€{product.price.toFixed(2)}</span>
                  <span className="discount-badge">-{discount}%</span>
                </>
              ) : (
                <span className="price">€{product.price.toFixed(2)}</span>
              )}
            </div>

            <div className="product-description">
              <p>{product.description}</p>
            </div>

            <div className="product-options">
              {/* Size */}
              <div className="option-group">
                <div className="option-label">
                  <span>Talla</span>
                  <a href="#">Guía de tallas</a>
                </div>
                <div className="size-selector">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      className={`size-btn${selectedSize === size ? ' selected' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="product-actions">
              <div className="quantity-selector">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                <input type="number" value={quantity} readOnly min={1} max={10} />
                <button onClick={() => setQuantity(Math.min(10, quantity + 1))}>+</button>
              </div>
              <button className="add-to-cart-btn" onClick={handleAddToCart}>
                Añadir al carrito
              </button>
              <button className="wishlist-btn" aria-label="Favoritos">
                <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              </button>
            </div>

            {/* Meta */}
            <div className="product-meta">
              <div className="product-meta-item">
                <svg viewBox="0 0 24 24" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                <span>Envío gratis en pedidos +99€</span>
              </div>
              <div className="product-meta-item">
                <svg viewBox="0 0 24 24" strokeWidth="1.5"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                <span>Devoluciones gratuitas en 30 días</span>
              </div>
              <div className="product-meta-item">
                <svg viewBox="0 0 24 24" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                <span>Pago seguro SSL</span>
              </div>
            </div>

            {/* Accordions */}
            <div className="product-accordions">
              <div className="accordion-item">
                <div className="accordion-header" onClick={() => setOpenAccordion(openAccordion === 0 ? null : 0)}>
                  <span>Detalles del producto</span>
                  <span className="accordion-icon">{openAccordion === 0 ? '−' : '+'}</span>
                </div>
                {openAccordion === 0 && (
                  <div className="accordion-content" style={{ maxHeight: '500px' }}>
                    <div className="accordion-content-inner">
                      <ul>
                        {product.details.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              <div className="accordion-item">
                <div className="accordion-header" onClick={() => setOpenAccordion(openAccordion === 1 ? null : 1)}>
                  <span>Cuidados</span>
                  <span className="accordion-icon">{openAccordion === 1 ? '−' : '+'}</span>
                </div>
                {openAccordion === 1 && (
                  <div className="accordion-content" style={{ maxHeight: '500px' }}>
                    <div className="accordion-content-inner">
                      <ul>
                        <li>Lavar a máquina max. 30°C</li>
                        <li>No usar secadora</li>
                        <li>Planchar a temperatura media</li>
                        <li>No usar lejía</li>
                        <li>Lavar del revés</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              <div className="accordion-item">
                <div className="accordion-header" onClick={() => setOpenAccordion(openAccordion === 2 ? null : 2)}>
                  <span>Envío y devoluciones</span>
                  <span className="accordion-icon">{openAccordion === 2 ? '−' : '+'}</span>
                </div>
                {openAccordion === 2 && (
                  <div className="accordion-content" style={{ maxHeight: '500px' }}>
                    <div className="accordion-content-inner">
                      <p>Envío estándar: 3-5 días laborables. Envío express: 1-2 días laborables. Envío gratuito en pedidos superiores a 99€. Devoluciones gratuitas en los primeros 30 días.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="collection-section" style={{ marginTop: '4rem' }}>
            <div className="collection-header">
              <h2 className="reveal">También te puede gustar</h2>
              <Link href="/shop" className="view-all-link">Ver todo</Link>
            </div>
            <ProductCarousel>
              {related.map(p => (
                <ProductCard key={p.id} id={p.id} name={p.name} slug={p.slug} price={p.price}
                  originalPrice={p.original_price} badge={p.badge} images={p.images} colors={p.colors} />
              ))}
            </ProductCarousel>
          </section>
        )}
      </div>
    </section>
  );
}
