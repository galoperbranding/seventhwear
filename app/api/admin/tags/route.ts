import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// Get all tags
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const db = getDb();
    const tags = db.prepare(`
      SELECT ct.*, 
        (SELECT COUNT(*) FROM customer_tag_assignments WHERE tag_id = ct.id) as customer_count
      FROM customer_tags ct
      ORDER BY ct.name
    `).all();

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('CRM tags list error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// Create a new tag
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const db = getDb();
    const { name, color = '#666666' } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
    }

    const id = uuidv4();
    try {
      db.prepare('INSERT INTO customer_tags (id, name, color) VALUES (?, ?, ?)')
        .run(id, name.trim(), color);
    } catch {
      return NextResponse.json({ error: 'Ya existe una etiqueta con ese nombre' }, { status: 409 });
    }

    const tag = db.prepare('SELECT * FROM customer_tags WHERE id = ?').get(id);
    return NextResponse.json({ tag });
  } catch (error) {
    console.error('CRM create tag error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// Delete a tag
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const db = getDb();
    const { tagId } = await request.json();

    if (!tagId) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    db.prepare('DELETE FROM customer_tags WHERE id = ?').run(tagId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('CRM delete tag error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
