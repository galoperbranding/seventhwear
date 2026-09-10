'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    fetch('/api/orders/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paypal_order_id: token }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.order_number) {
          setOrderNumber(data.order_number);
          setStatus('success');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [token]);

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
        Procesando tu pago...
      </div>
    );
  }

  if (status === 'error') {
    return (
      <>
        <div className="page-header">
          <h1>Error en el pago</h1>
        </div>
        <div className="container" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <p style={{ marginBottom: '1.5rem' }}>Hubo un problema al procesar tu pago. Por favor, contacta con nosotros si el problema persiste.</p>
          <Link href="/shop" className="btn btn-primary">Volver a la tienda</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>¡Pedido confirmado!</h1>
      </div>
      <div className="container" style={{ textAlign: 'center', padding: '3rem 1.5rem', maxWidth: '600px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✓</div>
        <h2 style={{ marginBottom: '1rem' }}>Gracias por tu compra</h2>
        <p style={{ opacity: 0.7, marginBottom: '0.5rem' }}>Pedido #{orderNumber}</p>
        <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Te hemos enviado un email de confirmación con los detalles de tu pedido.</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/cuenta" className="btn btn-primary">Ver mis pedidos</Link>
          <Link href="/shop" className="btn btn-outline">Seguir comprando</Link>
        </div>
      </div>
    </>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>Cargando...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
