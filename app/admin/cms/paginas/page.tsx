'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import TipTapEditor from '@/components/TipTapEditor';

interface CmsPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string;
  updated_at: string;
}

export default function CMSPaginasPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', meta_description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetch('/api/admin/cms/pages').then(r => r.json()).then(d => {
        setPages(d.pages || []);
        if (d.pages?.length > 0) {
          const first = d.pages[0];
          setActivePageId(first.id);
          setForm({ title: first.title, content: first.content, meta_description: first.meta_description });
        }
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [user]);

  function selectPage(page: CmsPage) {
    setActivePageId(page.id);
    setForm({ title: page.title, content: page.content, meta_description: page.meta_description });
  }

  const handleContentChange = useCallback((v: string) => {
    setForm(f => ({ ...f, content: v }));
  }, []);

  async function handleSave() {
    if (!activePageId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/cms/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activePageId, ...form }),
      });
      if (res.ok) {
        showToast('✅ Página guardada');
        setPages(prev => prev.map(p => p.id === activePageId
          ? { ...p, ...form, updated_at: new Date().toISOString() }
          : p
        ));
      } else { showToast('Error al guardar', 'error'); }
    } catch { showToast('Error de conexión', 'error'); }
    finally { setSaving(false); }
  }

  if (authLoading || !user || user.role !== 'admin') return <div className="crm-loading-page"><div className="crm-spinner" /></div>;

  const inp: React.CSSProperties = { background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.6rem 0.75rem', borderRadius: '4px', fontSize: '0.9rem', width: '100%' };
  const lbl: React.CSSProperties = { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, display: 'block', marginBottom: '0.35rem' };
  const activePage = pages.find(p => p.id === activePageId);

  return (
    <>
      <div className="crm-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/admin/cms" style={{ opacity: 0.4, fontSize: '0.85rem', textDecoration: 'none', color: 'inherit' }}>← CMS</Link>
          <h1 className="crm-page-title">Páginas</h1>
        </div>
        <button onClick={handleSave} disabled={saving || !activePageId} className="crm-action-btn" style={{ background: 'var(--color-text)', color: 'var(--color-bg)', borderColor: 'var(--color-text)' }}>
          {saving ? 'Guardando...' : '💾 Guardar cambios'}
        </button>
      </div>

      {loading ? <p style={{ opacity: 0.5 }}>Cargando...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem' }}>
          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {pages.map(page => (
              <button
                key={page.id}
                onClick={() => selectPage(page)}
                style={{
                  padding: '0.75rem 1rem', borderRadius: 6, cursor: 'pointer', textAlign: 'left',
                  border: '1px solid', fontSize: '0.9rem', transition: 'all 0.15s',
                  background: activePageId === page.id ? 'var(--color-text)' : 'transparent',
                  color: activePageId === page.id ? 'var(--color-bg)' : 'var(--color-text)',
                  borderColor: activePageId === page.id ? 'var(--color-text)' : 'var(--color-border)',
                }}
              >
                <div style={{ fontWeight: 500 }}>{page.title}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: 2 }}>/{page.slug}</div>
              </button>
            ))}
          </div>

          {/* Editor */}
          {activePage ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={lbl}>Título de la página</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Meta descripción (SEO)</label>
                <input value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} style={inp} placeholder="Descripción para motores de búsqueda..." />
              </div>
              <div>
                <label style={lbl}>Contenido</label>
                <TipTapEditor
                  key={activePageId}
                  content={form.content}
                  onChange={handleContentChange}
                  placeholder="Escribe el contenido de la página..."
                  minHeight={450}
                />
              </div>
              {activePage.updated_at && (
                <p style={{ fontSize: '0.75rem', opacity: 0.4 }}>
                  Última actualización: {new Date(activePage.updated_at.replace(' ', 'T')).toLocaleString('es-ES')}
                </p>
              )}
            </div>
          ) : (
            <div className="crm-empty-state"><p>Selecciona una página para editarla</p></div>
          )}
        </div>
      )}
    </>
  );
}
