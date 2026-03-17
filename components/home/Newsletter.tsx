'use client';

import { useState, FormEvent } from 'react';
import { useToast } from '@/context/ToastContext';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { showToast } = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
        showToast('¡Gracias por suscribirte! Usa el código WELCOME7 para 10% de descuento.');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="newsletter-section">
      <div className="container">
        <div className="newsletter-content reveal-blur">
          <h2>Únete al movimiento</h2>
          <p>Sé el primero en conocer nuevos lanzamientos y drops exclusivos.</p>
          <span className="newsletter-discount">10% OFF — Código: WELCOME7</span>
          {status === 'success' ? (
            <p style={{ color: '#4caf50', marginTop: '1rem' }}>¡Gracias por suscribirte! Revisa tu correo.</p>
          ) : (
            <form className="newsletter-form" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Tu email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <button type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Enviando...' : 'Suscribirse'}
              </button>
            </form>
          )}
          {status === 'error' && (
            <p style={{ color: '#f44336', marginTop: '0.5rem', fontSize: '0.9rem' }}>Error al suscribirse. Intenta de nuevo.</p>
          )}
        </div>
      </div>
    </section>
  );
}
