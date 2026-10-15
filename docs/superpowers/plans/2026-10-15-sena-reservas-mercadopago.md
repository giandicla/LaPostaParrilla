# Seña de la reserva con Mercado Pago — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reservar desde la web exige pagar una seña de $10.000 con Checkout Pro; el webhook confirma la reserva, el admin puede cancelar con motivo y la seña se reintegra sola; el admin puede bloquear un turno lleno.

**Architecture:** Las reglas viven en Postgres (migraciones + pgTAP): estados `esperando_pago`/`vencida`, tabla `pagos`, `acreditar_pago()`, trigger de reintegro y vencimiento con `pg_cron`. Tres Route Handlers de Next (`app/api/`) hablan con Mercado Pago usando módulos de `src/servidor/` cuya lógica recibe sus dependencias (base, Mercado Pago) por parámetro, así se testea con `node --test` sin red. El front llama a esas rutas desde `src/servicios/pagos.js`.

**Tech Stack:** Next.js 16 (App Router, Route Handlers), React 19, Supabase (Postgres 17, RLS, Realtime, pg_cron), SDK oficial `mercadopago` 3.6.1, `zod` 4.6.7, `node --test`, pgTAP, Deno (Edge Function de mails).

**Spec:** `docs/superpowers/specs/2026-10-15-sena-reservas-mercadopago-design.md`

## Global Constraints

- Solo credenciales de **prueba** (vendedor de prueba, `APP_USR-`). Nunca credenciales de producción.
- Monto de la seña: **$10.000**, fijo por reserva, en `locales.sena`. El servidor nunca usa un monto que venga del navegador.
- Vencimiento: **15 minutos** desde `reservas.creada_en`; la preferencia vence en el mismo momento.
- Turno: hora `< 17:00` → `mediodia`; desde `17:00` → `noche`.
- Motivo de cancelación: máximo **120** caracteres (mismo límite que `LIMITES.motivo`), obligatorio para el admin, por defecto "No hay lugar".
- Siempre `init_point`, nunca `sandbox_init_point`. `auto_return` y `notification_url` solo si `APP_URL` es HTTPS y no local.
- Variables solo de servidor: `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `SUPABASE_SECRET_KEY`, `APP_URL`. Ninguna con prefijo `NEXT_PUBLIC_`.
- Código, nombres y textos en español; commits en inglés terminando con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Ningún componente importa `@supabase/supabase-js`: el front pasa por `src/servicios/`; el servidor, por `src/servidor/`.
- Imports con rutas relativas y extensión `.js` (los tests de `node --test` no resuelven el alias `@/`).
- Todo en la rama `feat/pagos-sena`; PR con la plantilla; no se mergea sin el OK del usuario.

## Review Focus

1. **Aviso repetido del mismo pago**: Mercado Pago reenvía el webhook → la reserva y el pago no cambian la segunda vez (pgTAP, Task 2).
2. **Primer intento rechazado y segundo aprobado en la misma preferencia**: el pago `rechazado` pasa a `aprobado` y la reserva a `confirmada` (pgTAP, Task 2).
3. **Dos preferencias abiertas y las dos pagadas**: la segunda queda `reintegro_pendiente`, nunca dos señas cobradas (pgTAP, Task 2).
4. **Aviso de un pago que no salió de este sitio** (`external_reference` vacío, no-UUID o desconocido) → 200 `ignorado`, no 500 (si no, Mercado Pago reintenta durante horas) (`node --test`, Task 7).
5. **El reembolso de Mercado Pago falla** → la cancelación igual queda hecha y la ruta informa `reintegro: 'pendiente'` (`node --test`, Task 8).

---

## Mapa de archivos

| Archivo | Qué hace |
|---|---|
| `supabase/migrations/20261015110000_estados_sena.sql` | Agrega `esperando_pago` y `vencida` al enum (archivo propio: un valor nuevo de enum no se puede usar en la misma transacción) |
| `supabase/migrations/20261015120000_sena_reservas.sql` | Reserva esperando el pago, motivo, cancelar, `pagos`, acreditar, reintegro, vencimiento |
| `supabase/migrations/20261015130000_bloqueo_por_turno.sql` | `turno_de()`, `dias_bloqueados.turno`, `validar_reserva()` con turnos |
| `supabase/tests/database/05_sena.test.sql` | Tests de la seña |
| `supabase/tests/database/06_bloqueo_por_turno.test.sql` | Tests del bloqueo por turno |
| `supabase/functions/notificar-reserva/mensajes.ts` (+ test) | Mails según los estados nuevos |
| `src/servidor/respuestas.js` | `ErrorHttp`, `json`, `manejar` |
| `src/servidor/esquemas.js` | Esquemas Zod y `leerCuerpo` |
| `src/servidor/firma.js` | `validarFirma` del webhook |
| `src/servidor/preferencia.js` | `armarPreferencia`, `venceLaReserva`, `esUrlPublica` |
| `src/servidor/pagos.js` | `iniciarPagoDeSena` |
| `src/servidor/avisos.js` | `procesarAvisoDePago` |
| `src/servidor/reintegros.js` | `reintegrarPago` |
| `src/servidor/cancelaciones.js` | `cancelarReserva` |
| `src/servidor/supabase.js` | Clientes de Supabase del servidor y `usuarioDelPedido` |
| `src/servidor/base.js` | Adaptador de la base para la lógica de arriba |
| `src/servidor/mercadopago.js` | Adaptador del SDK de Mercado Pago |
| `app/api/v1/pagos/route.js` | `POST /api/v1/pagos` |
| `app/api/webhooks/mercadopago/route.js` | `POST /api/webhooks/mercadopago` |
| `app/api/v1/reservas/[id]/cancelacion/route.js` | `POST /api/v1/reservas/:id/cancelacion` |
| `src/servicios/pagos.js` | El front llama a las rutas |
| `src/servicios/reservas.js`, `src/servicios/admin.js` | Estados, seña, turnos, reintegros |
| `app/reservas/page.jsx`, `app/reservas/pago/page.jsx` | Reservar y pagar; vuelta de Mercado Pago |
| `app/mis-reservas/page.jsx` | Pagar, cancelar, motivo, reintegro |
| `app/admin/page.jsx` | Cancelar con motivo, seña, reintegros, turnos |

---

### Task 1: Base — reserva esperando el pago y cancelación con motivo

**Files:**
- Create: `supabase/migrations/20261015110000_estados_sena.sql`
- Create: `supabase/migrations/20261015120000_sena_reservas.sql`
- Create: `supabase/tests/database/05_sena.test.sql`
- Modify: `supabase/tests/database/01_reservas_cliente.test.sql:41,85,128-130`

**Interfaces:**
- Produces: enum `estado_reserva` con `esperando_pago` y `vencida`; `reservas.estado` por defecto `esperando_pago`; `reservas.motivo_cancelacion text`; `public.cancelar_reserva(p_id uuid, p_motivo text default null) returns public.reservas` (reemplaza a `cancelar_reserva(uuid)`); mensaje de error `'Escribí el motivo de la cancelación: se lo mandamos al cliente.'`.

- [ ] **Step 1: Levantar la base local**

Run: `npx supabase start` (requiere Docker Desktop) y después `npm run db:test`
Expected: los 4 archivos actuales pasan (baseline).

- [ ] **Step 2: Escribir el test que falla**

Crear `supabase/tests/database/05_sena.test.sql`:

```sql
-- Seña de la reserva (migraciones 20261015110000 y 20261015120000).
-- Corre con: npx supabase test db
begin;
select plan(9);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.com', '{"full_name":"Ana"}'),
  ('33333333-3333-3333-3333-333333333333', 'admin@test.com', '{"full_name":"Admin"}');
update public.perfiles set rol = 'admin' where id = '33333333-3333-3333-3333-333333333333';

-- ---------- Como Ana ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok($$
  insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
          'parrilla', current_date + 10, '20:30', 4, 'Ana', '2944111111')
$$, 'un cliente reserva');

select is(
  (select estado::text from public.reservas where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'esperando_pago', 'la reserva nueva queda esperando el pago');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 10, '21:00', 2, 'Ana', '2944111111')
$$, '23505', null, 'una reserva esperando el pago ocupa el lugar del día');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono, estado)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 11, '20:30', 2, 'Ana', '2944111111', 'pendiente')
$$, '42501', null, 'un cliente ya no crea reservas pendientes');

select lives_ok($$
  select public.cancelar_reserva('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
$$, 'el cliente cancela una reserva sin pagar, sin motivo');

select is(
  (select estado::text || '/' || cancelada_por from public.reservas where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'cancelada/cliente', 'queda cancelada por el cliente');

-- ---------- Como admin ----------
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

insert into public.reservas (id, usuario_id, origen, estado, local_id, fecha, hora, personas, nombre, telefono)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', null, 'local', 'confirmada',
        'parrilla', current_date + 12, '20:30', 4, 'Carlos', '2944222222');

select throws_ok($$
  select public.cancelar_reserva('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
$$, 'P0001', 'Escribí el motivo de la cancelación: se lo mandamos al cliente.',
  'el admin no cancela sin motivo');

select lives_ok($$
  select public.cancelar_reserva('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'No hay lugar')
$$, 'el admin cancela con motivo');

select is(
  (select motivo_cancelacion from public.reservas where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'No hay lugar', 'el motivo queda guardado');

select * from finish();
rollback;
```

- [ ] **Step 3: Correrlo y verificar que falla**

Run: `npm run db:test`
Expected: FAIL en `05_sena.test.sql` (el estado es `pendiente` y `cancelar_reserva` no acepta motivo).

- [ ] **Step 4: Migración de los estados**

Crear `supabase/migrations/20261015110000_estados_sena.sql`:

```sql
-- Estados nuevos de la reserva para la seña. Van en una migración propia
-- porque Postgres no deja usar un valor nuevo de enum en la misma transacción
-- en que se agrega. Spec: docs/superpowers/specs/2026-10-15-sena-reservas-mercadopago-design.md
alter type public.estado_reserva add value if not exists 'esperando_pago' before 'pendiente';
alter type public.estado_reserva add value if not exists 'vencida';
```

- [ ] **Step 5: Migración de la reserva y la cancelación**

Crear `supabase/migrations/20261015120000_sena_reservas.sql`:

```sql
-- Seña de la reserva con Mercado Pago (parte de la base).
-- Spec: docs/superpowers/specs/2026-10-15-sena-reservas-mercadopago-design.md
--
-- Una reserva de la web nace esperando el pago; el webhook la confirma. Ya no
-- pasa por "pendiente": el admin no acepta reservas, solo puede cancelarlas,
-- con motivo. pendiente y rechazada quedan en el enum por las reservas viejas.

-- =====================================================================
-- Reserva esperando el pago
-- =====================================================================
alter table public.reservas alter column estado set default 'esperando_pago';

alter table public.reservas
  add column motivo_cancelacion text
    check (motivo_cancelacion is null or char_length(motivo_cancelacion) <= 120),
  -- Las reservas del local no pagan seña
  add constraint reservas_sena_solo_web
    check (origen = 'web' or estado <> 'esperando_pago');

-- Esperando el pago también ocupa el lugar del día
drop index public.reservas_una_activa_por_dia;
create unique index reservas_una_activa_por_dia
  on public.reservas (usuario_id, local_id, fecha)
  where estado in ('esperando_pago', 'pendiente', 'confirmada');

drop policy "reservas: crear a nombre propio y pendiente" on public.reservas;
create policy "reservas: crear a nombre propio esperando el pago" on public.reservas
  for insert to authenticated
  with check (
    (usuario_id = auth.uid() and origen = 'web' and estado = 'esperando_pago'
      and cancelada_por is null and motivo_cancelacion is null)
    or public.es_admin()
  );

-- =====================================================================
-- Cancelar: el cliente y el admin pasan por acá. El admin explica el motivo
-- (le llega al cliente). Una reserva sin pagar se cancela cuando sea.
-- =====================================================================
drop function public.cancelar_reserva(uuid);

create function public.cancelar_reserva(p_id uuid, p_motivo text default null)
returns public.reservas
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.reservas;
  admin boolean := public.es_admin();
begin
  select * into r from public.reservas where id = p_id;

  if not found or (r.usuario_id is distinct from auth.uid() and not admin) then
    raise exception 'No encontramos esa reserva.';
  end if;

  if r.estado not in ('esperando_pago', 'pendiente', 'confirmada') then
    raise exception 'Esa reserva ya no está activa.';
  end if;

  if not admin and r.estado <> 'esperando_pago'
     and public.inicio_reserva(r.fecha, r.hora) - now() < interval '1 hour' then
    raise exception 'Falta menos de 1 hora para tu reserva: para cancelarla escribinos por WhatsApp.';
  end if;

  update public.reservas
    set estado = 'cancelada', motivo_cancelacion = nullif(trim(p_motivo), '')
    where id = p_id
    returning * into r;
  return r;
end;
$$;

revoke execute on function public.cancelar_reserva(uuid, text) from anon, public;
grant execute on function public.cancelar_reserva(uuid, text) to authenticated;

-- El motivo del admin se exige en un trigger y no en la función: el admin
-- también puede cancelar con un update directo (política "el admin edita").
create function public.validar_cancelacion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.estado = 'cancelada' and old.estado <> 'cancelada' and public.es_admin()
     and nullif(trim(new.motivo_cancelacion), '') is null then
    raise exception 'Escribí el motivo de la cancelación: se lo mandamos al cliente.';
  end if;
  return new;
end;
$$;

create trigger validar_cancelacion
  before update of estado on public.reservas
  for each row execute function public.validar_cancelacion();
```

- [ ] **Step 6: Actualizar el test 01, que asumía `pendiente`**

En `supabase/tests/database/01_reservas_cliente.test.sql`:
- línea 41: `'pendiente', 'la reserva nueva queda pendiente');` → `'esperando_pago', 'la reserva nueva queda esperando el pago');`
- línea 85: `'pendiente', 'un cliente no puede confirmar su reserva');` → `'esperando_pago', 'un cliente no puede confirmar su reserva');`
- el test "el admin puede cancelar aunque falte menos de 1 hora" pasa a llamar con motivo:

```sql
select lives_ok($$
  select public.cancelar_reserva('cccccccc-cccc-cccc-cccc-cccccccccccc', 'No hay lugar')
$$, 'el admin puede cancelar aunque falte menos de 1 hora');
```

La reserva `cccc…` (dentro de 30 minutos) nace `esperando_pago`, y un cliente puede cancelar una reserva sin pagar a cualquier hora. Para que el test de "menos de 1 hora" siga probando la regla, confirmarla en los datos de prueba, justo después del insert de `cccc…` (todavía como superusuario):

```sql
update public.reservas set estado = 'confirmada' where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
```

En `04_reservas_del_local.test.sql`, la reserva `dddd…` (dentro de 90 minutos) se cancela desde la web y sigue pasando: no hace falta tocarlo.

- [ ] **Step 7: Correr los tests**

Run: `npx supabase db reset && npm run db:test`
Expected: PASS en los 5 archivos.

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/20261015110000_estados_sena.sql supabase/migrations/20261015120000_sena_reservas.sql supabase/tests/database/05_sena.test.sql supabase/tests/database/01_reservas_cliente.test.sql
git commit -m "feat: web reservations wait for the deposit; cancel with a reason

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Base — pagos, acreditación, reintegro y vencimiento

**Files:**
- Modify: `supabase/migrations/20261015120000_sena_reservas.sql` (agregar al final)
- Modify: `supabase/tests/database/05_sena.test.sql`

**Interfaces:**
- Consumes: estados y `cancelar_reserva(uuid, text)` de Task 1.
- Produces: `locales.sena numeric(12,2)`; tabla `pagos(id uuid, reserva_id uuid, monto numeric, estado text, mp_preference_id text, mp_payment_id text, creado_en, actualizado_en)` con estados `iniciado|aprobado|rechazado|reintegro_pendiente|reintegrado`; `public.acreditar_pago(p_pago_id uuid, p_mp_payment_id text, p_estado_mp text) returns text` (solo `service_role`; devuelve el estado final del pago); `public.vencer_reservas_sin_pagar() returns integer`; job de `pg_cron` `vencer-reservas-sin-pagar`.

- [ ] **Step 1: Escribir los tests que fallan**

En `05_sena.test.sql`, cambiar `select plan(9);` por `select plan(24);` y agregar antes de `select * from finish();`:

```sql
-- ---------- Pagos ----------
reset role;
-- Reserva de Ana esperando el pago, y un pago iniciado (lo crea el servidor)
insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111',
        'parrilla', current_date + 15, '20:30', 2, 'Ana', '2944111111');
