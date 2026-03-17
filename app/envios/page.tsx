import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Envíos — SEVENTHWEAR',
  description: 'Información sobre envíos, plazos de entrega y gastos de envío en SEVENTHWEAR.',
};

export default function EnviosPage() {
  return (
    <>
      <div className="page-header">
        <h1>Envíos</h1>
        <p>Todo lo que necesitas saber sobre nuestros envíos</p>
      </div>

      <div className="legal-content">

        <h2>Zonas de envío</h2>
        <p>Realizamos envíos nacionales (Perú) e internacionales a los destinos habilitados en nuestra web. Si tu país no aparece durante el checkout, contáctanos para consultar disponibilidad.</p>

        <h2>Plazos de entrega estimados</h2>
        <ul>
          <li><strong>Envío estándar (Perú):</strong> 3–5 días laborables</li>
          <li><strong>Envío express (Perú):</strong> 1–2 días laborables</li>
          <li><strong>Europa:</strong> 5–10 días laborables</li>
          <li><strong>Resto del mundo:</strong> 10–20 días laborables</li>
        </ul>
        <p>Los plazos de entrega son orientativos y pueden variar según el destino, la disponibilidad del producto y factores externos (aduanas, logística local, etc.). No constituyen una obligación contractual, aunque nos comprometemos a cumplirlos en la medida de lo posible.</p>

        <h2>Gastos de envío</h2>
        <ul>
          <li><strong>Envío gratuito</strong> en pedidos superiores a <strong>99€</strong>.</li>
          <li>Pedidos inferiores a 99€: gastos de envío de <strong>9,95€</strong> (estándar).</li>
          <li>Los gastos de envío se calculan y muestran antes de confirmar el pedido.</li>
        </ul>

        <h2>Seguimiento del pedido</h2>
        <p>Una vez procesado tu pedido, recibirás un email con el número de seguimiento para que puedas rastrear tu paquete en tiempo real.</p>

        <h2>Dirección de envío</h2>
        <p>El cliente es responsable de proporcionar una dirección de envío correcta y completa. SEVENTHWEAR® no se responsabiliza por retrasos o pérdidas derivados de datos de envío incorrectos.</p>

        <h2>¿No has recibido tu pedido?</h2>
        <p>En caso de no recibir tu pedido dentro del plazo estimado, contáctanos para iniciar una investigación con el transportista.</p>
        <p>Escríbenos a <a href="mailto:hello@seventhwear.com">hello@seventhwear.com</a> o por WhatsApp al <a href="https://wa.me/51913058154">+51 913 058 154</a>.</p>

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--color-bg-secondary)', textAlign: 'center' }}>
          <p style={{ marginBottom: '1rem' }}>¿Tienes más preguntas sobre envíos?</p>
          <Link href="/faq" className="btn btn-outline">Consulta nuestras FAQ</Link>
        </div>
      </div>
    </>
  );
}
