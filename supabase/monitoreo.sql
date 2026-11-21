-- =====================================================================
-- MI JARDÍN · Monitoreo de salud de las plantas
-- Pégalo completo en Supabase → SQL Editor → Run.
-- Es seguro ejecutarlo más de una vez y NO borra datos.
--
-- Agrega:
--   * registros_cuidado.estado_salud  (bien | regular | mal)
--   * nuevo tipo de cuidado "revision" (una revisión sin otra tarea)
--   * plantas.estado_salud / plantas.ultima_revision (se calculan solos
--     a partir del historial, igual que ultimo_riego)
-- =====================================================================

begin;

-- 1. Permitir el tipo "revision" (busca el CHECK de "tipo" sin depender del nombre)
do $$
declare c record;
begin
  for c in
    select con.conname
      from pg_constraint con
      join pg_attribute a on a.attrelid = con.conrelid and a.attnum = any (con.conkey)
     where con.conrelid = 'public.registros_cuidado'::regclass
       and con.contype = 'c'
       and a.attname = 'tipo'
  loop
    execute format('alter table public.registros_cuidado drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.registros_cuidado
  add constraint registros_cuidado_tipo_check check (tipo in (
    'riego', 'fertilizacion', 'poda', 'trasplante', 'limpieza',
    'control_plagas', 'cambio_ubicacion', 'revision', 'otro'));

-- 2. Columnas nuevas
alter table public.registros_cuidado
  add column if not exists estado_salud text;

alter table public.plantas
  add column if not exists estado_salud text,
  add column if not exists ultima_revision timestamptz;

alter table public.registros_cuidado drop constraint if exists registros_cuidado_estado_salud_check;
alter table public.registros_cuidado
  add constraint registros_cuidado_estado_salud_check
  check (estado_salud is null or estado_salud in ('bien', 'regular', 'mal'));

alter table public.plantas drop constraint if exists plantas_estado_salud_check;
alter table public.plantas
  add constraint plantas_estado_salud_check
  check (estado_salud is null or estado_salud in ('bien', 'regular', 'mal'));

create index if not exists registros_salud_idx
  on public.registros_cuidado (planta_id, fecha_hora desc)
  where estado_salud is not null;

-- 3. El estado actual de la planta = el de su revisión más reciente
create or replace function public.sincronizar_estado_salud()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  ids uuid[] := '{}';
  pid uuid;
begin
  if tg_op in ('UPDATE', 'DELETE') then ids := ids || old.planta_id; end if;
  if tg_op in ('INSERT', 'UPDATE') then ids := ids || new.planta_id; end if;

  foreach pid in array (select array(select distinct unnest(ids))) loop
    update public.plantas p
       set estado_salud = u.estado_salud,
           ultima_revision = u.fecha_hora
      from (
        select (select r.estado_salud
                  from public.registros_cuidado r
                 where r.planta_id = pid and r.estado_salud is not null
                 order by r.fecha_hora desc limit 1) as estado_salud,
               (select r.fecha_hora
                  from public.registros_cuidado r
                 where r.planta_id = pid and r.estado_salud is not null
                 order by r.fecha_hora desc limit 1) as fecha_hora
      ) u
     where p.id = pid;
  end loop;
  return null;
end;
$$;

drop trigger if exists registros_cuidado_estado_salud on public.registros_cuidado;
create trigger registros_cuidado_estado_salud
  after insert or delete or update of estado_salud, fecha_hora, planta_id
  on public.registros_cuidado
  for each row execute function public.sincronizar_estado_salud();

-- 4. Datos que ya existían: nada que recalcular (aún no hay estados)

commit;
