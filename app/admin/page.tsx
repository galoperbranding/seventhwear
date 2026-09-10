'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  totalSubscribers: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  first_name: string;
  last_name: string;
  user_email: string;
}

interface Product {
  id: string;
  name: string;
  stock: number;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetch('/api/admin')
        .then(res => res.json())
        .then(data => {
          setStats(data.stats);
          setRecentOrders(data.recentOrders || []);
          setLowStock(data.lowStock || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || !user || user.role !== 'admin') {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>Cargando...</div>;
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente', confirmed: 'Confirmado', processing: 'En proceso',
    shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
  };

  const statCardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' as const };

  return (
    <>
      <div className="page-header">
        <h1>Panel de administración</h1>
        <p>Gestiona tu tienda SEVENTHWEAR</p>
      </div>

      <div className="container" style={{ maxWidth: '1100px', padding: '2rem 1.5rem 4rem' }}>
        {/* Navigation */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <Link href="/admin" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>Dashboard</Link>
          <Link href="/admin/pedidos" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>Pedidos</Link>
          <Link href="/admin/productos" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>Productos</Link>
        </div>

        {loading ? (
          <p style={{ opacity: 0.5 }}>Cargando datos...</p>
        ) : stats && (
          <>
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
              <div style={statCardStyle}>
                <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, marginBottom: '0.5rem' }}>Ingresos</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 700 }}>€{stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div style={statCardStyle}>
                <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, marginBottom: '0.5rem' }}>Pedidos</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.totalOrders}</p>
              </div>
              <div style={statCardStyle}>
                <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, marginBottom: '0.5rem' }}>Usuarios</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.totalUsers}</p>
              </div>
              <div style={statCardStyle}>
                <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, marginBottom: '0.5rem' }}>Productos</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.totalProducts}</p>
              </div>
              <div style={statCardStyle}>
                <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, marginBottom: '0.5rem' }}>Suscriptores</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.totalSubscribers}</p>
              </div>
            </div>

            {/* Recent Orders */}
            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Pedidos recientes</h3>
                <Link href="/admin/pedidos" style={{ fontSize: '0.85rem', opacity: 0.7 }}>Ver todos →</Link>
              </div>
              {recentOrders.length === 0 ? (
                <p style={{ opacity: 0.5 }}>No hay pedidos aún</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>Pedido</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>Cliente</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>Estado</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>Total</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map(order => (
                        <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.75rem 0.5rem' }}>#{order.order_number}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>{order.first_name} {order.last_name}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>{statusLabels[order.status] || order.status}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>€{order.total.toFixed(2)}</td>
                          <td style={{ padding: '0.75rem 0.5rem', opacity: 0.6 }}>{new Date(order.created_at).toLocaleDateString('es-ES')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Low Stock */}
            {lowStock.length > 0 && (
              <div>
                <h3 style={{ marginBottom: '1rem' }}>Stock bajo</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {lowStock.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                      <span>{p.name}</span>
                      <span style={{ color: p.stock < 5 ? '#f44336' : '#ff9800' }}>{p.stock} uds.</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
