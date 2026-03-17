import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { createPayPalOrder } from '@/lib/paypal';
import { v4 as uuidv4 } from 'uuid';

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SW-${timestamp}-${random}`;
}

// Create order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, email, shippingAddress, billingAddress, notes } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email es obligatorio' }, { status: 400 });
    }

    const db = getDb();
    const authUser = await getAuthUser();

    // Validate products and calculate totals
    let subtotal = 0;
    const validatedItems: Array<{
      productId: string;
      name: string;
      image: string;
      size: string;
      color: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    for (const item of items) {
      const product = db.prepare(
        'SELECT id, name, price, images, stock FROM products WHERE id = ? AND is_active = 1'
      ).get(item.productId) as {
        id: string; name: string; price: number; images: string; stock: number;
      } | undefined;

      if (!product) {
        return NextResponse.json(
          { error: `Producto no disponible: ${item.name || item.productId}` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${product.name}` },
          { status: 400 }
        );
      }

      const images = JSON.parse(product.images || '[]');
      const totalPrice = product.price * item.quantity;
      subtotal += totalPrice;

      validatedItems.push({
        productId: product.id,
        name: product.name,
        image: images[0] || '',
        size: item.size,
        color: item.color || '',
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice,
      });
    }

    const shippingCost = subtotal >= 100 ? 0 : 9.95;
    const total = subtotal + shippingCost;

    // Create PayPal order
    const paypalItems = validatedItems.map((item) => ({
      name: `${item.name} (${item.size})`,
      quantity: item.quantity,
      unit_amount: {
        currency_code: 'EUR',
        value: item.unitPrice.toFixed(2),
      },
    }));

    const paypalOrder = await createPayPalOrder(
      total.toFixed(2),
      'EUR',
      paypalItems
    );

    if (!paypalOrder.id) {
      console.error('PayPal order creation failed:', paypalOrder);
      return NextResponse.json(
        { error: 'Error al crear el pago con PayPal' },
        { status: 500 }
      );
    }

    // Save order in DB
    const orderId = uuidv4();
    const orderNumber = generateOrderNumber();

    const insertOrder = db.prepare(`
      INSERT INTO orders (id, order_number, user_id, email, status, subtotal, shipping_cost, total, currency, payment_method, payment_id, payment_status, shipping_address, billing_address, notes)
      VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, 'EUR', 'paypal', ?, 'pending', ?, ?, ?)
    `);

    const insertItem = db.prepare(`
      INSERT INTO order_items (id, order_id, product_id, product_name, product_image, size, color, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      insertOrder.run(
        orderId,
        orderNumber,
        authUser?.userId || null,
        email,
        subtotal,
        shippingCost,
        total,
        paypalOrder.id,
        JSON.stringify(shippingAddress || {}),
        JSON.stringify(billingAddress || shippingAddress || {}),
        notes || ''
      );

      for (const item of validatedItems) {
        insertItem.run(
          uuidv4(),
          orderId,
          item.productId,
          item.name,
          item.image,
          item.size,
          item.color,
          item.quantity,
          item.unitPrice,
          item.totalPrice
        );
      }
    });

    transaction();

    // Find approval URL
    const approvalUrl = paypalOrder.links?.find(
      (link: { rel: string; href: string }) => link.rel === 'approve'
    )?.href;

    return NextResponse.json({
      orderId,
      orderNumber,
      paypalOrderId: paypalOrder.id,
      approvalUrl,
      total,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// Get user orders
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const db = getDb();
    const orders = db.prepare(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
    ).all(authUser.userId) as Record<string, unknown>[];

    const ordersWithItems = orders.map((order) => {
      const items = db.prepare(
        'SELECT * FROM order_items WHERE order_id = ?'
      ).all(order.id as string);
      return { ...order, items };
    });

    return NextResponse.json({ orders: ordersWithItems });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