insert into public.pagos (id, reserva_id, monto)
values ('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 10000);

select is((select sena from public.locales where id = 'parrilla'), 10000.00::numeric,
  'la seña de la parrilla es de $10.000');

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is((select count(*)::int from public.pagos), 1, 'el cliente ve el pago de su reserva');

select throws_ok($$
  insert into public.pagos (reserva_id, monto) values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 1)
$$, '42501', null, 'el navegador no crea pagos');

select throws_ok($$
  select public.acreditar_pago('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0', '999', 'approved')
$$, '42501', null, 'el navegador no acredita pagos');

-- ---------- Como el servidor ----------
set local role service_role;

select is(public.acreditar_pago('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0', '111', 'rejected'),
  'rechazado', 'un pago rechazado queda rechazado');
select is((select estado::text from public.reservas where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  'esperando_pago', 'y la reserva sigue esperando el pago (puede reintentar)');

select is(public.acreditar_pago('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0', '222', 'approved'),
  'aprobado', 'el segundo intento, aprobado, aprueba el mismo pago');
select is((select estado::text from public.reservas where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  'confirmada', 'y la reserva queda confirmada');

select is(public.acreditar_pago('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0', '222', 'approved'),
  'aprobado', 'un aviso repetido no cambia nada');

-- Una segunda preferencia de la misma reserva, también pagada: se devuelve
reset role;
insert into public.pagos (id, reserva_id, monto)
values ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 10000);
set local role service_role;
select is(public.acreditar_pago('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', '333', 'approved'),
  'reintegro_pendiente', 'una segunda seña cobrada para la misma reserva queda para reintegrar');

-- ---------- Cancelar una reserva pagada ----------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok($$ select public.cancelar_reserva('cccccccc-cccc-cccc-cccc-cccccccccccc') $$,
  'el cliente cancela su reserva pagada con tiempo');
reset role;
select is((select estado from public.pagos where id = 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0'),
  'reintegro_pendiente', 'al cancelar, la seña aprobada queda para reintegrar');

-- ---------- Vencimiento ----------
insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono, creada_en)
values ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111',
        'parrilla', current_date + 16, '20:30', 2, 'Ana', '2944111111', now() - interval '16 minutes'),
       ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111',
        'parrilla', current_date + 17, '20:30', 2, 'Ana', '2944111111', now() - interval '5 minutes');
select public.vencer_reservas_sin_pagar();
select is((select estado::text from public.reservas where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  'vencida', 'a los 15 minutos sin pagar, la reserva vence');
select is((select estado::text from public.reservas where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  'esperando_pago', 'antes de los 15 minutos, no');

-- Un pago que llega tarde sobre una reserva vencida se devuelve
insert into public.pagos (id, reserva_id, monto)
values ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 10000);
set local role service_role;
select is(public.acreditar_pago('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', '444', 'approved'),
  'reintegro_pendiente', 'un pago aprobado sobre una reserva vencida queda para reintegrar');
reset role;
```

- [ ] **Step 2: Correrlos y verificar que fallan**

Run: `npm run db:test`
Expected: FAIL (no existe `locales.sena` ni la tabla `pagos`).

- [ ] **Step 3: Agregar al final de `20261015120000_sena_reservas.sql`**

```sql
-- =====================================================================
-- Monto de la seña: fijo por reserva, por local. Se cambia acá, no en el código.
-- =====================================================================
alter table public.locales
  add column sena numeric(12,2) not null default 10000 check (sena > 0);

-- =====================================================================
-- Pagos: uno por intento de pago (preferencia). El id va a Mercado Pago como
-- external_reference y vuelve en el webhook: es el puente con la reserva.
-- Solo los escribe el servidor (clave secreta, que se saltea la RLS).
-- =====================================================================
create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references public.reservas (id) on delete cascade,
  monto numeric(12,2) not null check (monto > 0),
  estado text not null default 'iniciado'
    check (estado in ('iniciado', 'aprobado', 'rechazado', 'reintegro_pendiente', 'reintegrado')),
  mp_preference_id text,
  mp_payment_id text unique,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index pagos_por_reserva on public.pagos (reserva_id);

-- Nunca dos señas aprobadas para la misma reserva: la segunda que se cobra
-- queda reintegro_pendiente (ver acreditar_pago)
create unique index pagos_uno_aprobado_por_reserva on public.pagos (reserva_id)
  where estado = 'aprobado';

alter table public.pagos enable row level security;

create policy "pagos: ver los de mis reservas o ser admin" on public.pagos
  for select to authenticated
  using (
    public.es_admin()
    or exists (select 1 from public.reservas r where r.id = reserva_id and r.usuario_id = auth.uid())
  );

revoke insert, update, delete on public.pagos from anon, authenticated;

-- =====================================================================
-- Acreditar un pago: la llama el webhook con el estado real que devolvió
-- GET /v1/payments/:id. Idempotente: Mercado Pago repite los avisos.
-- Devuelve el estado final del pago; si es reintegro_pendiente, el servidor
-- hace el reembolso.
-- =====================================================================
create function public.acreditar_pago(p_pago_id uuid, p_mp_payment_id text, p_estado_mp text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.pagos;
  r public.reservas;
begin
  select * into p from public.pagos where id = p_pago_id for update;
  if not found then
    raise exception 'No existe el pago %', p_pago_id;
  end if;

  -- Ya resuelto: un aviso repetido no cambia nada
  if p.estado in ('aprobado', 'reintegro_pendiente', 'reintegrado') then
    return p.estado;
  end if;

  select * into r from public.reservas where id = p.reserva_id for update;

  if p_estado_mp = 'approved' then
    if r.estado = 'esperando_pago' then
      update public.pagos
        set estado = 'aprobado', mp_payment_id = p_mp_payment_id, actualizado_en = now()
        where id = p.id;
      update public.reservas set estado = 'confirmada' where id = r.id;
      return 'aprobado';
    end if;
    -- La reserva venció, se canceló o ya tenía otra seña: se devuelve
    update public.pagos
      set estado = 'reintegro_pendiente', mp_payment_id = p_mp_payment_id, actualizado_en = now()
      where id = p.id;
    return 'reintegro_pendiente';
  end if;

  if p_estado_mp in ('rejected', 'cancelled') then
    update public.pagos
      set estado = 'rechazado', mp_payment_id = p_mp_payment_id, actualizado_en = now()
      where id = p.id;
    return 'rechazado';
  end if;

  return p.estado;  -- pending, in_process: todavía no hay nada que hacer
end;
$$;

revoke execute on function public.acreditar_pago(uuid, text, text) from public, anon, authenticated;
grant execute on function public.acreditar_pago(uuid, text, text) to service_role;

-- =====================================================================
-- Cancelar una reserva pagada deja la seña para reintegrar, la cancele quien
-- la cancele. El reembolso lo hace el servidor; si falla, el panel lo muestra.
-- =====================================================================
create function public.marcar_reintegro()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.pagos
    set estado = 'reintegro_pendiente', actualizado_en = now()
    where reserva_id = new.id and estado = 'aprobado';
  return new;
end;
$$;

create trigger marcar_reintegro
  after update of estado on public.reservas
  for each row
  when (new.estado = 'cancelada' and old.estado <> 'cancelada')
  execute function public.marcar_reintegro();

-- =====================================================================
-- Vencimiento: 15 minutos para pagar. pg_cron lo corre cada minuto.
-- =====================================================================
create function public.vencer_reservas_sin_pagar()
returns integer
language sql
security definer
set search_path = ''
as $$
  with vencidas as (
    update public.reservas set estado = 'vencida'
    where estado = 'esperando_pago' and creada_en < now() - interval '15 minutes'
    returning 1
  )
  select count(*)::int from vencidas;
$$;

revoke execute on function public.vencer_reservas_sin_pagar() from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('vencer-reservas-sin-pagar', '* * * * *', 'select public.vencer_reservas_sin_pagar()');
```

- [ ] **Step 4: Correr los tests**

Run: `npx supabase db reset && npm run db:test`
Expected: PASS en los 5 archivos (24 asserts en `05_sena`).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261015120000_sena_reservas.sql supabase/tests/database/05_sena.test.sql
git commit -m "feat: payments table, idempotent crediting, refund flag and expiry

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Base — bloqueo por turno

**Files:**
- Create: `supabase/migrations/20261015130000_bloqueo_por_turno.sql`
- Create: `supabase/tests/database/06_bloqueo_por_turno.test.sql`

**Interfaces:**
- Produces: `public.turno_de(p_hora time) returns text` (`'mediodia'|'noche'`); `dias_bloqueados.turno text` (`null` = todo el día); mensaje `'Ese turno ya está completo.'`.

- [ ] **Step 1: Escribir el test que falla**

Crear `supabase/tests/database/06_bloqueo_por_turno.test.sql`:

```sql
-- Bloqueo por turno (migración 20261015130000): frena las reservas nuevas de
-- un turno lleno y no toca las que ya estaban.
begin;
select plan(6);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.com', '{"full_name":"Ana"}'),
  ('22222222-2222-2222-2222-222222222222', 'beto@test.com', '{"full_name":"Beto"}');

-- Beto ya tenía reserva para la noche antes del bloqueo
insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222',
        'parrilla', current_date + 20, '20:30', 2, 'Beto', '2944222222');

insert into public.dias_bloqueados (fecha, local_id, turno, motivo)
values (current_date + 20, 'parrilla', 'noche', 'Completo');

select is(public.turno_de('12:30'), 'mediodia', 'antes de las 17 es mediodía');
select is(public.turno_de('20:00'), 'noche', 'desde las 17 es noche');

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 20, '21:00', 2, 'Ana', '2944111111')
$$, 'P0001', 'Ese turno ya está completo.', 'no se puede reservar en un turno bloqueado');

select lives_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 20, '12:30', 2, 'Ana', '2944111111')
$$, 'el otro turno del mismo día sigue abierto');

