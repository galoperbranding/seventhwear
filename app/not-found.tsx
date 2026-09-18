import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Página no encontrada — SEVENTHWEAR',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="main-content">
      <div className="container">
        <div className="page-header">
          <h1>404</h1>
          <p>La página que buscas no existe o fue movida.</p>
        </div>
        <div style={{ textAlign: 'center', paddingBottom: '4rem' }}>
          <Link href="/shop" className="btn btn-primary">
            Ver la tienda
          </Link>
        </div>
      </div>
    </main>
  );
}
