import { Metadata } from 'next';
import getDb from '@/lib/db';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const db = getDb();
    const page = db.prepare('SELECT * FROM cms_pages WHERE slug = ?').get('envios') as { title: string; meta_description: string } | undefined;
    if (page) return { title: `${page.title} — SEVENTHWEAR`, description: page.meta_description };
  } catch { /* fallback */ }
  return {
    title: 'Envíos — SEVENTHWEAR',
    description: 'Información sobre envíos, plazos de entrega y gastos de envío en SEVENTHWEAR.',
  };
}

export default function EnviosPage() {
  let content = '';
  let title = 'Envíos';
  try {
    const db = getDb();
    const page = db.prepare('SELECT * FROM cms_pages WHERE slug = ?').get('envios') as { title: string; content: string } | undefined;
    if (page) { title = page.title; content = page.content; }
  } catch { /* fallback */ }

  return (
    <>
      <div className="page-header">
        <h1>{title}</h1>
        <p>Todo lo que necesitas saber sobre nuestros envíos</p>
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
