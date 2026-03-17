import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { capturePayPalOrder } from '@/lib/paypal';
import { sendOrderConfirmation } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { paypalOrderId } = await request.json();

    if (!paypalOrderId) {
      return NextResponse.json({ error: 'PayPal order ID requerido' }, { status: 400 });
    }

    // Capture payment
    const captureResult = await capturePayPalOrder(paypalOrderId);

    if (captureResult.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'El pago no pudo ser completado', details: captureResult },
        { status: 400 }
      );
    }

    const db = getDb();

    // Update order status
    db.prepare(
      "UPDATE orders SET status = 'confirmed', payment_status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE payment_id = ?"
    ).run(paypalOrderId);

    // Get order details
    const order = db.prepare(
      'SELECT * FROM orders WHERE payment_id = ?'
    ).get(paypalOrderId) as Record<string, unknown> | undefined;

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Get order items
    const items = db.prepare(
      'SELECT * FROM order_items WHERE order_id = ?'
    ).all(order.id as string) as Array<{
      product_name: string; size: string; quantity: number;
      unit_price: number; product_id: string;
    }>;

    // Update stock
    const updateStock = db.prepare(
      'UPDATE products SET stock = stock - ? WHERE id = ?'
    );
    for (const item of items) {
      updateStock.run(item.quantity, item.product_id);
    }

    // Send confirmation email
    try {
      await sendOrderConfirmation({
        orderNumber: order.order_number as string,
        customerName: order.email as string,
        email: order.email as string,
        items: items.map((i) => ({
          name: i.product_name,
          size: i.size,
          quantity: i.quantity,
          price: i.unit_price,
        })),
        subtotal: order.subtotal as number,
        shipping: order.shipping_cost as number,
        total: order.total as number,
      });
    } catch (emailError) {
      console.error('Email send failed:', emailError);
      // Don't fail the order if email fails
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.order_number,
      orderId: order.id,
    });
  } catch (error) {
    console.error('Capture payment error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
