create table if not exists public.rooms (
  id text primary key,
  invite_code text not null,
  match_id text not null,
  name text not null,
  summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (invite_code)
);

create table if not exists public.room_picks (
  room_id text not null references public.rooms(id) on delete cascade,
  id text not null,
  name text not null,
  initials text not null,
  outcome_id text not null,
  prediction text not null default 'Joined the room',
  points integer not null default 0 check (points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (room_id, id)
);

alter table public.rooms enable row level security;
alter table public.room_picks enable row level security;

drop policy if exists "demo rooms are readable" on public.rooms;
create policy "demo rooms are readable"
on public.rooms for select
to anon
using (true);

drop policy if exists "demo rooms can be upserted" on public.rooms;
create policy "demo rooms can be upserted"
on public.rooms for insert
to anon
with check (true);

drop policy if exists "demo rooms can be updated" on public.rooms;
create policy "demo rooms can be updated"
on public.rooms for update
to anon
using (true)
with check (true);

drop policy if exists "demo picks are readable" on public.room_picks;
create policy "demo picks are readable"
on public.room_picks for select
to anon
using (true);

drop policy if exists "demo picks can be upserted" on public.room_picks;
create policy "demo picks can be upserted"
on public.room_picks for insert
to anon
with check (char_length(name) between 1 and 48);

drop policy if exists "demo picks can be updated" on public.room_picks;
create policy "demo picks can be updated"
on public.room_picks for update
to anon
using (true)
with check (char_length(name) between 1 and 48);
