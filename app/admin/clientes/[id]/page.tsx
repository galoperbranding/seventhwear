'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Tag { id: string; name: string; color: string; }
interface Note { id: string; content: string; type: string; created_at: string; admin_name: string; admin_last_name: string; }
interface Order { id: string; order_number: string; status: string; total: number; created_at: string; items_summary: string; payment_status: string; }
interface Address { id: string; label: string; first_name: string; last_name: string; address_line1: string; address_line2: string; city: string; state: string; postal_code: string; country: string; phone: string; is_default: number; }
interface CartItem { id: string; product_name: string; price: number; size: string; color: string; quantity: number; images: string; }

interface CustomerDetail {
  id: string; email: string; first_name: string; last_name: string;
  phone: string; birth_date: string | null; avatar: string; google_id: string; created_at: string; updated_at: string;
}

interface OrderStats {
  total_orders: number; total_spent: number; avg_order: number;
  last_order_date: string | null; first_order_date: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmado', processing: 'En proceso',
  shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado', refunded: 'Reembolsado',
};

const NOTE_TYPE_LABELS: Record<string, string> = {
  note: '📝 Nota', call: '📞 Llamada', email: '✉️ Email', meeting: '🤝 Reunión', other: '📌 Otro',
};

export default function CustomerDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [newsletter, setNewsletter] = useState<{ is_active: number } | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('note');
  const [addingNote, setAddingNote] = useState(false);
  const [tab, setTab] = useState<'orders' | 'notes' | 'info'>('orders');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(() => {
    if (!user || user.role !== 'admin' || !id) return;
    setLoading(true);
    fetch(`/api/admin/customers/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setCustomer(data.customer);
        setOrders(data.orders || []);
        setOrderStats(data.orderStats);
        setAddresses(data.addresses || []);
        setNotes(data.notes || []);
        setTags(data.tags || []);
        setAllTags(data.allTags || []);
        setNewsletter(data.newsletter);
        setCartItems(data.cartItems || []);
      })
      .catch(() => router.push('/admin/clientes'))
      .finally(() => setLoading(false));
  }, [user, id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || addingNote) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent.trim(), type: noteType }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(prev => [data.note, ...prev]);
        setNoteContent('');
        setNoteType('note');
      }
    } catch { /* ignore */ }
    setAddingNote(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('¿Eliminar esta nota?')) return;
    await fetch(`/api/admin/customers/${id}/notes`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId }),
    });
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const handleToggleTag = async (tagId: string) => {
    const hasTag = tags.some(t => t.id === tagId);
    const res = await fetch(`/api/admin/customers/${id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId, action: hasTag ? 'remove' : 'add' }),
    });
    if (res.ok) {
      const data = await res.json();
      setTags(data.tags);
    }
  };

  if (authLoading || !user || user.role !== 'admin') {
    return <div className="crm-loading">Cargando...</div>;
  }

  if (loading || !customer) {
    return (
      <div className="crm-detail-page">
        <div className="crm-loading">
          <div className="crm-spinner" />
          Cargando...
        </div>
      </div>
    );
  }

  const daysSinceLastOrder = orderStats?.last_order_date
    ? Math.floor((Date.now() - new Date(orderStats.last_order_date).getTime()) / 86400000)
    : null;

  const initials = `${(customer.first_name?.[0] || '').toUpperCase()}${(customer.last_name?.[0] || customer.email[0] || '').toUpperCase()}`;

  return (
    <div className="crm-detail-page">
      {/* Back nav */}
      <div className="crm-detail-topnav">
        <Link href="/admin/clientes" className="crm-back-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Clientes
        </Link>
        <div className="crm-detail-breadcrumb">
          <span>{customer.first_name} {customer.last_name}</span>
        </div>
      </div>

      <div className="crm-detail-grid">
        {/* Left sidebar — profile card */}
        <aside className="crm-detail-sidebar">
          <div className="crm-profile-card">
            <div className="crm-profile-avatar">
              {customer.avatar ? (
                <img src={customer.avatar} alt="" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <h2 className="crm-profile-name">
              {customer.first_name} {customer.last_name}
            </h2>
            <p className="crm-profile-email">{customer.email}</p>
            {customer.phone && <p className="crm-profile-phone">{customer.phone}</p>}

            <div className="crm-profile-badges">
              {customer.google_id && <span className="crm-badge-google">Google</span>}
              {newsletter?.is_active ? (
                <span className="crm-badge-sub">Suscrito</span>
              ) : (
                <span className="crm-badge-nosub">No suscrito</span>
              )}
            </div>

            <p className="crm-profile-since">
              Cliente desde {new Date(customer.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Stats */}
          {orderStats && (
            <div className="crm-profile-stats">
              <div className="crm-profile-stat">
                <span className="crm-profile-stat-val">{orderStats.total_orders}</span>
                <span className="crm-profile-stat-lbl">Pedidos</span>
              </div>
              <div className="crm-profile-stat">
                <span className="crm-profile-stat-val">S/{orderStats.total_spent.toFixed(0)}</span>
                <span className="crm-profile-stat-lbl">Total</span>
              </div>
              <div className="crm-profile-stat">
                <span className="crm-profile-stat-val">S/{orderStats.avg_order.toFixed(0)}</span>
                <span className="crm-profile-stat-lbl">Medio</span>
              </div>
              <div className="crm-profile-stat">
                <span className="crm-profile-stat-val">
                  {daysSinceLastOrder !== null ? `${daysSinceLastOrder}d` : '—'}
                </span>
                <span className="crm-profile-stat-lbl">Últ. pedido</span>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="crm-profile-section">
            <h4 className="crm-profile-section-title">Etiquetas</h4>
            <div className="crm-profile-tags">
              {allTags.map(tag => {
                const isAssigned = tags.some(t => t.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => handleToggleTag(tag.id)}
                    className={`crm-tag-toggle ${isAssigned ? 'active' : ''}`}
                    style={{ borderColor: tag.color, ...(isAssigned ? { background: tag.color } : {}) }}
                  >
                    {tag.name}
                  </button>
                );
              })}
              {allTags.length === 0 && <span className="crm-muted-text">Sin etiquetas</span>}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="crm-detail-main">
          {/* Tabs */}
          <div className="crm-tabs">
            <button onClick={() => setTab('orders')} className={`crm-tab ${tab === 'orders' ? 'active' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              Pedidos <span className="crm-tab-count">{orders.length}</span>
            </button>
            <button onClick={() => setTab('notes')} className={`crm-tab ${tab === 'notes' ? 'active' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              Notas <span className="crm-tab-count">{notes.length}</span>
            </button>
            <button onClick={() => setTab('info')} className={`crm-tab ${tab === 'info' ? 'active' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Información
            </button>
          </div>

          <div className="crm-tab-content">
            {/* ORDERS TAB */}
            {tab === 'orders' && (
              <div>
                {orders.length === 0 ? (
                  <div className="crm-empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.15"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                    <p>Sin pedidos</p>
                  </div>
                ) : (
                  <div className="crm-orders-list">
                    {orders.map(order => (
                      <div key={order.id} className="crm-order-card">
                        <div className="crm-order-row">
                          <div className="crm-order-left">
                            <span className="crm-order-number">#{order.order_number}</span>
                            <span className="crm-order-date">{new Date(order.created_at).toLocaleDateString('es-ES')}</span>
                          </div>
                          <div className="crm-order-right">
                            <span className={`crm-order-status crm-status-${order.status}`}>
                              {STATUS_LABELS[order.status] || order.status}
                            </span>
                            <span className={`crm-payment-badge crm-payment-${order.payment_status}`}>
                              {order.payment_status === 'completed' ? '✓ Pagado' : order.payment_status === 'failed' ? '✕ Fallido' : '◷ Pendiente'}
                            </span>
                            <span className="crm-order-amount">S/{order.total.toFixed(2)}</span>
                          </div>
                        </div>
                        {order.items_summary && (
                          <p className="crm-order-summary">{order.items_summary}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {cartItems.length > 0 && (
                  <div className="crm-abandoned-card">
                    <div className="crm-abandoned-header">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
                      <span>Carrito abandonado</span>
                    </div>
                    {cartItems.map(item => {
                      let imgSrc = '';
                      try { const imgs = JSON.parse(item.images); imgSrc = imgs[0] || ''; } catch { /* ignore */ }
                      return (
                        <div key={item.id} className="crm-cart-item">
                          {imgSrc && <img src={imgSrc} alt="" className="crm-cart-img" />}
                          <div className="crm-cart-info">
                            <strong>{item.product_name}</strong>
                            <span>{item.size} / {item.color} × {item.quantity}</span>
                          </div>
                          <span className="crm-cart-price">S/{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* NOTES TAB */}
            {tab === 'notes' && (
              <div>
                <form onSubmit={handleAddNote} className="crm-note-form">
                  <div className="crm-note-form-row">
                    <select value={noteType} onChange={e => setNoteType(e.target.value)} className="crm-note-select">
                      <option value="note">📝 Nota</option>
                      <option value="call">📞 Llamada</option>
                      <option value="email">✉️ Email</option>
                      <option value="meeting">🤝 Reunión</option>
                      <option value="other">📌 Otro</option>
                    </select>
                    <button type="submit" disabled={addingNote || !noteContent.trim()} className="crm-note-submit">
                      {addingNote ? 'Guardando...' : 'Añadir'}
                    </button>
                  </div>
                  <textarea
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value)}
                    placeholder="Escribe una nota sobre este cliente..."
                    className="crm-note-textarea"
                    rows={3}
                  />
                </form>

                {notes.length === 0 ? (
                  <div className="crm-empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.15"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <p>Sin notas</p>
                  </div>
                ) : (
                  <div className="crm-notes-list">
                    {notes.map(note => (
                      <div key={note.id} className="crm-note-card">
                        <div className="crm-note-header">
                          <span className="crm-note-type">{NOTE_TYPE_LABELS[note.type] || note.type}</span>
                          <span className="crm-note-meta">
                            {new Date(note.created_at).toLocaleDateString('es-ES')} — {note.admin_name} {note.admin_last_name}
                          </span>
                          <button onClick={() => handleDeleteNote(note.id)} className="crm-note-delete" title="Eliminar">×</button>
                        </div>
                        <p className="crm-note-body">{note.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* INFO TAB */}
            {tab === 'info' && (
              <div>
                <div className="crm-info-section">
                  <h4 className="crm-info-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    Direcciones
                  </h4>
                  {addresses.length === 0 ? (
                    <p className="crm-muted-text">No hay direcciones guardadas</p>
                  ) : (
                    <div className="crm-addresses-grid">
                      {addresses.map(addr => (
                        <div key={addr.id} className="crm-address-card">
                          {addr.is_default ? <span className="crm-badge-default">Principal</span> : null}
                          <p className="crm-address-name">{addr.first_name} {addr.last_name}</p>
                          <p>{addr.address_line1}</p>
                          {addr.address_line2 && <p>{addr.address_line2}</p>}
                          <p>{addr.postal_code} {addr.city}, {addr.state}</p>
                          <p>{addr.country}</p>
                          {addr.phone && <p className="crm-address-phone">{addr.phone}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="crm-info-section">
                  <h4 className="crm-info-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Datos de la cuenta
                  </h4>
                  <div className="crm-info-table">
                    <div className="crm-info-row"><span className="crm-info-label">ID</span><span className="crm-info-value">{customer.id}</span></div>
                    <div className="crm-info-row"><span className="crm-info-label">Email</span><span className="crm-info-value">{customer.email}</span></div>
                    <div className="crm-info-row"><span className="crm-info-label">Teléfono</span><span className="crm-info-value">{customer.phone || '—'}</span></div>
                    <div className="crm-info-row"><span className="crm-info-label">Fecha de nacimiento</span><span className="crm-info-value">{customer.birth_date ? new Date(customer.birth_date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span></div>
                    <div className="crm-info-row"><span className="crm-info-label">Cuenta Google</span><span className="crm-info-value">{customer.google_id ? 'Sí' : 'No'}</span></div>
                    <div className="crm-info-row"><span className="crm-info-label">Registrado</span><span className="crm-info-value">{new Date(customer.created_at).toLocaleString('es-ES')}</span></div>
                    <div className="crm-info-row"><span className="crm-info-label">Actualizado</span><span className="crm-info-value">{new Date(customer.updated_at).toLocaleString('es-ES')}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
