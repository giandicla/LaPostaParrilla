// Respuestas de las rutas de la API (clase 10): JSON con un mensaje para el
// usuario y el código HTTP que corresponde. Los detalles internos van al log
// del servidor; nunca un stack trace al cliente.

export class ErrorHttp extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

export const json = (cuerpo, status = 200, headers = {}) => Response.json(cuerpo, { status, headers });

// Envuelve un Route Handler: un ErrorHttp se responde tal cual; cualquier otro
// error es un 500 genérico.
export const manejar = (handler) => async (pedido, contexto) => {
  try {
    return await handler(pedido, contexto);
  } catch (error) {
    if (error instanceof ErrorHttp) return json({ error: error.message }, error.status);
    console.error(error);
    return json({ error: 'Algo salió mal. Probá de nuevo en un momento.' }, 500);
  }
};
