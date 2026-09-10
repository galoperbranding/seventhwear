'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  shipping_cost: number;
  created_at: string;
  first_name: string;
  last_name: string;
  user_email: string;
  shipping_address: string;
  tracking_number: string | null;
}

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchOrders();
    }
  }, [user]);

  function fetchOrders() {
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    try {
      await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: newStatus }),
      });
      fetchOrders();
    } catch {
      // ignore
    } finally {
      setUpdatingId(null);
    }
  }

  if (authLoading || !user || user.role !== 'admin') {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>Cargando...</div>;
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente', confirmed: 'Confirmado', processing: 'En proceso',
    shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
  };

  return (
    <>
      <div className="page-header">
        <h1>Gestión de pedidos</h1>
      </div>

      <div className="container" style={{ maxWidth: '1100px', padding: '2rem 1.5rem 4rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <Link href="/admin" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>Dashboard</Link>
          <Link href="/admin/pedidos" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>Pedidos</Link>
          <Link href="/admin/productos" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>Productos</Link>
        </div>

        {loading ? (
          <p style={{ opacity: 0.5 }}>Cargando pedidos...</p>
        ) : orders.length === 0 ? (
          <p style={{ opacity: 0.5 }}>No hay pedidos</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map(order => (
              <div key={order.id} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>#{order.order_number}</span>
                    <span style={{ opacity: 0.5, marginLeft: '1rem', fontSize: '0.85rem' }}>
                      {new Date(order.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>€{order.total.toFixed(2)}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ opacity: 0.5, fontSize: '0.75rem', textTransform: 'uppercase' }}>Cliente</span>
                    <p>{order.first_name} {order.last_name}</p>
                    <p style={{ opacity: 0.6 }}>{order.user_email}</p>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5, fontSize: '0.75rem', textTransform: 'uppercase' }}>Estado</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <select
                        value={order.status}
                        onChange={e => updateStatus(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '0.375rem 0.75rem', borderRadius: '4px', fontSize: '0.85rem' }}
                      >
                        {Object.entries(statusLabels).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {order.tracking_number && (
                  <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Tracking: {order.tracking_number}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
