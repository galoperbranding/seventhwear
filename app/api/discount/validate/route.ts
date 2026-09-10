import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
    }

    const db = getDb();
    const authUser = await getAuthUser();

    const discount = db.prepare(`
      SELECT * FROM discount_codes 
      WHERE code = ? AND is_active = 1 AND expires_at > datetime('now')
    `).get(code.toUpperCase().trim()) as {
      id: string; code: string; type: string; value: number;
      min_order: number; max_uses: number; used_count: number;
      user_id: string | null; reason: string;
    } | undefined;

    if (!discount) {
      return NextResponse.json({ error: 'Código no válido o expirado' }, { status: 404 });
    }

    if (discount.used_count >= discount.max_uses) {
      return NextResponse.json({ error: 'Este código ya fue utilizado' }, { status: 410 });
    }

    // If the code is user-specific, verify ownership
    if (discount.user_id && (!authUser || authUser.userId !== discount.user_id)) {
      return NextResponse.json({ error: 'Este código no es válido para tu cuenta' }, { status: 403 });
    }

    return NextResponse.json({
      discount: {
        id: discount.id,
        code: discount.code,
        type: discount.type,
        value: discount.value,
        min_order: discount.min_order,
        reason: discount.reason,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
