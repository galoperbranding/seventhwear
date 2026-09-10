import { Metadata } from 'next';
import Link from 'next/link';
import Newsletter from '@/components/home/Newsletter';

export const metadata: Metadata = {
  title: 'Nuestra Historia — SEVENTHWEAR',
  description: 'Conoce la historia de SEVENTHWEAR. StreetRideWear — La fusión del streetwear y el ridewear.',
};

export default function BrandPage() {
  return (
    <>
      {/* About Hero */}
      <section className="about-hero">
        <div className="about-hero-bg">
          <video src="/video/seventhwear_brand_1.mp4" autoPlay muted loop playsInline></video>
        </div>
        <div className="about-hero-overlay"></div>
        <div className="about-hero-content">
          <h1 style={{ color: '#fff' }}>Nuestra<br />Historia</h1>
        </div>
      </section>

      {/* About Content */}
      <section className="about-content">
        <div className="container">
          {/* Block 1 */}
          <div className="about-grid reveal-left">
            <div className="about-text">
              <h3>StreetRideWear</h3>
              <p>SEVENTHWEAR nace de la fusión de dos mundos: la calle y el ride. Somos una marca para los que no se conforman con un solo estilo, para los que viven entre el asfalto urbano y los caminos de tierra.</p>
              <p>Creamos ropa que funciona en ambos terrenos — diseños que respiran autenticidad callejera con la funcionalidad técnica que demanda el riding. Cada pieza está pensada para resistir, para moverte y para expresar quién eres.</p>
            </div>
            <div className="about-image">
              <img src="/img/seventhwear_brand_2.jpg" alt="Streetwear lifestyle" loading="lazy" />
            </div>
          </div>

          {/* Block 2 */}
          <div className="about-grid reverse reveal-right">
            <div className="about-text">
              <h3>Nacidos de la adrenalina</h3>
              <p>Cada colección cuenta una historia. Desde las calles de la ciudad hasta las rutas de montaña, nuestras prendas están diseñadas para acompañarte en cada aventura.</p>
              <p>Usamos algodones orgánicos pesados, tejidos técnicos y acabados premium. No seguimos tendencias — creamos las nuestras. SEVENTHWEAR es más que ropa: es una actitud.</p>
            </div>
            <div className="about-image">
              <img src="/img/seventhwear_brand_3.jpg" alt="Ride lifestyle" loading="lazy" />
            </div>
          </div>

          {/* Block 3 */}
          <div className="about-grid reveal-left">
            <div className="about-text">
              <h3>Calidad sin compromisos</h3>
              <p>Cada prenda pasa por un riguroso control de calidad. Seleccionamos los mejores materiales y trabajamos con fábricas que respetan estándares éticos y medioambientales.</p>
              <p>Nuestros algodones son orgánicos certificados, nuestros tejidos técnicos utilizan materiales reciclados cuando es posible, y nuestros procesos de tinte minimizan el impacto ambiental.</p>
              <p>Creemos que la moda puede ser consciente sin sacrificar el estilo ni la funcionalidad.</p>
            </div>
            <div className="about-image">
              <img src="/img/seventhwear_brand_4.jpg" alt="Quality details" loading="lazy" />
            </div>
          </div>

          {/* Values */}
          <div style={{ textAlign: 'center', padding: '80px 0', maxWidth: '700px', margin: '0 auto' }}>
            <h2 className="reveal-title" style={{ marginBottom: '40px' }}>Nuestros Valores</h2>
            <div className="reveal-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', textAlign: 'center' }}>
              <div>
                <h4 style={{ marginBottom: '12px', fontSize: '1rem' }}>Autenticidad</h4>
                <p style={{ fontSize: '0.85rem' }}>Creamos desde la experiencia real en la calle y el ride. Cada diseño refleja nuestra comunidad.</p>
              </div>
              <div>
                <h4 style={{ marginBottom: '12px', fontSize: '1rem' }}>Calidad</h4>
                <p style={{ fontSize: '0.85rem' }}>Materiales premium y construcción duradera. Ropa hecha para resistir cualquier terreno.</p>
              </div>
              <div>
                <h4 style={{ marginBottom: '12px', fontSize: '1rem' }}>Comunidad</h4>
                <p style={{ fontSize: '0.85rem' }}>SEVENTHWEAR es un movimiento. Conectamos riders, skaters y amantes del streetwear.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="featured-banner reveal-scale">
        <div className="featured-banner-bg">
          <img src="/img/seventhwear_brand_5.jpg" alt="Explore collection" loading="lazy" />
        </div>
        <div className="featured-banner-overlay"></div>
        <div className="featured-banner-content reveal-left">
          <p className="featured-banner-tag">Explora la colección</p>
          <h2>Encuentra<br />tu estilo</h2>
          <p>Descubre las colecciones que definen el StreetRideWear. Desde tees oversized hasta jerseys técnicos de riding.</p>
          <Link href="/shop" className="btn btn-primary">Ver Tienda</Link>
        </div>
      </section>

      <Newsletter />
    </>
  );
}
