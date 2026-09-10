'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  category: string;
  collection: string;
  badge: string | null;
  stock: number;
  images: string;
}

export default function AdminProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchProducts();
    }
  }, [user]);

  function fetchProducts() {
    fetch('/api/admin/products')
      .then(res => res.json())
      .then(data => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  async function deleteProduct(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;

    try {
      await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchProducts();
    } catch {
      // ignore
    }
  }

  if (authLoading || !user || user.role !== 'admin') {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>Cargando...</div>;
  }

  function getFirstImage(images: string): string {
    try {
      const arr = JSON.parse(images);
      return arr[0] || '';
    } catch {
      return '';
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Gestión de productos</h1>
      </div>

      <div className="container" style={{ maxWidth: '1100px', padding: '2rem 1.5rem 4rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <Link href="/admin" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>Dashboard</Link>
          <Link href="/admin/pedidos" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>Pedidos</Link>
          <Link href="/admin/productos" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>Productos</Link>
        </div>

        {loading ? (
          <p style={{ opacity: 0.5 }}>Cargando productos...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}></th>
                  <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>Producto</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>Precio</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>Categoría</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>Stock</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.5rem', width: '50px' }}>
                      {getFirstImage(p.images) && (
                        <img src={getFirstImage(p.images)} alt="" style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <p style={{ fontWeight: 500 }}>{p.name}</p>
                      <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>{p.collection}</p>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      €{p.price.toFixed(2)}
                      {p.original_price && (
                        <span style={{ opacity: 0.5, textDecoration: 'line-through', marginLeft: '0.5rem', fontSize: '0.85rem' }}>€{p.original_price.toFixed(2)}</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{p.category}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: p.stock < 10 ? '#f44336' : 'inherit' }}>{p.stock}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <button
                        onClick={() => deleteProduct(p.id, p.name)}
                        style={{ background: 'none', border: '1px solid rgba(244,67,54,0.3)', color: '#f44336', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
