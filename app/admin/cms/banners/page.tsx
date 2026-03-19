'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  cta_text: string;
  cta_url: string;
  image_url: string;
  position: string;
  is_active: number;
  sort_order: number;
  bg_color: string;
  text_color: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

const POSITIONS = [
  { value: 'hero', label: 'Hero (principal)' },
  { value: 'promo', label: 'Promoción' },
  { value: 'announcement', label: 'Anuncio (barra superior)' },
];

const emptyForm = {
  title: '', subtitle: '', cta_text: '', cta_url: '/', image_url: '',
  position: 'hero', bg_color: '#000000', text_color: '#ffffff',
  sort_order: '0', starts_at: '', ends_at: '', is_active: true,
};

export default function CMSBannersPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') fetchBanners();
  }, [user]);

  function fetchBanners() {
    fetch('/api/admin/cms/banners').then(r => r.json()).then(d => setBanners(d.banners || [])).catch(() => {}).finally(() => setLoading(false));
  }

  function openCreate() { setEditingId(null); setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(b: Banner) {
    setEditingId(b.id);
    setForm({ title: b.title, subtitle: b.subtitle, cta_text: b.cta_text, cta_url: b.cta_url, image_url: b.image_url, position: b.position, bg_color: b.bg_color, text_color: b.text_color, sort_order: String(b.sort_order), starts_at: b.starts_at || '', ends_at: b.ends_at || '', is_active: b.is_active === 1 });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim()) { showToast('El título es obligatorio', 'error'); return; }
    setSaving(true);
    const body = { ...form, sort_order: parseInt(form.sort_order) || 0, starts_at: form.starts_at || null, ends_at: form.ends_at || null, ...(editingId ? { id: editingId } : {}) };
    try {
      const res = await fetch('/api/admin/cms/banners', { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { showToast(editingId ? 'Banner actualizado' : 'Banner creado'); setShowModal(false); fetchBanners(); }
    } catch { showToast('Error', 'error'); }
    finally { setSaving(false); }
  }

  async function deleteBanner(id: string, title: string) {
    if (!confirm(`¿Eliminar banner "${title}"?`)) return;
    await fetch('/api/admin/cms/banners', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    showToast('Eliminado'); fetchBanners();
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
          <h1 className="crm-page-title">Banners</h1>
          <p className="crm-page-subtitle" style={{ margin: 0 }}>{banners.length} banners</p>
        </div>
        <button onClick={openCreate} className="crm-action-btn" style={{ background: 'var(--color-text)', color: 'var(--color-bg)', borderColor: 'var(--color-text)' }}>+ Nuevo banner</button>
      </div>

      {loading ? <p style={{ opacity: 0.5 }}>Cargando...</p> : banners.length === 0 ? (
        <div className="crm-empty-state"><p>No hay banners aún</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {banners.map(b => (
            <div key={b.id} style={{ border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden', opacity: b.is_active ? 1 : 0.55 }}>
              {/* Preview */}
              <div style={{ position: 'relative', background: b.bg_color, color: b.text_color, padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', minHeight: 100 }}>
                {b.image_url && <img src={b.image_url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />}
                <div>
                  {b.title && <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{b.title}</h3>}
                  {b.subtitle && <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>{b.subtitle}</p>}
                  {b.cta_text && <span style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.3rem 0.75rem', border: `1px solid ${b.text_color}`, borderRadius: 4, fontSize: '0.8rem' }}>{b.cta_text}</span>}
                </div>
                <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.4)', color: '#fff' }}>{POSITIONS.find(p => p.value === b.position)?.label}</span>
                  {!b.is_active && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(239,68,68,0.8)', color: '#fff' }}>Inactivo</span>}
                </div>
              </div>
              {/* Actions */}
              <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>→ {b.cta_url}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => openEdit(b)} style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.25rem 0.75rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>Editar</button>
                  <button onClick={() => deleteBanner(b.id, b.title)} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.25rem 0.75rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto' }} onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 12, width: '100%', maxWidth: 660, padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{editingId ? 'Editar banner' : 'Nuevo banner'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.5 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={lbl}>Título *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inp} /></div>
                <div><label style={lbl}>Posición</label>
                  <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} style={inp}>
                    {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={lbl}>Subtítulo</label><input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} style={inp} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={lbl}>Texto del botón CTA</label><input value={form.cta_text} onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))} style={inp} placeholder="Ej: Ver colección" /></div>
                <div><label style={lbl}>URL del CTA</label><input value={form.cta_url} onChange={e => setForm(f => ({ ...f, cta_url: e.target.value }))} style={inp} /></div>
              </div>
              <div>
                <label style={lbl}>Imagen de fondo</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {form.image_url && <img src={form.image_url} alt="" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />}
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...inp, width: 'auto', cursor: 'pointer' }}>{uploading ? 'Subiendo...' : '📁 Subir'}</button>
                  <input placeholder="o URL" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} style={inp} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                <div><label style={lbl}>Color de fondo</label><input type="color" value={form.bg_color} onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))} style={{ ...inp, padding: '0.2rem', height: 42, cursor: 'pointer' }} /></div>
                <div><label style={lbl}>Color de texto</label><input type="color" value={form.text_color} onChange={e => setForm(f => ({ ...f, text_color: e.target.value }))} style={{ ...inp, padding: '0.2rem', height: 42, cursor: 'pointer' }} /></div>
                <div><label style={lbl}>Orden</label><input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} style={inp} /></div>
                <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                  Activo
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={lbl}>Fecha inicio (opcional)</label><input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} style={inp} /></div>
                <div><label style={lbl}>Fecha fin (opcional)</label><input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} style={inp} /></div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowModal(false)} style={{ ...inp, width: 'auto', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary">{saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear banner'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
