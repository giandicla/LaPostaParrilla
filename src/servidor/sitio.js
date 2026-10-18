// URL pública del sitio, para la vuelta desde Mercado Pago (back_urls) y el
// aviso de pago (notification_url). En producción usa el dominio que informa
// Vercel (VERCEL_PROJECT_PRODUCTION_URL), así un APP_URL mal cargado no manda
// al cliente ni al webhook a una preview. Sin barra final.

const sinBarra = (url) => url.replace(/\/+$/, '');

export function urlDelSitio(env = process.env) {
  if (env.VERCEL_ENV === 'production' && env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${sinBarra(env.VERCEL_PROJECT_PRODUCTION_URL)}`;
  }
  if (env.APP_URL) return sinBarra(env.APP_URL);
  if (env.VERCEL_BRANCH_URL) return `https://${sinBarra(env.VERCEL_BRANCH_URL)}`;
  return 'http://localhost:3000';
}
