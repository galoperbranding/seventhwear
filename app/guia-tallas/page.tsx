import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Guía de Tallas — SEVENTHWEAR',
  description: 'Encuentra tu talla perfecta con nuestra guía de tallas SEVENTHWEAR.',
};

export default function GuiaTallasPage() {
  return (
    <>
      <div className="page-header">
        <h1>Guía de Tallas</h1>
        <p>Encuentra tu fit perfecto</p>
      </div>

      <div className="legal-content">

        <h2>¿Cómo medir?</h2>
        <p>Para obtener las medidas más precisas, utiliza una cinta métrica flexible y mide directamente sobre el cuerpo (sin ropa gruesa):</p>
        <ul>
          <li><strong>Pecho:</strong> Mide la parte más ancha del pecho, pasando la cinta por debajo de los brazos.</li>
          <li><strong>Cintura:</strong> Mide la parte más estrecha del torso, generalmente a la altura del ombligo.</li>
          <li><strong>Cadera:</strong> Mide la parte más ancha de la cadera.</li>
          <li><strong>Largo:</strong> Mide desde el hombro hasta el bajo de la prenda deseado.</li>
        </ul>

        <h2>Camisetas / Tees</h2>
        <div className="size-table-wrapper">
          <table className="size-table">
            <thead>
              <tr>
                <th>Talla</th>
                <th>Pecho (cm)</th>
                <th>Largo (cm)</th>
                <th>Hombro (cm)</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>S</td><td>96</td><td>70</td><td>44</td></tr>
              <tr><td>M</td><td>102</td><td>72</td><td>46</td></tr>
              <tr><td>L</td><td>108</td><td>74</td><td>48</td></tr>
              <tr><td>XL</td><td>114</td><td>76</td><td>50</td></tr>
              <tr><td>XXL</td><td>120</td><td>78</td><td>52</td></tr>
            </tbody>
          </table>
        </div>

        <h2>Hoodies / Sudaderas</h2>
        <div className="size-table-wrapper">
          <table className="size-table">
            <thead>
              <tr>
                <th>Talla</th>
                <th>Pecho (cm)</th>
                <th>Largo (cm)</th>
                <th>Manga (cm)</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>S</td><td>104</td><td>68</td><td>62</td></tr>
              <tr><td>M</td><td>110</td><td>70</td><td>64</td></tr>
              <tr><td>L</td><td>116</td><td>72</td><td>66</td></tr>
              <tr><td>XL</td><td>122</td><td>74</td><td>68</td></tr>
              <tr><td>XXL</td><td>128</td><td>76</td><td>70</td></tr>
            </tbody>
          </table>
        </div>

        <h2>Pantalones / Pants</h2>
        <div className="size-table-wrapper">
          <table className="size-table">
            <thead>
              <tr>
                <th>Talla</th>
                <th>Cintura (cm)</th>
                <th>Cadera (cm)</th>
                <th>Largo (cm)</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>S</td><td>74</td><td>96</td><td>102</td></tr>
              <tr><td>M</td><td>80</td><td>102</td><td>104</td></tr>
              <tr><td>L</td><td>86</td><td>108</td><td>106</td></tr>
              <tr><td>XL</td><td>92</td><td>114</td><td>108</td></tr>
              <tr><td>XXL</td><td>98</td><td>120</td><td>110</td></tr>
            </tbody>
          </table>
        </div>

        <h2>Jerseys / Ridewear</h2>
        <div className="size-table-wrapper">
          <table className="size-table">
            <thead>
              <tr>
                <th>Talla</th>
                <th>Pecho (cm)</th>
                <th>Largo (cm)</th>
                <th>Manga (cm)</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>S</td><td>94</td><td>68</td><td>60</td></tr>
              <tr><td>M</td><td>100</td><td>70</td><td>62</td></tr>
              <tr><td>L</td><td>106</td><td>72</td><td>64</td></tr>
              <tr><td>XL</td><td>112</td><td>74</td><td>66</td></tr>
              <tr><td>XXL</td><td>118</td><td>76</td><td>68</td></tr>
            </tbody>
          </table>
        </div>

        <h2>Consejos de fit</h2>
        <ul>
          <li>Nuestras camisetas tienen un <strong>corte oversized</strong>. Si prefieres un fit más ajustado, recomendamos bajar una talla.</li>
          <li>Los hoodies tienen un fit <strong>regular-relaxed</strong>. Para un look más holgado, sube una talla.</li>
          <li>Los pantalones cargo tienen <strong>cintura elástica</strong> con cordón ajustable.</li>
          <li>Los jerseys de ridewear están diseñados con un <strong>corte ergonómico</strong> para la posición de ride.</li>
        </ul>

        <p>Si tienes dudas sobre tu talla, escríbenos a <a href="mailto:hello@seventhwear.com">hello@seventhwear.com</a> o por WhatsApp al <a href="https://wa.me/51913058154">+51 913 058 154</a>. Estaremos encantados de ayudarte.</p>

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--color-bg-secondary)', textAlign: 'center' }}>
          <p style={{ marginBottom: '1rem' }}>¿No encuentras tu talla o necesitas ayuda?</p>
          <Link href="/devoluciones" className="btn btn-outline">Política de cambios</Link>
        </div>
      </div>
    </>
  );
}
