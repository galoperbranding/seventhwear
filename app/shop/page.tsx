import { Suspense } from 'react';
import { Metadata } from 'next';
import ShopContent from '@/components/shop/ShopContent';

export const metadata: Metadata = {
  title: 'Tienda — SEVENTHWEAR',
  description: 'Explora todas nuestras colecciones de streetwear y ridewear.',
};

export default function ShopPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>Cargando...</div>}>
      <ShopContent />
    </Suspense>
  );
}
