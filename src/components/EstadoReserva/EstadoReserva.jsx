import { ESTADOS, estadoVisible } from '../../servicios/reservas.js';
import estilos from './EstadoReserva.module.css';

// Etiqueta del estado de una reserva (ver ESTADOS y estadoVisible en servicios/reservas.js)
export default function EstadoReserva({ reserva }) {
  const estado = estadoVisible(reserva);
  return <span className={`${estilos.estado} ${estilos[estado]}`}>{ESTADOS[estado] ?? estado}</span>;
}
