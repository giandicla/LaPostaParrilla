-- Parte 2: días bloqueados, notas internas, tiempo real y aviso por mail.

-- =====================================================================
-- Días bloqueados: feriados, cierres o eventos privados.
-- local_id nulo = los dos locales.
-- =====================================================================
create table public.dias_bloqueados (
  id bigint generated always as identity primary key,
  fecha date not null,
  local_id text references public.locales (id) on delete cascade,
  motivo text,
  creado_en timestamptz not null default now(),
  unique nulls not distinct (fecha, local_id)
);

alter table public.dias_bloqueados enable row level security;

create policy "bloqueos: lectura pública" on public.dias_bloqueados
  for select to anon, authenticated using (true);
create policy "bloqueos: el admin los edita" on public.dias_bloqueados
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- La validación de reservas suma el chequeo de días bloqueados
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
      where fecha = new.fecha and (local_id is null or local_id = new.local_id)
    ) then
      raise exception 'Ese día no tomamos reservas en ese local.';
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

-- =====================================================================
-- Notas internas: tabla aparte porque la RLS filtra filas, no columnas.
-- Si la nota fuera una columna de reservas, el cliente la leería.
-- =====================================================================
create table public.notas_reserva (
  reserva_id uuid primary key references public.reservas (id) on delete cascade,
  nota text not null,
  actualizada_en timestamptz not null default now()
);

alter table public.notas_reserva enable row level security;

create policy "notas: solo el admin" on public.notas_reserva
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- =====================================================================
-- Tiempo real: el panel de admin escucha los cambios de reservas.
-- Realtime respeta la RLS: cada cliente solo recibe sus propias filas.
-- =====================================================================
alter publication supabase_realtime add table public.reservas;

-- =====================================================================
-- Aviso por mail: al crear una reserva o cambiar su estado, fecha u hora,
-- la base llama a la Edge Function `notificar-reserva`, que manda el mail
-- con Brevo. La URL de la función y un secreto compartido se guardan en
-- Vault (ver docs/BACKEND.md); si no están, no se llama a nada y el sitio
-- funciona igual, sin mails.
-- =====================================================================
create extension if not exists pg_net with schema extensions;

create function public.notificar_reserva()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  url text;
  secreto text;
begin
  if tg_op = 'UPDATE'
     and new.estado = old.estado
     and new.fecha = old.fecha
     and new.hora = old.hora then
    return new;  -- cambió otra cosa (por ejemplo, el teléfono): no se avisa
  end if;

  select decrypted_secret into url
    from vault.decrypted_secrets where name = 'notificaciones_url';
  select decrypted_secret into secreto
    from vault.decrypted_secrets where name = 'notificaciones_secreto';

  if url is null or secreto is null then
    return new;
  end if;

  perform net.http_post(
    url := url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-secreto', secreto),
    body := jsonb_build_object(
      'tipo', tg_op,
      'reserva', to_jsonb(new),
      'anterior', case when tg_op = 'UPDATE' then to_jsonb(old) end
    )
  );
  return new;
end;
$$;

create trigger notificar_reserva
  after insert or update on public.reservas
  for each row execute function public.notificar_reserva();
