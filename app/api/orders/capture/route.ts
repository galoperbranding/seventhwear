import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { capturePayPalOrder } from '@/lib/paypal';
import { sendOrderConfirmation } from '@/lib/email';
import { checkRateLimit, rateLimitResponse, getClientIp } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const limit = checkRateLimit('api', getClientIp(request));
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfterMs);
    }

    const { paypalOrderId } = await request.json();

    if (!paypalOrderId) {
      return NextResponse.json({ error: 'PayPal order ID requerido' }, { status: 400 });
    }

    const db = getDb();

    const existing = db.prepare(
      'SELECT id, order_number, payment_status, total FROM orders WHERE payment_id = ?'
    ).get(paypalOrderId) as {
      id: string; order_number: string; payment_status: string; total: number;
    } | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Idempotencia: si ya se capturó, devolver el resultado sin volver a
    // descontar stock ni reenviar el email (recargas, doble clic, reintentos).
    if (existing.payment_status === 'completed') {
      return NextResponse.json({
        success: true,
        orderNumber: existing.order_number,
        orderId: existing.id,
        alreadyCaptured: true,
      });
    }

    // Capture payment
    const captureResult = await capturePayPalOrder(paypalOrderId);

    if (captureResult.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'El pago no pudo ser completado', details: captureResult },
        { status: 400 }
      );
    }

    // Verificar que PayPal cobró exactamente el total del pedido.
    const captured = captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.amount;
    const capturedValue = Number(captured?.value);

    if (!Number.isFinite(capturedValue) || Math.abs(capturedValue - existing.total) > 0.01) {
      console.error('Capture amount mismatch', {
        paypalOrderId, expected: existing.total, captured: captured?.value,
      });
      db.prepare(
        "UPDATE orders SET payment_status = 'review', updated_at = CURRENT_TIMESTAMP WHERE payment_id = ?"
      ).run(paypalOrderId);
      return NextResponse.json(
        { error: 'El importe cobrado no coincide con el pedido' },
        { status: 400 }
      );
    }

    // Get order items
    const items = db.prepare(
      'SELECT * FROM order_items WHERE order_id = ?'
    ).all(existing.id) as Array<{
      product_name: string; size: string; quantity: number;
      unit_price: number; product_id: string;
    }>;

    // Confirmación y descuento de stock en una sola transacción: si algo
    // falla, no queda un pedido pagado con el stock a medio descontar.
    const updateStock = db.prepare(
      'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?'
    );

    const confirmOrder = db.transaction(() => {
      db.prepare(
        "UPDATE orders SET status = 'confirmed', payment_status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE payment_id = ?"
      ).run(paypalOrderId);

      for (const item of items) {
        // El WHERE stock >= ? evita dejar stock negativo si dos compras
        // simultáneas se llevan las últimas unidades.
        const res = updateStock.run(item.quantity, item.product_id, item.quantity);
        if (res.changes === 0) {
          console.error('Stock insuficiente al capturar', {
            orderId: existing.id, productId: item.product_id, quantity: item.quantity,
          });
        }
      }
    });

    confirmOrder();

    const order = db.prepare(
      'SELECT * FROM orders WHERE payment_id = ?'
    ).get(paypalOrderId) as Record<string, unknown>;

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
