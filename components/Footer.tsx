'use client';

import Link from 'next/link';

export default function Footer() {
  function openContact() {
    const overlay = document.querySelector('.contact-overlay');
    const popup = document.querySelector('.contact-popup');
    if (overlay) overlay.classList.add('open');
    if (popup) popup.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="logo">
              <img src="/img/seventhwear_logo_blanco.svg" alt="SEVENTHWEAR" />
            </Link>
            <p>StreetRideWear — La fusión del streetwear y el ridewear. Ropa para los que viven en la calle y la adrenalina.</p>
            <div className="footer-social">
              <a href="https://instagram.com/seventhwear" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="1.5"></rect><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.5"></circle><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"></circle></svg>
              </a>
              <a href="https://tiktok.com/@seventhwear" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.57 6.33 6.33 0 0 0 9.37 22a6.33 6.33 0 0 0 6.33-6.33V9.4a8.16 8.16 0 0 0 4.29 1.2V7.15a4.85 4.85 0 0 1-.4-.46z"/></svg>
              </a>
              <a href="https://youtube.com/@seventhwear" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.53 3.5 12 3.5 12 3.5s-7.53 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.7 31.7 0 0 0 0 12a31.7 31.7 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.85.55 9.38.55 9.38.55s7.53 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.7 31.7 0 0 0 24 12a31.7 31.7 0 0 0-.5-5.81zM9.54 15.57V8.43L15.82 12l-6.28 3.57z"/></svg>
              </a>
            </div>
          </div>
          <div className="footer-column">
            <h4>Tienda</h4>
            <ul>
              <li><Link href="/shop?collection=street-collection">Street Collection</Link></li>
              <li><Link href="/shop?collection=ride-collection">Ride Collection</Link></li>
              <li><Link href="/shop?collection=essentials">Essentials</Link></li>
              <li><Link href="/shop">Todos los productos</Link></li>
              <li><Link href="/shop?badge=sale">Sale</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Sobre</h4>
            <ul>
              <li><Link href="/brand">Nuestra historia</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/lookbook">Lookbook</Link></li>
              <li><Link href="/terminos">Términos y condiciones</Link></li>
              <li><Link href="/privacidad">Privacidad y cookies</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Ayuda</h4>
            <ul>
              <li><a href="#" onClick={(e) => { e.preventDefault(); openContact(); }}>Contacto</a></li>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/guia-tallas">Guía de tallas</Link></li>
              <li><Link href="/envios">Envíos</Link></li>
              <li><Link href="/devoluciones">Devoluciones</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 SEVENTHWEAR. Todos los derechos reservados.</p>
          <div className="footer-payments">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>PayPal</span>
            <span>Apple Pay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
