import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes — SEVENTHWEAR',
  description: 'Respuestas a las preguntas más frecuentes sobre pedidos, envíos, devoluciones y más.',
};

export default function FAQPage() {
  return (
    <>
      <div className="page-header">
        <h1>Preguntas Frecuentes</h1>
        <p>Resolvemos tus dudas</p>
      </div>

      <div className="legal-content">

        <h2>Pedidos</h2>

        <h3>¿Cómo realizo un pedido?</h3>
        <p>Navega por nuestra tienda, selecciona el producto y la talla deseada, añádelo al carrito y completa el proceso de checkout con PayPal.</p>

        <h3>¿Puedo modificar o cancelar mi pedido?</h3>
        <p>Si tu pedido aún no ha sido procesado, contáctanos lo antes posible a <a href="mailto:hello@seventhwear.com">hello@seventhwear.com</a> y haremos lo posible por modificarlo. Una vez enviado, no es posible cancelarlo, pero puedes iniciar una devolución.</p>

        <h3>¿Recibiré confirmación de mi pedido?</h3>
        <p>Sí, recibirás un email de confirmación con los detalles de tu pedido y, posteriormente, otro con la información de seguimiento del envío.</p>

        <h2>Envíos</h2>

        <h3>¿Cuánto cuesta el envío?</h3>
        <p>El envío es <strong>gratuito en pedidos superiores a 99€</strong>. Para pedidos inferiores, el coste es de 9,95€ (envío estándar).</p>

        <h3>¿Cuánto tarda en llegar mi pedido?</h3>
        <ul>
          <li><strong>Perú (estándar):</strong> 3–5 días laborables</li>
          <li><strong>Perú (express):</strong> 1–2 días laborables</li>
          <li><strong>Europa:</strong> 5–10 días laborables</li>
          <li><strong>Resto del mundo:</strong> 10–20 días laborables</li>
        </ul>

        <h3>¿Puedo hacer seguimiento de mi pedido?</h3>
        <p>Sí, una vez enviado recibirás un email con tu número de seguimiento. También puedes consultarlo en tu <Link href="/cuenta">cuenta</Link>.</p>

        <h2>Devoluciones y cambios</h2>

        <h3>¿Cuánto tiempo tengo para devolver un producto?</h3>
        <p>Dispones de <strong>14 días naturales</strong> desde la recepción del pedido para solicitar una devolución.</p>

        <h3>¿Cómo inicio una devolución?</h3>
        <p>Escríbenos a <a href="mailto:hello@seventhwear.com">hello@seventhwear.com</a> o por WhatsApp al <a href="https://wa.me/51913058154">+51 913 058 154</a> con tu número de pedido. Te enviaremos las instrucciones.</p>

        <h3>¿Puedo cambiar de talla?</h3>
        <p>Sí, aceptamos cambios de talla o color sujetos a disponibilidad. Consulta nuestra <Link href="/guia-tallas">guía de tallas</Link> para elegir la talla correcta.</p>

        <h3>¿Cuándo recibiré mi reembolso?</h3>
        <p>Los reembolsos se procesan en un plazo máximo de 14 días tras recibir y verificar el producto devuelto, al mismo método de pago utilizado en la compra.</p>

        <h2>Productos</h2>

        <h3>¿Qué materiales utilizáis?</h3>
        <p>Trabajamos con algodón orgánico de 280gsm, tejidos técnicos moisture-wicking con protección UV y materiales premium seleccionados por su durabilidad y confort.</p>

        <h3>¿Las tallas son oversized?</h3>
        <p>Nuestras camisetas tienen corte oversized. Hoodies son regular-relaxed. Consulta la <Link href="/guia-tallas">guía de tallas</Link> para encontrar tu fit perfecto.</p>

        <h3>¿Los colores del producto son exactos?</h3>
        <p>Hacemos todo lo posible para que las fotos representen fielmente los colores, pero pueden variar ligeramente según la calibración de tu pantalla.</p>

        <h2>Pagos</h2>

        <h3>¿Qué métodos de pago aceptáis?</h3>
        <p>Actualmente aceptamos pagos a través de <strong>PayPal</strong>, que incluye pago con tarjeta de crédito/débito, saldo PayPal y financiación en cuotas (según disponibilidad).</p>

        <h3>¿Es seguro comprar en SEVENTHWEAR?</h3>
        <p>Sí, tu seguridad es nuestra prioridad. Todas las transacciones están protegidas con cifrado SSL y procesadas de forma segura por PayPal. No almacenamos datos de tarjetas.</p>

        <h2>Cuenta</h2>

        <h3>¿Necesito crear una cuenta para comprar?</h3>
        <p>Recomendamos crear una cuenta para un seguimiento más fácil de tus pedidos, pero no es obligatorio.</p>

        <h3>¿Cómo recupero mi contraseña?</h3>
        <p>Escríbenos a <a href="mailto:hello@seventhwear.com">hello@seventhwear.com</a> y te ayudaremos a restablecer el acceso a tu cuenta.</p>

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--color-bg-secondary)', textAlign: 'center' }}>
          <p style={{ marginBottom: '1rem' }}>¿No encuentras la respuesta que buscas?</p>
          <p>Escríbenos a <a href="mailto:hello@seventhwear.com">hello@seventhwear.com</a> o por WhatsApp al <a href="https://wa.me/51913058154">+51 913 058 154</a></p>
        </div>
      </div>
    </>
  );
}
