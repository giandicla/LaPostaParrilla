// Bloqueos de reservas: de una fecha a otra y, si hace falta, entre dos horas.
// Funciones puras; la regla la hace cumplir la base (validar_reserva), acá se
// usa para no ofrecer lo que la base va a rechazar y para validar el formulario.
//
// Un bloqueo: { fecha, fecha_hasta, local_id (null = los dos locales),
//               hora_desde, hora_hasta (las dos null = todo el día), motivo }
// Las fechas son 'AAAA-MM-DD' y las horas 'HH:MM' o 'HH:MM:SS': se comparan
// como texto.

import { validarFecha, validarMotivo } from './reservas.js';

const hhmm = (hora) => hora?.slice(0, 5);

// Los bloqueos que alcanzan a ese día en ese local
export const bloqueosDelDia = (bloqueos, fecha, idLocal) =>
  bloqueos.filter(
    (b) => fecha >= b.fecha && fecha <= (b.fecha_hasta ?? b.fecha) && (!b.local_id || b.local_id === idLocal)
  );

// delDia: lo que devuelve bloqueosDelDia. Las dos horas del rango son inclusive.
export const horaBloqueada = (delDia, hora) =>
  delDia.some((b) => !b.hora_desde || (hhmm(hora) >= hhmm(b.hora_desde) && hhmm(hora) <= hhmm(b.hora_hasta)));

// El bloqueo que deja el día sin reservas: uno de todo el día o, si entre
// varios tapan todos los horarios del local, el primero (para mostrar su motivo).
export function cierreDelDia(delDia, franjas) {
  const entero = delDia.find((b) => !b.hora_desde);
  if (entero) return entero;
  return franjas.length > 0 && franjas.every((hora) => horaBloqueada(delDia, hora)) ? delDia[0] : undefined;
}

// El formulario del panel. datos: { desde, hasta, horaDesde, horaHasta, motivo }.
// Devuelve { campo, mensaje } con el primer error, o null.
export function validarBloqueo(datos, { hoy } = {}) {
  const errores = [
    ['desde', validarFecha(datos.desde, { hoy })],
    ['hasta', datos.hasta && datos.hasta < datos.desde ? 'La fecha hasta no puede ser anterior a la fecha desde.' : ''],
    ['horaHasta', datos.horaHasta < datos.horaDesde ? 'La hora hasta no puede ser anterior a la hora desde.' : ''],
    ['motivo', validarMotivo(datos.motivo)],
  ];
  const [campo, mensaje] = errores.find(([, texto]) => texto) ?? [];
  return campo ? { campo, mensaje } : null;
}

// Si el rango elegido va del primer horario al último, es "todo el día": se
// guarda sin horas, así sigue cerrado aunque después cambien las franjas.
export const horasDelBloqueo = ({ horaDesde, horaHasta }, franjas) =>
  horaDesde === franjas[0] && horaHasta === franjas[franjas.length - 1]
    ? { hora_desde: null, hora_hasta: null }
    : { hora_desde: horaDesde, hora_hasta: horaHasta };

export const mismoBloqueo = (a, b) =>
  a.fecha === b.fecha
  && (a.fecha_hasta ?? a.fecha) === (b.fecha_hasta ?? b.fecha)
  && (a.local_id ?? null) === (b.local_id ?? null)
  && (hhmm(a.hora_desde) ?? null) === (hhmm(b.hora_desde) ?? null)
  && (hhmm(a.hora_hasta) ?? null) === (hhmm(b.hora_hasta) ?? null);

// "todo el día" o "de 20:00 a 20:30"
export const textoDeHoras = (bloqueo) =>
  bloqueo.hora_desde ? `de ${hhmm(bloqueo.hora_desde)} a ${hhmm(bloqueo.hora_hasta)}` : 'todo el día';