reset role;
select is((select estado::text from public.reservas where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'esperando_pago', 'la reserva que ya existía no se toca');

select lives_ok($$
  insert into public.dias_bloqueados (fecha, local_id, turno) values (current_date + 20, 'parrilla', 'mediodia')
$$, 'se puede bloquear también el otro turno del mismo día');

select * from finish();
rollback;
```


- [ ] **Step 2: Correrlo y verificar que falla**

Run: `npm run db:test`
Expected: FAIL (no existe `turno_de` ni la columna `turno`).

- [ ] **Step 3: Ver el nombre de la restricción de unicidad actual**

Run: `npx supabase db dump --local --schema public | grep -n "dias_bloqueados.*UNIQUE\|CONSTRAINT .*dias_bloqueados"`
Expected: `dias_bloqueados_fecha_local_id_key` (el nombre por defecto). Si es otro, usarlo en el paso siguiente.

- [ ] **Step 4: Migración**

Crear `supabase/migrations/20261015130000_bloqueo_por_turno.sql`:

```sql
-- Bloqueo por turno: cuando un turno se llena, el admin frena las reservas
-- nuevas de ese turno sin tocar las ya hechas. turno null = todo el día.
-- Spec: docs/superpowers/specs/2026-10-15-sena-reservas-mercadopago-design.md

-- Las franjas de reserva son 12 a 13 y 20 a 21: antes de las 17, mediodía.
create function public.turno_de(p_hora time)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when p_hora < time '17:00' then 'mediodia' else 'noche' end;
$$;

alter table public.dias_bloqueados
  add column turno text check (turno in ('mediodia', 'noche'));

alter table public.dias_bloqueados drop constraint dias_bloqueados_fecha_local_id_key;
alter table public.dias_bloqueados
  add constraint dias_bloqueados_fecha_local_turno_key unique nulls not distinct (fecha, local_id, turno);

create or replace function public.validar_reserva()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT'
     or new.fecha is distinct from old.fecha
     or new.hora is distinct from old.hora
     or new.local_id is distinct from old.local_id then

    if not exists (
      select 1 from public.franjas_reserva
      where local_id = new.local_id and hora = new.hora
    ) then
      raise exception 'La hora elegida no es un horario de reserva de ese local.';
    end if;

    if public.inicio_reserva(new.fecha, new.hora) <= now() then
      raise exception 'No se puede reservar para una fecha u hora que ya pasó.';
    end if;

    if exists (
      select 1 from public.dias_bloqueados
      where fecha = new.fecha and (local_id is null or local_id = new.local_id) and turno is null
    ) then
      raise exception 'Ese día no tomamos reservas en ese local.';
    end if;

    if exists (
      select 1 from public.dias_bloqueados
      where fecha = new.fecha and (local_id is null or local_id = new.local_id)
        and turno = public.turno_de(new.hora)
    ) then
      raise exception 'Ese turno ya está completo.';
    end if;
  end if;

  if tg_op = 'UPDATE' and new.estado = 'cancelada' and old.estado <> 'cancelada' then
    new.cancelada_por := case when public.es_admin() then 'admin' else 'cliente' end;
  end if;

  if tg_op = 'UPDATE' then
    new.actualizada_en := now();
  end if;

  return new;
end;
$$;
```

- [ ] **Step 5: Correr los tests**

Run: `npx supabase db reset && npm run db:test`
Expected: PASS en los 6 archivos (el 02 sigue pasando: el bloqueo de día entero conserva su mensaje).

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20261015130000_bloqueo_por_turno.sql supabase/tests/database/06_bloqueo_por_turno.test.sql
git commit -m "feat: block new reservations for a full shift

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Mails según los estados nuevos (Edge Function)

**Files:**
- Modify: `supabase/functions/notificar-reserva/mensajes.ts`
- Modify: `supabase/functions/notificar-reserva/mensajes.test.ts`

**Interfaces:**
- Consumes: estados de Task 1 (`esperando_pago`, `vencida`) y `motivo_cancelacion`.
- Produces: `armarMensajes(aviso, sitio)` con las reglas: INSERT web → nada; `esperando_pago → confirmada` → cliente + admin; `→ vencida` → nada; `esperando_pago → cancelada` → nada; cancelada por admin → cliente con motivo y aviso de reintegro (solo web).

- [ ] **Step 1: Escribir los tests que fallan**

En `mensajes.test.ts`, cambiar `base` a `estado: 'esperando_pago'` y agregar `motivo_cancelacion: null`. Reemplazar los tests `'reserva nueva: avisa al admin'` y `'confirmada o rechazada: avisa al cliente'` y `'cancelada: avisa al que no canceló'` por:

```ts
const confirmada: Reserva = { ...base, estado: 'confirmada' };

Deno.test('reserva nueva de la web (esperando el pago): no manda nada', () => {
  assertEquals(armarMensajes({ tipo: 'INSERT', reserva: base, anterior: null }, sitio).length, 0);
});

Deno.test('pago acreditado: le confirma al cliente y avisa al admin', () => {
  const m = armarMensajes({ tipo: 'UPDATE', reserva: confirmada, anterior: base }, sitio);
  assertEquals(destinos(m).sort(), ['admin', 'cliente']);
});

Deno.test('vencida o abandonada sin pagar: no manda nada', () => {
  const vencida = { ...base, estado: 'vencida' as const };
  const abandonada = { ...base, estado: 'cancelada' as const, cancelada_por: 'cliente' as const };
  assertEquals(armarMensajes({ tipo: 'UPDATE', reserva: vencida, anterior: base }, sitio).length, 0);
  assertEquals(armarMensajes({ tipo: 'UPDATE', reserva: abandonada, anterior: base }, sitio).length, 0);
});

Deno.test('cancelada: avisa al que no canceló', () => {
  const porCliente = { ...confirmada, estado: 'cancelada' as const, cancelada_por: 'cliente' as const };
  const porAdmin = { ...confirmada, estado: 'cancelada' as const, cancelada_por: 'admin' as const,
    motivo_cancelacion: 'No hay lugar' };
  assertEquals(destinos(armarMensajes({ tipo: 'UPDATE', reserva: porCliente, anterior: confirmada }, sitio)), ['admin']);
  assertEquals(destinos(armarMensajes({ tipo: 'UPDATE', reserva: porAdmin, anterior: confirmada }, sitio)), ['cliente']);
});

Deno.test('cancelada por el admin: el mail lleva el motivo y avisa el reintegro', () => {
  const porAdmin = { ...confirmada, estado: 'cancelada' as const, cancelada_por: 'admin' as const,
    motivo_cancelacion: 'No hay <lugar>' };
  const [m] = armarMensajes({ tipo: 'UPDATE', reserva: porAdmin, anterior: confirmada }, sitio);
  assertEquals(m.html.includes('No hay &lt;lugar&gt;'), true);
  assertEquals(m.html.includes('reintegramos la seña'), true);
});
```

Y en `'escapa el HTML de lo que escribe el cliente'`, usar el mail de confirmación:

```ts
Deno.test('escapa el HTML de lo que escribe el cliente', () => {
  const [m] = armarMensajes({ tipo: 'UPDATE', reserva: confirmada, anterior: base }, sitio);
  assertEquals(m.html.includes('Ana &lt;b&gt;'), true);
});
```

En los tests de reservas del local, `delLocal` hereda `motivo_cancelacion: null` de `base`; el test `'reserva del local: los cambios le llegan al cliente, nunca al admin'` agrega motivo a su `cancelada`: `{ ...delLocal, estado: 'cancelada' as const, cancelada_por: 'admin' as const, motivo_cancelacion: 'Evento privado' }`.

- [ ] **Step 2: Correrlos y verificar que fallan**

Run: `docker run --rm -v "$PWD/supabase/functions/notificar-reserva:/app" -w /app denoland/deno test mensajes.test.ts`
Expected: FAIL (tipos y reglas viejas).

- [ ] **Step 3: Implementar**

En `mensajes.ts`, el tipo `Reserva`:

```ts
  estado: 'esperando_pago' | 'pendiente' | 'confirmada' | 'rechazada' | 'cancelada' | 'vencida';
  cancelada_por: 'cliente' | 'admin' | null;
  // Lo escribe el admin al cancelar; le llega al cliente
  motivo_cancelacion: string | null;
```

Y reemplazar `mensajesWeb` por:

```ts
function mensajesWeb(aviso: Aviso, sitio: string, delLocal = false): Mensaje[] {
  const { tipo, reserva: r, anterior: a } = aviso;
  const pagina = (titulo: string, cuerpo: string) => plantilla(titulo, cuerpo, sitio, delLocal);

  // Una reserva de la web nace esperando el pago: nadie se entera hasta que se paga
  if (tipo === 'INSERT' || !a) return [];

  if (r.estado !== a.estado) {
    // Vencida o abandonada antes de pagar: no hubo reserva de verdad
    if (r.estado === 'vencida' || (a.estado === 'esperando_pago' && r.estado === 'cancelada')) return [];

    if (r.estado === 'confirmada') {
      const cliente: Mensaje = { para: 'cliente', asunto: 'Tu reserva en La Posta está confirmada',
        html: pagina('¡Te esperamos!', detalle(r)) };
      if (a.estado !== 'esperando_pago') return [cliente];
      return [cliente, {
        para: 'admin',
        asunto: `Nueva reserva — ${formatearCuando(r.fecha, r.hora)}`,
        html: pagina('Entró una reserva nueva, con la seña paga', `${detalle(r)}
          <p>La ves en el <a href="${sitio}/admin">panel</a>.</p>`),
      }];
    }
    if (r.estado === 'rechazada') {
      return [{ para: 'cliente', asunto: 'No pudimos confirmar tu reserva',
        html: pagina('No pudimos confirmar tu reserva',
          `${detalle(r)}<p>Escribinos por WhatsApp y buscamos otro horario.</p>`) }];
    }
    if (r.estado === 'cancelada') {
      if (r.cancelada_por === 'cliente') {
        return [{ para: 'admin', asunto: `Un cliente canceló — ${formatearCuando(r.fecha, r.hora)}`,
          html: pagina('Se canceló una reserva', detalle(r)) }];
      }
      const motivo = r.motivo_cancelacion ? `<p>Motivo: ${escapar(r.motivo_cancelacion)}</p>` : '';
      const reintegro = r.origen === 'web'
        ? '<p>Te reintegramos la seña completa en el mismo medio de pago.</p>' : '';
      return [{ para: 'cliente', asunto: 'Tu reserva en La Posta fue cancelada',
        html: pagina('Cancelamos tu reserva',
          `${detalle(r)}${motivo}${reintegro}<p>Si tenés dudas, escribinos por WhatsApp.</p>`) }];
    }
    return [];
  }

  if (r.fecha !== a.fecha || r.hora !== a.hora) {
    return [{ para: 'cliente', asunto: 'Cambiamos el horario de tu reserva',
      html: pagina('Tu reserva tiene un nuevo horario',
        `${detalle(r)}<p>Antes era el ${formatearCuando(a.fecha, a.hora)}.</p>`) }];
  }

  return [];
}
```

El test busca `'reintegramos la seña'`: el texto de arriba lo contiene ("Te reintegramos la seña completa…").

- [ ] **Step 4: Correr los tests**

Run: `docker run --rm -v "$PWD/supabase/functions/notificar-reserva:/app" -w /app denoland/deno test mensajes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/notificar-reserva/mensajes.ts supabase/functions/notificar-reserva/mensajes.test.ts
git commit -m "feat: emails follow the deposit flow and carry the cancel reason

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Servidor — dependencias, respuestas y esquemas

**Files:**
- Modify: `package.json`, `package-lock.json`
- Modify: `.env.example`
- Create: `src/servidor/respuestas.js`, `src/servidor/respuestas.test.js`
- Create: `src/servidor/esquemas.js`, `src/servidor/esquemas.test.js`

**Interfaces:**
- Produces: `class ErrorHttp(status: number, mensaje: string)`; `json(cuerpo, status = 200): Response`; `manejar(handler) → (pedido, contexto) => Promise<Response>`; `esquemaPago` (`{ reservaId: uuid }`); `esquemaCancelacion` (`{ motivo?: string ≤ 120 }`); `esquemaId` (uuid); `leerCuerpo(pedido: Request, esquema) → Promise<datos>` (body vacío = `{}`; JSON roto o inválido → `ErrorHttp(400)`).

- [ ] **Step 1: Pedir autorización e instalar**

Mostrar al usuario: `mercadopago` (no instalado → 3.6.1) y `zod` (no instalado → 4.6.7), archivos que cambian: `package.json`, `package-lock.json`. Con su OK:

Run: `npm install mercadopago@3.6.1 zod@4.6.7`
Expected: sin errores; las dos en `dependencies`.

- [ ] **Step 2: Variables de ejemplo**

Agregar a `.env.example`:

```bash
# Mercado Pago (solo servidor). Credenciales de PRUEBA del vendedor de prueba (APP_USR-...).
MP_ACCESS_TOKEN=
# Panel de Mercado Pago (como vendedor de prueba) → Webhooks → clave secreta
MP_WEBHOOK_SECRET=
# Supabase → Settings → API Keys → secret key. Solo servidor: se saltea la RLS.
SUPABASE_SECRET_KEY=
# URL pública del sitio, sin barra final (en local: http://localhost:3000)
APP_URL=
```

- [ ] **Step 3: Escribir los tests que fallan**

Crear `src/servidor/respuestas.test.js`:

```js
// node --test "src/**/*.test.js"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ErrorHttp, manejar } from './respuestas.js';

test('un ErrorHttp se responde con su código y su mensaje', async () => {
  const handler = manejar(async () => {
    throw new ErrorHttp(409, 'Esa reserva ya no está esperando el pago.');
  });
  const respuesta = await handler(new Request('http://x/'));
  assert.equal(respuesta.status, 409);
  assert.deepEqual(await respuesta.json(), { error: 'Esa reserva ya no está esperando el pago.' });
});

test('cualquier otro error es un 500 que no muestra detalles internos', async (t) => {
  t.mock.method(console, 'error', () => {});
  const handler = manejar(async () => {
    throw new Error('relation "pagos" does not exist');
  });
  const respuesta = await handler(new Request('http://x/'));
  assert.equal(respuesta.status, 500);
  const { error } = await respuesta.json();
  assert.equal(error.includes('pagos'), false);
});
```

Crear `src/servidor/esquemas.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esquemaCancelacion, esquemaPago, leerCuerpo } from './esquemas.js';
import { ErrorHttp } from './respuestas.js';

const pedido = (cuerpo) => new Request('http://x/', { method: 'POST', body: cuerpo });
const ID = '7f9c2b1e-4a3d-4c5e-9f1a-2b3c4d5e6f70';

test('acepta un id de reserva válido', async () => {
  assert.deepEqual(await leerCuerpo(pedido(JSON.stringify({ reservaId: ID })), esquemaPago), { reservaId: ID });
});

test('rechaza con 400 un id que no es UUID', async () => {
  await assert.rejects(leerCuerpo(pedido(JSON.stringify({ reservaId: '1' })), esquemaPago),
    (e) => e instanceof ErrorHttp && e.status === 400);
});

test('rechaza con 400 un cuerpo que no es JSON', async () => {
  await assert.rejects(leerCuerpo(pedido('{nope'), esquemaPago),
    (e) => e instanceof ErrorHttp && e.status === 400);
});

test('un cuerpo vacío vale como {} (el cliente cancela sin motivo)', async () => {
  assert.deepEqual(await leerCuerpo(pedido(''), esquemaCancelacion), {});
});

test('el motivo se recorta y tiene hasta 120 caracteres', async () => {
  assert.deepEqual(await leerCuerpo(pedido(JSON.stringify({ motivo: '  No hay lugar ' })), esquemaCancelacion),
    { motivo: 'No hay lugar' });
  await assert.rejects(leerCuerpo(pedido(JSON.stringify({ motivo: 'x'.repeat(121) })), esquemaCancelacion),
    (e) => e.status === 400);
});
```

- [ ] **Step 4: Correrlos y verificar que fallan**

Run: `npm test`
Expected: FAIL ("Cannot find module './respuestas.js'").

- [ ] **Step 5: Implementar**

Crear `src/servidor/respuestas.js`:

```js
// Respuestas de las rutas de la API (clase 10): JSON con un mensaje para el
// usuario y el código HTTP que corresponde. Los detalles internos van al log
// del servidor; nunca un stack trace al cliente.

export class ErrorHttp extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

export const json = (cuerpo, status = 200) => Response.json(cuerpo, { status });

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
```

Crear `src/servidor/esquemas.js`:

```js
// Validación de lo que llega a las rutas (clase 10: nunca confiar en el
// cliente). Si no cumple el esquema, 400 con los campos que fallaron.

import { z } from 'zod';
import { ErrorHttp } from './respuestas.js';

export const esquemaId = z.uuid();

export const esquemaPago = z.object({ reservaId: z.uuid() });

// Mismo límite que LIMITES.motivo y que el check de la base
export const esquemaCancelacion = z.object({ motivo: z.string().trim().max(120).optional() });

export async function leerCuerpo(pedido, esquema) {
  const texto = await pedido.text();
  let datos = {};
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      throw new ErrorHttp(400, 'El cuerpo del pedido tiene que ser JSON.');
    }
  }
  const resultado = esquema.safeParse(datos);
  if (!resultado.success) {
    const campos = resultado.error.issues.map((problema) => problema.path.join('.') || 'cuerpo');
    throw new ErrorHttp(400, `Datos inválidos: ${[...new Set(campos)].join(', ')}.`);
  }
  return resultado.data;
}
```

- [ ] **Step 6: Correr los tests**

Run: `npm test`
Expected: PASS (los 23 de antes + 7 nuevos).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .env.example src/servidor/respuestas.js src/servidor/respuestas.test.js src/servidor/esquemas.js src/servidor/esquemas.test.js
git commit -m "feat: server error responses and request schemas

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Servidor — firma del webhook

**Files:**
- Create: `src/servidor/firma.js`, `src/servidor/firma.test.js`

**Interfaces:**
- Produces: `validarFirma({ firma: string|null, idPedido: string|null, idDato: string|null, secreto: string|undefined }) → boolean`.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/servidor/firma.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { validarFirma } from './firma.js';

const SECRETO = 'secreto-de-prueba';
// Como firma Mercado Pago: HMAC-SHA256 de "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
const firmar = ({ idDato, idPedido, ts }, secreto = SECRETO) =>
  `ts=${ts},v1=${createHmac('sha256', secreto).update(`id:${idDato};request-id:${idPedido};ts:${ts};`).digest('hex')}`;

const aviso = { idDato: '123456789', idPedido: 'req-1', ts: '1760550000' };

test('acepta una firma válida', () => {
  assert.equal(validarFirma({ firma: firmar(aviso), idPedido: aviso.idPedido, idDato: aviso.idDato, secreto: SECRETO }), true);
});

test('rechaza si cambió el id del pago', () => {
  assert.equal(validarFirma({ firma: firmar(aviso), idPedido: aviso.idPedido, idDato: '999', secreto: SECRETO }), false);
});

test('rechaza una firma hecha con otro secreto', () => {
  assert.equal(validarFirma({ firma: firmar(aviso, 'otro'), idPedido: aviso.idPedido, idDato: aviso.idDato, secreto: SECRETO }), false);
});

test('rechaza cabeceras faltantes o mal formadas', () => {
  for (const firma of [null, '', 'v1=abc', 'ts=1,v1=no-es-hex']) {
    assert.equal(validarFirma({ firma, idPedido: aviso.idPedido, idDato: aviso.idDato, secreto: SECRETO }), false);
  }
  assert.equal(validarFirma({ firma: firmar(aviso), idPedido: aviso.idPedido, idDato: aviso.idDato, secreto: '' }), false);
});

test('un id alfanumérico se firma en minúsculas', () => {
  const conLetras = { ...aviso, idDato: 'abc123' };
  assert.equal(validarFirma({ firma: firmar(conLetras), idPedido: aviso.idPedido, idDato: 'ABC123', secreto: SECRETO }), true);
});
```

- [ ] **Step 2: Correrlo y verificar que falla**

Run: `npm test`
Expected: FAIL ("Cannot find module './firma.js'").

- [ ] **Step 3: Implementar**

Crear `src/servidor/firma.js`:

```js
// Validación de la firma de los webhooks de Mercado Pago (clase 11: sin esto,
// cualquiera podría mandar avisos falsos y confirmar reservas sin pagar).
//
// x-signature trae "ts=<timestamp>,v1=<hmac>". El HMAC-SHA256, con la clave
// secreta del panel, es del manifiesto "id:<data.id>;request-id:<x-request-id>;ts:<ts>;".

import { createHmac, timingSafeEqual } from 'node:crypto';

export function validarFirma({ firma, idPedido, idDato, secreto }) {
  if (!firma || !idPedido || !idDato || !secreto) return false;

  const partes = Object.fromEntries(
    firma.split(',').map((parte) => parte.split('=').map((texto) => texto.trim()))
  );
  const { ts, v1 } = partes;
  if (!ts || !v1 || !/^[0-9a-f]{64}$/i.test(v1)) return false;

  // Si el id es alfanumérico, Mercado Pago lo firma en minúsculas
  const manifiesto = `id:${String(idDato).toLowerCase()};request-id:${idPedido};ts:${ts};`;
  const esperada = createHmac('sha256', secreto).update(manifiesto).digest();
  return timingSafeEqual(esperada, Buffer.from(v1, 'hex'));
}
```

- [ ] **Step 4: Correr los tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/servidor/firma.js src/servidor/firma.test.js
git commit -m "feat: validate Mercado Pago webhook signatures

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Servidor — preferencia, inicio del pago y aviso de pago

**Files:**
- Create: `src/servidor/preferencia.js`, `src/servidor/preferencia.test.js`
- Create: `src/servidor/pagos.js`, `src/servidor/pagos.test.js`
- Create: `src/servidor/reintegros.js`
- Create: `src/servidor/avisos.js`, `src/servidor/avisos.test.js`

**Interfaces:**
- Consumes: `ErrorHttp` (Task 5).
- Produces:
  - `MINUTOS_PARA_PAGAR = 15`; `venceLaReserva(creadaEn: string) → Date`; `esUrlPublica(url) → boolean`; `armarPreferencia({ pago: { id, monto }, reserva: { id, fecha, hora, creada_en }, nombreLocal, appUrl }) → body`.
  - `iniciarPagoDeSena({ reservaId, usuarioId }, { base, mp, appUrl, ahora? }) → Promise<{ initPoint }>`; usa `base.leerReserva(id) → { id, usuario_id, estado, fecha, hora, creada_en, locales: { nombre, sena } } | null`, `base.crearPago({ reservaId, monto }) → { id, monto }`, `base.guardarPreferencia(idPago, idPreferencia)`, `mp.crearPreferencia(body) → { id, init_point }`.
  - `reintegrarPago({ id, mp_payment_id }, { base, mp })`; usa `mp.reintegrar(idPagoMp, claveIdempotencia)` y `base.marcarReintegrado(idPago)`.
  - `procesarAvisoDePago(idPagoMp, { base, mp }) → Promise<'ignorado'|'aprobado'|'rechazado'|'reintegro_pendiente'|'reintegrado'|'iniciado'>`; usa `mp.obtenerPago(id) → { id, status, external_reference }`, `base.leerPago(id) → { id } | null`, `base.acreditarPago(idPago, idPagoMp, estadoMp) → string`.

- [ ] **Step 1: Escribir los tests que fallan**

Crear `src/servidor/preferencia.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { armarPreferencia, esUrlPublica, venceLaReserva } from './preferencia.js';

const datos = {
  pago: { id: 'p-1', monto: '10000.00' },
  reserva: { id: 'r-1', fecha: '2026-10-18', hora: '20:30:00', creada_en: '2026-10-15T20:00:00.000Z' },
  nombreLocal: 'La Posta Parrilla',
};

test('el monto sale del pago (de la base) y es un número', () => {
  const [item] = armarPreferencia({ ...datos, appUrl: 'https://lapostaparrilla.vercel.app' }).items;
  assert.equal(item.unit_price, 10000);
  assert.equal(item.quantity, 1);
  assert.equal(item.currency_id, 'ARS');
  assert.equal(item.title, 'Seña reserva La Posta Parrilla · 18/10 20:30');
});

test('external_reference es el id del pago', () => {
  assert.equal(armarPreferencia({ ...datos, appUrl: 'https://x.vercel.app' }).external_reference, 'p-1');
});

test('con URL pública: auto_return, webhook y vuelta a /reservas/pago', () => {
  const p = armarPreferencia({ ...datos, appUrl: 'https://x.vercel.app' });
  assert.equal(p.auto_return, 'approved');
  assert.equal(p.notification_url, 'https://x.vercel.app/api/webhooks/mercadopago');
  assert.equal(p.back_urls.success, 'https://x.vercel.app/reservas/pago?reserva=r-1');
});

test('en localhost: sin auto_return ni notification_url (Mercado Pago los rechaza)', () => {
  const p = armarPreferencia({ ...datos, appUrl: 'http://localhost:3000' });
  assert.equal('auto_return' in p, false);
  assert.equal('notification_url' in p, false);
  assert.equal(p.back_urls.failure, 'http://localhost:3000/reservas/pago?reserva=r-1');
});

test('la preferencia vence junto con la reserva, a los 15 minutos', () => {
  const p = armarPreferencia({ ...datos, appUrl: 'https://x.vercel.app' });
  assert.equal(p.expires, true);
  assert.equal(p.expiration_date_to, '2026-10-15T20:15:00.000Z');
  assert.equal(venceLaReserva('2026-10-15T20:00:00.000Z').toISOString(), '2026-10-15T20:15:00.000Z');
});

test('URL pública: HTTPS y no local', () => {
  assert.equal(esUrlPublica('https://lapostaparrilla.vercel.app'), true);
  assert.equal(esUrlPublica('http://lapostaparrilla.vercel.app'), false);
  assert.equal(esUrlPublica('https://localhost:3000'), false);
  assert.equal(esUrlPublica(undefined), false);
});
```

Crear `src/servidor/pagos.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarPagoDeSena } from './pagos.js';

