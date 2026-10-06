# Backend: Supabase

Reservas, cuentas y panel de admin corren sobre **Supabase** (Postgres + Auth +
Realtime + Edge Functions). No hay servidor propio: el front habla con Supabase
desde el navegador y **la seguridad la pone la RLS de la base**. Diseño completo:
`docs/superpowers/specs/2026-10-01-backend-supabase-design.md`.

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Esquema, RLS, funciones y triggers | `supabase/migrations/*.sql` (la verdad: no se crean tablas desde el panel) |
| Tests de la base (pgTAP) | `supabase/tests/database/*.test.sql` |
| Datos de desarrollo (usuarios de prueba) | `supabase/seed.sql` — solo local |
| Edge Function de mails | `supabase/functions/notificar-reserva/` |
| Única puerta del front a Supabase | `src/servicios/` (`supabase.js`, `auth.js`, `reservas.js`, `admin.js`) |
| Configuración local | `supabase/config.toml` |

**Regla:** ningún componente importa `@supabase/supabase-js` ni `src/servicios/supabase.js`.
Usan las funciones de los otros archivos de `src/servicios/`.

## Desarrollo local

Requiere Docker Desktop prendido.

```bash
npx supabase start          # levanta Postgres, Auth, Realtime, Studio... (la 1ª vez tarda)
npx supabase db reset       # aplica migraciones + seed desde cero
npm run db:test             # tests de la base (pgTAP)
npx supabase functions serve --env-file supabase/functions/.env   # función de mails
npm run dev
```

- `.env.local` (no se commitea): `NEXT_PUBLIC_SUPABASE_URL` y
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, los de `npx supabase status`.
  Plantilla en `.env.example`.
- `supabase/functions/.env` (no se commitea): variables de la función de mails,
  ver la cabecera de `supabase/functions/notificar-reserva/index.ts`.
- Usuarios de prueba (del seed): `admin@laposta.test` y `cliente@laposta.test`,
  contraseña `laposta123`.
- Studio (panel de la base local): http://127.0.0.1:54323. Mails de Auth
  (confirmación, recuperar contraseña): http://127.0.0.1:54324.
- Los tests de la función de mails corren con Deno:
  `docker run --rm -v "$PWD/supabase/functions/notificar-reserva:/app" -w /app denoland/deno test mensajes.test.ts`

## Producción: estado actual

- Proyecto Supabase **`la-posta`** (ref `dagxitkhqbztgetoultt`, São Paulo), en la
  organización "TP Web La Posta". Migraciones aplicadas; los tests pgTAP pasan contra él.
- Función `notificar-reserva` desplegada con sus secretos y los de Vault. Falta
  `BREVO_API_KEY`: hasta cargarla, los mails solo quedan en el log de la función.
- Auth: Site URL `https://lapostaparrilla.vercel.app`. **Solo Google**: el proveedor
  de email está apagado (la API rechaza registrarse con email). Se aplica con `npx supabase config push` (sección `[auth]` de
  `config.toml`; las credenciales salen de `supabase/.env`, que no se sube).
- Google: cliente OAuth creado con la cuenta de la facultad. Ingresar funciona con
  cualquier cuenta de Google (probado con una personal).
- La contraseña de la base está en `supabase/.db-password` (ignorado por git).

**Nota:** como el registro con email está apagado en `config.toml`, en local los
usuarios de prueba del seed tampoco pueden ingresar con contraseña. Para probar en
local con sesión hay que agregar `http://127.0.0.1:54321/auth/v1/callback` a las
URIs de redirección del cliente de Google.

## Puesta en producción (una sola vez)

Pasos en orden. Los marcados 👤 los tiene que hacer una persona (cuentas,
pantallas de consentimiento); el resto se puede hacer desde la CLI.

1. 👤 `npx supabase login` (abre el navegador; cuenta GitHub `giandicla`).
2. Crear el proyecto: `npx supabase projects create la-posta --region sa-east-1`
   (São Paulo, el más cercano) y guardar la contraseña de la base que pide.
3. `npx supabase link --project-ref <ref>` y `npx supabase db push` (migraciones).
4. Función de mails: `npx supabase functions deploy notificar-reserva` y sus
   secretos: `npx supabase secrets set NOTIFICACIONES_SECRETO=<algo largo y al azar>
   MAIL_REMITENTE=lapostavla@gmail.com MAIL_ADMIN=lapostavla@gmail.com
   SITIO_URL=https://<dominio de vercel> BREVO_API_KEY=<clave>`.
5. En el SQL Editor del proyecto, los dos secretos de Vault que usa el trigger:
   ```sql
   select vault.create_secret('https://<ref>.supabase.co/functions/v1/notificar-reserva', 'notificaciones_url');
   select vault.create_secret('<el mismo NOTIFICACIONES_SECRETO>', 'notificaciones_secreto');
   ```
6. Auth → URL Configuration: *Site URL* = el dominio de Vercel; *Redirect URLs* =
   `https://<dominio>/**` y `http://localhost:3000/**`.
7. 👤 **Google**: en Google Cloud Console crear un *OAuth client ID* (Web), con
   *Authorized redirect URI* = `https://<ref>.supabase.co/auth/v1/callback`.
   Pegar Client ID y Secret en Supabase → Auth → Providers → Google.
8. 👤 **Brevo**: crear cuenta gratis, verificar el remitente `lapostavla@gmail.com`
   (Senders), crear una API key (SMTP & API → API Keys) y cargarla en el paso 4.
9. **Vercel** → Settings → Environment Variables: `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` del proyecto (Settings → API Keys).
10. 👤 Nombrar al primer admin: registrarse en el sitio y, en el SQL Editor,
    `update public.perfiles set rol = 'admin' where id = (select id from auth.users where email = '<mail>');`

## Mails

Al ingresar solo con Google, Supabase Auth no manda mails (no hay confirmaciones
ni recuperación de contraseña). Los únicos mails son los de reservas, que manda
la función `notificar-reserva` con Brevo cuando esté cargada `BREVO_API_KEY`.
