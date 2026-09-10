import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// Assign/remove tags from a customer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const db = getDb();
    const body = await request.json();
    const { tagId, action } = body;

    if (!tagId || !['add', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    // Verify customer exists
    const customer = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'customer'").get(id);
    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    if (action === 'add') {
      const assignId = uuidv4();
      try {
        db.prepare(`INSERT INTO customer_tag_assignments (id, user_id, tag_id) VALUES (?, ?, ?)`)
          .run(assignId, id, tagId);
      } catch {
        // Already assigned — ignore
      }
    } else {
      db.prepare('DELETE FROM customer_tag_assignments WHERE user_id = ? AND tag_id = ?')
        .run(id, tagId);
    }

    // Return updated tags
    const tags = db.prepare(`
      SELECT ct.id, ct.name, ct.color
      FROM customer_tag_assignments cta
      JOIN customer_tags ct ON ct.id = cta.tag_id
      WHERE cta.user_id = ?
    `).all(id);

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('CRM tags error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
