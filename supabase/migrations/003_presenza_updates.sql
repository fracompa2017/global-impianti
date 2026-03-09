-- 003_presenza_updates.sql
-- Aggiornamento modello presenze dipendente e report senza meteo

alter table public.timbrature
  add column if not exists tipo_giornata text
    check (tipo_giornata in ('intera', 'mezza'))
    default 'intera';

alter table public.timbrature
  drop column if exists ore_totali;

alter table public.timbrature
  drop column if exists ora_entrata;

alter table public.timbrature
  drop column if exists ora_uscita;

with dedupe as (
  select
    id,
    row_number() over (
      partition by dipendente_id, data
      order by created_at desc, id desc
    ) as rn
  from public.timbrature
)
delete from public.timbrature
where id in (
  select id
  from dedupe
  where rn > 1
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'unique_presenza_giornaliera'
      and conrelid = 'public.timbrature'::regclass
  ) then
    alter table public.timbrature
      add constraint unique_presenza_giornaliera
      unique (dipendente_id, data);
  end if;
end
$$;

alter table public.report_giornalieri
  drop column if exists meteo;

create index if not exists idx_turni_dipendente_data
  on public.turni(dipendente_id, data);

create index if not exists idx_timbrature_dipendente_mese
  on public.timbrature(dipendente_id, date_trunc('month', data::timestamp));
