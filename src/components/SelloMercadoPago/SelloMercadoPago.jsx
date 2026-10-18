'use client';

// Cartel oficial de Mercado Pago (Brand Brick) junto al botón de pagar la seña:
// muestra su logo y los medios de pago aceptados, para darle confianza al
// cliente. El logo lo dibuja Mercado Pago, así se respeta su marca sin copiar
// un archivo. Necesita la Public Key, que es pública por diseño; si falta, el
// cartel no aparece y el resto de la página sigue igual.

import { Brand, initMercadoPago } from '@mercadopago/sdk-react';
import estilos from './SelloMercadoPago.module.css';

const CLAVE_PUBLICA = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

// Una sola vez, y solo en el navegador (el SDK carga un script de Mercado Pago)
if (CLAVE_PUBLICA && typeof window !== 'undefined') {
  initMercadoPago(CLAVE_PUBLICA, { locale: 'es-AR' });
}

const PERSONALIZACION = {
  text: {
    valueProp: 'payment_methods',
    useCustomFont: true, // hereda Gill Sans del sitio
    size: 'small',
    align: 'left',
  },
  visual: {
    backgroundColor: 'transparent',
    contentAlign: 'left',
    verticalPadding: '8px',
    horizontalPadding: '0px',
  },
  // El checkout no ofrece efectivo (la reserva espera solo 15 minutos):
  // el cartel tampoco lo promete
  paymentMethods: { excludedPaymentTypes: ['ticket'] },
};

export default function SelloMercadoPago() {
  if (!CLAVE_PUBLICA) return null;

  return (
    <div className={estilos.sello}>
      <Brand locale="es-AR" customization={PERSONALIZACION} />
    </div>
  );
}
