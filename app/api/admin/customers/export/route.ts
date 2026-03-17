import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { logAudit, getClientIp } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const segment = searchParams.get('segment') || 'all';

    let whereClause = "WHERE u.role = 'customer'";

    switch (segment) {
      case 'new':
        whereClause += ` AND u.created_at >= datetime('now', '-30 days')`;
        break;
      case 'vip':
        whereClause += ` AND (SELECT COUNT(*) FROM orders WHERE user_id = u.id AND status != 'cancelled') >= 3`;
        break;
      case 'inactive':
        whereClause += ` AND ((SELECT MAX(created_at) FROM orders WHERE user_id = u.id) < datetime('now', '-90 days') OR (SELECT COUNT(*) FROM orders WHERE user_id = u.id) = 0)`;
        break;
      case 'subscribers':
        whereClause += ` AND u.email IN (SELECT email FROM newsletter_subscribers WHERE is_active = 1)`;
        break;
      case 'with_orders':
        whereClause += ` AND (SELECT COUNT(*) FROM orders WHERE user_id = u.id AND status != 'cancelled') > 0`;
        break;
    }

    const customers = db.prepare(`
      SELECT 
        u.email, u.first_name, u.last_name, u.phone, u.created_at,
        COALESCE(os.order_count, 0) as order_count,
        COALESCE(os.total_spent, 0) as total_spent,
        os.last_order_date,
        CASE WHEN ns.email IS NOT NULL THEN 'Sí' ELSE 'No' END as suscriptor_newsletter
      FROM users u
      LEFT JOIN (
        SELECT user_id,
          COUNT(*) as order_count,
          SUM(total) as total_spent,
          MAX(created_at) as last_order_date
        FROM orders WHERE status != 'cancelled'
        GROUP BY user_id
      ) os ON os.user_id = u.id
      LEFT JOIN newsletter_subscribers ns ON ns.email = u.email AND ns.is_active = 1
      ${whereClause}
      ORDER BY u.created_at DESC
    `).all() as Record<string, unknown>[];

    // Build CSV
    const headers = ['Email', 'Nombre', 'Apellido', 'Teléfono', 'Fecha registro', 'Pedidos', 'Total gastado', 'Último pedido', 'Newsletter'];
    const escapeCsv = (val: unknown) => {
      const str = val == null ? '' : String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = customers.map(c => [
      escapeCsv(c.email),
      escapeCsv(c.first_name),
      escapeCsv(c.last_name),
      escapeCsv(c.phone),
      escapeCsv(c.created_at),
      escapeCsv(c.order_count),
      escapeCsv(typeof c.total_spent === 'number' ? (c.total_spent as number).toFixed(2) : '0.00'),
      escapeCsv(c.last_order_date || ''),
      escapeCsv(c.suscriptor_newsletter),
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');

    logAudit({ action: 'customer_data_export', actorId: user.userId, actorEmail: user.email, ip: getClientIp(request), details: `Segment: ${segment}, ${customers.length} records`, severity: 'warn' });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="clientes_${segment}_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('CRM export error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
