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
alter table if exists votes add column if not exists insta boolean not null default false;

create table if not exists votes (
  id         bigint generated always as identity primary key,
  event_id   text not null references events(id) on delete cascade,
  genre      text not null,
  device_id  text not null,
  code       text not null,                  -- kurzer Code, den der Gast an der Bar zeigt
  insta      boolean not null default false, -- hat vor dem Spiel auf "Follow on Instagram" getippt (anonym)
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
drop function if exists cast_vote(text, text, text);
create or replace function cast_vote(p_event text, p_genre text, p_device text, p_insta boolean default false)
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
  insert into votes (event_id, genre, device_id, code, insta) values (p_event, p_genre, left(p_device, 64), v_code, coalesce(p_insta, false));
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

-- Statistik fürs Backstage: Stimmen gesamt + wie viele vorher auf Instagram getippt haben
create or replace function vote_stats(p_event text)
returns json language sql security definer set search_path = public as $$
  select case when is_admin() then
    json_build_object('total', count(*), 'insta', count(*) filter (where insta))
  else null end
  from votes where event_id = p_event;
$$;
grant execute on function vote_stats(text) to authenticated;

create or replace function vote_results(p_event text)
returns table (genre text, votes bigint) language sql security definer set search_path = public as $$
  select g, count(v.id)
  from events e
  cross join lateral jsonb_array_elements_text(e.genres) g
  left join votes v on v.event_id = e.id and v.genre = g
  where e.id = p_event
  group by g;
$$;

grant execute on function cast_vote(text, text, text, boolean), my_vote(text, text), vote_results(text) to anon, authenticated;
grant execute on function is_admin() to authenticated;

-- ── Anfragen (Künstler:innen & Locations) ─────────────────────────────

create table if not exists requests (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  kind        text not null check (kind in ('artist', 'venue')),
  name        text not null,                 -- Künstler-/Bandname bzw. Name der Location
  contact     text default '',               -- Ansprechperson
  email       text not null,
  phone       text default '',
  instagram   text default '',
  city        text default '',
  genre       text default '',
  links       text default '',               -- Spotify, SoundCloud, YouTube … (eine pro Zeile)
  message     text default '',               -- kurze Vorstellung
  details     jsonb not null default '{}',   -- weitere Felder (Kapazität, Technik, …)
  files       jsonb not null default '[]',   -- Pfade im privaten Storage-Bucket "requests"
  status      text not null default 'new' check (status in ('new', 'contacted', 'booked', 'archived')),
  notes       text default ''                -- interne Notizen
);
alter table requests enable row level security;

drop policy if exists requests_insert on requests;
drop policy if exists requests_admin  on requests;
create policy requests_insert on requests for insert to anon, authenticated
  with check (status = 'new' and notes = '' and length(name) between 1 and 200 and length(email) between 3 and 200
              and length(coalesce(message, '')) <= 5000 and length(coalesce(links, '')) <= 3000);
create policy requests_admin on requests for all to authenticated using (is_admin()) with check (is_admin());

grant insert on requests to anon, authenticated;
grant select, update, delete on requests to authenticated;

-- Privater Speicher für Anhänge (Soundprobe, EPK, Fotos). Hochladen darf jeder, ansehen nur Admins.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('requests', 'requests', false, 26214400,
        array['audio/mpeg','audio/mp4','audio/x-m4a','audio/wav','audio/x-wav','audio/aac','audio/ogg',
              'application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists requests_files_upload on storage.objects;
drop policy if exists requests_files_admin  on storage.objects;
create policy requests_files_upload on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'requests');
create policy requests_files_admin on storage.objects for all to authenticated
  using (bucket_id = 'requests' and public.is_admin()) with check (bucket_id = 'requests' and public.is_admin());

-- ── Feedback-Board (Wünsche, Vorschläge, Abnahme) ─────────────────────

create table if not exists board_items (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  author      text not null default coalesce(auth.jwt() ->> 'email', ''),
  kind        text not null default 'wish' check (kind in ('wish', 'proposal', 'bug')),
  title       text not null check (length(title) between 1 and 200),
  body        text default '',
  link        text default '',               -- z. B. Vorschau-Link oder Drive-Ordner
  status      text not null default 'open'
              check (status in ('open', 'planned', 'staging', 'approved', 'rejected', 'done'))
);

create table if not exists board_comments (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references board_items(id) on delete cascade,
  created_at  timestamptz not null default now(),
  author      text not null default coalesce(auth.jwt() ->> 'email', ''),
  body        text not null default '',
  action      text default ''                -- '', 'approved', 'rejected', 'changes', 'staging', 'done' …
);

alter table board_items enable row level security;
alter table board_comments enable row level security;
drop policy if exists board_items_admin on board_items;
drop policy if exists board_comments_admin on board_comments;
create policy board_items_admin on board_items for all to authenticated using (is_admin()) with check (is_admin());
create policy board_comments_admin on board_comments for all to authenticated using (is_admin()) with check (is_admin());
grant select, insert, update, delete on board_items, board_comments to authenticated;

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
