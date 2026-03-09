-- Global Impianti - schema iniziale

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text not null default 'dipendente' check (role in ('admin', 'dipendente')),
  avatar_url text,
  push_subscription jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.cantieri (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cliente text,
  indirizzo text,
  descrizione text,
  stato text check (stato in ('pianificato', 'in_corso', 'completato', 'sospeso')),
  data_inizio date,
  data_fine_prevista date,
  data_fine_effettiva date,
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.cantiere_assegnazioni (
  id uuid primary key default gen_random_uuid(),
  cantiere_id uuid references public.cantieri(id) on delete cascade,
  dipendente_id uuid references public.profiles(id) on delete cascade,
  data_inizio date,
  data_fine date,
  ruolo_cantiere text,
  created_at timestamptz not null default now(),
  unique (cantiere_id, dipendente_id)
);

create table if not exists public.turni (
  id uuid primary key default gen_random_uuid(),
  dipendente_id uuid references public.profiles(id),
  cantiere_id uuid references public.cantieri(id),
  data date not null,
  ora_inizio time,
  ora_fine time,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.timbrature (
  id uuid primary key default gen_random_uuid(),
  dipendente_id uuid references public.profiles(id),
  cantiere_id uuid references public.cantieri(id),
  data date not null,
  ora_entrata timestamptz,
  ora_uscita timestamptz,
  ore_totali numeric generated always as (
    extract(epoch from (ora_uscita - ora_entrata)) / 3600
  ) stored,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.report_giornalieri (
  id uuid primary key default gen_random_uuid(),
  dipendente_id uuid references public.profiles(id),
  cantiere_id uuid references public.cantieri(id),
  data date not null,
  testo text,
  testo_generato_ai text,
  meteo text,
  materiali_utilizzati text,
  problemi_riscontrati text,
  created_at timestamptz not null default now()
);

create table if not exists public.report_foto (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.report_giornalieri(id) on delete cascade,
  url text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  cantiere_id uuid references public.cantieri(id) on delete cascade,
  titolo text not null,
  descrizione text,
  data_prevista date,
  data_completamento date,
  completata boolean not null default false,
  percentuale_avanzamento integer not null default 0,
  ordine integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.documenti (
  id uuid primary key default gen_random_uuid(),
  dipendente_id uuid references public.profiles(id),
  cantiere_id uuid references public.cantieri(id),
  tipo text check (tipo in ('busta_paga', 'certificato', 'contratto', 'altro')),
  nome text not null,
  url text not null,
  mese integer,
  anno integer,
  created_at timestamptz not null default now()
);

create table if not exists public.preventivi (
  id uuid primary key default gen_random_uuid(),
  cantiere_id uuid references public.cantieri(id),
  cliente text,
  titolo text,
  stato text check (stato in ('bozza', 'inviato', 'accettato', 'rifiutato')),
  contenuto_ai jsonb,
  totale numeric,
  pdf_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.notifiche (
  id uuid primary key default gen_random_uuid(),
  destinatario_id uuid references public.profiles(id),
  titolo text,
  messaggio text,
  tipo text,
  letta boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_cantieri_stato on public.cantieri(stato);
create index if not exists idx_assegnazioni_cantiere on public.cantiere_assegnazioni(cantiere_id);
create index if not exists idx_assegnazioni_dipendente on public.cantiere_assegnazioni(dipendente_id);
create index if not exists idx_turni_dipendente_data on public.turni(dipendente_id, data);
create index if not exists idx_timbrature_dipendente_data on public.timbrature(dipendente_id, data);
create index if not exists idx_report_dipendente_data on public.report_giornalieri(dipendente_id, data);
create index if not exists idx_milestones_cantiere_ordine on public.milestones(cantiere_id, ordine);
create index if not exists idx_documenti_dipendente_data on public.documenti(dipendente_id, created_at desc);
create index if not exists idx_notifiche_destinatario_data on public.notifiche(destinatario_id, created_at desc);

-- trigger opzionale per sincronizzare auth.users -> profiles
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    'dipendente'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- funzioni helper per policy
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.is_dipendente()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'dipendente'
  );
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.cantieri enable row level security;
alter table public.cantiere_assegnazioni enable row level security;
alter table public.turni enable row level security;
alter table public.timbrature enable row level security;
alter table public.report_giornalieri enable row level security;
alter table public.report_foto enable row level security;
alter table public.milestones enable row level security;
alter table public.documenti enable row level security;
alter table public.preventivi enable row level security;
alter table public.notifiche enable row level security;

-- profiles
create policy "profiles_select_self_or_admin"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.is_admin());

create policy "profiles_update_self_or_admin"
on public.profiles
for update
to authenticated
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

create policy "profiles_insert_admin"
on public.profiles
for insert
to authenticated
with check (public.is_admin());

create policy "profiles_delete_admin"
on public.profiles
for delete
to authenticated
using (public.is_admin());

-- cantieri
create policy "cantieri_select_admin_or_assigned"
on public.cantieri
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.cantiere_assegnazioni ca
    where ca.cantiere_id = cantieri.id
      and ca.dipendente_id = auth.uid()
  )
);

create policy "cantieri_insert_admin"
on public.cantieri
for insert
to authenticated
with check (public.is_admin());

create policy "cantieri_update_admin"
on public.cantieri
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "cantieri_delete_admin"
on public.cantieri
for delete
to authenticated
using (public.is_admin());

-- cantiere_assegnazioni
create policy "assegnazioni_select_admin_or_self"
on public.cantiere_assegnazioni
for select
to authenticated
using (public.is_admin() or dipendente_id = auth.uid());

create policy "assegnazioni_manage_admin"
on public.cantiere_assegnazioni
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- turni
create policy "turni_select_admin_or_self"
on public.turni
for select
to authenticated
using (public.is_admin() or dipendente_id = auth.uid());

create policy "turni_manage_admin"
on public.turni
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- timbrature
create policy "timbrature_select_admin_or_self"
on public.timbrature
for select
to authenticated
using (public.is_admin() or dipendente_id = auth.uid());

create policy "timbrature_insert_self_or_admin"
on public.timbrature
for insert
to authenticated
with check (public.is_admin() or dipendente_id = auth.uid());

create policy "timbrature_update_self_or_admin"
on public.timbrature
for update
to authenticated
using (public.is_admin() or dipendente_id = auth.uid())
with check (public.is_admin() or dipendente_id = auth.uid());

-- report_giornalieri
create policy "report_select_admin_or_self"
on public.report_giornalieri
for select
to authenticated
using (public.is_admin() or dipendente_id = auth.uid());

create policy "report_insert_self_or_admin"
on public.report_giornalieri
for insert
to authenticated
with check (public.is_admin() or dipendente_id = auth.uid());

create policy "report_update_self_or_admin"
on public.report_giornalieri
for update
to authenticated
using (public.is_admin() or dipendente_id = auth.uid())
with check (public.is_admin() or dipendente_id = auth.uid());

-- report_foto
create policy "report_foto_select_admin_or_owner"
on public.report_foto
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.report_giornalieri rg
    where rg.id = report_foto.report_id
      and rg.dipendente_id = auth.uid()
  )
);

