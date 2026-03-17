'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';

interface OrderItem {
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  product_image: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  items: OrderItem[];
  tracking_number?: string;
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="cuenta-loading">Cargando...</div>}>
      <AccountContent />
    </Suspense>
  );
}

function AccountContent() {
  const { user, logout, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [editingBirthday, setEditingBirthday] = useState(false);
  const [birthDateInput, setBirthDateInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (searchParams.get('welcome') === '1' && user) {
      showToast(`¡Bienvenido${user.first_name ? ', ' + user.first_name : ''}! Tu cuenta está lista`);
      window.history.replaceState({}, '', '/cuenta');
    }
  }, [searchParams, user, showToast]);

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
    return <div className="cuenta-loading">Cargando...</div>;
  }

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  async function handleSaveBirthday() {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birth_date: birthDateInput || null }),
      });
      if (!res.ok) throw new Error();
      await refreshUser();
      setEditingBirthday(false);
      showToast('Fecha de nacimiento actualizada');
    } catch {
      showToast('Error al guardar');
    } finally {
      setSavingProfile(false);
    }
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    processing: 'En proceso',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };

  const statusIcons: Record<string, string> = {
    pending: '⏳',
    confirmed: '✓',
    processing: '⚙️',
    shipped: '🚚',
    delivered: '✅',
    cancelled: '✕',
  };

  const totalSpent = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const initials = `${(user.first_name?.[0] || '').toUpperCase()}${(user.last_name?.[0] || '').toUpperCase()}`;

  return (
    <>
      <div className="page-header">
        <h1>Mi cuenta</h1>
        <p>Bienvenido de vuelta, {user.first_name}</p>
      </div>

      <div className="cuenta-container">
        {/* Sidebar / Profile Card */}
        <aside className="cuenta-sidebar">
          <div className="cuenta-avatar-lg">
            <span>{initials}</span>
          </div>
          <h2 className="cuenta-user-name">{user.first_name} {user.last_name}</h2>
          <p className="cuenta-user-email">{user.email}</p>
          <p className="cuenta-user-since">
            Miembro desde {new Date(user.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </p>

          <div className="cuenta-sidebar-stats">
            <div className="cuenta-sidebar-stat">
              <span className="cuenta-sidebar-stat-value">{orders.length}</span>
              <span className="cuenta-sidebar-stat-label">Pedidos</span>
            </div>
            <div className="cuenta-sidebar-stat">
              <span className="cuenta-sidebar-stat-value">€{totalSpent.toFixed(0)}</span>
              <span className="cuenta-sidebar-stat-label">Total</span>
            </div>
          </div>

          <div className="cuenta-sidebar-actions">
            {user.role === 'admin' && (
              <Link href="/admin" className="btn btn-outline cuenta-sidebar-btn">Admin Panel</Link>
            )}
            <button onClick={handleLogout} className="cuenta-logout-btn">Cerrar sesión</button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="cuenta-main">
          {/* Tabs */}
          <div className="cuenta-tabs">
            <button
              onClick={() => setActiveTab('orders')}
              className={`cuenta-tab ${activeTab === 'orders' ? 'active' : ''}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              Mis pedidos
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`cuenta-tab ${activeTab === 'profile' ? 'active' : ''}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Mi perfil
            </button>
          </div>

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="cuenta-orders">
              {loadingOrders ? (
                <div className="cuenta-empty">
                  <p>Cargando pedidos...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="cuenta-empty">
                  <div className="cuenta-empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                  </div>
                  <h3>Aún no tienes pedidos</h3>
                  <p>Cuando compres algo, tus pedidos aparecerán aquí</p>
                  <Link href="/shop" className="btn btn-primary" style={{ marginTop: '1rem' }}>Explorar tienda</Link>
                </div>
              ) : (
                <div className="cuenta-orders-list">
                  {orders.map(order => (
                    <div
                      key={order.id}
                      className={`cuenta-order-card ${expandedOrder === order.id ? 'expanded' : ''}`}
                    >
                      <button
                        className="cuenta-order-header"
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      >
                        <div className="cuenta-order-left">
                          <span className={`cuenta-order-icon cuenta-status-${order.status}`}>
                            {statusIcons[order.status] || '•'}
                          </span>
                          <div>
                            <span className="cuenta-order-number">Pedido #{order.order_number}</span>
                            <span className="cuenta-order-date">
                              {new Date(order.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <div className="cuenta-order-right">
                          <span className={`cuenta-order-status cuenta-status-${order.status}`}>
                            {statusLabels[order.status] || order.status}
                          </span>
                          <span className="cuenta-order-amount">€{order.total.toFixed(2)}</span>
                          <span className={`cuenta-order-chevron ${expandedOrder === order.id ? 'open' : ''}`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                          </span>
                        </div>
                      </button>

                      {expandedOrder === order.id && (
                        <div className="cuenta-order-detail">
                          {order.tracking_number && (
                            <div className="cuenta-tracking">
                              <span>📦 Tracking:</span>
                              <strong>{order.tracking_number}</strong>
                            </div>
                          )}
                          <div className="cuenta-order-items">
                            {order.items.map((item, i) => (
                              <div key={i} className="cuenta-order-item">
                                {item.product_image && (
                                  <div className="cuenta-item-img">
                                    <img src={item.product_image} alt={item.product_name} />
                                  </div>
                                )}
                                <div className="cuenta-item-info">
                                  <span className="cuenta-item-name">{item.product_name}</span>
                                  <span className="cuenta-item-meta">
                                    {item.size && `Talla: ${item.size}`}
                                    {item.color && ` · ${item.color}`}
                                    {` · Cant: ${item.quantity}`}
                                  </span>
                                </div>
                                <span className="cuenta-item-price">€{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="cuenta-order-total">
                            <span>Total del pedido</span>
                            <span>€{order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="cuenta-profile">
              <div className="cuenta-profile-card">
                <h3 className="cuenta-profile-title">Información personal</h3>
                <div className="cuenta-profile-grid">
                  <div className="cuenta-profile-field">
                    <label className="cuenta-label">Nombre</label>
                    <p className="cuenta-value">{user.first_name}</p>
                  </div>
                  <div className="cuenta-profile-field">
                    <label className="cuenta-label">Apellido</label>
                    <p className="cuenta-value">{user.last_name}</p>
                  </div>
                </div>
                <div className="cuenta-profile-field">
                  <label className="cuenta-label">Email</label>
                  <p className="cuenta-value">{user.email}</p>
                </div>
                <div className="cuenta-profile-field">
                  <label className="cuenta-label">Fecha de nacimiento</label>
                  {editingBirthday ? (
                    <div className="cuenta-birthday-edit">
                      <input
                        type="date"
                        value={birthDateInput}
                        onChange={e => setBirthDateInput(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="cuenta-birthday-input"
                      />
                      <div className="cuenta-birthday-actions">
                        <button onClick={handleSaveBirthday} disabled={savingProfile} className="btn btn-primary btn-sm">
                          {savingProfile ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button onClick={() => setEditingBirthday(false)} className="btn btn-outline btn-sm">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="cuenta-birthday-display">
                      <p className="cuenta-value">
                        {user.birth_date
                          ? new Date(user.birth_date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                          : 'No configurada'}
                      </p>
                      <button
                        onClick={() => { setBirthDateInput(user.birth_date || ''); setEditingBirthday(true); }}
                        className="cuenta-edit-btn"
                      >
                        {user.birth_date ? 'Editar' : '🎂 Agregar para recibir descuento'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="cuenta-profile-card">
                <h3 className="cuenta-profile-title">Resumen de actividad</h3>
                <div className="cuenta-activity-grid">
                  <div className="cuenta-activity-item">
                    <span className="cuenta-activity-num">{orders.length}</span>
                    <span className="cuenta-activity-label">Pedidos realizados</span>
                  </div>
                  <div className="cuenta-activity-item">
                    <span className="cuenta-activity-num">€{totalSpent.toFixed(2)}</span>
                    <span className="cuenta-activity-label">Total gastado</span>
                  </div>
                  <div className="cuenta-activity-item">
                    <span className="cuenta-activity-num">
                      {orders.length > 0
                        ? `€${(totalSpent / orders.filter(o => o.status !== 'cancelled').length || 1).toFixed(2)}`
                        : '—'}
                    </span>
                    <span className="cuenta-activity-label">Pedido medio</span>
                  </div>
                  <div className="cuenta-activity-item">
                    <span className="cuenta-activity-num">
                      {new Date(user.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                    </span>
                    <span className="cuenta-activity-label">Miembro desde</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
