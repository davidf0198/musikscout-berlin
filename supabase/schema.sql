-- musik scout · Voting
-- In Supabase: SQL Editor → New query → alles einfügen → Run.

create table if not exists voting_events (
  event_id  text primary key,          -- gleich wie "id" in assets/data.js, z. B. '2026-11-24'
  acts      text[] not null,           -- Namen genau wie in data.js
  is_open   boolean not null default false
);

create table if not exists votes (
  id         bigint generated always as identity primary key,
  event_id   text not null references voting_events(event_id) on delete cascade,
  act        text not null,
  device_id  text not null,
  created_at timestamptz not null default now(),
  unique (event_id, device_id)         -- eine Stimme pro Handy und Abend
);

-- Direkter Zugriff auf die Tabellen ist gesperrt; alles läuft über die Funktionen unten.
alter table voting_events enable row level security;
alter table votes enable row level security;

create or replace function voting_is_open(p_event text)
returns boolean language sql security definer set search_path = public as $$
  select coalesce((select is_open from voting_events where event_id = p_event), false);
$$;

create or replace function cast_vote(p_event text, p_act text, p_device text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from voting_events where event_id = p_event and is_open and p_act = any(acts)) then
    return 'closed';
  end if;
  insert into votes (event_id, act, device_id) values (p_event, p_act, left(p_device, 64));
  return 'ok';
exception when unique_violation then
  return 'already';
end $$;

create or replace function vote_results(p_event text)
returns table (act text, votes bigint) language sql security definer set search_path = public as $$
  select a.act, count(v.id)
  from voting_events e
  cross join lateral unnest(e.acts) as a(act)
  left join votes v on v.event_id = e.event_id and v.act = a.act
  where e.event_id = p_event
  group by a.act;
$$;

grant execute on function voting_is_open(text), cast_vote(text, text, text), vote_results(text) to anon;

-- Erstes Event anlegen (Abstimmung erstmal geschlossen):
insert into voting_events (event_id, acts)
values ('2026-11-24', array['Tontom', 'Stirling Trig', 'De Luce'])
on conflict (event_id) do nothing;

-- Am Abend öffnen:     update voting_events set is_open = true  where event_id = '2026-11-24';
-- Danach schließen:    update voting_events set is_open = false where event_id = '2026-11-24';