const AHORA = new Date('2026-10-15T20:05:00.000Z');
const reserva = {
  id: 'r-1', usuario_id: 'u-1', estado: 'esperando_pago', fecha: '2026-10-18', hora: '20:30:00',
  creada_en: '2026-10-15T20:00:00.000Z', locales: { nombre: 'La Posta Parrilla', sena: '10000.00' },
};

function falsos(cambios = {}) {
  const llamadas = [];
  const base = {
    leerReserva: async () => ({ ...reserva, ...cambios }),
    crearPago: async (datos) => { llamadas.push(['crearPago', datos]); return { id: 'p-1', monto: datos.monto }; },
    guardarPreferencia: async (...args) => llamadas.push(['guardarPreferencia', ...args]),
  };
  const mp = {
    crearPreferencia: async (body) => { llamadas.push(['crearPreferencia', body]); return { id: 'pref-1', init_point: 'https://mp/pagar' }; },
  };
  return { base, mp, llamadas, appUrl: 'https://x.vercel.app', ahora: AHORA };
}

test('crea el pago con el monto de la base y devuelve el init_point', async () => {
  const deps = falsos();
  assert.deepEqual(await iniciarPagoDeSena({ reservaId: 'r-1', usuarioId: 'u-1' }, deps), { initPoint: 'https://mp/pagar' });
  assert.deepEqual(deps.llamadas[0], ['crearPago', { reservaId: 'r-1', monto: '10000.00' }]);
  assert.equal(deps.llamadas[1][1].external_reference, 'p-1');
  assert.deepEqual(deps.llamadas[2], ['guardarPreferencia', 'p-1', 'pref-1']);
});

test('una reserva ajena es un 404', async () => {
  await assert.rejects(iniciarPagoDeSena({ reservaId: 'r-1', usuarioId: 'otro' }, falsos()), (e) => e.status === 404);
});

test('una reserva que no espera el pago es un 409', async () => {
  await assert.rejects(iniciarPagoDeSena({ reservaId: 'r-1', usuarioId: 'u-1' }, falsos({ estado: 'confirmada' })),
    (e) => e.status === 409);
});

test('pasados los 15 minutos es un 409, aunque pg_cron todavía no la haya vencido', async () => {
  const deps = { ...falsos(), ahora: new Date('2026-10-15T20:15:01.000Z') };
  await assert.rejects(iniciarPagoDeSena({ reservaId: 'r-1', usuarioId: 'u-1' }, deps), (e) => e.status === 409);
});
```

Crear `src/servidor/avisos.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { procesarAvisoDePago } from './avisos.js';

const ID_PAGO = '7f9c2b1e-4a3d-4c5e-9f1a-2b3c4d5e6f70';

function falsos({ pagoMp, estadoFinal = 'aprobado', existe = true }) {
  const llamadas = [];
  return {
    llamadas,
    mp: {
      obtenerPago: async () => pagoMp,
      reintegrar: async (...args) => llamadas.push(['reintegrar', ...args]),
    },
    base: {
      leerPago: async () => (existe ? { id: ID_PAGO } : null),
      acreditarPago: async (...args) => { llamadas.push(['acreditar', ...args]); return estadoFinal; },
      marcarReintegrado: async (id) => llamadas.push(['marcarReintegrado', id]),
    },
  };
}

test('acredita con el estado real que devuelve Mercado Pago', async () => {
  const deps = falsos({ pagoMp: { id: 555, status: 'approved', external_reference: ID_PAGO } });
  assert.equal(await procesarAvisoDePago('555', deps), 'aprobado');
  assert.deepEqual(deps.llamadas, [['acreditar', ID_PAGO, '555', 'approved']]);
});

test('un pago tardío queda reintegrado en el momento', async () => {
  const deps = falsos({ pagoMp: { id: 555, status: 'approved', external_reference: ID_PAGO }, estadoFinal: 'reintegro_pendiente' });
  assert.equal(await procesarAvisoDePago('555', deps), 'reintegrado');
  assert.deepEqual(deps.llamadas.slice(1), [['reintegrar', '555', `reintegro-${ID_PAGO}`], ['marcarReintegrado', ID_PAGO]]);
});

test('un pago que no salió de este sitio se ignora (sin 500, para que no reintente)', async () => {
  for (const external_reference of [undefined, '', 'pedido-42']) {
    const deps = falsos({ pagoMp: { id: 1, status: 'approved', external_reference } });
    assert.equal(await procesarAvisoDePago('1', deps), 'ignorado');
    assert.equal(deps.llamadas.length, 0);
  }
  const desconocido = falsos({ pagoMp: { id: 1, status: 'approved', external_reference: ID_PAGO }, existe: false });
  assert.equal(await procesarAvisoDePago('1', desconocido), 'ignorado');
});
```

- [ ] **Step 2: Correrlos y verificar que fallan**

Run: `npm test`
Expected: FAIL (módulos inexistentes).

- [ ] **Step 3: Implementar**

Crear `src/servidor/preferencia.js`:

```js
// Cuerpo de la preferencia de Checkout Pro para la seña (clase 11: items,
// back_urls, external_reference). Función pura: no habla con Mercado Pago.

