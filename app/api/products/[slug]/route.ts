import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = getDb();

    const product = db.prepare(
      'SELECT * FROM products WHERE slug = ? AND is_active = 1'
    ).get(slug) as Record<string, unknown> | undefined;

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const parsed = {
      ...product,
      colors: JSON.parse((product.colors as string) || '[]'),
      sizes: JSON.parse((product.sizes as string) || '[]'),
      images: JSON.parse((product.images as string) || '[]'),
      details: JSON.parse((product.details as string) || '[]'),
    };

    // Get related products (same collection, different product)
    const related = db.prepare(
      'SELECT * FROM products WHERE collection = ? AND id != ? AND is_active = 1 LIMIT 4'
    ).all(product.collection, product.id) as Record<string, unknown>[];

    const relatedParsed = related.map((p) => ({
      ...p,
      colors: JSON.parse((p.colors as string) || '[]'),
      sizes: JSON.parse((p.sizes as string) || '[]'),
      images: JSON.parse((p.images as string) || '[]'),
      details: JSON.parse((p.details as string) || '[]'),
    }));

    return NextResponse.json({ product: parsed, related: relatedParsed });
  } catch (error) {
    console.error('Product detail error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
