'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';

interface LookbookItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  collection: string;
  sort_order: number;
  is_active: number;
  created_at: string;
}

const COLLECTIONS = ['', 'street-collection', 'ride-collection', 'essentials'];

export default function CMSLookbookPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [items, setItems] = useState<LookbookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: '', description: '', image_url: '', collection: '', sort_order: '0', is_active: true });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') fetchItems();
  }, [user]);

  function fetchItems() {
    fetch('/api/admin/cms/lookbook').then(r => r.json()).then(d => setItems(d.items || [])).catch(() => {}).finally(() => setLoading(false));
  }

  function openCreate() { setEditingId(null); setForm({ title: '', description: '', image_url: '', collection: '', sort_order: '0', is_active: true }); setShowModal(true); }
  function openEdit(item: LookbookItem) {
    setEditingId(item.id);
    setForm({ title: item.title, description: item.description, image_url: item.image_url, collection: item.collection, sort_order: String(item.sort_order), is_active: item.is_active === 1 });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.image_url) { showToast('La imagen es obligatoria', 'error'); return; }
    setSaving(true);
    const body = { ...form, sort_order: parseInt(form.sort_order) || 0, is_active: form.is_active, ...(editingId ? { id: editingId } : {}) };
    try {
      const res = await fetch('/api/admin/cms/lookbook', { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { showToast(editingId ? 'Actualizado' : 'Añadido'); setShowModal(false); fetchItems(); }
    } catch { showToast('Error', 'error'); }
    finally { setSaving(false); }
  }

  async function deleteItem(id: string) {
    if (!confirm('¿Eliminar esta imagen?')) return;
    await fetch('/api/admin/cms/lookbook', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    showToast('Eliminado');
    fetchItems();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) { setForm(f => ({ ...f, image_url: data.url })); showToast('Imagen subida'); }
    } catch { showToast('Error al subir', 'error'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  if (authLoading || !user || user.role !== 'admin') return <div className="crm-loading-page"><div className="crm-spinner" /></div>;

  const inp: React.CSSProperties = { background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.6rem 0.75rem', borderRadius: '4px', fontSize: '0.9rem', width: '100%' };
  const lbl: React.CSSProperties = { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, display: 'block', marginBottom: '0.35rem' };

  return (
    <>
      <div className="crm-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/admin/cms" style={{ opacity: 0.4, fontSize: '0.85rem', textDecoration: 'none', color: 'inherit' }}>← CMS</Link>
          <h1 className="crm-page-title">Lookbook</h1>
          <p className="crm-page-subtitle" style={{ margin: 0 }}>{items.length} fotos</p>
        </div>
        <button onClick={openCreate} className="crm-action-btn" style={{ background: 'var(--color-text)', color: 'var(--color-bg)', borderColor: 'var(--color-text)' }}>+ Añadir foto</button>
      </div>

      {loading ? <p style={{ opacity: 0.5 }}>Cargando...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {items.map(item => (
            <div key={item.id} style={{ border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden', opacity: item.is_active ? 1 : 0.5 }}>
              <div style={{ position: 'relative', aspectRatio: '3/4', background: 'var(--color-bg-secondary)' }}>
                <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {!item.is_active && <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem' }}>Oculto</div>}
              </div>
              <div style={{ padding: '0.75rem' }}>
                {item.title && <p style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>{item.title}</p>}
                {item.collection && <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>{item.collection}</p>}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button onClick={() => openEdit(item)} style={{ flex: 1, background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.2rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>Editar</button>
                  <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.2rem 0.5rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>×</button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="crm-empty-state" style={{ gridColumn: '1/-1' }}><p>No hay fotos en el lookbook aún</p></div>}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 12, width: '100%', maxWidth: 520, padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{editingId ? 'Editar foto' : 'Nueva foto'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.5 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={lbl}>Imagen *</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {form.image_url && <img src={form.image_url} alt="" style={{ width: 50, height: 65, objectFit: 'cover', borderRadius: 4 }} />}
                  <div style={{ flex: 1 }}>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...inp, cursor: 'pointer', marginBottom: '0.5rem' }}>{uploading ? 'Subiendo...' : '📁 Subir imagen'}</button>
                    <input placeholder="o URL de imagen" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} style={inp} />
                  </div>
                </div>
              </div>
              <div><label style={lbl}>Título</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inp} /></div>
              <div><label style={lbl}>Descripción</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inp, resize: 'vertical' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={lbl}>Colección</label>
                  <select value={form.collection} onChange={e => setForm(f => ({ ...f, collection: e.target.value }))} style={inp}>
                    {COLLECTIONS.map(c => <option key={c} value={c}>{c || '— Ninguna —'}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Orden</label><input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} style={inp} /></div>
              </div>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                Visible en el sitio
              </label>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowModal(false)} style={{ ...inp, width: 'auto', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary">{saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Añadir'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
