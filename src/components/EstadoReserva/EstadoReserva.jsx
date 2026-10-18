import { ESTADOS } from '../../servicios/reservas.js';
import estilos from './EstadoReserva.module.css';

// Etiqueta del estado de una reserva (ver ESTADOS en servicios/reservas.js)
export default function EstadoReserva({ estado }) {
  return <span className={`${estilos.estado} ${estilos[estado]}`}>{ESTADOS[estado] ?? estado}</span>;
}
