'use client';

import { useCart } from '@/context/CartContext';
import Link from 'next/link';

export default function CartSidebar() {
  const { cart, cartTotal, isOpen, closeCart, removeFromCart, updateQuantity } = useCart();

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={closeCart}></div>
      <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="cart-sidebar-header">
          <h3>Carrito</h3>
          <button className="cart-sidebar-close" onClick={closeCart}>×</button>
        </div>
        <div className="cart-sidebar-items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <p>Tu carrito está vacío</p>
              <Link href="/shop" className="btn btn-outline btn-small" onClick={closeCart}>
                Ver productos
              </Link>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.productId}-${item.size}-${item.color}-${idx}`} className="cart-item">
                <div className="cart-item-image">
                  <img src={item.image} alt={item.name} />
                </div>
                <div className="cart-item-info">
                  <div>
                    <div className="cart-item-title">{item.name}</div>
                    <div className="cart-item-variant">
                      Talla: {item.size}{item.color ? ` — Color: ${item.color}` : ''}
                    </div>
                    <button className="cart-item-remove" onClick={() => removeFromCart(item.productId, item.size, item.color)}>Eliminar</button>
                  </div>
                  <div className="cart-item-bottom">
                    <div className="cart-item-qty">
                      <button onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}>+</button>
                    </div>
                    <div className="cart-item-price">€{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="cart-sidebar-footer">
            <div className="cart-subtotal">
              <span>Subtotal</span>
              <span>€{cartTotal.toFixed(2)}</span>
            </div>
            <p className="cart-shipping-note">Envío calculado en el checkout</p>
            <Link href="/checkout" className="checkout-btn" onClick={closeCart}>
              Finalizar Compra
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
