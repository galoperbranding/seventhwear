'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    setFieldErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    if (firstName.trim().length < 2) errors.firstName = 'Nombre demasiado corto';
    if (lastName.trim().length < 2) errors.lastName = 'Apellido demasiado corto';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email inválido';
    if (!/^\+?[\d\s\-()]{7,20}$/.test(phone)) errors.phone = 'Teléfono inválido';
    if (address.trim().length < 5) errors.address = 'Dirección demasiado corta';
    if (city.trim().length < 2) errors.city = 'Ciudad requerida';
    if (state.trim().length < 2) errors.state = 'Región requerida';
    if (postalCode.trim().length < 3) errors.postalCode = 'Código postal inválido';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast('Revisa los campos marcados en rojo', 'error');
      return;
    }

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

  const errorMsg = (field: string) => fieldErrors[field] ? <span className="field-error">{fieldErrors[field]}</span> : null;

  return (
    <>
      <div className="page-header">
        <h1>Checkout</h1>
        <p>Completa tu pedido</p>
      </div>

      <form onSubmit={handleSubmit} className="checkout-grid">
        {/* Shipping Form */}
        <div className="checkout-shipping">
          <h3>Datos de envío</h3>

          {error && <div className="auth-error">{error}</div>}

          <div className="checkout-row">
            <div className={`checkout-field${fieldErrors.firstName ? ' has-error' : ''}`}>
              <label>Nombre</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              {errorMsg('firstName')}
            </div>
            <div className={`checkout-field${fieldErrors.lastName ? ' has-error' : ''}`}>
              <label>Apellido</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required />
              {errorMsg('lastName')}
            </div>
          </div>

          <div className={`checkout-field${fieldErrors.email ? ' has-error' : ''}`}>
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            {errorMsg('email')}
          </div>

          <div className={`checkout-field${fieldErrors.phone ? ' has-error' : ''}`}>
            <label>Teléfono</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
            {errorMsg('phone')}
          </div>

          <div className={`checkout-field${fieldErrors.address ? ' has-error' : ''}`}>
            <label>Dirección</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} required />
            {errorMsg('address')}
          </div>

          <div className="checkout-row">
            <div className={`checkout-field${fieldErrors.city ? ' has-error' : ''}`}>
              <label>Ciudad</label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)} required />
              {errorMsg('city')}
            </div>
            <div className={`checkout-field${fieldErrors.state ? ' has-error' : ''}`}>
              <label>Estado / Región</label>
              <input type="text" value={state} onChange={e => setState(e.target.value)} required />
              {errorMsg('state')}
            </div>
          </div>

          <div className="checkout-row">
            <div className={`checkout-field${fieldErrors.postalCode ? ' has-error' : ''}`}>
              <label>Código postal</label>
              <input type="text" value={postalCode} onChange={e => setPostalCode(e.target.value)} required />
              {errorMsg('postalCode')}
            </div>
            <div className="checkout-field">
              <label>País</label>
              <select value={country} onChange={e => setCountry(e.target.value)}>
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
        <div className="checkout-summary">
          <h3 style={{ marginBottom: '1.5rem' }}>Resumen del pedido</h3>

          <div className="checkout-summary-items">
            {cart.map((item, i) => (
              <div key={i} className="checkout-item">
                <div className="checkout-item-img">
                  <img src={item.image} alt={item.name} />
                </div>
                <div className="checkout-item-info">
                  <p>{item.name}</p>
                  <p>Talla: {item.size} — Cant: {item.quantity}</p>
                </div>
                <span className="checkout-item-price">S/{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="checkout-totals">
            <div className="checkout-totals-row">
              <span>Subtotal</span>
              <span>S/{cartTotal.toFixed(2)}</span>
            </div>
            <div className="checkout-totals-row">
              <span>Envío</span>
              <span>{shippingCost === 0 ? 'Gratis' : `S/${shippingCost.toFixed(2)}`}</span>
            </div>
            {shippingCost > 0 && (
              <p className="checkout-free-shipping">Envío gratis en pedidos +S/100</p>
            )}
            <div className="checkout-total-final">
              <span>Total</span>
              <span>S/{total.toFixed(2)}</span>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary auth-submit" style={{ marginTop: '1.5rem' }}>
            {loading ? 'Procesando...' : 'Pagar con PayPal'}
          </button>

          <p className="checkout-terms">
            Al completar tu compra, aceptas nuestros{' '}
            <Link href="/terminos">Términos y Condiciones</Link>
          </p>
        </div>
      </form>
    </>
  );
}
