import { Metadata } from 'next';
import getDb from '@/lib/db';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const db = getDb();
    const page = db.prepare('SELECT * FROM cms_pages WHERE slug = ?').get('guia-tallas') as { title: string; meta_description: string } | undefined;
    if (page) return { title: `${page.title} — SEVENTHWEAR`, description: page.meta_description };
  } catch { /* fallback */ }
  return {
    title: 'Guía de Tallas — SEVENTHWEAR',
    description: 'Encuentra tu talla perfecta con nuestra guía de tallas SEVENTHWEAR.',
  };
}

export default function GuiaTallasPage() {
  let content = '';
  let title = 'Guía de Tallas';
  try {
    const db = getDb();
    const page = db.prepare('SELECT * FROM cms_pages WHERE slug = ?').get('guia-tallas') as { title: string; content: string } | undefined;
    if (page) { title = page.title; content = page.content; }
  } catch { /* fallback */ }

  return (
    <>
      <div className="page-header">
        <h1>{title}</h1>
        <p>Encuentra tu fit perfecto</p>
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