export const MINUTOS_PARA_PAGAR = 15;

export const venceLaReserva = (creadaEn) =>
  new Date(new Date(creadaEn).getTime() + MINUTOS_PARA_PAGAR * 60 * 1000);

// Mercado Pago rechaza auto_return y notification_url con URLs locales
export function esUrlPublica(url) {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && !['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname);
  } catch {
    return false;
  }
}

// "2026-10-18" + "20:30:00" → "18/10 20:30"
const cuando = (fecha, hora) => `${fecha.slice(8, 10)}/${fecha.slice(5, 7)} ${hora.slice(0, 5)}`;

export function armarPreferencia({ pago, reserva, nombreLocal, appUrl }) {
  const vuelta = `${appUrl}/reservas/pago?reserva=${reserva.id}`;
  const publica = esUrlPublica(appUrl);
  return {
    items: [{
      id: `sena-${reserva.id}`,
      title: `Seña reserva ${nombreLocal} · ${cuando(reserva.fecha, reserva.hora)}`,
      quantity: 1,
      unit_price: Number(pago.monto),
      currency_id: 'ARS',
    }],
    external_reference: pago.id,
    back_urls: { success: vuelta, pending: vuelta, failure: vuelta },
    ...(publica ? { auto_return: 'approved', notification_url: `${appUrl}/api/webhooks/mercadopago` } : {}),
    expires: true,
    expiration_date_to: venceLaReserva(reserva.creada_en).toISOString(),
    statement_descriptor: 'LA POSTA',
  };
}
```

Crear `src/servidor/pagos.js`:

```js
// Inicio del pago de la seña: valida la reserva, crea el pago y la
// preferencia. Recibe la base y Mercado Pago por parámetro (ver base.js y
// mercadopago.js), así se testea sin red.

import { ErrorHttp } from './respuestas.js';
import { armarPreferencia, venceLaReserva } from './preferencia.js';

export async function iniciarPagoDeSena({ reservaId, usuarioId }, { base, mp, appUrl, ahora = new Date() }) {
  const reserva = await base.leerReserva(reservaId);
  if (!reserva || reserva.usuario_id !== usuarioId) {
    throw new ErrorHttp(404, 'No encontramos esa reserva.');
  }
  if (reserva.estado !== 'esperando_pago') {
    throw new ErrorHttp(409, 'Esa reserva ya no está esperando el pago.');
  }
  if (venceLaReserva(reserva.creada_en) <= ahora) {
    throw new ErrorHttp(409, 'Se venció el plazo para pagar la seña. Hacé la reserva de nuevo.');
  }

  // El monto sale de la base, nunca del navegador
  const pago = await base.crearPago({ reservaId, monto: reserva.locales.sena });
  const preferencia = await mp.crearPreferencia(
    armarPreferencia({ pago, reserva, nombreLocal: reserva.locales.nombre, appUrl })
  );
  await base.guardarPreferencia(pago.id, preferencia.id);
  return { initPoint: preferencia.init_point };
}
```

Crear `src/servidor/reintegros.js`:

```js
// Reembolso total de una seña en Mercado Pago. La clave de idempotencia es el
// id del pago: si se reintenta, Mercado Pago no devuelve dos veces.
export async function reintegrarPago(pago, { base, mp }) {
  await mp.reintegrar(pago.mp_payment_id, `reintegro-${pago.id}`);
  await base.marcarReintegrado(pago.id);
}
```

Crear `src/servidor/avisos.js`:

```js
// Aviso de pago de Mercado Pago, con la firma ya validada. El cuerpo del
// aviso no se usa: el estado real sale de GET /v1/payments/:id (clase 11).

import { reintegrarPago } from './reintegros.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function procesarAvisoDePago(idPagoMp, { base, mp }) {
  const pagoMp = await mp.obtenerPago(idPagoMp);
  const idPago = pagoMp.external_reference;

  // Pagos que no salieron de este sitio: se responde 200 igual, para que
  // Mercado Pago no los reintente durante horas
  if (!idPago || !UUID.test(idPago) || !(await base.leerPago(idPago))) return 'ignorado';

  const estado = await base.acreditarPago(idPago, String(pagoMp.id), pagoMp.status);
  if (estado !== 'reintegro_pendiente') return estado;

  await reintegrarPago({ id: idPago, mp_payment_id: String(pagoMp.id) }, { base, mp });
  return 'reintegrado';
}
```

- [ ] **Step 4: Correr los tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/servidor/preferencia.js src/servidor/preferencia.test.js src/servidor/pagos.js src/servidor/pagos.test.js src/servidor/reintegros.js src/servidor/avisos.js src/servidor/avisos.test.js
git commit -m "feat: build the deposit preference and process payment notices

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Servidor — cancelación con reintegro

**Files:**
- Create: `src/servidor/cancelaciones.js`, `src/servidor/cancelaciones.test.js`

**Interfaces:**
- Consumes: `ErrorHttp` (Task 5), `reintegrarPago` (Task 7).
- Produces: `cancelarReserva({ reservaId, motivo }, { usuario, base, mp }) → Promise<{ reintegro: 'no_corresponde'|'hecho'|'pendiente' }>`; usa `usuario.leerReserva(id) → { id, estado } | null` (con la RLS del que llama), `usuario.cancelar(id, motivo)` (lanza `ErrorHttp(409)` con el mensaje de la base), `base.pagoAReintegrar(reservaId) → { id, mp_payment_id } | null`.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/servidor/cancelaciones.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cancelarReserva } from './cancelaciones.js';
import { ErrorHttp } from './respuestas.js';

function falsos({ reserva = { id: 'r-1', estado: 'confirmada' }, pago = { id: 'p-1', mp_payment_id: '555' }, fallaMp = false } = {}) {
  const llamadas = [];
  return {
    llamadas,
    usuario: {
      leerReserva: async () => reserva,
      cancelar: async (...args) => llamadas.push(['cancelar', ...args]),
    },
    base: {
      pagoAReintegrar: async () => pago,
      marcarReintegrado: async (id) => llamadas.push(['marcarReintegrado', id]),
    },
    mp: {
      reintegrar: async (...args) => {
        if (fallaMp) throw new Error('MP caído');
        llamadas.push(['reintegrar', ...args]);
      },
    },
  };
}

test('cancela y reintegra la seña', async () => {
  const deps = falsos();
  assert.deepEqual(await cancelarReserva({ reservaId: 'r-1', motivo: 'No hay lugar' }, deps), { reintegro: 'hecho' });
  assert.deepEqual(deps.llamadas, [
    ['cancelar', 'r-1', 'No hay lugar'], ['reintegrar', '555', 'reintegro-p-1'], ['marcarReintegrado', 'p-1'],
  ]);
});

test('sin seña cobrada no hay reintegro', async () => {
  assert.deepEqual(await cancelarReserva({ reservaId: 'r-1' }, falsos({ pago: null })), { reintegro: 'no_corresponde' });
});

test('si el reembolso falla, la cancelación queda hecha y el reintegro pendiente', async (t) => {
  t.mock.method(console, 'error', () => {});
  const deps = falsos({ fallaMp: true });
  assert.deepEqual(await cancelarReserva({ reservaId: 'r-1' }, deps), { reintegro: 'pendiente' });
  assert.deepEqual(deps.llamadas, [['cancelar', 'r-1', undefined]]);
});

test('una reserva ya cancelada con reintegro pendiente solo reintenta el reembolso', async () => {
  const deps = falsos({ reserva: { id: 'r-1', estado: 'cancelada' } });
  assert.deepEqual(await cancelarReserva({ reservaId: 'r-1' }, deps), { reintegro: 'hecho' });
  assert.equal(deps.llamadas.some(([nombre]) => nombre === 'cancelar'), false);
});

test('una reserva que el usuario no ve es un 404', async () => {
  await assert.rejects(cancelarReserva({ reservaId: 'r-1' }, falsos({ reserva: null })),
    (e) => e instanceof ErrorHttp && e.status === 404);
});
```

- [ ] **Step 2: Correrlo y verificar que falla**

Run: `npm test`
Expected: FAIL ("Cannot find module './cancelaciones.js'").

- [ ] **Step 3: Implementar**

Crear `src/servidor/cancelaciones.js`:

```js
// Cancelar una reserva (cliente o admin) y reintegrar la seña. La cancelación
// la hace la base con la sesión del que llama, así siguen valiendo sus reglas
// (1 hora, permisos, motivo del admin). El trigger marcar_reintegro deja el
// pago para reintegrar; acá se hace el reembolso.

import { ErrorHttp } from './respuestas.js';
import { reintegrarPago } from './reintegros.js';

const ACTIVAS = ['esperando_pago', 'pendiente', 'confirmada'];

export async function cancelarReserva({ reservaId, motivo }, { usuario, base, mp }) {
  const reserva = await usuario.leerReserva(reservaId);
  if (!reserva) throw new ErrorHttp(404, 'No encontramos esa reserva.');

  // Ya cancelada: solo se reintenta el reintegro (botón del panel)
  if (ACTIVAS.includes(reserva.estado)) await usuario.cancelar(reservaId, motivo);

  const pago = await base.pagoAReintegrar(reservaId);
  if (!pago) return { reintegro: 'no_corresponde' };

  try {
    await reintegrarPago(pago, { base, mp });
    return { reintegro: 'hecho' };
  } catch (error) {
    // La cancelación ya quedó hecha; el panel muestra el reintegro pendiente
    console.error('Falló el reintegro de la seña', pago.id, error);
    return { reintegro: 'pendiente' };
  }
}
```

- [ ] **Step 4: Correr los tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/servidor/cancelaciones.js src/servidor/cancelaciones.test.js
git commit -m "feat: cancel a reservation and refund its deposit

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Rutas de la API y adaptadores

**Files:**
- Create: `src/servidor/supabase.js`, `src/servidor/base.js`, `src/servidor/mercadopago.js`
- Create: `app/api/v1/pagos/route.js`
- Create: `app/api/webhooks/mercadopago/route.js`
- Create: `app/api/v1/reservas/[id]/cancelacion/route.js`
- Modify: `LaPostaParrilla/.env.local` (lo completa el usuario: `SUPABASE_SECRET_KEY` local)

**Interfaces:**
- Consumes: todo lo de Tasks 5–8.
- Produces: `clienteSecreto()`; `usuarioDelPedido(pedido) → { id, leerReserva, cancelar }`; `crearBase(cliente?)` con `leerReserva`, `crearPago`, `guardarPreferencia`, `leerPago`, `acreditarPago`, `pagoAReintegrar`, `marcarReintegrado`; `crearMercadoPago(accessToken?)` con `crearPreferencia`, `obtenerPago`, `reintegrar`; rutas `POST /api/v1/pagos` → 201 `{ initPoint }`, `POST /api/webhooks/mercadopago` → 200 `{ ok, estado }` / 401, `POST /api/v1/reservas/:id/cancelacion` → 200 `{ reintegro }`.

- [ ] **Step 1: Verificar la firma del SDK para reembolsos**

Run: `grep -rn "create" node_modules/mercadopago/dist/clients/paymentRefund/index.d.ts`
Expected: un método `create({ payment_id, body, requestOptions })`. Si la firma es otra, ajustar `reintegrar` en el paso 3 a lo que diga ese archivo.

- [ ] **Step 2: Clientes de Supabase del servidor**

Crear `src/servidor/supabase.js`:

```js
// Supabase desde el servidor (Route Handlers). Excepción documentada a "todo
// pasa por src/servicios/": esto nunca llega al navegador.
//
// clienteSecreto: con SUPABASE_SECRET_KEY, se saltea la RLS. Solo para pagos.
// usuarioDelPedido: con el token del que llama, así la base aplica sus reglas.

import { createClient } from '@supabase/supabase-js';
import { ErrorHttp } from './respuestas.js';

const SIN_SESION = { auth: { persistSession: false, autoRefreshToken: false } };

export function clienteSecreto() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.SUPABASE_SECRET_KEY;
  if (!url || !clave) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY');
  return createClient(url, clave, SIN_SESION);
}

export async function usuarioDelPedido(pedido) {
  const token = pedido.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new ErrorHttp(401, 'Ingresá con tu cuenta para continuar.');

  const cliente = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    ...SIN_SESION,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await cliente.auth.getUser(token);
  if (error || !data.user) throw new ErrorHttp(401, 'Tu sesión venció. Ingresá de nuevo.');

  return {
    id: data.user.id,
    async leerReserva(id) {
      const { data: reserva, error: e } = await cliente.from('reservas').select('id, estado').eq('id', id).maybeSingle();
      if (e) throw new Error(e.message);
      return reserva;
    },
    async cancelar(id, motivo) {
      const { error: e } = await cliente.rpc('cancelar_reserva', { p_id: id, p_motivo: motivo ?? null });
      // Las reglas de la base (P0001) ya vienen en castellano
      if (e) throw e.code === 'P0001' ? new ErrorHttp(409, e.message) : new Error(e.message);
    },
  };
}
```

- [ ] **Step 3: Adaptadores de la base y de Mercado Pago**

Crear `src/servidor/base.js`:

```js
// La base vista desde la lógica de pagos (pagos.js, avisos.js,
// cancelaciones.js). Usa la clave secreta: la tabla pagos no se escribe
// desde el navegador.

import { clienteSecreto } from './supabase.js';

const dato = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};
const ahora = () => new Date().toISOString();

export function crearBase(cliente = clienteSecreto()) {
  return {
    leerReserva: async (id) =>
      dato(await cliente.from('reservas')
        .select('id, usuario_id, estado, fecha, hora, creada_en, locales(nombre, sena)')
        .eq('id', id).maybeSingle()),
    crearPago: async ({ reservaId, monto }) =>
      dato(await cliente.from('pagos').insert({ reserva_id: reservaId, monto }).select('id, monto').single()),
    guardarPreferencia: async (idPago, idPreferencia) =>
      dato(await cliente.from('pagos').update({ mp_preference_id: idPreferencia, actualizado_en: ahora() }).eq('id', idPago)),
    leerPago: async (id) =>
      dato(await cliente.from('pagos').select('id').eq('id', id).maybeSingle()),
    acreditarPago: async (idPago, idPagoMp, estadoMp) =>
      dato(await cliente.rpc('acreditar_pago', { p_pago_id: idPago, p_mp_payment_id: idPagoMp, p_estado_mp: estadoMp })),
    pagoAReintegrar: async (reservaId) =>
      dato(await cliente.from('pagos').select('id, mp_payment_id')
        .eq('reserva_id', reservaId).eq('estado', 'reintegro_pendiente').maybeSingle()),
    marcarReintegrado: async (idPago) =>
      dato(await cliente.from('pagos').update({ estado: 'reintegrado', actualizado_en: ahora() })
        .eq('id', idPago).eq('estado', 'reintegro_pendiente')),
  };
}
```

