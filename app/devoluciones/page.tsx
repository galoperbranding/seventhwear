import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Devoluciones y Cambios — SEVENTHWEAR',
  description: 'Política de devoluciones, cambios y reembolsos en SEVENTHWEAR.',
};

export default function DevolucionesPage() {
  return (
    <>
      <div className="page-header">
        <h1>Devoluciones y Cambios</h1>
        <p>Queremos que quedes 100% satisfecho con tu compra</p>
      </div>

      <div className="legal-content">

        <h2>Política de devoluciones</h2>
        <p>Aceptamos devoluciones dentro de los <strong>14 días naturales</strong> posteriores a la recepción del pedido, siempre que los productos:</p>
        <ul>
          <li>Estén en su estado original: sin usar, sin lavar.</li>
          <li>Conserven todas las etiquetas y embalaje original.</li>
        </ul>
        <p><strong>Excepciones:</strong> Los productos personalizados, artículos en promoción marcados como &quot;venta final&quot; o productos de higiene (como ropa interior) no admiten devolución, salvo defecto de fabricación.</p>

        <h2>Cambios de talla o color</h2>
        <ul>
          <li>Aceptamos cambios de talla o color, sujetos a disponibilidad, dentro del mismo plazo de 14 días.</li>
          <li>Los gastos de envío del cambio corren por cuenta del cliente, salvo que el cambio se deba a un error nuestro.</li>
        </ul>

        <h2>Productos defectuosos</h2>
        <p>Si recibes un producto defectuoso o dañado durante el transporte:</p>
        <ul>
          <li>Contáctanos dentro de las <strong>48 horas</strong> siguientes a la recepción.</li>
          <li>Envíanos fotografías del producto y del embalaje.</li>
          <li>Procederemos al envío de un reemplazo o al reembolso completo, incluyendo los gastos de envío.</li>
        </ul>

        <h2>Proceso de reembolso</h2>
        <p>Los reembolsos se procesarán mediante el mismo método de pago utilizado en la compra original, en un plazo máximo de <strong>14 días</strong> tras la recepción y verificación del producto devuelto.</p>

        <h2>¿Cómo iniciar una devolución o cambio?</h2>
        <ol>
          <li>Escríbenos a <a href="mailto:hello@seventhwear.com">hello@seventhwear.com</a> o por WhatsApp al <a href="https://wa.me/51913058154">+51 913 058 154</a> con tu <strong>número de pedido</strong>.</li>
          <li>Te enviaremos las instrucciones y la etiqueta de devolución (si aplica).</li>
          <li>Envía el producto en su embalaje original.</li>
          <li>Una vez recibido y verificado, procesaremos el cambio o reembolso.</li>
        </ol>

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--color-bg-secondary)', textAlign: 'center' }}>
          <p style={{ marginBottom: '1rem' }}>¿Necesitas ayuda con una devolución?</p>
          <Link href="/faq" className="btn btn-outline">Consulta nuestras FAQ</Link>
        </div>
      </div>
    </>
  );
}
