// Validación de la edición de la carta (panel del admin). Funciones puras,
// como las de reservas.js: devuelven el mensaje de error, o '' si está bien.
// La API y la base vuelven a controlar lo mismo.

export const LIMITES_CARTA = { nombre: 120, texto: 300, bodega: 80 };

const limpio = (valor) => String(valor ?? '').trim();

// "6000", "6.000" o "$ 6.000" → 6000. Cualquier otra cosa → null.
export function aEntero(valor) {
  const sinAdornos = limpio(valor).replace(/^\$\s*/, '').replaceAll('.', '');
  return /^-?\d+$/.test(sinAdornos) ? Number(sinAdornos) : null;
}

export function validarPrecio(valor) {
  const texto = limpio(valor);
  if (!texto) return 'Escribí el precio.';
  const numero = aEntero(texto);
  if (numero === null) return 'El precio va en pesos enteros, sin centavos.';
  if (numero <= 0) return 'El precio tiene que ser mayor que cero.';
  return '';
}

export function validarPrecios(valores, tamanos) {
  if (valores.length !== tamanos.length || valores.some((valor) => !limpio(valor))) return 'Cargá un precio por tamaño.';
  return valores.map(validarPrecio).find(Boolean) ?? '';
}

export function validarNombreItem(valor) {
  const nombre = limpio(valor);
  if (!nombre) return 'Escribí el nombre.';
  if (nombre.length > LIMITES_CARTA.nombre) return `Hasta ${LIMITES_CARTA.nombre} caracteres.`;
  return '';
}

export function validarTexto(valor, max) {
  return limpio(valor).length > max ? `Hasta ${max} caracteres.` : '';
}