Crear `src/servidor/mercadopago.js`:

```js
// SDK oficial de Mercado Pago. Con credenciales de PRUEBA (vendedor de prueba):
// no hay sandbox, la API es la real y lo que cambia son las credenciales.

import { MercadoPagoConfig, Payment, PaymentRefund, Preference } from 'mercadopago';

export function crearMercadoPago(accessToken = process.env.MP_ACCESS_TOKEN) {
  if (!accessToken) throw new Error('Falta MP_ACCESS_TOKEN');
  const cliente = new MercadoPagoConfig({ accessToken, options: { timeout: 10000 } });
  return {
    crearPreferencia: (body) => new Preference(cliente).create({ body }),
    obtenerPago: (id) => new Payment(cliente).get({ id }),
    reintegrar: (idPagoMp, claveIdempotencia) =>
      new PaymentRefund(cliente).create({
        payment_id: idPagoMp,
        body: {},
        requestOptions: { idempotencyKey: claveIdempotencia },
      }),
  };
}
```

- [ ] **Step 4: Las tres rutas**

Crear `app/api/v1/pagos/route.js`:

```js
// POST /api/v1/pagos — { reservaId } → 201 { initPoint }
// Crea la preferencia de Checkout Pro para la seña de una reserva propia.
import { json, manejar } from '../../../../src/servidor/respuestas.js';
import { esquemaPago, leerCuerpo } from '../../../../src/servidor/esquemas.js';
import { usuarioDelPedido } from '../../../../src/servidor/supabase.js';
import { crearBase } from '../../../../src/servidor/base.js';
import { crearMercadoPago } from '../../../../src/servidor/mercadopago.js';
import { iniciarPagoDeSena } from '../../../../src/servidor/pagos.js';

export const POST = manejar(async (pedido) => {
  const usuario = await usuarioDelPedido(pedido);
  const { reservaId } = await leerCuerpo(pedido, esquemaPago);
  const resultado = await iniciarPagoDeSena(
    { reservaId, usuarioId: usuario.id },
    { base: crearBase(), mp: crearMercadoPago(), appUrl: process.env.APP_URL }
  );
  return json(resultado, 201);
});
```

Crear `app/api/webhooks/mercadopago/route.js`:

```js
// POST /api/webhooks/mercadopago — avisos de Mercado Pago (clase 11):
// 1. valida la firma, 2. consulta el pago real, 3. concilia en la base.
// Responde 200 si se procesó (o no era un pago) y 401 si la firma no vale.
// Un 500 hace que Mercado Pago reintente más tarde.
import { json, manejar } from '../../../../src/servidor/respuestas.js';
import { validarFirma } from '../../../../src/servidor/firma.js';
import { crearBase } from '../../../../src/servidor/base.js';
import { crearMercadoPago } from '../../../../src/servidor/mercadopago.js';
import { procesarAvisoDePago } from '../../../../src/servidor/avisos.js';

export const POST = manejar(async (pedido) => {
  const parametros = new URL(pedido.url).searchParams;
  const idDato = parametros.get('data.id');
  const tipo = parametros.get('type') ?? parametros.get('topic');

  const firmaValida = validarFirma({
    firma: pedido.headers.get('x-signature'),
    idPedido: pedido.headers.get('x-request-id'),
    idDato,
    secreto: process.env.MP_WEBHOOK_SECRET,
  });
  if (!firmaValida) return json({ error: 'Firma inválida' }, 401);

  if (tipo !== 'payment') return json({ ok: true, estado: 'ignorado' });

  const estado = await procesarAvisoDePago(idDato, { base: crearBase(), mp: crearMercadoPago() });
  return json({ ok: true, estado });
});
```

Crear `app/api/v1/reservas/[id]/cancelacion/route.js`:

```js
// POST /api/v1/reservas/:id/cancelacion — { motivo? } → 200 { reintegro }
// La usan el cliente (Mis reservas) y el admin (panel, con motivo). También
// reintenta un reintegro pendiente de una reserva ya cancelada.
import { ErrorHttp, json, manejar } from '../../../../../../src/servidor/respuestas.js';
import { esquemaCancelacion, esquemaId, leerCuerpo } from '../../../../../../src/servidor/esquemas.js';
import { usuarioDelPedido } from '../../../../../../src/servidor/supabase.js';
import { crearBase } from '../../../../../../src/servidor/base.js';
import { crearMercadoPago } from '../../../../../../src/servidor/mercadopago.js';
import { cancelarReserva } from '../../../../../../src/servidor/cancelaciones.js';

export const POST = manejar(async (pedido, { params }) => {
  const { id } = await params;
  if (!esquemaId.safeParse(id).success) throw new ErrorHttp(400, 'Ese id de reserva no es válido.');
  const usuario = await usuarioDelPedido(pedido);
  const { motivo } = await leerCuerpo(pedido, esquemaCancelacion);
  const resultado = await cancelarReserva({ reservaId: id, motivo }, { usuario, base: crearBase(), mp: crearMercadoPago() });
  return json(resultado);
});
```

- [ ] **Step 5: Probar las rutas en local**

Pedirle al usuario que agregue a `.env.local` la `SUPABASE_SECRET_KEY` local (`npx supabase status` → "Secret key") y apunte temporalmente `NEXT_PUBLIC_SUPABASE_*` a la base local si no lo están. Levantar con `preview_start` `{ name: "dev" }`.

Run: `curl -s -X POST http://localhost:3000/api/v1/pagos -H "Content-Type: application/json" -d '{"reservaId":"x"}'`
Expected: `401` con `{"error":"Ingresá con tu cuenta para continuar."}`.

Run: `curl -s -i -X POST "http://localhost:3000/api/webhooks/mercadopago?data.id=1&type=payment"`
Expected: `401` con `{"error":"Firma inválida"}`.

Run: `curl -s -X POST http://localhost:3000/api/v1/reservas/nope/cancelacion`
Expected: `400` con `{"error":"Ese id de reserva no es válido."}`.

- [ ] **Step 6: Lint, tests y build**

Run: `npm run lint && npm test && npm run build`
Expected: sin errores; el build lista las tres rutas como dinámicas (`ƒ`) y las páginas siguen estáticas.

- [ ] **Step 7: Commit**

```bash
git add src/servidor/supabase.js src/servidor/base.js src/servidor/mercadopago.js app/api
git commit -m "feat: payments, webhook and cancellation API routes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Servicios del front

**Files:**
- Create: `src/servicios/pagos.js`
- Modify: `src/servicios/reservas.js`, `src/servicios/reservas.test.js`
- Modify: `src/servicios/admin.js`
- Modify: `src/components/EstadoReserva/EstadoReserva.module.css`

**Interfaces:**
- Produces (`pagos.js`): `iniciarPago(reservaId) → Promise<string>` (init point); `cancelarReserva(reservaId, motivo?) → Promise<{ reintegro }>`; `reintentarReintegro(reservaId) → Promise<{ reintegro }>`.
- Produces (`reservas.js`): `ESTADOS` con `esperando_pago: 'Esperando pago'` y `vencida: 'Vencida'`; `esActiva(r)` incluye `esperando_pago`; `sePuedeCancelar(r)` (sin pagar: siempre; si no, ≥ 1 hora); `MINUTOS_PARA_PAGAR = 15`; `venceElPago(r) → Date`; `puedePagar(r, ahora = Date.now()) → boolean`; `turnoDe(hora) → 'mediodia'|'noche'`; `TURNOS = { mediodia: 'Mediodía', noche: 'Noche' }`; `estadoSena(r) → 'aprobado'|'reintegro_pendiente'|'reintegrado'|null`; `ETIQUETAS_SENA`; `formatearMonto(n) → '$ 10.000'`; `obtenerSena(idLocal) → number`; `obtenerReserva(id)`; `escucharReserva(id, callback) → () => void`. Se borra `cancelarReserva` de `reservas.js` (pasa a `pagos.js`).
- Produces (`admin.js`): `listarReservas` trae `motivo_cancelacion` y `pagos(estado)`; `listarReintegrosPendientes()`; `listarBloqueos` trae `turno`; `bloquearDia({ fecha, idLocal, turno, motivo })`. Se borran `cambiarEstado` y `contarPendientes`.

- [ ] **Step 1: Escribir los tests que fallan**

Agregar a `src/servicios/reservas.test.js` (y sumar los imports `estadoSena, puedePagar, turnoDe` al import de `./reservas.js`):

```js
test('una reserva sin pagar se puede cancelar siempre', () => {
  assert.equal(sePuedeCancelar({ ...dentroDe(30), estado: 'esperando_pago' }), true);
});

test('turno: antes de las 17 es mediodía', () => {
  assert.equal(turnoDe('12:45'), 'mediodia');
  assert.equal(turnoDe('16:59:00'), 'mediodia');
  assert.equal(turnoDe('17:00'), 'noche');
  assert.equal(turnoDe('20:30:00'), 'noche');
});

test('se puede pagar la seña durante 15 minutos', () => {
  const creada = '2026-10-15T20:00:00.000Z';
  const reserva = { estado: 'esperando_pago', creada_en: creada };
  assert.equal(puedePagar(reserva, Date.parse('2026-10-15T20:14:00.000Z')), true);
  assert.equal(puedePagar(reserva, Date.parse('2026-10-15T20:15:00.000Z')), false);
  assert.equal(puedePagar({ ...reserva, estado: 'confirmada' }, Date.parse(creada)), false);
});

test('estado de la seña: el pago cobrado, si hay', () => {
  assert.equal(estadoSena({ pagos: [{ estado: 'rechazado' }, { estado: 'aprobado' }] }), 'aprobado');
  assert.equal(estadoSena({ pagos: [{ estado: 'reintegrado' }] }), 'reintegrado');
  assert.equal(estadoSena({ pagos: [{ estado: 'iniciado' }] }), null);
  assert.equal(estadoSena({}), null);
});
```

- [ ] **Step 2: Correrlos y verificar que fallan**

Run: `npm test`
Expected: FAIL (`turnoDe` no existe; `sePuedeCancelar` da `false` para `esperando_pago` a 30 minutos).

- [ ] **Step 3: Implementar `reservas.js`**

En `src/servicios/reservas.js`:
- `COLUMNAS` pasa a `'id, local_id, fecha, hora, personas, nombre, telefono, comentarios, estado, cancelada_por, motivo_cancelacion, creada_en, pagos(estado)'`.
- `obtenerDiasBloqueados` selecciona `'fecha, local_id, turno, motivo'`.
- Borrar `cancelarReserva` (se muda a `pagos.js`).
- Reemplazar `esActiva`, `sePuedeCancelar` y `ESTADOS`, y agregar lo nuevo:

```js
export const esActiva = (reserva) => ['esperando_pago', 'pendiente', 'confirmada'].includes(reserva.estado);

// Misma regla que cancelar_reserva() en la base: sin pagar, siempre; pagada,
// hasta 1 hora antes. Acá solo decide qué botón mostrar.
export const sePuedeCancelar = (reserva) =>
  esActiva(reserva) && (reserva.estado === 'esperando_pago' || faltaParaReserva(reserva) >= UNA_HORA);

// ---------- Seña ----------

// Mismo plazo que vencer_reservas_sin_pagar() y la preferencia de Mercado Pago
export const MINUTOS_PARA_PAGAR = 15;

export const venceElPago = (reserva) =>
  new Date(new Date(reserva.creada_en).getTime() + MINUTOS_PARA_PAGAR * 60 * 1000);

export const puedePagar = (reserva, ahora = Date.now()) =>
  reserva.estado === 'esperando_pago' && venceElPago(reserva).getTime() > ahora;

// El pago que cuenta es el cobrado (aprobado, a reintegrar o reintegrado)
const COBRADOS = ['aprobado', 'reintegro_pendiente', 'reintegrado'];
export const estadoSena = (reserva) =>
  (reserva.pagos ?? []).map((pago) => pago.estado).find((estado) => COBRADOS.includes(estado)) ?? null;

export const ETIQUETAS_SENA = {
  aprobado: 'Seña pagada',
  reintegro_pendiente: 'Reintegro de la seña en proceso',
  reintegrado: 'Seña reintegrada',
};

export const formatearMonto = (monto) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(monto);

export async function obtenerSena(idLocal) {
  const fila = resultado(await supabase.from('locales').select('sena').eq('id', idLocal).single());
  return Number(fila.sena);
}

export const obtenerReserva = async (id) =>
  resultado(await supabase.from('reservas').select(COLUMNAS).eq('id', id).maybeSingle());

