-- 002_segnalazioni.sql
-- Modulo gestione segnalazioni e guasti per Supabase/PostgreSQL

create extension if not exists pgcrypto;

create sequence if not exists public.segnalazioni_code_seq;

create table if not exists public.segnalazioni (
  id uuid primary key default gen_random_uuid(),
  codice text unique,
  titolo text not null,
  descrizione text not null,
  tipo text check (tipo in (
    'guasto', 'malfunzionamento', 'manutenzione',
    'emergenza', 'richiesta_intervento', 'altro'
  )),
  priorita text check (priorita in ('bassa', 'media', 'alta', 'critica')) default 'media',
  stato text check (stato in ('aperta', 'assegnata', 'in_lavorazione', 'risolta', 'chiusa', 'in_attesa')) default 'aperta',
  cliente text,
  indirizzo text,
  cantiere_id uuid references public.cantieri(id) on delete set null,
  impianto_tipo text check (impianto_tipo in (
    'elettrico', 'idraulico', 'termico',
    'fotovoltaico', 'antincendio', 'altro'
  )),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.segnalazione_foto (
  id uuid primary key default gen_random_uuid(),
  segnalazione_id uuid references public.segnalazioni(id) on delete cascade,
  url text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists public.interventi (
  id uuid primary key default gen_random_uuid(),
  segnalazione_id uuid references public.segnalazioni(id) on delete cascade,
  titolo text,
  data_intervento date not null,
  ora_inizio time,
  ora_fine time,
  note_pianificazione text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.intervento_assegnazioni (
  id uuid primary key default gen_random_uuid(),
  intervento_id uuid references public.interventi(id) on delete cascade,
  dipendente_id uuid references public.profiles(id) on delete cascade,
  notifica_inviata boolean default false,
  notifica_inviata_at timestamptz,
  calendar_aggiunto boolean default false,
  created_at timestamptz not null default now(),
  unique (intervento_id, dipendente_id)
);

create table if not exists public.intervento_report (
  id uuid primary key default gen_random_uuid(),
  intervento_id uuid references public.interventi(id) on delete cascade,
  dipendente_id uuid references public.profiles(id),
  descrizione_lavori text not null,
  causa_guasto text,
  soluzione_adottata text,
  materiali_utilizzati text,
  esito text check (esito in ('risolto', 'parzialmente_risolto', 'non_risolto', 'rimesso_in_guasto')),
  rimesso_in_guasto boolean default false,
  motivo_rimessa_guasto text,
  ore_lavorate numeric,
  prossimo_intervento_necessario boolean default false,
  note_prossimo_intervento text,
  firma_cliente text,
  created_at timestamptz not null default now(),
  unique (intervento_id, dipendente_id)
);

create table if not exists public.intervento_foto (
  id uuid primary key default gen_random_uuid(),
  intervento_id uuid references public.interventi(id) on delete cascade,
  report_id uuid references public.intervento_report(id) on delete set null,
  url text not null,
  caption text,
  tipo text check (tipo in ('prima', 'durante', 'dopo')),
  created_at timestamptz not null default now()
);

create table if not exists public.segnalazione_history (
  id uuid primary key default gen_random_uuid(),
  segnalazione_id uuid references public.segnalazioni(id) on delete cascade,
  stato_precedente text,
  stato_nuovo text,
  nota text,
  changed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.segnalazione_commenti (
  id uuid primary key default gen_random_uuid(),
  segnalazione_id uuid references public.segnalazioni(id) on delete cascade,
  autore_id uuid references public.profiles(id),
  testo text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_segnalazioni_stato on public.segnalazioni(stato);
create index if not exists idx_segnalazioni_priorita on public.segnalazioni(priorita);
create index if not exists idx_segnalazioni_created_at on public.segnalazioni(created_at desc);
create index if not exists idx_interventi_segnalazione_id on public.interventi(segnalazione_id);
create index if not exists idx_interventi_data_intervento on public.interventi(data_intervento);
create index if not exists idx_intervento_assegnazioni_intervento_id on public.intervento_assegnazioni(intervento_id);
create index if not exists idx_intervento_assegnazioni_dipendente_id on public.intervento_assegnazioni(dipendente_id);
create index if not exists idx_intervento_report_intervento_id on public.intervento_report(intervento_id);
create index if not exists idx_intervento_report_dipendente_id on public.intervento_report(dipendente_id);
create index if not exists idx_intervento_report_esito on public.intervento_report(esito);
create index if not exists idx_segnalazione_history_segnalazione_id on public.segnalazione_history(segnalazione_id);
create index if not exists idx_segnalazione_commenti_segnalazione_id on public.segnalazione_commenti(segnalazione_id);

create or replace function public.generate_segnalazione_codice()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.codice is null or new.codice = '' then
    new.codice := 'SEG-' || to_char(coalesce(new.created_at, now()), 'YYYY') || '-' || lpad(nextval('public.segnalazioni_code_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create or replace function public.touch_segnalazioni_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.log_segnalazione_state_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.stato is distinct from new.stato then
    insert into public.segnalazione_history (
      segnalazione_id,
      stato_precedente,
      stato_nuovo,
      nota,
      changed_by,
      created_at
    )
    values (
      new.id,
      old.stato,
      new.stato,
      null,
      auth.uid(),
      now()
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_segnalazioni_code on public.segnalazioni;
create trigger trg_segnalazioni_code
before insert on public.segnalazioni
for each row
execute function public.generate_segnalazione_codice();

drop trigger if exists trg_segnalazioni_updated_at on public.segnalazioni;
create trigger trg_segnalazioni_updated_at
before update on public.segnalazioni
for each row
execute function public.touch_segnalazioni_updated_at();

drop trigger if exists trg_segnalazioni_history on public.segnalazioni;
create trigger trg_segnalazioni_history
after update on public.segnalazioni
for each row
execute function public.log_segnalazione_state_change();

alter table public.segnalazioni enable row level security;
alter table public.segnalazione_foto enable row level security;
alter table public.interventi enable row level security;
alter table public.intervento_assegnazioni enable row level security;
alter table public.intervento_report enable row level security;
alter table public.intervento_foto enable row level security;
alter table public.segnalazione_history enable row level security;
alter table public.segnalazione_commenti enable row level security;

-- admin full access
create policy "segnalazioni_admin_all" on public.segnalazioni for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "segnalazione_foto_admin_all" on public.segnalazione_foto for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "interventi_admin_all" on public.interventi for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "intervento_assegnazioni_admin_all" on public.intervento_assegnazioni for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "intervento_report_admin_all" on public.intervento_report for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "intervento_foto_admin_all" on public.intervento_foto for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "segnalazione_history_admin_all" on public.segnalazione_history for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "segnalazione_commenti_admin_all" on public.segnalazione_commenti for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- dipendente access scope
create policy "segnalazioni_dipendente_select_assigned"
on public.segnalazioni
for select to authenticated
using (
  exists (
    select 1
    from public.interventi i
    join public.intervento_assegnazioni ia on ia.intervento_id = i.id
    where i.segnalazione_id = segnalazioni.id
      and ia.dipendente_id = auth.uid()
  )
);

create policy "segnalazione_foto_dipendente_select_assigned"
on public.segnalazione_foto
for select to authenticated
using (
  exists (
    select 1
    from public.interventi i
    join public.intervento_assegnazioni ia on ia.intervento_id = i.id
    where i.segnalazione_id = segnalazione_foto.segnalazione_id
      and ia.dipendente_id = auth.uid()
  )
);

create policy "interventi_dipendente_select_assigned"
on public.interventi
for select to authenticated
using (
  exists (
    select 1
    from public.intervento_assegnazioni ia
    where ia.intervento_id = interventi.id
      and ia.dipendente_id = auth.uid()
  )
);

create policy "intervento_assegnazioni_dipendente_select_self"
on public.intervento_assegnazioni
for select to authenticated
using (dipendente_id = auth.uid());

create policy "intervento_assegnazioni_dipendente_update_self"
on public.intervento_assegnazioni
for update to authenticated
using (dipendente_id = auth.uid())
with check (dipendente_id = auth.uid());

create policy "intervento_report_dipendente_select_self_or_assigned"
on public.intervento_report
for select to authenticated
using (
  dipendente_id = auth.uid()
  or exists (
    select 1
    from public.intervento_assegnazioni ia
    where ia.intervento_id = intervento_report.intervento_id
      and ia.dipendente_id = auth.uid()
  )
);

create policy "intervento_report_dipendente_insert_self"
on public.intervento_report
for insert to authenticated
with check (
  dipendente_id = auth.uid()
  and exists (
    select 1
    from public.intervento_assegnazioni ia
    where ia.intervento_id = intervento_report.intervento_id
      and ia.dipendente_id = auth.uid()
  )
);

create policy "intervento_foto_dipendente_select_assigned"
on public.intervento_foto
for select to authenticated
using (
  exists (
    select 1
    from public.intervento_assegnazioni ia
    where ia.intervento_id = intervento_foto.intervento_id
      and ia.dipendente_id = auth.uid()
  )
);

create policy "intervento_foto_dipendente_insert_assigned"
on public.intervento_foto
for insert to authenticated
with check (
  exists (
    select 1
    from public.intervento_assegnazioni ia
    where ia.intervento_id = intervento_foto.intervento_id
      and ia.dipendente_id = auth.uid()
  )
);

create policy "segnalazione_history_dipendente_select_assigned"
on public.segnalazione_history
for select to authenticated
using (
  exists (
    select 1
    from public.interventi i
    join public.intervento_assegnazioni ia on ia.intervento_id = i.id
    where i.segnalazione_id = segnalazione_history.segnalazione_id
      and ia.dipendente_id = auth.uid()
  )
);

create policy "segnalazione_commenti_dipendente_select_assigned"
on public.segnalazione_commenti
for select to authenticated
using (
  exists (
    select 1
    from public.interventi i
    join public.intervento_assegnazioni ia on ia.intervento_id = i.id
    where i.segnalazione_id = segnalazione_commenti.segnalazione_id
      and ia.dipendente_id = auth.uid()
  )
);

create policy "segnalazione_commenti_dipendente_insert_assigned"
on public.segnalazione_commenti
for insert to authenticated
with check (
  autore_id = auth.uid()
  and exists (
    select 1
    from public.interventi i
    join public.intervento_assegnazioni ia on ia.intervento_id = i.id
    where i.segnalazione_id = segnalazione_commenti.segnalazione_id
      and ia.dipendente_id = auth.uid()
  )
);
