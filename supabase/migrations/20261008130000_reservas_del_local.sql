-- Reservas del local: las que carga el admin desde el panel, por ejemplo las
-- que entran por teléfono o WhatsApp. No tienen cuenta de cliente detrás,
-- entran confirmadas, pueden ser de hasta 40 personas y llevar el mail del
-- cliente si lo dio. Además, el plazo para cancelar desde la web baja de 2
-- horas a 1. Spec: docs/superpowers/specs/2026-10-08-reservas-admin-design.md

-- =====================================================================
-- Origen, cuenta y mail
-- =====================================================================
alter table public.reservas
  add column origen text not null default 'web' check (origen in ('web', 'local')),
  add column mail text;

-- Las del local no tienen cuenta. El índice de "una reserva activa por día"
-- es sobre usuario_id, y los null no chocan entre sí: el admin puede cargar
-- todas las que quiera el mismo día.
alter table public.reservas alter column usuario_id drop not null;

alter table public.reservas
  add constraint reservas_cuenta_segun_origen
    check ((origen = 'web') = (usuario_id is not null)),
  -- Una reserva de la web ya tiene el mail de su cuenta, en Auth
  add constraint reservas_mail_solo_local
    check (mail is null or origen = 'local');

-- Personas: desde la web hasta 6 (más, por WhatsApp); desde el panel hasta
-- 40, un tope contra errores de tipeo.
alter table public.reservas drop constraint reservas_personas_check;
alter table public.reservas add constraint reservas_personas_check
  check (personas >= 1 and personas <= case origen when 'web' then 6 else 40 end);

-- =====================================================================
-- Quién crea qué: el cliente, solo reservas de la web a su nombre y
-- pendientes. El admin, cualquiera (desde el panel: del local y confirmadas).
-- =====================================================================
drop policy "reservas: crear a nombre propio y pendiente" on public.reservas;
create policy "reservas: crear a nombre propio y pendiente" on public.reservas
  for insert to authenticated
  with check (
    (usuario_id = auth.uid() and origen = 'web' and estado = 'pendiente' and cancelada_por is null)
    or public.es_admin()
  );

-- =====================================================================
-- Validación de contacto: suma el mail. Además, a pedido del usuario, el
-- nombre ya no tiene mínimo de 2 letras (alcanza con que no esté vacío; el
-- check reservas_nombre_check ya lo exige) y los comentarios pasan de 500
-- caracteres a 100.
-- =====================================================================
create or replace function public.validar_contacto()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if char_length(trim(new.nombre)) > 80 then
    raise exception 'El nombre puede tener hasta 80 caracteres.';
  end if;

  if new.telefono !~ '^[0-9+()[:space:]-]+$'
     or char_length(regexp_replace(new.telefono, '\D', '', 'g')) not between 8 and 15 then
    raise exception 'Ese teléfono no parece válido: tiene que tener entre 8 y 15 dígitos.';
  end if;

  if char_length(coalesce(new.comentarios, '')) > 100 then
    raise exception 'Los comentarios pueden tener hasta 100 caracteres.';
  end if;

  -- Algo@algo.algo, sin espacios: lo mismo que valida el formulario del panel
  if new.mail is not null
     and (char_length(new.mail) > 254 or new.mail !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then
    raise exception 'Ese mail no parece válido.';
  end if;

  return new;
end;
$$;

drop trigger validar_contacto on public.reservas;
create trigger validar_contacto
  before insert or update of nombre, telefono, comentarios, mail on public.reservas
  for each row execute function public.validar_contacto();

-- =====================================================================
-- Cancelar desde la web: hasta 1 hora antes (antes eran 2)
-- =====================================================================
create or replace function public.cancelar_reserva(p_id uuid)
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

  -- "is distinct from" y no "<>": una reserva del local tiene usuario_id null,
  -- y null <> uid da null, que no frenaba a nadie (cualquier cliente podía
  -- cancelarla si conocía el id).
  if not found or (r.usuario_id is distinct from auth.uid() and not admin) then
    raise exception 'No encontramos esa reserva.';
  end if;

  if r.estado not in ('pendiente', 'confirmada') then
    raise exception 'Esa reserva ya no está activa.';
  end if;

  if not admin and public.inicio_reserva(r.fecha, r.hora) - now() < interval '1 hour' then
    raise exception 'Falta menos de 1 hora para tu reserva: para cancelarla escribinos por WhatsApp.';
  end if;

  update public.reservas set estado = 'cancelada' where id = p_id returning * into r;
  return r;
end;
$$;

-- =====================================================================
-- Avisos por mail: una reserva del local sin mail no tiene a quién avisarle
-- (y al admin no hace falta: la cargó él). La Edge Function decide el resto.
-- =====================================================================
create or replace function public.notificar_reserva()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  url text;
  secreto text;
begin
  if new.origen = 'local' and new.mail is null then
    return new;
  end if;

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
