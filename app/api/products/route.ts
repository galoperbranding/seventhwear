import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const collection = searchParams.get('collection');
    const badge = searchParams.get('badge');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'sort_order';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = 'SELECT * FROM products WHERE is_active = 1';
    const params: (string | number)[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (collection) {
      query += ' AND collection = ?';
      params.push(collection);
    }
    if (badge) {
      query += ' AND badge = ?';
      params.push(badge);
    }
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Sorting
    switch (sort) {
      case 'price-asc':
        query += ' ORDER BY price ASC';
        break;
      case 'price-desc':
        query += ' ORDER BY price DESC';
        break;
      case 'name-asc':
        query += ' ORDER BY name ASC';
        break;
      case 'newest':
        query += ' ORDER BY created_at DESC';
        break;
      default:
        query += ' ORDER BY sort_order ASC, created_at DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const products = db.prepare(query).all(...params);

    // Parse JSON fields
    const parsed = (products as Record<string, unknown>[]).map((p) => ({
      ...p,
      colors: JSON.parse((p.colors as string) || '[]'),
      sizes: JSON.parse((p.sizes as string) || '[]'),
      images: JSON.parse((p.images as string) || '[]'),
      details: JSON.parse((p.details as string) || '[]'),
    }));

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE is_active = 1';
    const countParams: (string | number)[] = [];
    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }
    if (collection) {
      countQuery += ' AND collection = ?';
      countParams.push(collection);
    }
    if (badge) {
      countQuery += ' AND badge = ?';
      countParams.push(badge);
    }
    if (search) {
      countQuery += ' AND (name LIKE ? OR description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const countResult = db.prepare(countQuery).get(...countParams) as { total: number };

    return NextResponse.json({
      products: parsed,
      total: countResult.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
