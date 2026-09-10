import { Metadata } from 'next';
import getDb from '@/lib/db';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const db = getDb();
    const page = db.prepare('SELECT * FROM cms_pages WHERE slug = ?').get('privacidad') as { title: string; meta_description: string } | undefined;
    if (page) return { title: `${page.title} — SEVENTHWEAR`, description: page.meta_description };
  } catch { /* fallback */ }
  return {
    title: 'Política de Privacidad — SEVENTHWEAR',
    description: 'Cómo protegemos tus datos personales en SEVENTHWEAR.',
  };
}

export default function PrivacidadPage() {
  let content = '';
  let title = 'Política de Privacidad y Cookies';
  try {
    const db = getDb();
    const page = db.prepare('SELECT * FROM cms_pages WHERE slug = ?').get('privacidad') as { title: string; content: string } | undefined;
    if (page) { title = page.title; content = page.content; }
  } catch { /* fallback */ }

  return (
    <>
      <div className="page-header">
        <h1>{title}</h1>
        <p>Tu privacidad es nuestra prioridad</p>
      </div>
      <div className="legal-content">
        {content
          ? <div dangerouslySetInnerHTML={{ __html: content }} />
          : <p style={{ opacity: 0.5 }}>Contenido no disponible.</p>
        }
      </div>
    </>
  );
}
