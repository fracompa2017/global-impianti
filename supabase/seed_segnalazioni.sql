-- seed_segnalazioni.sql
-- Dati demo per modulo Segnalazioni e Guasti

with refs as (
  select
    (select id from public.profiles where role = 'admin' order by created_at asc limit 1) as admin_id,
    (select id from public.profiles where role = 'dipendente' order by created_at asc limit 1) as dip1_id,
    (select id from public.profiles where role = 'dipendente' order by created_at asc offset 1 limit 1) as dip2_id,
    (select id from public.profiles where role = 'dipendente' order by created_at asc offset 2 limit 1) as dip3_id,
    (select id from public.cantieri order by created_at asc limit 1) as cantiere_id
)
insert into public.segnalazioni (
  id,
  titolo,
  descrizione,
  tipo,
  priorita,
  stato,
  cliente,
  indirizzo,
  cantiere_id,
  impianto_tipo,
  created_by,
  created_at,
  updated_at
)
select
  '11111111-1111-1111-1111-111111111001'::uuid,
  'Quadro elettrico principale in allarme',
  'Segnalazione di scatto continuo del magnetotermico nel quadro generale.',
  'guasto',
  'critica',
  'aperta',
  'Condominio Aurora',
  'Via Roma 21, Milano',
  refs.cantiere_id,
  'elettrico',
  refs.admin_id,
  now() - interval '6 hours',
  now() - interval '6 hours'
from refs
union all
select
  '11111111-1111-1111-1111-111111111002'::uuid,
  'Perdita collettore bagno piano 2',
  'Presenza acqua dal collettore con pressione impianto instabile.',
  'malfunzionamento',
  'alta',
  'assegnata',
  'Hotel San Marco',
  'Via Verdi 8, Torino',
  refs.cantiere_id,
  'idraulico',
  refs.admin_id,
  now() - interval '1 day',
  now() - interval '20 hours'
from refs
union all
select
  '11111111-1111-1111-1111-111111111003'::uuid,
  'Manutenzione urgente centrale termica',
  'Rumore anomalo su circolatore primario e resa termica ridotta.',
  'manutenzione',
  'media',
  'in_lavorazione',
  'Residenza Le Betulle',
  'Corso Francia 120, Torino',
  refs.cantiere_id,
  'termico',
  refs.admin_id,
  now() - interval '3 days',
  now() - interval '2 hours'
from refs
union all
select
  '11111111-1111-1111-1111-111111111004'::uuid,
  'Inverter fotovoltaico non produce',
  'Da monitoraggio risulta impianto fermo da 48 ore.',
  'richiesta_intervento',
  'bassa',
  'risolta',
  'Azienda Agricola Sole',
  'Strada Provinciale 45, Asti',
  refs.cantiere_id,
  'fotovoltaico',
  refs.admin_id,
  now() - interval '8 days',
  now() - interval '2 days'
from refs
union all
select
  '11111111-1111-1111-1111-111111111005'::uuid,
  'Anomalia impianto antincendio',
  'Centrale antincendio con segnale di fault intermittente.',
  'emergenza',
  'alta',
  'in_attesa',
  'Centro Direzionale Delta',
  'Via Liberta 77, Bologna',
  refs.cantiere_id,
  'antincendio',
  refs.admin_id,
  now() - interval '2 days',
  now() - interval '3 hours'
from refs
on conflict (id) do nothing;

