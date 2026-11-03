// Validación de los formularios de reservas, del lado del cliente.
// Funciones puras, sin React: cada una devuelve el mensaje de error, o '' si
// el valor está bien. Sirven para avisar antes de mandar; la base vuelve a
// controlar lo mismo (checks y trigger), porque el navegador se puede saltear.

export const LIMITES = {
  // Alcanza con que no esté vacío (pedido del usuario, sesión 04)
  nombre: { max: 80 },
  telefonoDigitos: { min: 8, max: 15 },
  // max: lo que se reserva desde la web; más que eso, por WhatsApp.
  // maxLocal: lo que carga el admin desde el panel (tope contra errores de tipeo).
  personas: { min: 1, max: 6, maxLocal: 40 },
  mail: 254,
  comentarios: 100,
  motivo: 120,
};

// Letras de cualquier idioma, y entre ellas espacios, apóstrofo, guion o punto
const NOMBRE = /^\p{L}[\p{L} '.-]*$/u;
const TELEFONO = /^[0-9+()\s-]+$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
// Algo@algo.algo, sin espacios. La validación de verdad es que el mail llegue.
export const MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const limpio = (valor) => String(valor ?? '').trim();

export function validarNombre(valor) {
  const nombre = limpio(valor);
  const { max } = LIMITES.nombre;
  if (!nombre) return 'Escribí a nombre de quién va la reserva.';
  if (nombre.length > max) return `El nombre puede tener hasta ${max} caracteres.`;
  if (!NOMBRE.test(nombre)) return 'Usá solo letras y espacios en el nombre.';
  return '';
}

// Se aplica mientras se escribe o se pega: lo que no puede ir en un teléfono
// ni siquiera entra al campo.
export const limpiarTelefono = (valor) => String(valor ?? '').replace(/[^0-9+() -]/g, '');

export function validarTelefono(valor) {
  const telefono = limpio(valor);
  const { min, max } = LIMITES.telefonoDigitos;
  if (!telefono) return 'Dejanos un teléfono por si tenemos que avisarte algo.';
  const digitos = telefono.replace(/\D/g, '').length;
  if (!TELEFONO.test(telefono) || digitos < min || digitos > max) {
    return 'Ese teléfono no parece válido. Ejemplo: +54 9 2944 00-0000';
  }
  return '';
}

// Las fechas llegan como 'AAAA-MM-DD', así que se comparan como texto.
// bloqueo: { motivo } si ese día no se toman reservas.
export function validarFecha(fecha, { hoy, bloqueo, nombreLocal = 'este local' } = {}) {
  if (!fecha) return 'Elegí una fecha.';
  if (!FECHA.test(fecha)) return 'Esa fecha no es válida.';
  if (hoy && fecha < hoy) return 'Elegí una fecha desde hoy en adelante.';
  if (bloqueo) {
    const motivo = bloqueo.motivo ? ` (${bloqueo.motivo})` : '';
    return `Ese día no tomamos reservas en ${nombreLocal}${motivo}. Elegí otra fecha.`;
  }
  return '';
}

// franjas: los horarios que todavía se pueden elegir ese día
export function validarHora(hora, { franjas = [] } = {}) {
  if (!franjas.length) return 'Ese día no quedan horarios. Probá con otra fecha.';
  if (!hora) return 'Elegí un horario.';
  if (!franjas.includes(hora)) return 'Elegí un horario de la lista.';
  return '';
}

export function validarPersonas(valor, { max = LIMITES.personas.max } = {}) {
  const personas = Number(valor);
  const { min } = LIMITES.personas;
  if (!Number.isInteger(personas) || personas < min || personas > max) {
    return `Las reservas son de ${min} a ${max} personas.`;
  }
  return '';
}

// Más personas de las que se reservan desde la web: va por WhatsApp
export const esGrupo = (valor) => Number(valor) > LIMITES.personas.max;

// Opcional: vacío está bien
export function validarMail(valor) {
  const mail = limpio(valor);
  if (!mail) return '';
  if (mail.length > LIMITES.mail || !MAIL.test(mail)) {
    return 'Ese mail no parece válido. Ejemplo: nombre@gmail.com';
  }
  return '';
}

const validarLargo = (maximo) => (valor) =>
  limpio(valor).length > maximo ? `Puede tener hasta ${maximo} caracteres.` : '';

export const validarComentarios = validarLargo(LIMITES.comentarios);
export const validarMotivo = validarLargo(LIMITES.motivo);

// datos: los valores del formulario (mail solo en el del admin).
// contexto: { hoy, franjas, bloqueo, nombreLocal, maxPersonas }.
// Devuelve { campo: mensaje } solo con los campos que tienen error.
export function validarReserva(datos, contexto = {}) {
  const errores = {
    nombre: validarNombre(datos.nombre),
    telefono: validarTelefono(datos.telefono),
    fecha: validarFecha(datos.fecha, contexto),
    hora: validarHora(datos.hora, contexto),
    personas: validarPersonas(datos.personas, { max: contexto.maxPersonas }),
    comentarios: validarComentarios(datos.comentarios),
    mail: validarMail(datos.mail),
  };
  return Object.fromEntries(Object.entries(errores).filter(([, mensaje]) => mensaje));
}

export const hayErrores = (errores) => Object.keys(errores).length > 0;
