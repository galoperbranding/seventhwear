import { Metadata } from 'next';
import getDb from '@/lib/db';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const db = getDb();
    const page = db.prepare('SELECT * FROM cms_pages WHERE slug = ?').get('faq') as { title: string; meta_description: string } | undefined;
    if (page) return { title: `${page.title} — SEVENTHWEAR`, description: page.meta_description };
  } catch { /* fallback */ }
  return {
    title: 'Preguntas Frecuentes — SEVENTHWEAR',
    description: 'Respuestas a las preguntas más frecuentes sobre pedidos, envíos, devoluciones y más.',
  };
}

export default function FAQPage() {
  let content = '';
  let title = 'Preguntas Frecuentes';
  let subtitle = 'Resolvemos tus dudas';
  try {
    const db = getDb();
    const page = db.prepare('SELECT * FROM cms_pages WHERE slug = ?').get('faq') as { title: string; content: string } | undefined;
    if (page) { title = page.title; content = page.content; }
  } catch { /* fallback */ }

  return (
    <>
      <div className="page-header">
        <h1>{title}</h1>
        <p>{subtitle}</p>
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
