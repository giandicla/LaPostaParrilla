// Aviso de pago de Mercado Pago, con la firma ya validada. El cuerpo del
// aviso no se usa: el estado real sale de GET /v1/payments/:id (clase 11).
// La app no reembolsa por Mercado Pago (no se puede en modo de prueba): un pago
// tardío queda "a devolver" en el panel y el local lo devuelve a mano.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Los errores del SDK traen el código HTTP en `status`
async function leerPagoMp(idPagoMp, mp) {
  try {
    return await mp.obtenerPago(idPagoMp);
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

export async function procesarAvisoDePago(idPagoMp, { base, mp }) {
  const pagoMp = await leerPagoMp(idPagoMp, mp);
  // Un pago que no existe (p. ej. un aviso de otra cuenta) no se reintenta
  if (!pagoMp) return 'ignorado';
  const idPago = pagoMp.external_reference;

  // Pagos que no salieron de este sitio: se responde 200 igual, para que
  // Mercado Pago no los reintente durante horas
  if (!idPago || !UUID.test(idPago) || !(await base.leerPago(idPago))) return 'ignorado';

  const estado = await base.acreditarPago(idPago, String(pagoMp.id), pagoMp.status);

  // Otro cobro aprobado sobre la misma preferencia: no tiene fila propia, así
  // que solo queda en el log, con los dos ids para devolverlo a mano
  if (estado === 'duplicado') {
    console.warn('Cobro duplicado de la seña: devolver a mano', idPago, pagoMp.id);
  }
  return estado;
}
