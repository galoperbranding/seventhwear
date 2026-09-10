import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { sanitizeText, truncate } from '@/lib/security';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const db = getDb();
    const user = db.prepare(
      'SELECT id, email, first_name, last_name, phone, role, birth_date, created_at FROM users WHERE id = ?'
    ).get(authUser.userId) as {
      id: string; email: string; first_name: string;
      last_name: string; phone: string; role: string; birth_date: string | null; created_at: string;
    } | undefined;

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role,
        birth_date: user.birth_date,
        created_at: user.created_at,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const db = getDb();

    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (body.first_name !== undefined) {
      updates.push('first_name = ?');
      values.push(truncate(sanitizeText(body.first_name), 100));
    }
    if (body.last_name !== undefined) {
      updates.push('last_name = ?');
      values.push(truncate(sanitizeText(body.last_name), 100));
    }
    if (body.phone !== undefined) {
      updates.push('phone = ?');
      values.push(truncate(sanitizeText(body.phone), 20));
    }
    if (body.birth_date !== undefined) {
      if (body.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(body.birth_date)) {
        return NextResponse.json({ error: 'Formato de fecha inválido' }, { status: 400 });
      }
      updates.push('birth_date = ?');
      values.push(body.birth_date || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(authUser.userId);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    // Return updated user
    const user = db.prepare(
      'SELECT id, email, first_name, last_name, phone, role, birth_date, created_at FROM users WHERE id = ?'
    ).get(authUser.userId) as Record<string, unknown>;

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
