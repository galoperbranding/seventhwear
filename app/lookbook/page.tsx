import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Lookbook — SEVENTHWEAR',
  description: 'Descubre las últimas colecciones y estilos SEVENTHWEAR en nuestro lookbook.',
};

export default function LookbookPage() {
  return (
    <>
      <div className="page-header">
        <h1>Lookbook</h1>
        <p>Colecciones &amp; Estilos — SS26</p>
      </div>

      <div className="container" style={{ padding: '60px 0' }}>
        {/* Street Collection */}
        <section className="lookbook-section">
          <h2 className="reveal-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2rem' }}>
            Street Collection
          </h2>
          <div className="reveal-stagger-scale" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
            <div style={{ aspectRatio: '3/4', background: 'var(--color-bg-secondary)', overflow: 'hidden' }}>
              <img src="/img/seventhwear_1.jpg" alt="Street Collection 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
            </div>
            <div style={{ aspectRatio: '3/4', background: 'var(--color-bg-secondary)', overflow: 'hidden' }}>
              <img src="/img/seventhwear_2.jpg" alt="Street Collection 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
            </div>
            <div style={{ aspectRatio: '3/4', background: 'var(--color-bg-secondary)', overflow: 'hidden' }}>
              <img src="/img/seventhwear_3.jpg" alt="Street Collection 3" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href="/shop?collection=street-collection" className="btn btn-outline">Ver Street Collection</Link>
          </div>
        </section>

        {/* Ride Collection */}
        <section className="lookbook-section" style={{ marginTop: '80px' }}>
          <h2 className="reveal-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2rem' }}>
            Ride Collection
          </h2>
          <div className="reveal-stagger-scale" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            <div style={{ aspectRatio: '3/4', background: 'var(--color-bg-secondary)', overflow: 'hidden' }}>
              <img src="/img/seventhwear_4.jpg" alt="Ride Collection 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
            </div>
            <div style={{ aspectRatio: '3/4', background: 'var(--color-bg-secondary)', overflow: 'hidden' }}>
              <img src="/img/seventhwear_5.jpg" alt="Ride Collection 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href="/shop?collection=ride-collection" className="btn btn-outline">Ver Ride Collection</Link>
          </div>
        </section>

        {/* Essentials */}
        <section className="lookbook-section" style={{ marginTop: '80px' }}>
          <h2 className="reveal-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2rem' }}>
            Essentials
          </h2>
          <div className="reveal-stagger-scale" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '4px' }}>
            <div style={{ aspectRatio: '16/9', background: 'var(--color-bg-secondary)', overflow: 'hidden' }}>
              <img src="/img/seventhwear_brand_2.jpg" alt="Essentials 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
            </div>
            <div style={{ aspectRatio: '9/16', background: 'var(--color-bg-secondary)', overflow: 'hidden' }}>
              <img src="/img/seventhwear_brand_3.jpg" alt="Essentials 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href="/shop?collection=essentials" className="btn btn-outline">Ver Essentials</Link>
          </div>
        </section>

        {/* Brand CTA */}
        <section style={{ marginTop: '80px', textAlign: 'center', padding: '60px 0' }} className="reveal-blur">
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem, 2.5vw, 2rem)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem' }}>
            StreetRideWear
          </p>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto 2rem' }}>
            Nacidos de la fusión entre el streetwear urbano y la cultura del ride. Cada pieza está diseñada para quienes viven entre el asfalto y los caminos de tierra.
          </p>
          <Link href="/brand" className="btn btn-primary">Nuestra historia</Link>
        </section>
      </div>
    </>
  );
}
