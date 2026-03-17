import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const segment = searchParams.get('segment') || 'all';
    const tag = searchParams.get('tag') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = 25;
    const offset = (page - 1) * limit;

    // Base query: all customers (not admins)
    let whereClause = "WHERE u.role = 'customer'";
    const params: (string | number)[] = [];

    // Search filter
    if (search) {
      whereClause += ` AND (u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR (u.first_name || ' ' || u.last_name) LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    // Tag filter
    if (tag) {
      whereClause += ` AND u.id IN (SELECT user_id FROM customer_tag_assignments WHERE tag_id = ?)`;
      params.push(tag);
    }

    // Segment filters
    const now = new Date().toISOString();
    switch (segment) {
      case 'new':
        whereClause += ` AND u.created_at >= datetime('now', '-30 days')`;
        break;
      case 'vip':
        whereClause += ` AND (SELECT COUNT(*) FROM orders WHERE user_id = u.id AND status != 'cancelled') >= 3`;
        break;
      case 'inactive':
        whereClause += ` AND (SELECT MAX(created_at) FROM orders WHERE user_id = u.id) < datetime('now', '-90 days') OR (SELECT COUNT(*) FROM orders WHERE user_id = u.id) = 0`;
        break;
      case 'subscribers':
        whereClause += ` AND u.email IN (SELECT email FROM newsletter_subscribers WHERE is_active = 1)`;
        break;
      case 'with_orders':
        whereClause += ` AND (SELECT COUNT(*) FROM orders WHERE user_id = u.id AND status != 'cancelled') > 0`;
        break;
      case 'abandoned':
        whereClause += ` AND (SELECT COUNT(*) FROM cart_items WHERE user_id = u.id) > 0 AND (SELECT COUNT(*) FROM orders WHERE user_id = u.id) = 0`;
        break;
    }

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM users u ${whereClause}`;
    const total = (db.prepare(countQuery).get(...params) as { total: number }).total;

    // Get customers with stats
    const query = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar,
        u.google_id, u.created_at,
        COALESCE(os.order_count, 0) as order_count,
        COALESCE(os.total_spent, 0) as total_spent,
        os.last_order_date,
        CASE WHEN ns.email IS NOT NULL THEN 1 ELSE 0 END as is_subscriber
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
      LIMIT ? OFFSET ?
    `;

    const customers = db.prepare(query).all(...params, limit, offset);

    // Get tags for all returned customers
    const customerIds = (customers as { id: string }[]).map(c => c.id);
    let customerTags: Record<string, { id: string; name: string; color: string }[]> = {};
    if (customerIds.length > 0) {
      const placeholders = customerIds.map(() => '?').join(',');
      const tagRows = db.prepare(`
        SELECT cta.user_id, ct.id, ct.name, ct.color
        FROM customer_tag_assignments cta
        JOIN customer_tags ct ON ct.id = cta.tag_id
        WHERE cta.user_id IN (${placeholders})
      `).all(...customerIds) as { user_id: string; id: string; name: string; color: string }[];

      for (const row of tagRows) {
        if (!customerTags[row.user_id]) customerTags[row.user_id] = [];
        customerTags[row.user_id].push({ id: row.id, name: row.name, color: row.color });
      }
    }

    // All tags for filter dropdown
    const allTags = db.prepare('SELECT * FROM customer_tags ORDER BY name').all();

    // Segment counts
    const segmentCounts = {
      all: (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'customer'").get() as { c: number }).c,
      new: (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'customer' AND created_at >= datetime('now', '-30 days')").get() as { c: number }).c,
      vip: (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'customer' AND (SELECT COUNT(*) FROM orders WHERE user_id = users.id AND status != 'cancelled') >= 3").get() as { c: number }).c,
      with_orders: (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'customer' AND (SELECT COUNT(*) FROM orders WHERE user_id = users.id AND status != 'cancelled') > 0").get() as { c: number }).c,
      inactive: (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'customer' AND ((SELECT MAX(created_at) FROM orders WHERE user_id = users.id) < datetime('now', '-90 days') OR (SELECT COUNT(*) FROM orders WHERE user_id = users.id) = 0)").get() as { c: number }).c,
      subscribers: (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'customer' AND email IN (SELECT email FROM newsletter_subscribers WHERE is_active = 1)").get() as { c: number }).c,
      abandoned: (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'customer' AND (SELECT COUNT(*) FROM cart_items WHERE user_id = users.id) > 0 AND (SELECT COUNT(*) FROM orders WHERE user_id = users.id) = 0").get() as { c: number }).c,
    };

    return NextResponse.json({
      customers: (customers as Record<string, unknown>[]).map(c => ({
        ...c,
        tags: customerTags[(c as { id: string }).id] || [],
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      segmentCounts,
      allTags,
    });
  } catch (error) {
    console.error('CRM customers error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
