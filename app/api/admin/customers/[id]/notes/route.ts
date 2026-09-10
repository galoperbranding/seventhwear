import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

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

    const { content, type = 'note' } = body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Contenido requerido' }, { status: 400 });
    }

    const validTypes = ['note', 'call', 'email', 'meeting', 'other'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    // Verify customer exists
    const customer = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'customer'").get(id);
    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const noteId = uuidv4();
    db.prepare(`
      INSERT INTO customer_notes (id, user_id, admin_id, content, type)
      VALUES (?, ?, ?, ?, ?)
    `).run(noteId, id, user.userId, content.trim(), type);

    // Return the created note with admin info
    const note = db.prepare(`
      SELECT cn.*, u.first_name as admin_name, u.last_name as admin_last_name
      FROM customer_notes cn
      JOIN users u ON u.id = cn.admin_id
      WHERE cn.id = ?
    `).get(noteId);

    return NextResponse.json({ note });
  } catch (error) {
    console.error('CRM add note error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const { noteId } = await request.json();

    if (!noteId) {
      return NextResponse.json({ error: 'ID de nota requerido' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('DELETE FROM customer_notes WHERE id = ? AND user_id = ?').run(noteId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('CRM delete note error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
