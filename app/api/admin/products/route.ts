import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const db = getDb();
    const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();

    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, description, price, original_price, category, collection, badge, images, colors, sizes, details, stock } = body;

    if (!name || !slug || !price || !category || !collection) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const db = getDb();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO products (id, name, slug, description, price, original_price, category, collection, badge, images, colors, sizes, details, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, slug, description || '', price, original_price || null,
      category, collection, badge || null,
      JSON.stringify(images || []), JSON.stringify(colors || []),
      JSON.stringify(sizes || []), JSON.stringify(details || []),
      stock || 50
    );

    return NextResponse.json({ id, message: 'Producto creado' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, slug, description, price, original_price, category, collection, badge, images, colors, sizes, details, stock } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const db = getDb();

    db.prepare(`
      UPDATE products SET
        name = ?, slug = ?, description = ?, price = ?, original_price = ?,
        category = ?, collection = ?, badge = ?,
        images = ?, colors = ?, sizes = ?, details = ?,
        stock = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name, slug, description, price, original_price || null,
      category, collection, badge || null,
      JSON.stringify(images || []), JSON.stringify(colors || []),
      JSON.stringify(sizes || []), JSON.stringify(details || []),
      stock, id
    );

    return NextResponse.json({ message: 'Producto actualizado' });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('DELETE FROM products WHERE id = ?').run(id);

    return NextResponse.json({ message: 'Producto eliminado' });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
