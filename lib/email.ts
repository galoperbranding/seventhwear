import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  email: string;
  items: Array<{
    name: string;
    size: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
}

export async function sendOrderConfirmation(data: OrderEmailData) {
  const itemRows = data.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${item.name} (${item.size})</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">€${item.price.toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
        <div style="background:#0a0a0a;padding:30px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:4px">SEVENTHWEAR</h1>
        </div>
        <div style="padding:30px">
          <h2 style="color:#0a0a0a;margin-top:0">¡Gracias por tu compra, ${data.customerName}!</h2>
          <p style="color:#666">Tu pedido <strong>#${data.orderNumber}</strong> ha sido confirmado.</p>
          
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <thead>
              <tr style="background:#f5f5f5">
                <th style="padding:10px;text-align:left">Producto</th>
                <th style="padding:10px;text-align:center">Cantidad</th>
                <th style="padding:10px;text-align:right">Precio</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
          
          <div style="text-align:right;margin-top:20px">
            <p style="margin:4px 0;color:#666">Subtotal: €${data.subtotal.toFixed(2)}</p>
            <p style="margin:4px 0;color:#666">Envío: €${data.shipping.toFixed(2)}</p>
            <p style="margin:8px 0;font-size:18px;font-weight:bold;color:#0a0a0a">Total: €${data.total.toFixed(2)}</p>
          </div>
          
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
          <p style="color:#999;font-size:13px">Te enviaremos un email cuando tu pedido sea enviado con el número de seguimiento.</p>
        </div>
        <div style="background:#f5f5f5;padding:20px;text-align:center">
          <p style="margin:0;color:#999;font-size:12px">© 2026 SEVENTHWEAR. Todos los derechos reservados.</p>
          <p style="margin:4px 0 0;color:#999;font-size:12px">hello@seventhwear.com | +51 913 058 154</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'SEVENTHWEAR <hello@seventhwear.com>',
      to: data.email,
      subject: `SEVENTHWEAR — Pedido #${data.orderNumber} confirmado`,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

export async function sendShippingNotification(
  email: string,
  customerName: string,
  orderNumber: string,
  trackingNumber: string,
  trackingUrl: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
        <div style="background:#0a0a0a;padding:30px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:4px">SEVENTHWEAR</h1>
        </div>
        <div style="padding:30px">
          <h2 style="color:#0a0a0a;margin-top:0">¡Tu pedido está en camino, ${customerName}!</h2>
          <p style="color:#666">Tu pedido <strong>#${orderNumber}</strong> ha sido enviado.</p>
          <p style="color:#666">Número de seguimiento: <strong>${trackingNumber}</strong></p>
          <div style="text-align:center;margin:30px 0">
            <a href="${trackingUrl}" style="background:#0a0a0a;color:#fff;padding:12px 32px;text-decoration:none;border-radius:4px;display:inline-block">Rastrear Pedido</a>
          </div>
        </div>
        <div style="background:#f5f5f5;padding:20px;text-align:center">
          <p style="margin:0;color:#999;font-size:12px">© 2026 SEVENTHWEAR. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'SEVENTHWEAR <hello@seventhwear.com>',
      to: email,
      subject: `SEVENTHWEAR — Tu pedido #${orderNumber} ha sido enviado`,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

export async function sendVerificationEmail(email: string, name: string, code: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
        <div style="background:#0a0a0a;padding:30px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:4px">SEVENTHWEAR</h1>
        </div>
        <div style="padding:30px;text-align:center">
          <h2 style="color:#0a0a0a;margin-top:0">Verifica tu email</h2>
          <p style="color:#666;font-size:15px">Hola ${name}, usa este código para verificar tu cuenta:</p>
          <div style="background:#f5f5f5;border-radius:8px;padding:20px;margin:24px 0;display:inline-block">
            <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#0a0a0a;font-family:monospace">${code}</span>
          </div>
          <p style="color:#999;font-size:13px">Este código expira en 15 minutos.</p>
          <p style="color:#999;font-size:13px">Si no creaste esta cuenta, ignora este email.</p>
        </div>
        <div style="background:#f5f5f5;padding:20px;text-align:center">
          <p style="margin:0;color:#999;font-size:12px">© 2026 SEVENTHWEAR. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'SEVENTHWEAR <hello@seventhwear.com>',
      to: email,
      subject: 'SEVENTHWEAR — Código de verificación',
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Verification email error:', error);
    return { success: false, error };
  }
}

export async function sendBirthdayEmail(email: string, name: string, discountCode: string, discountPercent: number) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
        <div style="background:#0a0a0a;padding:40px 30px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:4px">SEVENTHWEAR</h1>
        </div>
        <div style="padding:40px 30px;text-align:center">
          <div style="font-size:48px;margin-bottom:16px">🎂</div>
          <h2 style="color:#0a0a0a;margin:0 0 8px;font-size:24px">¡Feliz cumpleaños, ${name}!</h2>
          <p style="color:#666;font-size:15px;line-height:1.6;margin:16px 0">
            Desde SEVENTHWEAR te deseamos un día increíble. Para celebrar contigo, 
            te regalamos un <strong>${discountPercent}% de descuento</strong> en toda nuestra tienda.
          </p>
          <div style="background:#0a0a0a;border-radius:8px;padding:24px;margin:28px auto;display:inline-block;min-width:200px">
            <p style="color:#999;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px">Tu código exclusivo</p>
            <span style="font-size:28px;font-weight:800;letter-spacing:4px;color:#fff;font-family:monospace">${discountCode}</span>
          </div>
          <p style="color:#666;font-size:14px;margin:20px 0 0">
            Válido por <strong>7 días</strong> desde hoy. ¡Disfruta tu regalo!
          </p>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://seventhwear.com'}/shop" 
             style="display:inline-block;margin-top:28px;padding:14px 40px;background:#0a0a0a;color:#fff;text-decoration:none;font-size:13px;text-transform:uppercase;letter-spacing:2px;border-radius:0">
            Ir a la tienda
          </a>
        </div>
        <div style="background:#f5f5f5;padding:20px;text-align:center">
          <p style="margin:0;color:#999;font-size:12px">© 2026 SEVENTHWEAR. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'SEVENTHWEAR <hello@seventhwear.com>',
      to: email,
      subject: `🎂 ¡Feliz cumpleaños, ${name}! Tu regalo de SEVENTHWEAR`,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Birthday email error:', error);
    return { success: false, error };
  }
}
