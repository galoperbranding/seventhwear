'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import TipTapEditor from '@/components/TipTapEditor';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  status: 'draft' | 'published';
  author_name: string;
  published_at: string | null;
  created_at: string;
}

const CATEGORIES = ['Cultura', 'Producto', 'Colección', 'Riders', 'Comunidad', 'Noticias', 'Blog'];

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const emptyForm = {
  title: '', slug: '', excerpt: '', content: '', cover_image: '',
  category: 'Cultura', status: 'draft' as 'draft' | 'published',
};

export default function CMSBlogPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') fetchPosts();
  }, [user]);

  function fetchPosts() {
    fetch('/api/admin/cms/posts')
      .then(r => r.json())
      .then(d => setPosts(d.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  }

  function openEdit(p: Post) {
    setEditingId(p.id);
    setForm({ title: p.title, slug: p.slug, excerpt: p.excerpt, content: p.content, cover_image: p.cover_image, category: p.category || 'Cultura', status: p.status });
    setShowModal(true);
  }

  const handleSave = useCallback(async (statusOverride: 'draft' | 'published') => {
    if (!form.title.trim()) { showToast('El título es obligatorio', 'error'); return; }
    setSaving(true);
    const body = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      excerpt: form.excerpt,
      content: form.content,
      cover_image: form.cover_image,
      category: form.category,
      status: statusOverride,
      ...(editingId ? { id: editingId } : {}),
    };
    try {
      const res = await fetch('/api/admin/cms/posts', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showToast(statusOverride === 'published' ? '✅ Post publicado' : 'Borrador guardado');
        setShowModal(false);
        fetchPosts();
      } else {
        const d = await res.json();
        showToast(d.error || 'Error al guardar', 'error');
      }
    } catch { showToast('Error de conexión', 'error'); }
    finally { setSaving(false); }
  }, [form, editingId, showToast]);

  async function deletePost(id: string, title: string) {
    if (!confirm(`¿Eliminar "${title}"?`)) return;
    await fetch('/api/admin/cms/posts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    showToast('Post eliminado');
    fetchPosts();
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) { setForm(f => ({ ...f, cover_image: data.url })); showToast('Imagen subida'); }
      else showToast(data.error || 'Error', 'error');
    } catch { showToast('Error al subir', 'error'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  const handleContentChange = useCallback((v: string) => {
    setForm(f => ({ ...f, content: v }));
  }, []);

  if (authLoading || !user || user.role !== 'admin') return <div className="crm-loading-page"><div className="crm-spinner" /></div>;

  const inp: React.CSSProperties = { background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.6rem 0.75rem', borderRadius: '4px', fontSize: '0.9rem', width: '100%' };
  const lbl: React.CSSProperties = { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, display: 'block', marginBottom: '0.35rem' };

  return (
    <>
      <div className="crm-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/admin/cms" style={{ opacity: 0.4, fontSize: '0.85rem', textDecoration: 'none', color: 'inherit' }}>← CMS</Link>
          <h1 className="crm-page-title">Blog</h1>
          <p className="crm-page-subtitle" style={{ margin: 0 }}>{posts.length} posts</p>
        </div>
        <button onClick={openCreate} className="crm-action-btn" style={{ background: 'var(--color-text)', color: 'var(--color-bg)', borderColor: 'var(--color-text)' }}>+ Nuevo post</button>
      </div>

      {loading ? <p style={{ opacity: 0.5 }}>Cargando...</p> : posts.length === 0 ? (
        <div className="crm-empty-state"><p>No hay posts aún. ¡Crea el primero!</p></div>
      ) : (
        <div className="crm-table-card">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Portada</th>
                <th>Título</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(p => (
                <tr key={p.id}>
                  <td style={{ width: 50 }}>
                    {p.cover_image
                      ? <img src={p.cover_image} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                      : <div style={{ width: 40, height: 40, background: 'var(--color-bg-secondary)', borderRadius: 4 }} />}
                  </td>
                  <td>
                    <p style={{ fontWeight: 500 }}>{p.title}</p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.4 }}>/blog/{p.slug}</p>
                  </td>
                  <td><span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{p.category || '—'}</span></td>
                  <td>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 500, background: p.status === 'published' ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)', color: p.status === 'published' ? '#10b981' : '#6b7280' }}>
                      {p.status === 'published' ? 'Publicado' : 'Borrador'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', opacity: 0.5 }}>
                    {p.published_at
                      ? new Date(p.published_at.replace(' ', 'T')).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                      : new Date(p.created_at.replace(' ', 'T')).toLocaleDateString('es-ES')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openEdit(p)} style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.25rem 0.75rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>Editar</button>
                      <button onClick={() => deletePost(p.id, p.title)} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.25rem 0.75rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto' }} onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 12, width: '100%', maxWidth: 900, padding: '2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{editingId ? 'Editar post' : 'Nuevo post'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.5 }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Título + Slug */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={lbl}>Título *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: !f.slug || f.slug === slugify(f.title) ? slugify(e.target.value) : f.slug }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Slug</label>
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} style={inp} placeholder="auto-generado" />
                </div>
              </div>

              {/* Categoría + Extracto */}
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem' }}>
                <div>
                  <label style={lbl}>Categoría</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Extracto</label>
                  <input value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} style={inp} placeholder="Breve descripción del post..." />
                </div>
              </div>

              {/* Imagen portada */}
              <div>
                <label style={lbl}>Imagen de portada</label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {form.cover_image && <img src={form.cover_image} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--color-border)', flexShrink: 0 }} />}
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: 'none' }} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...inp, width: 'auto', cursor: 'pointer', flexShrink: 0 }}>{uploading ? '⏳ Subiendo...' : '📁 Subir imagen'}</button>
                  <span style={{ opacity: 0.4, fontSize: '0.8rem' }}>o</span>
                  <input placeholder="URL de la imagen" value={form.cover_image} onChange={e => setForm(f => ({ ...f, cover_image: e.target.value }))} style={inp} />
                </div>
              </div>

              {/* Contenido TipTap */}
              <div>
                <label style={lbl}>Contenido</label>
                <TipTapEditor
                  key={editingId || 'new'}
                  content={form.content}
                  onChange={handleContentChange}
                  placeholder="Escribe el contenido del post aquí..."
                  minHeight={350}
                />
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ ...inp, width: 'auto', cursor: 'pointer' }}>Cancelar</button>
                  <button type="button" onClick={() => handleSave('draft')} disabled={saving} style={{ ...inp, width: 'auto', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
                    {saving ? 'Guardando...' : '💾 Guardar borrador'}
                  </button>
                </div>
                <button type="button" onClick={() => handleSave('published')} disabled={saving} className="btn btn-primary" style={{ opacity: saving ? 0.5 : 1 }}>
                  {saving ? 'Publicando...' : '🚀 Publicar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
