-- Validación de los datos de contacto de una reserva: las mismas reglas que
-- el formulario (src/validacion/reservas.js), porque el navegador se puede
-- saltear.
--
-- Va en un trigger y no en un check a propósito: un check se evalúa en cada
-- update, así que una reserva vieja con un teléfono corto ya no se podría ni
-- confirmar. El trigger solo mira las filas nuevas y las que cambian estos
-- campos.

create function public.validar_contacto()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if char_length(trim(new.nombre)) not between 2 and 80 then
    raise exception 'El nombre tiene que tener entre 2 y 80 caracteres.';
  end if;

  if new.telefono !~ '^[0-9+()[:space:]-]+$'
     or char_length(regexp_replace(new.telefono, '\D', '', 'g')) not between 8 and 15 then
    raise exception 'Ese teléfono no parece válido: tiene que tener entre 8 y 15 dígitos.';
  end if;

  if char_length(coalesce(new.comentarios, '')) > 500 then
    raise exception 'Los comentarios pueden tener hasta 500 caracteres.';
  end if;

  return new;
end;
$$;

create trigger validar_contacto
  before insert or update of nombre, telefono, comentarios on public.reservas
  for each row execute function public.validar_contacto();

-- El motivo de un día bloqueado se muestra en el formulario de reservas.
-- not valid: no revisa las filas que ya existen, solo las nuevas.
alter table public.dias_bloqueados
  add constraint dias_bloqueados_motivo_largo
  check (motivo is null or char_length(motivo) <= 120) not valid;
