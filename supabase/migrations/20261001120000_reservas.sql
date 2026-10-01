-- Parte 1: locales, perfiles, franjas de reserva y reservas, con sus reglas.
-- Las reglas viven acá, en la base, y no en el front: un cliente que llame a la
-- API directo (sin pasar por la página) se topa con las mismas restricciones.

-- =====================================================================
-- Locales: solo lo necesario para las claves foráneas. Fotos, textos y
-- horarios de atención siguen en src/data/locales.js.
-- =====================================================================
create table public.locales (
  id text primary key,
  nombre text not null
);

insert into public.locales (id, nombre) values
  ('parrilla', 'La Posta Parrilla'),
  ('restaurante', 'La Posta II Restaurante');

-- =====================================================================
-- Perfiles: uno por usuario de Supabase Auth, creado por trigger.
-- =====================================================================
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text,
  telefono text,
  rol text not null default 'cliente' check (rol in ('cliente', 'admin')),
  creado_en timestamptz not null default now()
);

create function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Google manda full_name; el registro con email manda "nombre"
  insert into public.perfiles (id, nombre)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'nombre',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    )
  );
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- ¿El usuario de esta request es admin? security definer para poder leer
-- perfiles sin pasar por su propia RLS (si no, la política se llamaría a sí misma).
create function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles where id = auth.uid() and rol = 'admin'
  );
$$;

-- =====================================================================
-- Franjas de reserva: los horarios que se pueden reservar en cada local.
-- =====================================================================
create table public.franjas_reserva (
  local_id text not null references public.locales (id) on delete cascade,
  hora time not null,
  primary key (local_id, hora)
);

insert into public.franjas_reserva (local_id, hora)
select l.id, h.hora::time
from public.locales l
cross join (values
  ('12:00'), ('12:15'), ('12:30'), ('12:45'), ('13:00'),
  ('20:00'), ('20:15'), ('20:30'), ('20:45'), ('21:00')
) as h (hora);

-- =====================================================================
-- Reservas
-- =====================================================================
create type public.estado_reserva as enum ('pendiente', 'confirmada', 'rechazada', 'cancelada');

create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  local_id text not null references public.locales (id),
  fecha date not null,
  hora time not null,
  -- Más de 6 personas se coordina por WhatsApp
  personas smallint not null check (personas between 1 and 6),
  nombre text not null check (length(trim(nombre)) > 0),
  telefono text not null check (length(trim(telefono)) > 0),
  comentarios text,
  estado public.estado_reserva not null default 'pendiente',
  cancelada_por text check (cancelada_por in ('cliente', 'admin')),
  creada_en timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);

-- Una reserva activa por usuario, local y día
create unique index reservas_una_activa_por_dia
  on public.reservas (usuario_id, local_id, fecha)
  where estado in ('pendiente', 'confirmada');

create index reservas_por_fecha on public.reservas (fecha, local_id);

-- Momento de la reserva en hora argentina, como timestamptz comparable con now()
create function public.inicio_reserva(p_fecha date, p_hora time)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select (p_fecha + p_hora) at time zone 'America/Argentina/Buenos_Aires';
$$;

-- Validaciones que dependen de otras tablas o de la hora actual
-- (un check no puede hacerlas).
create function public.validar_reserva()
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
  end if;

  -- Quién cancela: lo deja asentado para el historial y para los mails
  if tg_op = 'UPDATE' and new.estado = 'cancelada' and old.estado <> 'cancelada' then
    new.cancelada_por := case when public.es_admin() then 'admin' else 'cliente' end;
  end if;

  if tg_op = 'UPDATE' then
    new.actualizada_en := now();
  end if;

  return new;
end;
$$;

create trigger validar_reserva
  before insert or update on public.reservas
  for each row execute function public.validar_reserva();

-- Cancelar: la única forma en que un cliente modifica una reserva.
-- security definer porque el cliente no tiene permiso de update; por eso
-- todas las comprobaciones de dueño y de plazo están acá adentro.
create function public.cancelar_reserva(p_id uuid)
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

  if not found or (r.usuario_id <> auth.uid() and not admin) then
    raise exception 'No encontramos esa reserva.';
  end if;

  if r.estado not in ('pendiente', 'confirmada') then
    raise exception 'Esa reserva ya no está activa.';
  end if;

  if not admin and public.inicio_reserva(r.fecha, r.hora) - now() < interval '2 hours' then
    raise exception 'Faltan menos de 2 horas para tu reserva: para cancelarla escribinos por WhatsApp.';
  end if;

  update public.reservas set estado = 'cancelada' where id = p_id returning * into r;
  return r;
end;
$$;

-- =====================================================================
-- Seguridad: RLS y permisos
-- =====================================================================
alter table public.locales enable row level security;
alter table public.perfiles enable row level security;
alter table public.franjas_reserva enable row level security;
alter table public.reservas enable row level security;

-- Locales y franjas: lectura pública (el formulario las necesita), escritura admin
create policy "locales: lectura pública" on public.locales
  for select to anon, authenticated using (true);

create policy "franjas: lectura pública" on public.franjas_reserva
  for select to anon, authenticated using (true);
create policy "franjas: el admin las edita" on public.franjas_reserva
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Perfiles: cada uno ve y edita el suyo; el admin ve todos
create policy "perfiles: ver el propio o ser admin" on public.perfiles
  for select to authenticated using (id = auth.uid() or public.es_admin());
create policy "perfiles: editar el propio" on public.perfiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- El rol no lo puede tocar nadie desde la API: solo nombre y teléfono.
-- (El primer admin se nombra desde el panel de Supabase.)
revoke update on public.perfiles from authenticated, anon;
grant update (nombre, telefono) on public.perfiles to authenticated;

-- Reservas
create policy "reservas: ver las propias o ser admin" on public.reservas
  for select to authenticated using (usuario_id = auth.uid() or public.es_admin());

create policy "reservas: crear a nombre propio y pendiente" on public.reservas
  for insert to authenticated
  with check (
    (usuario_id = auth.uid() and estado = 'pendiente' and cancelada_por is null)
    or public.es_admin()
  );

-- Solo el admin edita. El cliente cancela con cancelar_reserva().
create policy "reservas: el admin edita" on public.reservas
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

-- Nadie borra reservas: se cancelan, para no perder el historial
revoke delete on public.reservas from authenticated, anon;

revoke execute on function public.cancelar_reserva(uuid) from anon, public;
grant execute on function public.cancelar_reserva(uuid) to authenticated;
