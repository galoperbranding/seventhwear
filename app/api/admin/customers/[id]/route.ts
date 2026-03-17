import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(
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

    // Customer info
    const customer = db.prepare(`
      SELECT id, email, first_name, last_name, phone, birth_date, avatar, google_id, role, created_at, updated_at
      FROM users WHERE id = ? AND role = 'customer'
    `).get(id) as Record<string, unknown> | undefined;

    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Orders
    const orders = db.prepare(`
      SELECT o.*, 
        (SELECT GROUP_CONCAT(oi.product_name, ', ') FROM order_items oi WHERE oi.order_id = o.id) as items_summary
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(id);

    // Order stats
    const orderStats = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_spent,
        COALESCE(AVG(total), 0) as avg_order,
        MAX(created_at) as last_order_date,
        MIN(created_at) as first_order_date
      FROM orders 
      WHERE user_id = ? AND status != 'cancelled'
    `).get(id) as Record<string, unknown>;

    // Addresses
    const addresses = db.prepare(`
      SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC
    `).all(id);

    // Notes
    const notes = db.prepare(`
      SELECT cn.*, u.first_name as admin_name, u.last_name as admin_last_name
      FROM customer_notes cn
      JOIN users u ON u.id = cn.admin_id
      WHERE cn.user_id = ?
      ORDER BY cn.created_at DESC
    `).all(id);

    // Tags
    const tags = db.prepare(`
      SELECT ct.id, ct.name, ct.color
      FROM customer_tag_assignments cta
      JOIN customer_tags ct ON ct.id = cta.tag_id
      WHERE cta.user_id = ?
    `).all(id);

    // Newsletter status
    const newsletter = db.prepare(`
      SELECT * FROM newsletter_subscribers WHERE email = ?
    `).get(customer.email as string);

    // Cart items (abandoned)
    const cartItems = db.prepare(`
      SELECT ci.*, p.name as product_name, p.price, p.images
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.user_id = ?
    `).all(id);

    // All available tags (for assignment)
    const allTags = db.prepare('SELECT * FROM customer_tags ORDER BY name').all();

    return NextResponse.json({
      customer,
      orders,
      orderStats,
      addresses,
      notes,
      tags,
      allTags,
      newsletter,
      cartItems,
    });
  } catch (error) {
    console.error('CRM customer detail error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