// Avisa cuando cambia una reserva (tiempo real; la RLS deja ver solo las propias)
export function escucharReserva(id, callback) {
  const canal = supabase
    .channel(`reserva-${id}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reservas', filter: `id=eq.${id}` }, callback)
    .subscribe();
  return () => supabase.removeChannel(canal);
}

// ---------- Turnos (mismo corte que turno_de() en la base) ----------

export const turnoDe = (hora) => (hora.slice(0, 5) < '17:00' ? 'mediodia' : 'noche');

export const TURNOS = { mediodia: 'Mediodía', noche: 'Noche' };

export const ESTADOS = {
  esperando_pago: 'Esperando pago',
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
  vencida: 'Vencida',
};
```

- [ ] **Step 4: Crear `pagos.js`**

Crear `src/servicios/pagos.js`:

```js
// Pagos y cancelaciones: pasan por las rutas del servidor (app/api) porque
// necesitan el Access Token de Mercado Pago, que nunca llega al navegador.
// El servidor sabe quién llama por el token de la sesión de Supabase.

import { supabase } from './supabase.js';

const ERROR_GENERICO = 'Algo salió mal. Probá de nuevo en un momento.';

async function llamar(ruta, cuerpo = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Ingresá con tu cuenta para continuar.');

  let respuesta;
  try {
    respuesta = await fetch(ruta, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(cuerpo),
    });
  } catch {
    throw new Error('No pudimos conectarnos. Revisá tu conexión y probá de nuevo.');
  }
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error ?? ERROR_GENERICO);
  return datos;
}

// Devuelve la URL de Checkout Pro a la que hay que mandar al cliente
export const iniciarPago = async (reservaId) => (await llamar('/api/v1/pagos', { reservaId })).initPoint;

// { reintegro: 'no_corresponde' | 'hecho' | 'pendiente' }
export const cancelarReserva = (reservaId, motivo) =>
  llamar(`/api/v1/reservas/${reservaId}/cancelacion`, motivo ? { motivo } : {});

export const reintentarReintegro = (reservaId) => llamar(`/api/v1/reservas/${reservaId}/cancelacion`);
```

- [ ] **Step 5: `admin.js`**

En `src/servicios/admin.js`:
- `COLUMNAS` suma `motivo_cancelacion` y `pagos(estado)`: `'id, usuario_id, origen, mail, local_id, fecha, hora, personas, nombre, telefono, comentarios, estado, cancelada_por, motivo_cancelacion, creada_en, notas_reserva(nota), pagos(estado)'`.
- Borrar `contarPendientes` y `cambiarEstado` (la cancelación pasa por `pagos.js`; ya no se confirma ni se rechaza).
- `listarBloqueos` selecciona `'id, fecha, local_id, turno, motivo'`.
- Reemplazar `bloquearDia` y agregar `listarReintegrosPendientes`:

```js
// turno: 'mediodia' | 'noche' | '' (todo el día)
export const bloquearDia = async ({ fecha, idLocal, turno, motivo }) =>
  resultado(
    await supabase
      .from('dias_bloqueados')
      .insert({ fecha, local_id: idLocal || null, turno: turno || null, motivo: motivo?.trim() || null })
  );

// Señas de reservas canceladas que todavía no se devolvieron (el reembolso falló)
export const listarReintegrosPendientes = async () =>
  resultado(
    await supabase
      .from('pagos')
      .select('id, monto, reserva_id, reservas(nombre, fecha, hora, local_id)')
      .eq('estado', 'reintegro_pendiente')
      .order('actualizado_en')
  );
```

- [ ] **Step 6: Estilos de los estados nuevos**

En `src/components/EstadoReserva/EstadoReserva.module.css`, agregar `.esperando_pago` junto a `.pendiente` y `.vencida` junto a `.cancelada`:

```css
.pendiente,
.esperando_pago {
  background-color: var(--arena);
  color: var(--carbon);
}
```

```css
.rechazada,
.cancelada,
.vencida {
  background-color: var(--gris-300);
  color: var(--gris-600);
  text-decoration: line-through;
}
```

Y en `EstadoReserva.jsx`, el comentario pasa a: `// Etiqueta del estado de una reserva (ver ESTADOS en servicios/reservas.js)`.

- [ ] **Step 7: Correr los tests**

Run: `npm test`
Expected: PASS. (`npm run lint` va a marcar los imports rotos de `mis-reservas` y `admin`: se arreglan en Tasks 12 y 13; no hace falta commitear con lint verde en esta tarea, pero sí con `npm test` verde.)

- [ ] **Step 8: Commit**

```bash
git add src/servicios src/components/EstadoReserva
git commit -m "feat: front services for deposit payments, refunds and shifts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Reservar y pagar (`/reservas` y `/reservas/pago`)

**Files:**
- Modify: `app/reservas/page.jsx`
- Create: `app/reservas/pago/page.jsx`, `app/reservas/pago/page.module.css`

**Interfaces:**
- Consumes: `iniciarPago` (pagos.js), `obtenerSena`, `formatearMonto`, `turnoDe`, `TURNOS`, `obtenerReserva`, `escucharReserva`, `puedePagar`, `venceElPago` (reservas.js).

- [ ] **Step 1: Seña en el formulario**

En `app/reservas/page.jsx`:
- importar `iniciarPago` de `../../src/servicios/pagos.js` y `formatearMonto, obtenerSena, turnoDe, TURNOS` de `../../src/servicios/reservas.js`;
- estado nuevo `const [sena, setSena] = useState(null);` y efecto:

```js
  useEffect(() => {
    let vigente = true;
    obtenerSena(idLocal).then((monto) => vigente && setSena(monto)).catch(() => vigente && setSena(null));
    return () => {
      vigente = false;
    };
  }, [idLocal]);
```

- reemplazar el cálculo de `bloqueo` y de `franjasDisponibles` para que distingan día entero y turno:

```js
  const delDia = bloqueos.filter((b) => b.fecha === fecha && (!b.local_id || b.local_id === idLocal));
  // Un bloqueo sin turno cierra el día; con turno, solo esos horarios
  const bloqueo = delDia.find((b) => !b.turno);
  const turnosCompletos = delDia.filter((b) => b.turno).map((b) => b.turno);

  // Si es hoy, solo los horarios que todavía no pasaron; y nunca los de un turno completo
  const franjasDisponibles = useMemo(
    () => franjas.filter((h) =>
      (!fecha || faltaParaReserva({ fecha, hora: h }) > 0) && !turnosCompletos.includes(turnoDe(h))),
    [franjas, fecha, turnosCompletos]
  );
```

  (`turnosCompletos` es un array nuevo en cada render; para que `useMemo` no recalcule siempre, usar `const clave = turnosCompletos.join();` y poner `clave` en las dependencias en lugar de `turnosCompletos`.)

- debajo del campo de hora, si hay turnos completos:

```jsx
{turnosCompletos.length > 0 && (
  <p className={formulario.ayuda}>
    Ese día ya está completo el turno {turnosCompletos.map((t) => TURNOS[t].toLowerCase()).join(' y el de la ')}.
  </p>
)}
```

- en `alEnviar`, después de crear la reserva (y guardar el teléfono), ir a pagar; si no se puede iniciar el pago, la reserva queda esperando el pago y se ofrece reintentar:

```js
      setCreada(reserva);
      try {
        window.location.assign(await iniciarPago(reserva.id));
        return; // sigue "Enviando…" mientras el navegador va a Mercado Pago
      } catch (e) {
        setError(e.message);
      }
```

  y el `finally { setEnviando(false); }` pasa a ejecutarse solo si no hubo redirección (mover `setEnviando(false)` al `catch` exterior y al `catch` del pago).

- la pantalla de `creada` pasa a ser la de "falta pagar":

```jsx
  if (creada) {
    return (
      <div className={formulario.formulario}>
        <h2 className={estilos.tituloListo}>Falta pagar la seña</h2>
        <p>
          <strong>{getLocal(creada.local_id).nombre}</strong>, {formatearFecha(creada.fecha)} a las{' '}
          {creada.hora.slice(0, 5)}, {creada.personas} {creada.personas === 1 ? 'persona' : 'personas'}, a nombre
          de {creada.nombre}.
        </p>
        {error && <p className={formulario.error} role="alert">{error}</p>}
        <p>
          Guardamos tu lugar durante {MINUTOS_PARA_PAGAR} minutos. Si no se paga la seña, la reserva se libera.
        </p>
        <div className={estilos.acciones}>
          <Boton onClick={pagar} disabled={enviando}>{enviando ? 'Abriendo Mercado Pago…' : 'Pagar seña'}</Boton>
          <Boton to="/mis-reservas" variante="texto">Ver mis reservas</Boton>
        </div>
      </div>
    );
  }
```

  con `MINUTOS_PARA_PAGAR` importado de `reservas.js` y

```js
  const pagar = async () => {
    setError('');
    setEnviando(true);
    try {
      window.location.assign(await iniciarPago(creada.id));
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
  };
```

  Se borra `otraReserva` (ya no se usa).

- el botón de enviar:

```jsx
<Boton type="submit" tamano="lg" className={estilos.botonEnviar} disabled={enviando}>
  {enviando ? 'Enviando…' : `Reservar y pagar seña${sena ? ` (${formatearMonto(sena)})` : ''}`}
</Boton>
```

  y, arriba del botón, `<p className={formulario.ayuda}>La seña se paga con Mercado Pago y se descuenta de la cuenta. Si cancelás con más de 1 hora de anticipación, te la devolvemos.</p>`.

- [ ] **Step 2: Página de vuelta de Mercado Pago**

Crear `app/reservas/pago/page.jsx`:

```jsx
'use client';

// A esta página vuelve el cliente desde Mercado Pago (back_urls). Lo que diga
// la URL no decide nada (clase 11: las back_urls no son confiables): se mira
// la reserva en la base, que la confirma el webhook.

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Hero from '../../../src/components/Hero/Hero.jsx';
import Section from '../../../src/components/Section/Section.jsx';
import Boton from '../../../src/components/Boton/Boton.jsx';
import RequiereSesion from '../../../src/components/RequiereSesion/RequiereSesion.jsx';
import { getLocal } from '../../../src/data/locales.js';
import { iniciarPago } from '../../../src/servicios/pagos.js';
import {
  escucharReserva,
  formatearFecha,
  obtenerReserva,
  puedePagar,
  venceElPago,
} from '../../../src/servicios/reservas.js';
import formulario from '../../../src/styles/formulario.module.css';
import estilos from './page.module.css';

const hora = (fecha) =>
  new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }).format(fecha);

function EstadoDelPago() {
  const id = useSearchParams().get('reserva');
  const [reserva, setReserva] = useState(null);
  const [error, setError] = useState(id ? '' : 'Falta el número de reserva.');
  const [abriendo, setAbriendo] = useState(false);

  useEffect(() => {
    if (!id) return undefined;
    let vigente = true;
    const leer = () =>
      obtenerReserva(id)
        .then((r) => vigente && (r ? setReserva(r) : setError('No encontramos esa reserva.')))
        .catch((e) => vigente && setError(e.message));
    leer();
    const dejarDeEscuchar = escucharReserva(id, leer);
    // Por si el tiempo real no llega: se vuelve a mirar cada 5 segundos
    const intervalo = setInterval(leer, 5000);
    return () => {
      vigente = false;
      dejarDeEscuchar();
      clearInterval(intervalo);
    };
  }, [id]);

  const reintentar = async () => {
    setAbriendo(true);
    try {
      window.location.assign(await iniciarPago(id));
    } catch (e) {
      setError(e.message);
      setAbriendo(false);
    }
  };

  if (error) return <p className={formulario.error} role="alert">{error}</p>;
  if (!reserva) return <p className={formulario.ayuda} role="status">Cargando tu reserva…</p>;

  const local = getLocal(reserva.local_id);
  const resumen = (
    <p>
      <strong>{local?.nombre}</strong>, {formatearFecha(reserva.fecha)} a las {reserva.hora.slice(0, 5)},{' '}
      {reserva.personas} {reserva.personas === 1 ? 'persona' : 'personas'}.
    </p>
  );

  if (reserva.estado === 'confirmada') {
    return (
      <div className={formulario.formulario} role="status">
        <h2 className={estilos.titulo}>¡Reserva confirmada!</h2>
        {resumen}
        <p className={formulario.exito}>Recibimos la seña. Te mandamos la confirmación por mail.</p>
        <Boton to="/mis-reservas">Ver mis reservas</Boton>
      </div>
    );
  }

  if (puedePagar(reserva)) {
    return (
      <div className={formulario.formulario} role="status" aria-live="polite">
        <h2 className={estilos.titulo}>Estamos confirmando tu pago…</h2>
        {resumen}
        <p>Si ya pagaste, esta página se actualiza sola en unos segundos.</p>
        <p className={formulario.ayuda}>
          Si el pago no se completó, podés intentarlo de nuevo hasta las {hora(venceElPago(reserva))}.
        </p>
        <Boton onClick={reintentar} disabled={abriendo}>{abriendo ? 'Abriendo Mercado Pago…' : 'Reintentar pago'}</Boton>
      </div>
    );
  }

  return (
    <div className={formulario.formulario}>
      <h2 className={estilos.titulo}>La reserva no se completó</h2>
      {resumen}
      <p>Se venció el plazo para pagar la seña, así que el lugar se liberó. Si querés, hacé la reserva de nuevo.</p>
      <Boton to="/reservas">Hacer una reserva</Boton>
    </div>
  );
}

export default function PagoDeLaReserva() {
  return (
    <main>
      <Hero compacto imagen="/img/comunes/salon-calido.webp" alt="" titulo="Tu reserva" bajada="La Posta" />
      <Section>
        <Suspense fallback={null}>
          <RequiereSesion soloClientes>
            <EstadoDelPago />
          </RequiereSesion>
        </Suspense>
      </Section>
    </main>
  );
}
```

Crear `app/reservas/pago/page.module.css`:

```css
.titulo {
  margin-top: 0;
  font-family: var(--font-titulo);
  font-size: var(--fs-h3);
  color: var(--bordo-900);
}
```

(Mismo estilo que `.tituloListo` de `app/reservas/page.module.css`.)

- [ ] **Step 3: Verificar en el navegador**

Con la base local y `preview_start` `{ name: "dev" }`: ingresar con Google (o con la sesión local que se use), reservar, comprobar que el botón dice "Reservar y pagar seña ($ 10.000)" y que redirige a `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=…`. Volver con el botón "Atrás" del navegador a `/reservas/pago?reserva=<id>` y ver "Estamos confirmando tu pago…". `read_console_messages` sin errores.

- [ ] **Step 4: Lint y commit**

Run: `npm run lint -- app/reservas`
Expected: sin errores en estos archivos.

```bash
git add app/reservas
git commit -m "feat: book and pay the deposit; return page waits for the webhook

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Mis reservas

**Files:**
- Modify: `app/mis-reservas/page.jsx`

**Interfaces:**
- Consumes: `cancelarReserva`, `iniciarPago` (pagos.js); `puedePagar`, `venceElPago`, `estadoSena`, `ETIQUETAS_SENA` (reservas.js).

- [ ] **Step 1: Implementar**

En `app/mis-reservas/page.jsx`:
- imports: sacar `cancelarReserva` del import de `reservas.js`; agregar `import { cancelarReserva, iniciarPago } from '../../src/servicios/pagos.js';` y `ETIQUETAS_SENA, estadoSena, puedePagar, venceElPago` a los de `reservas.js`.
- `TarjetaReserva` recibe también `alPagar`, y suma después de los comentarios:

```jsx
      {puedePagar(reserva) && (
        <>
          <p className={estilos.aviso}>
            Falta pagar la seña: guardamos tu lugar hasta las{' '}
            {new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }).format(venceElPago(reserva))}.
          </p>
          <Boton onClick={() => alPagar(reserva)}>Pagar seña</Boton>
        </>
      )}
      {estadoSena(reserva) && <p className={estilos.detalle}>{ETIQUETAS_SENA[estadoSena(reserva)]}</p>}
      {reserva.estado === 'cancelada' && reserva.motivo_cancelacion && (
        <p className={estilos.detalle}>Motivo: {reserva.motivo_cancelacion}</p>
      )}
```

- en `ListaReservas`, `alCancelar` y `alPagar`:

```js
  const alCancelar = async (reserva) => {
    if (!window.confirm('¿Seguro que querés cancelar esta reserva?')) return;
    setError('');
    setAviso('');
    try {
      const { reintegro } = await cancelarReserva(reserva.id);
      setAviso({
        hecho: 'Listo, cancelamos tu reserva y te devolvimos la seña.',
        pendiente: 'Listo, cancelamos tu reserva. La devolución de la seña está en proceso.',
        no_corresponde: 'Listo, cancelamos tu reserva.',
      }[reintegro]);
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e.message);
    }
  };

  const alPagar = async (reserva) => {
    setError('');
    try {
      window.location.assign(await iniciarPago(reserva.id));
    } catch (e) {
      setError(e.message);
    }
  };
```

  y pasar `alPagar={alPagar}` a las dos listas de `TarjetaReserva`.

- [ ] **Step 2: Verificar en el navegador**

Con una reserva `esperando_pago`: se ve "Esperando pago", "Pagar seña" y la hora límite. Cancelarla: "Listo, cancelamos tu reserva." y pasa a "Anteriores y canceladas". `read_console_messages` sin errores.

- [ ] **Step 3: Lint y commit**

Run: `npm run lint -- app/mis-reservas`
Expected: sin errores.

```bash
git add app/mis-reservas/page.jsx
git commit -m "feat: pay, cancel and see the deposit status in my reservations

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Panel del admin

**Files:**
- Modify: `app/admin/page.jsx`
- Modify: `app/admin/page.module.css`

**Interfaces:**
- Consumes: `cancelarReserva`, `reintentarReintegro` (pagos.js); `estadoSena`, `ETIQUETAS_SENA`, `TURNOS`, `formatearMonto` (reservas.js); `listarReintegrosPendientes`, `bloquearDia` con turno (admin.js).

- [ ] **Step 1: Cancelar con motivo y estado de la seña (`FilaReserva`)**

En `app/admin/page.jsx`:
- imports: sacar `cambiarEstado` y `contarPendientes`; agregar `listarReintegrosPendientes`; `import { cancelarReserva, reintentarReintegro } from '../../src/servicios/pagos.js';`; sumar `ETIQUETAS_SENA, TURNOS, estadoSena, formatearMonto` al import de `reservas.js`.
- en `FilaReserva`: `const activa = ['esperando_pago', 'pendiente', 'confirmada'].includes(reserva.estado);` y

```js
  const alCancelar = () => {
    const motivo = window.prompt(
      `Motivo de la cancelación${avisoMail ? ' (le llega al cliente por mail)' : ''}:`,
      'No hay lugar'
    );
    if (motivo === null) return;
    if (!motivo.trim()) {
      alError('Escribí el motivo de la cancelación.');
      return;
    }
    ejecutar(async () => {
      const { reintegro } = await cancelarReserva(reserva.id, motivo.trim());
      if (reintegro === 'pendiente') {
        alError('La reserva quedó cancelada, pero no se pudo devolver la seña: reintentalo en "Reintegros pendientes".');
      }
    });
  };
```

- en la línea secundaria de datos, después del `cancelada_por`:

```jsx
          {reserva.estado === 'cancelada' && reserva.motivo_cancelacion && ` · "${reserva.motivo_cancelacion}"`}
          {estadoSena(reserva) && ` · ${ETIQUETAS_SENA[estadoSena(reserva)]}`}
```

- el bloque de acciones queda (sin Confirmar ni Rechazar):

```jsx
      <div className={estilos.acciones}>
        {['pendiente', 'confirmada'].includes(reserva.estado) && !moviendo && (
          <button type="button" className={estilos.botonTexto} onClick={() => setMoviendo(true)}>Mover</button>
        )}
        {activa && (
          <button type="button" className={estilos.botonTexto} onClick={alCancelar}>Cancelar</button>
        )}
      </div>
```

- [ ] **Step 2: Reintegros pendientes**

Agregar el componente, arriba de `Panel`:

```jsx
// ---------------------------------------------------------------------
// Reintegros pendientes: señas de reservas canceladas cuyo reembolso falló
// ---------------------------------------------------------------------
function ReintegrosPendientes({ version, alCambiar, alError }) {
  const [pendientes, setPendientes] = useState([]);

  useEffect(() => {
    let vigente = true;
    listarReintegrosPendientes()
      .then((lista) => vigente && setPendientes(lista))
      .catch((e) => vigente && alError(e.message));
    return () => {
      vigente = false;
    };
  }, [version, alError]);

  if (!pendientes.length) return null;

  return (
    <section className={estilos.bloque} aria-labelledby="titulo-reintegros">
      <h2 id="titulo-reintegros" className={estilos.tituloBloque}>Reintegros pendientes</h2>
      <ul className={estilos.listaBloqueos}>
        {pendientes.map((p) => (
          <li key={p.id}>
            <span>
              <strong>{p.reservas.nombre}</strong> · {formatearFecha(p.reservas.fecha)} {p.reservas.hora.slice(0, 5)} ·{' '}
              {formatearMonto(Number(p.monto))}
            </span>
            <button type="button" className={estilos.botonTexto} onClick={async () => {
              try {
                const { reintegro } = await reintentarReintegro(p.reserva_id);
                if (reintegro !== 'hecho') alError('Todavía no se pudo devolver la seña. Probá de nuevo en un rato.');
                alCambiar();
              } catch (e) {
                alError(e.message);
              }
            }}>
              Reintentar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

En `Panel`:
- borrar `pendientes`/`setPendientes`, el `contarPendientes()` del `Promise.all` (queda `listarReservas(filtros).then((lista) => vigente && setReservas(lista))`) y el botón del contador de la cabecera;
- renderizar `<ReintegrosPendientes version={version} alCambiar={cargar} alError={alError} />` justo después del bloque de `error`.
- el aviso de tiempo real deja de saltar con cada INSERT (ahora una reserva nueva todavía no está pagada) y avisa cuando una reserva de la lista pasa de `esperando_pago` a `confirmada`. Realtime no manda el registro anterior completo, así que se compara con el estado que el panel ya tenía:

```js
  // Estado de cada reserva en pantalla, para saber cuándo una se acaba de pagar
  const estadosEnPantalla = useRef({});
  useEffect(() => {
    estadosEnPantalla.current = Object.fromEntries((reservas ?? []).map((r) => [r.id, r.estado]));
  }, [reservas]);

  useEffect(
    () =>
      escucharReservas((cambio) => {
        const { id, estado, nombre } = cambio.new ?? {};
        if (cambio.eventType === 'UPDATE' && estado === 'confirmada' && estadosEnPantalla.current[id] === 'esperando_pago') {
          setNovedad(`Entró una reserva nueva de ${nombre}, con la seña paga.`);
        }
        cargar();
      }),
    [cargar]
  );
```

  (sumar `useRef` al import de React; reemplaza el efecto de tiempo real actual).

En `app/admin/page.module.css`: borrar `.contador` y `.contadorActivo`; agregar las filas de los estados nuevos:

```css
.esperando_pago {
  border-left-color: var(--arena);
}

.rechazada,
.cancelada,
.vencida {
  opacity: 0.65;
}
```

(reemplazando la regla `.rechazada, .cancelada` existente).

- [ ] **Step 3: Bloqueo por turno (`DiasBloqueados`)**

- texto de ayuda: `Un día o un turno bloqueado no se puede reservar desde la web. Las reservas que ya existían no se tocan.`
- en el formulario, después del `<select name="local">`:

```jsx
        <select name="turno" className={formulario.control} aria-label="Turno" defaultValue="">
          <option value="">Todo el día</option>
          {Object.entries(TURNOS).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
        </select>
```

- en `alBloquear`: `const repetido = bloqueos.some((b) => b.fecha === datos.fecha && (b.local_id ?? '') === datos.local && (b.turno ?? '') === datos.turno);`, el mensaje de repetido pasa a `'Ese día y turno ya está bloqueado.'`, y `await bloquearDia({ fecha: datos.fecha, idLocal: datos.local, turno: datos.turno, motivo: datos.motivo });`. En el `catch`, el mismo mensaje en lugar de `'Ese día ya está bloqueado.'`.
- en la lista: `{b.turno ? ` · ${TURNOS[b.turno].toLowerCase()}` : ' · todo el día'}` después del local.

- [ ] **Step 4: Verificar en el navegador**

Con sesión de admin en local: sin botones Confirmar/Rechazar; "Cancelar" pide motivo con "No hay lugar" prellenado; cancelar sin motivo muestra el error; bloquear la noche de un día y ver en `/reservas` (como cliente) que ese día solo quedan los horarios del mediodía y el aviso "ya está completo el turno noche". `read_console_messages` sin errores.

- [ ] **Step 5: Lint, tests, build y commit**

Run: `npm run lint && npm test && npm run build`
Expected: todo verde.

```bash
git add app/admin
git commit -m "feat: admin cancels with a reason, sees deposits, retries refunds, blocks shifts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Despliegue en la preview, prueba de punta a punta y documentación

**Files:**
- Modify: `docs/QA-MANUAL.md`, `docs/BACKEND.md`, `docs/RUBRICA.md`, `docs/BITACORA.md`, `docs/PENDIENTES.md`, `docs/ESTRUCTURA.md`, `CLAUDE.md`
- Create: `docs/proceso/sesion-05-2026-10-15.md`
- Modify: `docs/proceso/hallazgos.md`
- Modify: `docs/superpowers/specs/2026-10-15-sena-reservas-mercadopago-design.md` (solo si la implementación se apartó: dejarlo anotado, no reescribir)

- [ ] **Step 1: Subir la rama y abrir el PR (borrador)**

```bash
git push -u origin feat/pagos-sena
gh pr create --draft --fill --base main
```
Expected: el PR existe y Vercel arma la preview. Anotar la URL fija de la rama (`…-git-feat-pagos-sena-….vercel.app`).

- [ ] **Step 2: Base remota**

Con el OK del usuario (toca la base de producción):

Run: `npx supabase db push`
Expected: se aplican las 3 migraciones. En el panel de Supabase → Database → Extensions, `pg_cron` figura activa, y `select jobname from cron.job;` devuelve `vencer-reservas-sin-pagar`.

- [ ] **Step 3: Webhook y variables (lo hace el usuario; la IA guía)**

1. Panel de Mercado Pago, **logueado como el vendedor de prueba** (ventana de incógnito) → la app → Webhooks → URL de producción `https://<url-de-la-rama>/api/webhooks/mercadopago`, evento **Pagos** → Guardar → copiar la **clave secreta**.
2. Vercel → Settings → Environment Variables, para **Preview**: `MP_ACCESS_TOKEN` (el `APP_USR-` del vendedor de prueba), `MP_WEBHOOK_SECRET`, `SUPABASE_SECRET_KEY` (Supabase → Settings → API Keys → secret), `APP_URL` = la URL de la rama.
3. Vercel → Settings → Deployment Protection: si las previews piden login, activar "Protection Bypass for Automation" o desactivar la protección de previews; si no, Mercado Pago recibe 401 de Vercel.
4. Redeploy de la preview.

- [ ] **Step 4: Prueba de punta a punta (agregar estos casos a `docs/QA-MANUAL.md` y correrlos)**

Siempre en **incógnito**, con el usuario **comprador de prueba** de Mercado Pago y tarjetas de prueba (`/mp-test-cards` para los números de Argentina):

- [ ] Reservar → redirige a Mercado Pago → pagar con titular `APRO` → vuelve a `/reservas/pago` y en segundos dice "¡Reserva confirmada!". En el panel, "Seña pagada".
- [ ] Reservar → pagar con titular `OTHE` (rechazado) → en `/reservas/pago`, "Reintentar pago" → pagar con `APRO` → confirmada.
- [ ] Reservar y no pagar → a los 15 minutos la reserva figura "Vencida" en Mis reservas.
- [ ] El cliente cancela una reserva pagada (con más de 1 hora) → "te devolvimos la seña"; en la cuenta del comprador de prueba aparece la devolución.
- [ ] El admin cancela una reserva pagada con motivo → el cliente ve el motivo; seña "reintegrada".
- [ ] El admin bloquea la noche de un día → `/reservas` no ofrece horarios de la noche ese día; una reserva previa de esa noche sigue confirmada.
- [ ] `curl -i -X POST "https://<url-de-la-rama>/api/webhooks/mercadopago?data.id=1&type=payment"` → 401.

Al terminar, borrar de la base de producción las reservas y pagos de prueba (se listan por fecha de creación de hoy y el usuario confirma antes de borrar).

- [ ] **Step 5: `/mp-review`**

Correr el skill `mercadopago:mp-review` sobre la rama y corregir lo que marque como bloqueante.

- [ ] **Step 6: Documentación**

- `docs/RUBRICA.md`: E6 pasa a ✅ con qué hay (checkout, webhook con firma, conciliación, reintegros, pruebas) y la fecha de revisión.
- `docs/BACKEND.md`: sección "Pagos con Mercado Pago": variables, webhook configurado como vendedor de prueba, `pg_cron`, cómo correr las pruebas.
- `docs/ESTRUCTURA.md`: `app/api/…`, `/reservas/pago`, `src/servidor/`.
- `CLAUDE.md`: la excepción `src/servidor/` (puede importar `@supabase/supabase-js`, nunca lo importa un componente) y las tres rutas de la API.
- `docs/PENDIENTES.md`: Etapa 3 — seña ✅; gift cards y pedido para llevar siguen pendientes.
- `docs/BITACORA.md`: entrada del 2026-10-15 arriba de todo.
- `docs/proceso/sesion-05-2026-10-15.md` y `docs/proceso/hallazgos.md`, con lo que pide `docs/proceso/README.md`: lo que decidió el usuario y lo que propuso la IA; la creación automática del vendedor de prueba que falló (`MP_API_DOWN`) y cómo se resolvió; la clase 11 que habla de "Sandbox" cuando Mercado Pago ya no lo tiene; el error de la IA al escribir que las credenciales `TEST-` "cobran a tu cuenta real" y su corrección.

- [ ] **Step 7: Commit, PR listo para revisión**

```bash
git add docs CLAUDE.md
git commit -m "docs: deposit payments in rubric, backend, QA and process log

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
gh pr ready
```

Completar el checklist de la plantilla del PR. **No mergear sin el OK del usuario.**
