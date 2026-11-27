-- musik scout · Datenbank (Events, Genre-Spiel, Admin)
-- In Supabase: SQL Editor → New query → alles einfügen → Run.
-- Das Skript kann gefahrlos mehrfach ausgeführt werden.

-- ── Tabellen ──────────────────────────────────────────────────────────

create table if not exists events (
  id          text primary key,              -- z. B. '2026-11-24' (steht im QR-Link)
  edition     text default '',               -- z. B. '#01'
  date        date not null,
  venue       text not null default '',
  address     text default '',
  time_label  text default '7 PM – 2 AM',
  tickets     text default '',               -- Ticket-/RSVP-Link
  poster      text default '',               -- Bild-URL des Posters (optional)
  live        jsonb not null default '[]',   -- [{"name":"Tontom","link":"","photo":""}, …]
  dj          jsonb,                         -- {"name":"…","from":"11 PM","link":"","photo":""}
  genres      jsonb not null default '["rap","jazz","indie"]', -- Auswahl im Spiel
  is_open     boolean not null default false, -- Abstimmung offen?
  spin_result text default '',               -- Ergebnis vom Rad (Gewinner-Genre fürs Freigetränk)
  created_at  timestamptz not null default now()
);

-- Ältere Version der Tabelle nachrüsten
alter table events add column if not exists poster text default '';
alter table events add column if not exists genres jsonb not null default '["rap","jazz","indie"]';
alter table events add column if not exists spin_result text default '';

create table if not exists votes (
  id         bigint generated always as identity primary key,
  event_id   text not null references events(id) on delete cascade,
  genre      text not null,
  device_id  text not null,
  code       text not null,                  -- kurzer Code, den der Gast an der Bar zeigt
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

drop policy if exists events_read  on events;
drop policy if exists events_write on events;
create policy events_read  on events for select using (true);
create policy events_write on events for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists votes_admin on votes;
create policy votes_admin on votes for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists admins_self on admins;
create policy admins_self on admins for select to authenticated using (user_id = auth.uid());

-- Tabellenrechte explizit (falls "Grant API access to new tables automatically" aus war)
grant usage on schema public to anon, authenticated;
grant select on events to anon, authenticated;
grant insert, update, delete on events to authenticated;
grant select, delete on votes to authenticated;
grant select on admins to authenticated;

-- ── Funktionen fürs Spiel ─────────────────────────────────────────────

-- Gibt {"status":"ok|already|closed","genre":"…","code":"…"} zurück
create or replace function cast_vote(p_event text, p_genre text, p_device text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_row votes%rowtype;
begin
  select * into v_row from votes where event_id = p_event and device_id = left(p_device, 64);
  if found then
    return json_build_object('status', 'already', 'genre', v_row.genre, 'code', v_row.code);
  end if;
  if not exists (select 1 from events e where e.id = p_event and e.is_open and e.genres ? p_genre) then
    return json_build_object('status', 'closed');
  end if;
  v_code := upper(substr(md5(random()::text || clock_timestamp()::text || p_device), 1, 4));
  insert into votes (event_id, genre, device_id, code) values (p_event, p_genre, left(p_device, 64), v_code);
  return json_build_object('status', 'ok', 'genre', p_genre, 'code', v_code);
exception when unique_violation then
  return json_build_object('status', 'already');
end $$;

-- Eigene Stimme wiederfinden (z. B. nach Neuladen der Seite)
create or replace function my_vote(p_event text, p_device text)
returns json language sql security definer set search_path = public as $$
  select json_build_object('genre', genre, 'code', code) from votes
  where event_id = p_event and device_id = left(p_device, 64);
$$;

create or replace function vote_results(p_event text)
returns table (genre text, votes bigint) language sql security definer set search_path = public as $$
  select g, count(v.id)
  from events e
  cross join lateral jsonb_array_elements_text(e.genres) g
  left join votes v on v.event_id = e.id and v.genre = g
  where e.id = p_event
  group by g;
$$;

grant execute on function cast_vote(text, text, text), my_vote(text, text), vote_results(text) to anon, authenticated;
grant execute on function is_admin() to authenticated;

-- ── Erstes Event (Archiv) ─────────────────────────────────────────────

insert into events (id, edition, date, venue, address, time_label, poster, live, dj)
values (
  '2026-11-24', '#01', '2026-11-24', 'Madame Claude', 'Lübbener Str. 19, 10997 Berlin', '7 PM – 2 AM',
  'assets/events/2026-11-24/poster.jpg',
  '[{"name":"Tontom","link":"","photo":"assets/events/2026-11-24/tontom.jpg"},
    {"name":"Stirling Trig","link":"","photo":"assets/events/2026-11-24/stirling-trig.jpg"},
    {"name":"Cal De Luce","link":"","photo":"assets/events/2026-11-24/cal-de-luce.jpg"}]',
  '{"name":"Raphaël Barninka","from":"11 PM","link":"","photo":"assets/events/2026-11-24/raphael-barninka.jpg"}'
) on conflict (id) do nothing;

-- ── Admin-Account ─────────────────────────────────────────────────────
-- 1. Authentication → Users → "Add user" → E-Mail + Passwort (Auto Confirm an).
-- 2. Authentication → Sign In / Providers → "Allow new users to sign up" AUS.
-- 3. Dann hier ausführen (E-Mail anpassen):
--
--    insert into admins (user_id) select id from auth.users where email = 'deine@mail.de';
