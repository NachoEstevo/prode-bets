drop policy if exists "demo rooms can be upserted" on public.rooms;
create policy "demo rooms can be upserted"
on public.rooms for insert
to anon
with check (
  invite_code ~ '^PB-[A-Z0-9-]{3,24}$'
  and char_length(name) between 1 and 48
  and char_length(id) between 1 and 64
);

drop policy if exists "demo rooms can be updated" on public.rooms;
create policy "demo rooms can be updated"
on public.rooms for update
to anon
using (
  invite_code ~ '^PB-[A-Z0-9-]{3,24}$'
  and char_length(id) between 1 and 64
)
with check (
  invite_code ~ '^PB-[A-Z0-9-]{3,24}$'
  and char_length(name) between 1 and 48
  and char_length(id) between 1 and 64
);

drop policy if exists "demo picks can be updated" on public.room_picks;
create policy "demo picks can be updated"
on public.room_picks for update
to anon
using (
  char_length(id) between 1 and 64
  and char_length(room_id) between 1 and 64
)
with check (
  char_length(name) between 1 and 48
  and char_length(id) between 1 and 64
  and char_length(room_id) between 1 and 64
);
