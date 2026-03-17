import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { logAudit, getClientIp } from '@/lib/security';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const db = getDb();
    const orders = db.prepare(`
      SELECT o.*, u.first_name, u.last_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `).all() as Array<Record<string, unknown>>;

    const ordersWithItems = orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id as string);
      return { ...order, items };
    });

    return NextResponse.json({ orders: ordersWithItems });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { order_id, status, tracking_number } = await request.json();

    if (!order_id || !status) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const db = getDb();

    if (tracking_number) {
      db.prepare('UPDATE orders SET status = ?, tracking_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(status, tracking_number, order_id);
    } else {
      db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(status, order_id);
    }

    logAudit({ action: 'order_status_update', actorId: user.userId, actorEmail: user.email, targetType: 'order', targetId: order_id, ip: getClientIp(request), details: `Status → ${status}${tracking_number ? `, tracking: ${tracking_number}` : ''}` });

    return NextResponse.json({ message: 'Pedido actualizado' });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
