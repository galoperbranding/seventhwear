'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error en la página:', error);
  }, [error]);

  return (
    <main className="main-content">
      <div className="container">
        <div className="page-header">
          <h1>Algo salió mal</h1>
          <p>
            No pudimos cargar esta página. Puedes reintentar o volver a la tienda.
          </p>
        </div>
        <div
          style={{
            textAlign: 'center',
            paddingBottom: '4rem',
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button onClick={reset} className="btn btn-primary">
            Reintentar
          </button>
          <Link href="/" className="btn">
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
