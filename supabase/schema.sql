-- musik scout · Datenbank (Events, Voting, Admin)
-- In Supabase: SQL Editor → New query → alles einfügen → Run.
-- Danach: Admin-Account anlegen (siehe ganz unten).

-- ── Tabellen ──────────────────────────────────────────────────────────

create table if not exists events (
  id          text primary key,              -- z. B. '2026-11-24' (steht im QR-Link)
  edition     text default '',               -- z. B. '#01'
  date        date not null,
  venue       text not null default '',
  address     text default '',
  time_label  text default '7 PM – 2 AM',
  tickets     text default '',               -- Ticket-/RSVP-Link
  live        jsonb not null default '[]',   -- [{"name":"Tontom","link":""}, …]
  dj          jsonb,                         -- {"name":"…","from":"11 PM","link":""}
  winner      text default '',
  is_open     boolean not null default false, -- Voting offen?
  created_at  timestamptz not null default now()
);

create table if not exists votes (
  id         bigint generated always as identity primary key,
  event_id   text not null references events(id) on delete cascade,
  act        text not null,
  device_id  text not null,
  created_at timestamptz not null default now(),
  unique (event_id, device_id)               -- eine Stimme pro Handy und Abend
);

create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- ── Zugriffsregeln ────────────────────────────────────────────────────

alter table events enable row level security;
alter table votes  enable row level security;
alter table admins enable row level security;

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- Events: alle dürfen lesen, nur Admins schreiben
drop policy if exists events_read  on events;
drop policy if exists events_write on events;
create policy events_read  on events for select using (true);
create policy events_write on events for all to authenticated using (is_admin()) with check (is_admin());

-- Votes: niemand direkt (nur über die Funktionen); Admins dürfen löschen (z. B. Test-Stimmen)
drop policy if exists votes_admin on votes;
create policy votes_admin on votes for all to authenticated using (is_admin()) with check (is_admin());

-- Admins: jeder sieht nur sich selbst
drop policy if exists admins_self on admins;
create policy admins_self on admins for select to authenticated using (user_id = auth.uid());

-- Tabellenrechte explizit vergeben (nötig, wenn "Grant API access to new tables
-- automatically" beim Anlegen des Projekts aus war). Die Regeln oben schränken
-- zusätzlich ein, wer welche Zeilen sehen bzw. ändern darf.
grant usage on schema public to anon, authenticated;
grant select on events to anon, authenticated;
grant insert, update, delete on events to authenticated;
grant select, delete on votes to authenticated;
grant select on admins to authenticated;

-- ── Funktionen fürs Voting ────────────────────────────────────────────

create or replace function cast_vote(p_event text, p_act text, p_device text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from events e
    where e.id = p_event and e.is_open
      and exists (select 1 from jsonb_array_elements(e.live) a where a->>'name' = p_act)
  ) then
    return 'closed';
  end if;
  insert into votes (event_id, act, device_id) values (p_event, p_act, left(p_device, 64));
  return 'ok';
exception when unique_violation then
  return 'already';
end $$;

create or replace function vote_results(p_event text)
returns table (act text, votes bigint) language sql security definer set search_path = public as $$
  select a->>'name', count(v.id)
  from events e
  cross join lateral jsonb_array_elements(e.live) a
  left join votes v on v.event_id = e.id and v.act = a->>'name'
  where e.id = p_event
  group by a->>'name';
$$;

grant execute on function cast_vote(text, text, text), vote_results(text) to anon, authenticated;
grant execute on function is_admin() to authenticated;

-- ── Erstes Event ──────────────────────────────────────────────────────

insert into events (id, edition, date, venue, address, time_label, live, dj)
values (
  '2026-11-24', '#01', '2026-11-24', 'Madame Claude', 'Lübbener Str. 19, 10997 Berlin', '7 PM – 2 AM',
  '[{"name":"Tontom","link":""},{"name":"Stirling Trig","link":""},{"name":"De Luce","link":""}]',
  '{"name":"Raphaël Barninka","from":"11 PM","link":""}'
) on conflict (id) do nothing;

-- ── Admin-Account ─────────────────────────────────────────────────────
-- 1. Authentication → Users → "Add user" → E-Mail + Passwort (Auto Confirm an).
-- 2. Authentication → Sign In / Providers → "Allow new users to sign up" AUS (damit sich niemand selbst registriert).
-- 3. Dann hier ausführen (E-Mail anpassen):
--
--    insert into admins (user_id) select id from auth.users where email = 'deine@mail.de';
