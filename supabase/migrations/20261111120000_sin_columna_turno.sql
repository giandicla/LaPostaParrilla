-- Saca la columna dias_bloqueados.turno, que quedó sin uso con los bloqueos por
-- rango (20261110120000): el front ya carga horas, y todas las filas tienen
-- turno null. Primero el trigger deja de leerla; después se borra.

create or replace function public.completar_bloqueo()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.fecha_hasta := coalesce(new.fecha_hasta, new.fecha);
  return new;
end;
$$;

alter table public.dias_bloqueados drop column turno;
