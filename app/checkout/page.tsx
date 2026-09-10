'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('PE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const shippingCost = cartTotal >= 100 ? 0 : 9.95;
  const total = cartTotal + shippingCost;

  if (cart.length === 0) {
    return (
      <>
        <div className="page-header">
          <h1>Checkout</h1>
        </div>
        <div className="container" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Tu carrito está vacío</p>
          <Link href="/shop" className="btn btn-primary">Ir a la tienda</Link>
        </div>
      </>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            product_id: item.productId,
            size: item.size,
            quantity: item.quantity,
          })),
          shipping_address: {
            first_name: firstName,
            last_name: lastName,
            address,
            city,
            state,
            postal_code: postalCode,
            country,
            phone,
          },
          customer_email: email,
          customer_name: `${firstName} ${lastName}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear el pedido');
      }

      // Redirect to PayPal for payment
      if (data.approval_url) {
        clearCart();
        window.location.href = data.approval_url;
      } else {
        throw new Error('No se obtuvo la URL de pago');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '0.75rem 1rem', borderRadius: '4px', fontSize: '0.95rem', width: '100%' };
  const labelStyle = { fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.1em', opacity: 0.7, display: 'block', marginBottom: '0.5rem' };

  return (
    <>
      <div className="page-header">
        <h1>Checkout</h1>
        <p>Completa tu pedido</p>
      </div>

      <div className="container" style={{ maxWidth: '1000px', padding: '2rem 1.5rem 4rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem', alignItems: 'start' }}>
          {/* Shipping Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos de envío</h3>

            {error && (
              <div style={{ background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)', padding: '0.75rem 1rem', borderRadius: '4px', color: '#f44336', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Nombre</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Apellido</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Teléfono</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Dirección</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} required style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Ciudad</label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Estado / Región</label>
                <input type="text" value={state} onChange={e => setState(e.target.value)} required style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Código postal</label>
                <input type="text" value={postalCode} onChange={e => setPostalCode(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>País</label>
                <select value={country} onChange={e => setCountry(e.target.value)} style={inputStyle}>
                  <option value="PE">Perú</option>
                  <option value="ES">España</option>
                  <option value="MX">México</option>
                  <option value="CO">Colombia</option>
                  <option value="CL">Chile</option>
                  <option value="AR">Argentina</option>
                  <option value="US">Estados Unidos</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1.5rem', position: 'sticky', top: '120px' }}>
            <h3 style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>Resumen del pedido</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {cart.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '60px', height: '75px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.05)' }}>
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.name}</p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Talla: {item.size} — Cant: {item.quantity}</p>
                  </div>
                  <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>€{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7 }}>Subtotal</span>
                <span>€{cartTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7 }}>Envío</span>
                <span>{shippingCost === 0 ? 'Gratis' : `€${shippingCost.toFixed(2)}`}</span>
              </div>
              {shippingCost > 0 && (
                <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>Envío gratis en pedidos +€100</p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem', marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
                <span>Total</span>
                <span>€{total.toFixed(2)}</span>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', marginTop: '1.5rem' }}>
              {loading ? 'Procesando...' : 'Pagar con PayPal'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.75rem', opacity: 0.5, marginTop: '1rem' }}>
              Al completar tu compra, aceptas nuestros{' '}
              <Link href="/terminos" style={{ textDecoration: 'underline' }}>Términos y Condiciones</Link>
            </p>
          </div>
        </form>
      </div>
    </>
  );
}
