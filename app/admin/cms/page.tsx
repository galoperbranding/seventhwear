'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

const CMS_SECTIONS = [
  {
    href: '/admin/cms/blog',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    title: 'Blog',
    description: 'Crea y publica artículos, noticias y contenido editorial',
    color: '#3b82f6',
  },
  {
    href: '/admin/cms/lookbook',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
    title: 'Lookbook',
    description: 'Gestiona la galería de fotos y shoots de la marca',
    color: '#8b5cf6',
  },
  {
    href: '/admin/cms/banners',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="7" width="20" height="10" rx="2"/>
        <path d="M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2"/>
      </svg>
    ),
    title: 'Banners',
    description: 'Configura el hero, promociones y anuncios del sitio',
    color: '#f59e0b',
  },
  {
    href: '/admin/cms/paginas',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
      </svg>
    ),
    title: 'Páginas',
    description: 'Edita el contenido de Brand, FAQ, Envíos y Devoluciones',
    color: '#10b981',
  },
];

export default function CMSHubPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/login');
  }, [user, authLoading, router]);

  if (authLoading || !user || user.role !== 'admin') {
    return <div className="crm-loading-page"><div className="crm-spinner" /></div>;
  }

  return (
    <>
      <div className="crm-topbar">
        <div>
          <h1 className="crm-page-title">CMS</h1>
          <p className="crm-page-subtitle">Gestiona el contenido del sitio</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', padding: '0.5rem 0' }}>
        {CMS_SECTIONS.map(section => (
          <Link
            key={section.href}
            href={section.href}
            style={{
              display: 'flex', flexDirection: 'column', gap: '1rem',
              padding: '1.75rem', border: '1px solid var(--color-border)',
              borderRadius: '8px', textDecoration: 'none', color: 'inherit',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = section.color;
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px ${section.color}22`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '56px', height: '56px', borderRadius: '12px',
              background: `${section.color}15`, color: section.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {section.icon}
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.35rem' }}>{section.title}</h3>
              <p style={{ fontSize: '0.85rem', opacity: 0.55, lineHeight: 1.5 }}>{section.description}</p>
            </div>
            <div style={{ fontSize: '0.8rem', color: section.color, marginTop: 'auto' }}>
              Gestionar →
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
