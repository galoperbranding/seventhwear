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

    // Core stats
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = \'customer\'').get() as { count: number };
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status != 'cancelled'").get() as { total: number };
    const subscribers = db.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers WHERE is_active = 1').get() as { count: number };

    // Period comparisons (this month vs last month)
    const thisMonthRevenue = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
      FROM orders WHERE status != 'cancelled'
      AND created_at >= date('now', 'start of month')
    `).get() as { total: number; count: number };

    const lastMonthRevenue = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
      FROM orders WHERE status != 'cancelled'
      AND created_at >= date('now', 'start of month', '-1 month')
      AND created_at < date('now', 'start of month')
    `).get() as { total: number; count: number };

    // New customers this month vs last
    const newCustomersThisMonth = db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE role = 'customer'
      AND created_at >= date('now', 'start of month')
    `).get() as { count: number };

    const newCustomersLastMonth = db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE role = 'customer'
      AND created_at >= date('now', 'start of month', '-1 month')
      AND created_at < date('now', 'start of month')
    `).get() as { count: number };

    // Average order value
    const avgOrder = db.prepare(`
      SELECT COALESCE(AVG(total), 0) as avg FROM orders WHERE status != 'cancelled'
    `).get() as { avg: number };

    // Conversion rate (orders / users)
    const conversionRate = totalUsers.count > 0
      ? ((totalOrders.count / totalUsers.count) * 100)
      : 0;

    // Revenue last 7 days (for sparkline)
    const revenueLast7Days = db.prepare(`
      SELECT date(created_at) as day, COALESCE(SUM(total), 0) as total, COUNT(*) as orders
      FROM orders WHERE status != 'cancelled'
      AND created_at >= date('now', '-6 days')
      GROUP BY date(created_at)
      ORDER BY day ASC
    `).all() as { day: string; total: number; orders: number }[];

    // Revenue last 6 months (for chart)
    const revenueLast6Months = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month,
             COALESCE(SUM(total), 0) as total,
             COUNT(*) as orders
      FROM orders WHERE status != 'cancelled'
      AND created_at >= date('now', '-5 months', 'start of month')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `).all() as { month: string; total: number; orders: number }[];

    // Orders by status
    const ordersByStatus = db.prepare(`
      SELECT status, COUNT(*) as count FROM orders GROUP BY status
    `).all() as { status: string; count: number }[];

    // Top selling products
    const topProducts = db.prepare(`
      SELECT oi.product_name as name, oi.product_image as image,
             SUM(oi.quantity) as units_sold,
             SUM(oi.total_price) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY oi.product_name
      ORDER BY revenue DESC
      LIMIT 5
    `).all() as { name: string; image: string; units_sold: number; revenue: number }[];

    // Top categories
    const topCategories = db.prepare(`
      SELECT p.category, COUNT(DISTINCT o.id) as orders, SUM(oi.total_price) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.status != 'cancelled'
      GROUP BY p.category
      ORDER BY revenue DESC
    `).all() as { category: string; orders: number; revenue: number }[];

    // Recent orders
    const recentOrders = db.prepare(`
      SELECT o.*, u.first_name, u.last_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `).all();

    // Low stock
    const lowStock = db.prepare('SELECT * FROM products WHERE stock < 10 AND is_active = 1 ORDER BY stock ASC LIMIT 10').all();

    // Pending orders count
    const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get() as { count: number };

    // Today's orders
    const todayOrders = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
      FROM orders WHERE date(created_at) = date('now') AND status != 'cancelled'
    `).get() as { count: number; revenue: number };

    return NextResponse.json({
      stats: {
        totalProducts: totalProducts.count,
        totalOrders: totalOrders.count,
        totalUsers: totalUsers.count,
        totalRevenue: totalRevenue.total,
        totalSubscribers: subscribers.count,
        avgOrderValue: avgOrder.avg,
        conversionRate,
        pendingOrders: pendingOrders.count,
      },
      trends: {
        thisMonth: { revenue: thisMonthRevenue.total, orders: thisMonthRevenue.count },
        lastMonth: { revenue: lastMonthRevenue.total, orders: lastMonthRevenue.count },
        newCustomersThisMonth: newCustomersThisMonth.count,
        newCustomersLastMonth: newCustomersLastMonth.count,
      },
      today: todayOrders,
      charts: {
        revenueLast7Days,
        revenueLast6Months,
        ordersByStatus,
        topProducts,
        topCategories,
      },
      recentOrders,
      lowStock,
    });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
