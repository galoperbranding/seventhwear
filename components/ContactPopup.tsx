'use client';

import { useEffect } from 'react';

export default function ContactPopup() {
  function closeContact() {
    const overlay = document.querySelector('.contact-overlay');
    const popup = document.querySelector('.contact-popup');
    if (overlay) overlay.classList.remove('open');
    if (popup) popup.classList.remove('open');
    document.body.style.overflow = '';
  }

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') closeContact();
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <>
      <div className="contact-overlay" onClick={closeContact}></div>
      <div className="contact-popup">
        <button className="contact-popup-close" onClick={closeContact}>&times;</button>
        <div className="contact-popup-header">
          <h3>Contacto</h3>
          <p>¿Tienes alguna duda? Estamos aquí para ayudarte.</p>
        </div>
        <div className="contact-popup-body">
          <div className="contact-item">
            <div className="contact-item-icon">
              <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            </div>
            <div className="contact-item-text">
              <div className="contact-item-label">Email</div>
              <div className="contact-item-value"><a href="mailto:hello@seventhwear.com">hello@seventhwear.com</a></div>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-item-icon">
              <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </div>
            <div className="contact-item-text">
              <div className="contact-item-label">WhatsApp</div>
              <div className="contact-item-value"><a href="https://wa.me/51913058154" target="_blank" rel="noopener noreferrer">+51 913 058 154</a></div>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-item-icon">
              <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </div>
            <div className="contact-item-text">
              <div className="contact-item-label">Ubicación</div>
              <div className="contact-item-value">Lima, Perú</div>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-item-icon">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <div className="contact-item-text">
              <div className="contact-item-label">Horario de atención</div>
              <div className="contact-item-value">Lun — Vie: 10:00 – 18:00</div>
            </div>
          </div>
          <div className="contact-social">
            <a href="https://facebook.com/seventhwear" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="https://instagram.com/seventhwear" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><circle cx="12" cy="12" r="5"></circle><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"></circle></svg>
            </a>
            <a href="https://tiktok.com/@seventhwear" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.57 6.33 6.33 0 0 0 9.37 22a6.33 6.33 0 0 0 6.33-6.33V9.4a8.16 8.16 0 0 0 4.29 1.2V7.15a4.85 4.85 0 0 1-.4-.46z"/></svg>
            </a>
            <a href="https://youtube.com/@seventhwear" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.53 3.5 12 3.5 12 3.5s-7.53 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.7 31.7 0 0 0 0 12a31.7 31.7 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.85.55 9.38.55 9.38.55s7.53 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.7 31.7 0 0 0 24 12a31.7 31.7 0 0 0-.5-5.81zM9.54 15.57V8.43L15.82 12l-6.28 3.57z"/></svg>
            </a>
            <a href="https://x.com/seventhwear" target="_blank" rel="noopener noreferrer" aria-label="X">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </div>
        <div className="contact-popup-footer">
          <p>Respondemos en menos de 24h.<br />También puedes escribirnos por DM en Instagram.</p>
        </div>
      </div>
    </>
  );
}