create policy "report_foto_insert_admin_or_owner"
on public.report_foto
for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
    from public.report_giornalieri rg
    where rg.id = report_foto.report_id
      and rg.dipendente_id = auth.uid()
  )
);

create policy "report_foto_delete_admin"
on public.report_foto
for delete
to authenticated
using (public.is_admin());

-- milestones
create policy "milestones_select_admin_or_assigned"
on public.milestones
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.cantiere_assegnazioni ca
    where ca.cantiere_id = milestones.cantiere_id
      and ca.dipendente_id = auth.uid()
  )
);

create policy "milestones_manage_admin"
on public.milestones
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- documenti
create policy "documenti_select_admin_or_self"
on public.documenti
for select
to authenticated
using (public.is_admin() or dipendente_id = auth.uid());

create policy "documenti_manage_admin"
on public.documenti
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- preventivi
create policy "preventivi_select_admin"
on public.preventivi
for select
to authenticated
using (public.is_admin());

create policy "preventivi_manage_admin"
on public.preventivi
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- notifiche
create policy "notifiche_select_admin_or_self"
on public.notifiche
for select
to authenticated
using (public.is_admin() or destinatario_id = auth.uid());

create policy "notifiche_insert_admin"
on public.notifiche
for insert
to authenticated
with check (public.is_admin());

create policy "notifiche_update_admin_or_self"
on public.notifiche
for update
to authenticated
using (public.is_admin() or destinatario_id = auth.uid())
with check (public.is_admin() or destinatario_id = auth.uid());

-- storage buckets consigliati
insert into storage.buckets (id, name, public)
values ('report-foto', 'report-foto', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('documenti', 'documenti', false)
on conflict (id) do nothing;

-- policy storage report-foto
create policy "report_foto_public_read"
on storage.objects
for select
to public
using (bucket_id = 'report-foto');

create policy "report_foto_insert_auth"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'report-foto');

create policy "documenti_read_admin_or_owner"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documenti'
  and (
    public.is_admin()
    or auth.uid()::text = (storage.foldername(name))[1]
  )
);

create policy "documenti_upload_admin"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'documenti' and public.is_admin());