insert into public.segnalazione_foto (id, segnalazione_id, url, caption, created_at)
values
  ('21111111-1111-1111-1111-111111111001'::uuid, '11111111-1111-1111-1111-111111111001'::uuid, 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6', 'Quadro elettrico', now() - interval '5 hours'),
  ('21111111-1111-1111-1111-111111111002'::uuid, '11111111-1111-1111-1111-111111111002'::uuid, 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7', 'Punto perdita', now() - interval '20 hours'),
  ('21111111-1111-1111-1111-111111111003'::uuid, '11111111-1111-1111-1111-111111111003'::uuid, 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4', 'Centrale termica', now() - interval '2 days')
on conflict (id) do nothing;

insert into public.interventi (
  id,
  segnalazione_id,
  titolo,
  data_intervento,
  ora_inizio,
  ora_fine,
  note_pianificazione,
  created_by,
  created_at
)
values
  (
    '31111111-1111-1111-1111-111111111001'::uuid,
    '11111111-1111-1111-1111-111111111002'::uuid,
    'Intervento perdita collettore',
    current_date,
    '09:00',
    '11:00',
    'Portare kit guarnizioni e pressatrice.',
    (select id from public.profiles where role = 'admin' order by created_at asc limit 1),
    now() - interval '8 hours'
  ),
  (
    '31111111-1111-1111-1111-111111111002'::uuid,
    '11111111-1111-1111-1111-111111111003'::uuid,
    'Controllo circolatore e valvole',
    current_date + interval '1 day',
    '14:00',
    '17:00',
    'Verifica vibrazioni e bilanciamento idraulico.',
    (select id from public.profiles where role = 'admin' order by created_at asc limit 1),
    now() - interval '1 day'
  ),
  (
    '31111111-1111-1111-1111-111111111003'::uuid,
    '11111111-1111-1111-1111-111111111004'::uuid,
    'Diagnosi inverter e ripristino produzione',
    current_date - interval '2 day',
    '08:30',
    '10:30',
    'Aggiornamento firmware e verifica stringhe.',
    (select id from public.profiles where role = 'admin' order by created_at asc limit 1),
    now() - interval '3 days'
  )
on conflict (id) do nothing;

with refs as (
  select
    (select id from public.profiles where role = 'dipendente' order by created_at asc limit 1) as dip1_id,
    (select id from public.profiles where role = 'dipendente' order by created_at asc offset 1 limit 1) as dip2_id,
    (select id from public.profiles where role = 'dipendente' order by created_at asc offset 2 limit 1) as dip3_id
)
insert into public.intervento_assegnazioni (
  id,
  intervento_id,
  dipendente_id,
  notifica_inviata,
  notifica_inviata_at,
  calendar_aggiunto,
  created_at
)
select
  '41111111-1111-1111-1111-111111111001'::uuid,
  '31111111-1111-1111-1111-111111111001'::uuid,
  refs.dip1_id,
  true,
  now() - interval '7 hours',
  false,
  now() - interval '7 hours'
from refs
where refs.dip1_id is not null
union all
select
  '41111111-1111-1111-1111-111111111002'::uuid,
  '31111111-1111-1111-1111-111111111002'::uuid,
  refs.dip2_id,
  true,
  now() - interval '20 hours',
  false,
  now() - interval '20 hours'
from refs
where refs.dip2_id is not null
union all
select
  '41111111-1111-1111-1111-111111111003'::uuid,
  '31111111-1111-1111-1111-111111111003'::uuid,
  refs.dip1_id,
  true,
  now() - interval '3 days',
  true,
  now() - interval '3 days'
from refs
where refs.dip1_id is not null
union all
select
  '41111111-1111-1111-1111-111111111004'::uuid,
  '31111111-1111-1111-1111-111111111001'::uuid,
  refs.dip3_id,
  true,
  now() - interval '7 hours',
  false,
  now() - interval '7 hours'
from refs
where refs.dip3_id is not null
on conflict (intervento_id, dipendente_id) do nothing;

with refs as (
  select
    (select id from public.profiles where role = 'dipendente' order by created_at asc limit 1) as dip1_id,
    (select id from public.profiles where role = 'dipendente' order by created_at asc offset 1 limit 1) as dip2_id
)
insert into public.intervento_report (
  id,
  intervento_id,
  dipendente_id,
  descrizione_lavori,
  causa_guasto,
  soluzione_adottata,
  materiali_utilizzati,
  esito,
  rimesso_in_guasto,
  motivo_rimessa_guasto,
  ore_lavorate,
  prossimo_intervento_necessario,
  note_prossimo_intervento,
  firma_cliente,
  created_at
)
select
  '51111111-1111-1111-1111-111111111001'::uuid,
  '31111111-1111-1111-1111-111111111003'::uuid,
  refs.dip1_id,
  'Effettuata diagnostica inverter, verifica stringhe e reset allarmi.',
  'Firmware obsoleto e disallineamento parametri MPPT.',
  'Aggiornamento firmware e riconfigurazione parametri di soglia.',
  'Kit connettori MC4, minuteria, nastro autoagglomerante.',
  'risolto',
  false,
  null,
  2.0,
  false,
  null,
  'Firma cliente acquisita',
  now() - interval '2 days'
from refs
where refs.dip1_id is not null
union all
select
  '51111111-1111-1111-1111-111111111002'::uuid,
  '31111111-1111-1111-1111-111111111001'::uuid,
  refs.dip2_id,
  'Intervento su perdita collettore, sostituzione guarnizioni e test pressione.',
  'Usura componenti e vibrazione eccessiva linea.',
  'Sostituzione guarnizioni e staffaggio aggiuntivo.',
  'Guarnizioni EPDM, pasta sigillante, fascette inox.',
  'rimesso_in_guasto',
  true,
  'Perdita ridotta ma non eliminata: necessario secondo intervento con sostituzione collettore.',
  2.5,
  true,
  'Pianificare sostituzione collettore entro 48 ore.',
  'Firma cliente acquisita',
  now() - interval '3 hours'
from refs
where refs.dip2_id is not null
on conflict (intervento_id, dipendente_id) do nothing;

insert into public.intervento_foto (id, intervento_id, report_id, url, caption, tipo, created_at)
values
  ('61111111-1111-1111-1111-111111111001'::uuid, '31111111-1111-1111-1111-111111111003'::uuid, '51111111-1111-1111-1111-111111111001'::uuid, 'https://images.unsplash.com/photo-1558002038-1055e2dae1d7', 'Verifica iniziale inverter', 'prima', now() - interval '2 days'),
  ('61111111-1111-1111-1111-111111111002'::uuid, '31111111-1111-1111-1111-111111111003'::uuid, '51111111-1111-1111-1111-111111111001'::uuid, 'https://images.unsplash.com/photo-1581094794329-c8112c4e5190', 'Test produzione ripristinata', 'dopo', now() - interval '2 days'),
  ('61111111-1111-1111-1111-111111111003'::uuid, '31111111-1111-1111-1111-111111111001'::uuid, '51111111-1111-1111-1111-111111111002'::uuid, 'https://images.unsplash.com/photo-1603791440384-56cd371ee9a7', 'Punto perdita residua', 'dopo', now() - interval '3 hours')
on conflict (id) do nothing;

insert into public.segnalazione_history (id, segnalazione_id, stato_precedente, stato_nuovo, nota, changed_by, created_at)
values
  ('71111111-1111-1111-1111-111111111001'::uuid, '11111111-1111-1111-1111-111111111002'::uuid, 'aperta', 'assegnata', 'Intervento pianificato', (select id from public.profiles where role = 'admin' order by created_at asc limit 1), now() - interval '22 hours'),
  ('71111111-1111-1111-1111-111111111002'::uuid, '11111111-1111-1111-1111-111111111003'::uuid, 'aperta', 'in_lavorazione', 'Presa in carico tecnica', (select id from public.profiles where role = 'admin' order by created_at asc limit 1), now() - interval '1 day'),
  ('71111111-1111-1111-1111-111111111003'::uuid, '11111111-1111-1111-1111-111111111004'::uuid, 'assegnata', 'risolta', 'Intervento completato e chiuso', (select id from public.profiles where role = 'admin' order by created_at asc limit 1), now() - interval '2 days'),
  ('71111111-1111-1111-1111-111111111004'::uuid, '11111111-1111-1111-1111-111111111005'::uuid, 'assegnata', 'in_attesa', 'In attesa ricambio specifico', (select id from public.profiles where role = 'admin' order by created_at asc limit 1), now() - interval '3 hours')
on conflict (id) do nothing;
