'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="crm-layout">
      <aside className="crm-sidebar">
        <div className="crm-sidebar-brand">
          <span className="crm-sidebar-logo">CRM</span>
          <span className="crm-sidebar-title">SEVENTHWEAR</span>
        </div>

        <nav className="crm-sidebar-nav">
          <Link href="/admin" className={`crm-nav-item ${pathname === '/admin' ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Dashboard
          </Link>
          <Link href="/admin/pedidos" className={`crm-nav-item ${pathname === '/admin/pedidos' ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            Pedidos
          </Link>
          <Link href="/admin/productos" className={`crm-nav-item ${pathname === '/admin/productos' ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            Productos
          </Link>
          <Link href="/admin/clientes" className={`crm-nav-item ${pathname?.startsWith('/admin/clientes') ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            Clientes
          </Link>
          <Link href="/admin/analytics" className={`crm-nav-item ${pathname?.startsWith('/admin/analytics') ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2H10a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/><line x1="10" y1="22" x2="14" y2="22"/></svg>
            IA & Analítica
          </Link>
          <Link href="/admin/cms" className={`crm-nav-item ${pathname?.startsWith('/admin/cms') ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            CMS
          </Link>
        </nav>

        <div id="admin-sidebar-extra"></div>

        {/* Volver al sitio */}
        <div style={{ marginTop: 'auto', padding: '1.5rem 1rem', borderTop: '1px solid var(--color-border)' }}>
          <Link
            href="/"
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', opacity: 0.5, transition: 'opacity 0.2s', textDecoration: 'none', color: 'inherit' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Volver al sitio
          </Link>
        </div>
      </aside>

      <main className="crm-main">
        {children}
      </main>
    </div>
  );
}
