import ProductDetailClient from '@/components/product/ProductDetailClient';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} />;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return {
    title: `${slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} — SEVENTHWEAR`,
    description: 'Producto SEVENTHWEAR — StreetRideWear',
  };
}
