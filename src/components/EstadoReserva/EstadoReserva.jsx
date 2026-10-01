import { ESTADOS } from '../../servicios/reservas.js';
import estilos from './EstadoReserva.module.css';

// Etiqueta del estado de una reserva: pendiente, confirmada, rechazada, cancelada
export default function EstadoReserva({ estado }) {
  return <span className={`${estilos.estado} ${estilos[estado]}`}>{ESTADOS[estado] ?? estado}</span>;
}
