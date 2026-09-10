'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('seventhwear_cookies');
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem('seventhwear_cookies', 'true');
    setVisible(false);
  }

  function decline() {
    localStorage.setItem('seventhwear_cookies', 'declined');
    setVisible(false);
  }

  return (
    <div className={`cookie-banner ${visible ? 'show' : ''}`}>
      <p>
        Utilizamos cookies para mejorar tu experiencia. Al continuar navegando, aceptas nuestra{' '}
        <Link href="/privacidad" style={{ color: '#000', textDecoration: 'underline' }}>política de cookies</Link>.
      </p>
      <div className="cookie-banner-actions">
        <button className="btn btn-small btn-outline" onClick={decline}>Rechazar</button>
        <button className="btn btn-small btn-primary" onClick={accept}>Aceptar</button>
      </div>
    </div>
  );
}
