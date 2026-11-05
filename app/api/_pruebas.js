// Ayudas de los tests de las rutas (Vitest). No es una ruta: Next solo sirve
// los archivos route.js.
//
// Los tests reemplazan los adaptadores de src/servidor/ (supabase.js, base.js,
// carta-base.js, mercadopago.js) por dobles en memoria. La lógica (pagos.js,
// avisos.js, cancelaciones.js, carta.js), la validación con Zod y el manejo de
// errores corren de verdad: lo que se prueba es la ruta entera, sin red.
import { ErrorHttp } from '../../src/servidor/respuestas.js';

export const TOKEN = 'token-de-prueba';
export const ID = '7d0c6b8e-1c1a-4b8e-9a5e-2f7c1d3e4a5b';

// Un Request como el que arma Next. `token` agrega el Authorization.
export function pedido(ruta, { metodo = 'GET', cuerpo, token, headers = {} } = {}) {
  return new Request(`http://localhost${ruta}`, {
    method: metodo,
    headers: {
      ...(token && { authorization: `Bearer ${token}` }),
      ...(cuerpo !== undefined && { 'content-type': 'application/json' }),
      ...headers,
    },
    body: cuerpo === undefined ? undefined : typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
  });
}

// El segundo argumento de un Route Handler: en Next 16 `params` es una promesa
export const contexto = (params) => ({ params: Promise.resolve(params) });

// Igual que usuarioDelPedido: sin token o con uno que no es el de prueba, 401
export function usuarioFalso(pedidoHttp, usuario) {
  const token = pedidoHttp.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new ErrorHttp(401, 'Ingresá con tu cuenta para continuar.');
  if (token !== TOKEN) throw new ErrorHttp(401, 'Tu sesión venció. Ingresá de nuevo.');
  return usuario;
}

export const leer = async (respuesta) => ({ status: respuesta.status, cuerpo: await respuesta.json() });

// La base de la carta (carta-base.js) en memoria. `estado` es un objeto del
// test: esAdmin, filas (de un local, o null si no existe), filasVinos, item
// (lo que devuelve la base al crear o editar; null = no existe) y llamadas.
export function baseCartaFalsa(estado) {
  const anotar = (nombre, valor) => async (...args) => {
    estado.llamadas.push([nombre, ...args]);
    return typeof valor === 'function' ? valor(...args) : valor;
  };
  return (cliente) => ({
    cliente,
    leerFilas: async () => estado.filas,
    leerFilasVinos: async () => estado.filasVinos,
    esAdmin: async () => estado.esAdmin,
    crearItem: anotar('crearItem', () => estado.item),
    editarItem: anotar('editarItem', () => estado.item),
    leerItem: anotar('leerItem', () => estado.item),
    borrarItem: anotar('borrarItem', () => estado.item != null),
    ubicarItem: anotar('ubicarItem', () => estado.item != null),
    editarBodega: anotar('editarBodega'),
    ubicarBodega: anotar('ubicarBodega'),
    cambiarCubierto: anotar('cambiarCubierto'),
  });
}

// Usuario de las rutas de escritura de la carta: solo hace falta su cliente
export const usuarioCarta = { id: 'admin-1', cliente: 'cliente-del-usuario' };
