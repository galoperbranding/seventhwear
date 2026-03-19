'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  email: string;
  created_at: string;
  first_name: string;
  last_name: string;
  user_email: string;
  shipping_address: string;
  tracking_number: string | null;
  payment_status: string;
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') fetchOrders();
  }, [user]);

  function fetchOrders() {
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data.orders || []);
        const inputs: Record<string, string> = {};
        (data.orders || []).forEach((o: Order) => { inputs[o.id] = o.tracking_number || ''; });
        setTrackingInputs(inputs);
      })
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
      showToast('Estado actualizado');
      fetchOrders();
    } catch { /* ignore */ }
    finally { setUpdatingId(null); }
  }

  async function saveTracking(orderId: string) {
    const tracking = trackingInputs[orderId]?.trim();
    if (!tracking) return;
    setUpdatingId(orderId);
    try {
      const order = orders.find(o => o.id === orderId);
      await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: order?.status || 'shipped', tracking_number: tracking }),
      });
      showToast('Tracking guardado');
      fetchOrders();
    } catch { /* ignore */ }
    finally { setUpdatingId(null); }
  }

  function parseAddress(addr: string) {
    try { return JSON.parse(addr); } catch { return null; }
  }

  if (authLoading || !user || user.role !== 'admin') {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>Cargando...</div>;
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente', confirmed: 'Confirmado', processing: 'En proceso',
    shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
  };
  const statusColors: Record<string, string> = {
    pending: '#ff9800', confirmed: '#2196f3', processing: '#9c27b0',
    shipped: '#00bcd4', delivered: '#4caf50', cancelled: '#f44336',
  };

  const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);
  const inp: React.CSSProperties = { background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.375rem 0.75rem', borderRadius: '4px', fontSize: '0.85rem' };

  return (
    <>
      <div className="crm-topbar">
        <div>
          <h1 className="crm-page-title">Pedidos</h1>
          <p className="crm-page-subtitle">{orders.length} pedido{orders.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="crm-topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase' }}>Filtrar:</span>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inp}>
            <option value="all">Todos ({orders.length})</option>
            {Object.entries(statusLabels).map(([val, label]) => {
              const count = orders.filter(o => o.status === val).length;
              return count > 0 ? <option key={val} value={val}>{label} ({count})</option> : null;
            })}
          </select>
        </div>
      </div>

      <div>
        {loading ? (
          <p style={{ opacity: 0.5 }}>Cargando pedidos...</p>
        ) : filteredOrders.length === 0 ? (
          <p style={{ opacity: 0.5 }}>No hay pedidos{filterStatus !== 'all' ? ' con este estado' : ''}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredOrders.map(order => {
              const isExpanded = expandedId === order.id;
              const addr = parseAddress(order.shipping_address);
              return (
                <div key={order.id} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
                  {/* Header row - clickable */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    style={{ padding: '1.25rem 1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>#{order.order_number}</span>
                      <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500, background: `${statusColors[order.status] || '#666'}22`, color: statusColors[order.status] || '#666', border: `1px solid ${statusColors[order.status] || '#666'}44` }}>
                        {statusLabels[order.status] || order.status}
                      </span>
                      <span style={{ opacity: 0.5, fontSize: '0.85rem' }}>
                        {order.first_name} {order.last_name}
                      </span>
                      <span style={{ opacity: 0.4, fontSize: '0.8rem' }}>
                        {new Date(order.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>S/{order.total.toFixed(2)}</span>
                      <span style={{ opacity: 0.4, fontSize: '1.2rem', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--color-border)', padding: '1.5rem', background: 'rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        {/* Customer */}
                        <div>
                          <p style={{ opacity: 0.5, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Cliente</p>
                          <p style={{ fontWeight: 500 }}>{order.first_name} {order.last_name}</p>
                          <p style={{ opacity: 0.6 }}>{order.user_email || order.email}</p>
                        </div>
                        {/* Address */}
                        <div>
                          <p style={{ opacity: 0.5, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Dirección de envío</p>
                          {addr ? (
                            <>
                              <p>{addr.address}</p>
                              <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                              <p style={{ opacity: 0.6 }}>{addr.country}</p>
                            </>
                          ) : (
                            <p style={{ opacity: 0.5 }}>No disponible</p>
                          )}
                        </div>
                        {/* Payment */}
                        <div>
                          <p style={{ opacity: 0.5, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Pago</p>
                          <p>Subtotal: S/{order.subtotal?.toFixed(2)}</p>
                          <p>Envío: S/{order.shipping_cost?.toFixed(2)}</p>
                          <p style={{ fontWeight: 600 }}>Total: S/{order.total.toFixed(2)}</p>
                          <p style={{ opacity: 0.6, marginTop: '0.25rem' }}>PayPal — {order.payment_status}</p>
                        </div>
                      </div>

                      {/* Order Items */}
                      {order.items && order.items.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                          <p style={{ opacity: 0.5, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Productos ({order.items.length})</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {order.items.map(item => (
                              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                                {item.product_image && (
                                  <img src={item.product_image} alt="" style={{ width: '36px', height: '45px', objectFit: 'cover', borderRadius: '4px' }} />
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.product_name}</p>
                                  <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Talla: {item.size}{item.color ? ` — Color: ${item.color}` : ''} — Cant: {item.quantity}</p>
                                </div>
                                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>S/{item.total_price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Status + Tracking */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                        <div>
                          <p style={{ opacity: 0.5, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Cambiar estado</p>
                          <select
                            value={order.status}
                            onChange={e => updateStatus(order.id, e.target.value)}
                            disabled={updatingId === order.id}
                            style={inp}
                          >
                            {Object.entries(statusLabels).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <p style={{ opacity: 0.5, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Nro. de seguimiento</p>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                              value={trackingInputs[order.id] || ''}
                              onChange={e => setTrackingInputs(t => ({ ...t, [order.id]: e.target.value }))}
                              placeholder="Tracking number"
                              style={{ ...inp, flex: 1 }}
                            />
                            <button
                              onClick={() => saveTracking(order.id)}
                              disabled={updatingId === order.id || !trackingInputs[order.id]?.trim()}
                              style={{ ...inp, cursor: 'pointer', opacity: trackingInputs[order.id]?.trim() ? 1 : 0.4, background: 'rgba(0,0,0,0.04)' }}
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
