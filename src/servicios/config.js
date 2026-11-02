// Si el backend está configurado, sin cargar el cliente de Supabase: la
// navbar y la sesión lo consultan en todas las páginas, y supabase-js pesa
// ~245 KB. El cliente se importa recién cuando hace falta (ver SesionProvider).
export const backendDisponible = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);
