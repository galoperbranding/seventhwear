import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const db = getDb();

    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status != 'cancelled'").get() as { total: number };
    const recentOrders = db.prepare(`
      SELECT o.*, u.first_name, u.last_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `).all();
    const lowStock = db.prepare('SELECT * FROM products WHERE stock < 10 ORDER BY stock ASC LIMIT 10').all();
    const subscribers = db.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers').get() as { count: number };

    return NextResponse.json({
      stats: {
        totalProducts: totalProducts.count,
        totalOrders: totalOrders.count,
        totalUsers: totalUsers.count,
        totalRevenue: totalRevenue.total,
        totalSubscribers: subscribers.count,
      },
      recentOrders,
      lowStock,
    });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
