'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price: number | null;
  category: string;
  collection: string;
  badge: string | null;
  stock: number;
  images: string;
  colors: string;
  sizes: string;
  details: string;
  is_active: number;
  sort_order: number;
}

const CATEGORIES = ['tees', 'hoodies', 'pants', 'jackets', 'ridewear', 'accessories'];
const COLLECTIONS = ['street-collection', 'ride-collection', 'essentials'];
const BADGES = ['', 'new', 'sale', 'limited', 'bestseller'];
const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const COMMON_COLORS = ['black', 'white', 'grey', 'sand', 'olive', 'navy', 'blue', 'red', 'brown'];

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const emptyForm = {
  name: '', slug: '', description: '', price: '', original_price: '',
  category: 'tees', collection: 'street-collection', badge: '',
  stock: '100', sort_order: '0', is_active: true,
  images: [] as string[], colors: [] as string[], sizes: ['S', 'M', 'L', 'XL'] as string[],
  details: [] as string[],
};

export default function AdminProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [newDetail, setNewDetail] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') fetchProducts();
  }, [user]);

  function fetchProducts() {
    fetch('/api/admin/products')
      .then(res => res.json())
      .then(data => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setNewDetail('');
    setNewImageUrl('');
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    const parseJSON = (s: string) => { try { return JSON.parse(s); } catch { return []; } };
    setForm({
      name: p.name, slug: p.slug, description: p.description || '',
      price: String(p.price), original_price: p.original_price ? String(p.original_price) : '',
      category: p.category, collection: p.collection, badge: p.badge || '',
      stock: String(p.stock), sort_order: String(p.sort_order || 0), is_active: p.is_active === 1,
      images: parseJSON(p.images), colors: parseJSON(p.colors),
      sizes: parseJSON(p.sizes), details: parseJSON(p.details),
    });
    setNewDetail('');
    setNewImageUrl('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.price || !form.category || !form.collection) {
      showToast('Completa los campos obligatorios (nombre, precio, categoría, colección)', 'error');
      return;
    }
    setSaving(true);
    const slug = form.slug || slugify(form.name);
    const body = {
      ...(editingId ? { id: editingId } : {}),
      name: form.name, slug, description: form.description,
      price: parseFloat(form.price), original_price: form.original_price ? parseFloat(form.original_price) : null,
      category: form.category, collection: form.collection, badge: form.badge || null,
      stock: parseInt(form.stock) || 0, sort_order: parseInt(form.sort_order) || 0,
      is_active: form.is_active ? 1 : 0,
      images: form.images, colors: form.colors, sizes: form.sizes, details: form.details,
    };

    try {
      const res = await fetch('/api/admin/products', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Error al guardar', 'error');
      } else {
        showToast(editingId ? 'Producto actualizado' : 'Producto creado');
        setShowModal(false);
        fetchProducts();
      }
    } catch {
      showToast('Error de conexión', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await fetch('/api/admin/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      showToast('Producto eliminado');
      fetchProducts();
    } catch { /* ignore */ }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Solo se permiten imágenes', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Máximo 5MB por imagen', 'error'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm(f => ({ ...f, images: [...f.images, data.url] }));
        showToast('Imagen subida');
      } else {
        showToast(data.error || 'Error al subir', 'error');
      }
    } catch { showToast('Error al subir imagen', 'error'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  function toggleSize(s: string) {
    setForm(f => ({ ...f, sizes: f.sizes.includes(s) ? f.sizes.filter(x => x !== s) : [...f.sizes, s] }));
  }
  function toggleColor(c: string) {
    setForm(f => ({ ...f, colors: f.colors.includes(c) ? f.colors.filter(x => x !== c) : [...f.colors, c] }));
  }
  function addDetail() {
    if (!newDetail.trim()) return;
    setForm(f => ({ ...f, details: [...f.details, newDetail.trim()] }));
    setNewDetail('');
  }
  function removeDetail(i: number) {
    setForm(f => ({ ...f, details: f.details.filter((_, idx) => idx !== i) }));
  }
  function addImageUrl() {
    if (!newImageUrl.trim()) return;
    setForm(f => ({ ...f, images: [...f.images, newImageUrl.trim()] }));
    setNewImageUrl('');
  }
  function removeImage(i: number) {
    setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
  }

  if (authLoading || !user || user.role !== 'admin') {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>Cargando...</div>;
  }

  function getFirstImage(images: string): string {
    try { return JSON.parse(images)[0] || ''; } catch { return ''; }
  }

  const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '0.6rem 0.75rem', borderRadius: '4px', fontSize: '0.9rem', width: '100%' };
  const lbl: React.CSSProperties = { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, display: 'block', marginBottom: '0.35rem' };

  return (
    <>
      <div className="crm-topbar">
        <div>
          <h1 className="crm-page-title">Productos</h1>
          <p className="crm-page-subtitle">{products.length} producto{products.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="crm-topbar-actions">
          <button onClick={openCreate} className="crm-action-btn" style={{ background: 'var(--color-text)', color: 'var(--color-bg)', borderColor: 'var(--color-text)' }}>+ Nuevo producto</button>
        </div>
      </div>

      <div>
        {loading ? (
          <p style={{ opacity: 0.5 }}>Cargando productos...</p>
        ) : (
          <div className="crm-table-card">
            <table className="crm-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td style={{ width: '50px' }}>
                      {getFirstImage(p.images) && (
                        <img src={getFirstImage(p.images)} alt="" style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                      )}
                    </td>
                    <td>
                      <p style={{ fontWeight: 500 }}>{p.name}</p>
                      <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>{p.collection}{p.badge ? ` · ${p.badge}` : ''}</p>
                    </td>
                    <td>
                      <span className="crm-cell-money">€{p.price.toFixed(2)}</span>
                      {p.original_price && (
                        <span style={{ opacity: 0.5, textDecoration: 'line-through', marginLeft: '0.5rem', fontSize: '0.85rem' }}>€{p.original_price.toFixed(2)}</span>
                      )}
                    </td>
                    <td>{p.category}</td>
                    <td style={{ color: p.stock < 10 ? '#f44336' : 'inherit' }}>{p.stock}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => openEdit(p)} style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Editar</button>
                        <button onClick={() => deleteProduct(p.id, p.name)} style={{ background: 'none', border: '1px solid rgba(244,67,54,0.3)', color: '#f44336', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflow: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{editingId ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.5 }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Name + Slug */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={lbl}>Nombre *</label>
                  <input value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value, slug: f.slug === slugify(f.name) || !f.slug ? slugify(e.target.value) : f.slug })); }} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Slug</label>
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} style={inp} placeholder="auto-generado" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={lbl}>Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inp, resize: 'vertical' }} />
              </div>

              {/* Price / Original / Stock / Order */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={lbl}>Precio (€) *</label>
                  <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Precio original</label>
                  <input type="number" step="0.01" value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))} style={inp} placeholder="Opcional" />
                </div>
                <div>
                  <label style={lbl}>Stock</label>
                  <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Orden</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} style={inp} />
                </div>
              </div>

              {/* Category / Collection / Badge */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={lbl}>Categoría *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Colección *</label>
                  <select value={form.collection} onChange={e => setForm(f => ({ ...f, collection: e.target.value }))} style={inp}>
                    {COLLECTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Badge</label>
                  <select value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} style={inp}>
                    {BADGES.map(b => <option key={b} value={b}>{b || '— Ninguno —'}</option>)}
                  </select>
                </div>
              </div>

              {/* Sizes */}
              <div>
                <label style={lbl}>Tallas</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {ALL_SIZES.map(s => (
                    <button key={s} type="button" onClick={() => toggleSize(s)} style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid', background: form.sizes.includes(s) ? '#fff' : 'transparent', color: form.sizes.includes(s) ? '#000' : '#fff', borderColor: form.sizes.includes(s) ? '#fff' : 'rgba(255,255,255,0.2)' }}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <label style={lbl}>Colores</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {COMMON_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => toggleColor(c)} style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid', background: form.colors.includes(c) ? '#fff' : 'transparent', color: form.colors.includes(c) ? '#000' : '#fff', borderColor: form.colors.includes(c) ? '#fff' : 'rgba(255,255,255,0.2)' }}>{c}</button>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div>
                <label style={lbl}>Imágenes</label>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {form.images.map((img, i) => (
                    <div key={i} style={{ position: 'relative', width: '80px', height: '100px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#f44336', width: '20px', height: '20px', borderRadius: '50%', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...inp, width: 'auto', cursor: 'pointer', opacity: uploading ? 0.5 : 1 }}>{uploading ? 'Subiendo...' : '📁 Subir imagen'}</button>
                  <span style={{ opacity: 0.4, fontSize: '0.8rem' }}>o</span>
                  <input placeholder="URL de imagen" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImageUrl())} style={{ ...inp, flex: 1 }} />
                  <button type="button" onClick={addImageUrl} style={{ ...inp, width: 'auto', cursor: 'pointer' }}>+</button>
                </div>
              </div>

              {/* Details */}
              <div>
                <label style={lbl}>Detalles del producto</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.5rem' }}>
                  {form.details.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <span style={{ opacity: 0.5 }}>•</span>
                      <span style={{ flex: 1 }}>{d}</span>
                      <button type="button" onClick={() => removeDetail(i)} style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer', fontSize: '0.8rem' }}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input placeholder="Nuevo detalle" value={newDetail} onChange={e => setNewDetail(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDetail())} style={{ ...inp, flex: 1 }} />
                  <button type="button" onClick={addDetail} style={{ ...inp, width: 'auto', cursor: 'pointer' }}>+</button>
                </div>
              </div>

              {/* Active toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                Producto activo (visible en tienda)
              </label>

              {/* Save */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ ...inp, width: 'auto', cursor: 'pointer' }}>Cancelar</button>
                <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ fontSize: '0.9rem', opacity: saving ? 0.5 : 1 }}>{saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear producto'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
