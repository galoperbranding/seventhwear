'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface OrderItem {
  product_name: string;
  size: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  items: OrderItem[];
}

export default function AccountPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetch('/api/orders')
        .then(res => res.json())
        .then(data => setOrders(data.orders || []))
        .catch(() => {})
        .finally(() => setLoadingOrders(false));
    }
  }, [user]);

  if (authLoading || !user) {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>Cargando...</div>;
  }

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    processing: 'En proceso',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };

  return (
    <>
      <div className="page-header">
        <h1>Mi cuenta</h1>
        <p>Hola, {user.first_name}</p>
      </div>

      <div className="container" style={{ maxWidth: '800px', padding: '2rem 1.5rem 4rem' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1rem', cursor: 'pointer', opacity: activeTab === 'orders' ? 1 : 0.5, borderBottom: activeTab === 'orders' ? '2px solid #fff' : 'none', paddingBottom: '0.5rem' }}
          >
            Mis pedidos
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1rem', cursor: 'pointer', opacity: activeTab === 'profile' ? 1 : 0.5, borderBottom: activeTab === 'profile' ? '2px solid #fff' : 'none', paddingBottom: '0.5rem' }}
          >
            Perfil
          </button>
          <div style={{ flex: 1 }}></div>
          <button onClick={handleLogout} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
            Cerrar sesión
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            {loadingOrders ? (
              <p style={{ opacity: 0.5 }}>Cargando pedidos...</p>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Aún no tienes pedidos</p>
                <a href="/shop" className="btn btn-primary">Explorar tienda</a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {orders.map(order => (
                  <div key={order.id} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>Pedido #{order.order_number}</span>
                        <span style={{ opacity: 0.5, marginLeft: '1rem', fontSize: '0.85rem' }}>
                          {new Date(order.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        background: order.status === 'delivered' ? 'rgba(76,175,80,0.15)' : order.status === 'cancelled' ? 'rgba(244,67,54,0.15)' : 'rgba(255,255,255,0.08)',
                        color: order.status === 'delivered' ? '#4caf50' : order.status === 'cancelled' ? '#f44336' : '#fff',
                      }}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                          <span>{item.product_name} — {item.size} × {item.quantity}</span>
                          <span>€{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '1rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>Total</span>
                      <span>€{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, display: 'block', marginBottom: '0.25rem' }}>Nombre</label>
                <p>{user.first_name}</p>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, display: 'block', marginBottom: '0.25rem' }}>Apellido</label>
                <p>{user.last_name}</p>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, display: 'block', marginBottom: '0.25rem' }}>Email</label>
              <p>{user.email}</p>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, display: 'block', marginBottom: '0.25rem' }}>Miembro desde</label>
              <p>{new Date(user.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
