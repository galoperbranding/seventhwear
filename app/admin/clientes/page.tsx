'use client';

import { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Tag {
  id: string;
  name: string;
  color: string;
  customer_count?: number;
}

interface Customer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  avatar: string;
  google_id: string;
  created_at: string;
  order_count: number;
  total_spent: number;
  last_order_date: string | null;
  is_subscriber: number;
  tags: Tag[];
}

interface SegmentCounts {
  all: number;
  new: number;
  vip: number;
  with_orders: number;
  inactive: number;
  subscribers: number;
  abandoned: number;
}

const SEGMENT_CONFIG: Record<string, { label: string; icon: string }> = {
  all: { label: 'Todos', icon: '👥' },
  new: { label: 'Nuevos (30d)', icon: '✨' },
  vip: { label: 'VIP', icon: '⭐' },
  with_orders: { label: 'Con pedidos', icon: '🛍' },
  inactive: { label: 'Inactivos', icon: '💤' },
  subscribers: { label: 'Suscriptores', icon: '✉️' },
  abandoned: { label: 'Carrito abandonado', icon: '🛒' },
};

export default function CRMClientesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('all');
  const [selectedTag, setSelectedTag] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [segmentCounts, setSegmentCounts] = useState<SegmentCounts | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);

  const [showTagManager, setShowTagManager] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#666666');
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('admin-sidebar-extra'));
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchCustomers = useCallback(() => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (segment !== 'all') params.set('segment', segment);
    if (selectedTag) params.set('tag', selectedTag);
    params.set('page', String(page));

    fetch(`/api/admin/customers?${params}`)
      .then(res => res.json())
      .then(data => {
        setCustomers(data.customers || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
        setSegmentCounts(data.segmentCounts);
        setAllTags(data.allTags || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, search, segment, selectedTag, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleExportCSV = () => {
    window.open(`/api/admin/customers/export?segment=${segment}`, '_blank');
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const res = await fetch('/api/admin/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
    });
    if (res.ok) {
      setNewTagName('');
      setNewTagColor('#666666');
      fetchCustomers();
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('¿Eliminar esta etiqueta?')) return;
    await fetch('/api/admin/tags', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId }),
    });
    if (selectedTag === tagId) setSelectedTag('');
    fetchCustomers();
  };

  if (authLoading || !user || user.role !== 'admin') {
    return <div className="crm-loading">Cargando...</div>;
  }

  const TAG_COLORS = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c', '#3498db', '#9b59b6', '#34495e', '#666666'];

  return (
    <>
      {/* Sidebar extras via portal */}
      {portalTarget && ReactDOM.createPortal(
        <>
          {/* Segments in sidebar */}
          <div className="crm-sidebar-section">
            <h4 className="crm-sidebar-heading">Segmentos</h4>
            <div className="crm-sidebar-segments">
              {Object.entries(SEGMENT_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => { setSegment(key); setPage(1); }}
                  className={`crm-segment-item ${segment === key ? 'active' : ''}`}
                >
                  <span className="crm-segment-icon">{config.icon}</span>
                  <span className="crm-segment-label">{config.label}</span>
                  {segmentCounts && (
                    <span className="crm-segment-count">{segmentCounts[key as keyof SegmentCounts]}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tags filter in sidebar */}
          <div className="crm-sidebar-section">
            <div className="crm-sidebar-heading-row">
              <h4 className="crm-sidebar-heading">Etiquetas</h4>
              <button onClick={() => setShowTagManager(!showTagManager)} className="crm-sidebar-heading-action">
                {showTagManager ? '✕' : '＋'}
              </button>
            </div>
            {showTagManager && (
              <div className="crm-tag-creator">
                <input
                  type="text"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  placeholder="Nueva etiqueta..."
                  className="crm-tag-input"
                />
                <div className="crm-tag-colors">
                  {TAG_COLORS.map(c => (
                    <button
                      key={c}
                      className={`crm-color-btn ${newTagColor === c ? 'active' : ''}`}
                      style={{ background: c }}
                      onClick={() => setNewTagColor(c)}
                    />
                  ))}
                </div>
                <button onClick={handleCreateTag} className="crm-tag-create-btn">Crear</button>
              </div>
            )}
            <div className="crm-sidebar-tags">
              <button
                onClick={() => { setSelectedTag(''); setPage(1); }}
                className={`crm-tag-filter ${selectedTag === '' ? 'active' : ''}`}
              >
                Todas
              </button>
              {allTags.map(tag => (
                <div key={tag.id} className="crm-tag-filter-wrap">
                  <button
                    onClick={() => { setSelectedTag(tag.id); setPage(1); }}
                    className={`crm-tag-filter ${selectedTag === tag.id ? 'active' : ''}`}
                  >
                    <span className="crm-tag-dot" style={{ background: tag.color }} />
                    {tag.name}
                    <span className="crm-tag-count">{tag.customer_count || 0}</span>
                  </button>
                  {showTagManager && (
                    <button onClick={() => handleDeleteTag(tag.id)} className="crm-tag-remove">×</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>,
        portalTarget
      )}

      {/* Main content */}
      <div className="crm-topbar">
        <div>
          <h1 className="crm-page-title">Clientes</h1>
          <p className="crm-page-subtitle">
            {total} cliente{total !== 1 ? 's' : ''} {segment !== 'all' ? `· ${SEGMENT_CONFIG[segment]?.label}` : ''}
          </p>
        </div>
        <div className="crm-topbar-actions">
          <button onClick={handleExportCSV} className="crm-action-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar
          </button>
        </div>
      </div>

      {/* Stats */}
      {segmentCounts && (
        <div className="crm-stats-row">
          <div className="crm-stat-card">
            <div className="crm-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            </div>
            <div>
              <span className="crm-stat-value">{segmentCounts.all}</span>
              <span className="crm-stat-label">Total</span>
            </div>
          </div>
          <div className="crm-stat-card">
            <div className="crm-stat-icon crm-stat-icon-green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            </div>
            <div>
              <span className="crm-stat-value">{segmentCounts.new}</span>
              <span className="crm-stat-label">Nuevos</span>
            </div>
          </div>
          <div className="crm-stat-card">
            <div className="crm-stat-icon crm-stat-icon-gold">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div>
              <span className="crm-stat-value">{segmentCounts.vip}</span>
              <span className="crm-stat-label">VIP</span>
            </div>
          </div>
          <div className="crm-stat-card">
            <div className="crm-stat-icon crm-stat-icon-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4a2 2 0 012 2v6a2 2 0 01-2 2h-4"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            </div>
            <div>
              <span className="crm-stat-value">{segmentCounts.with_orders}</span>
              <span className="crm-stat-label">Con pedidos</span>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="crm-search-bar">
        <svg className="crm-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o teléfono..."
          className="crm-search-input"
        />
      </form>

      {/* Table */}
      <div className="crm-table-card">
        <div className="crm-results-info">
          <span>{total} resultado{total !== 1 ? 's' : ''}</span>
          {totalPages > 1 && <span>Página {page} de {totalPages}</span>}
        </div>

        {loading ? (
          <div className="crm-loading-text">
            <div className="crm-spinner" />
            Cargando clientes...
          </div>
        ) : customers.length === 0 ? (
          <div className="crm-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            <p>No se encontraron clientes</p>
          </div>
        ) : (
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Pedidos</th>
                  <th>Total gastado</th>
                  <th>Último pedido</th>
                  <th>Etiquetas</th>
                  <th>Registro</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} onClick={() => router.push(`/admin/clientes/${c.id}`)} className="crm-row-clickable">
                    <td>
                      <div className="crm-customer-cell">
                        <div className="crm-avatar">
                          {c.avatar ? (
                            <img src={c.avatar} alt="" />
                          ) : (
                            <span>{(c.first_name?.[0] || c.email[0]).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <div className="crm-customer-name">
                            {c.first_name} {c.last_name}
                            {c.google_id && <span className="crm-google-badge">G</span>}
                            {c.is_subscriber ? <span className="crm-subscriber-badge">✉</span> : null}
                          </div>
                          <div className="crm-customer-email">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="crm-cell-number">{c.order_count}</span></td>
                    <td><span className="crm-cell-money">€{c.total_spent.toFixed(2)}</span></td>
                    <td className="crm-cell-date">{c.last_order_date ? new Date(c.last_order_date).toLocaleDateString('es-ES') : '—'}</td>
                    <td>
                      <div className="crm-tags-cell">
                        {c.tags.map(t => (
                          <span key={t.id} className="crm-tag-badge-sm" style={{ background: t.color }}>{t.name}</span>
                        ))}
                      </div>
                    </td>
                    <td className="crm-cell-date">{new Date(c.created_at).toLocaleDateString('es-ES')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="crm-pagination">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="crm-page-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button key={p} onClick={() => setPage(p)} className={`crm-page-btn ${page === p ? 'active' : ''}`}>
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="crm-page-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
