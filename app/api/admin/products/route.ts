import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { logAudit, getClientIp, sanitizeText, isValidSlug, truncate } from '@/lib/security';

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
    const { name, slug, description, price, original_price, category, collection, badge, images, colors, sizes, details, stock, is_active, sort_order } = body;

    if (!name || !slug || !price || !category || !collection) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: 'Slug inválido (solo minúsculas, números y guiones)' }, { status: 400 });
    }

    const db = getDb();
    const id = uuidv4();
    const cleanName = truncate(sanitizeText(name), 200);
    const cleanDesc = truncate(sanitizeText(description || ''), 5000);

    db.prepare(`
      INSERT INTO products (id, name, slug, description, price, original_price, category, collection, badge, images, colors, sizes, details, stock, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, cleanName, slug, cleanDesc, price, original_price || null,
      category, collection, badge || null,
      JSON.stringify(images || []), JSON.stringify(colors || []),
      JSON.stringify(sizes || []), JSON.stringify(details || []),
      stock ?? 50, is_active ?? 1, sort_order ?? 0
    );

    logAudit({ action: 'product_create', actorId: user.userId, actorEmail: user.email, targetType: 'product', targetId: id, ip: getClientIp(request), details: cleanName });

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
    const { id, name, slug, description, price, original_price, category, collection, badge, images, colors, sizes, details, stock, is_active, sort_order } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const db = getDb();

    const cleanName = truncate(sanitizeText(name), 200);
    const cleanDesc = truncate(sanitizeText(description || ''), 5000);

    db.prepare(`
      UPDATE products SET
        name = ?, slug = ?, description = ?, price = ?, original_price = ?,
        category = ?, collection = ?, badge = ?,
        images = ?, colors = ?, sizes = ?, details = ?,
        stock = ?, is_active = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      cleanName, slug, cleanDesc, price, original_price || null,
      category, collection, badge || null,
      JSON.stringify(images || []), JSON.stringify(colors || []),
      JSON.stringify(sizes || []), JSON.stringify(details || []),
      stock, is_active ?? 1, sort_order ?? 0, id
    );

    logAudit({ action: 'product_update', actorId: user.userId, actorEmail: user.email, targetType: 'product', targetId: id, ip: getClientIp(request), details: cleanName });

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
    const product = db.prepare('SELECT name FROM products WHERE id = ?').get(id) as { name: string } | undefined;
    db.prepare('DELETE FROM products WHERE id = ?').run(id);

    logAudit({ action: 'product_delete', actorId: user.userId, actorEmail: user.email, targetType: 'product', targetId: id, ip: getClientIp(request), details: product?.name || id, severity: 'warn' });

    return NextResponse.json({ message: 'Producto eliminado' });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
