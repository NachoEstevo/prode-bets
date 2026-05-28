import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readText = async (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Supabase migration creates shared rooms and guarded public picks", async () => {
  const sql = await readText("supabase/migrations/20260528_create_rooms.sql");

  assert.match(sql, /create table if not exists public\.rooms/i);
  assert.match(sql, /create table if not exists public\.room_picks/i);
  assert.match(sql, /alter table public\.rooms enable row level security/i);
  assert.match(sql, /alter table public\.room_picks enable row level security/i);
  assert.match(sql, /create policy "demo rooms are readable"/i);
  assert.match(sql, /create policy "demo picks can be upserted"/i);
  assert.match(sql, /unique \(invite_code\)/i);
  assert.match(sql, /primary key \(room_id, id\)/i);
});
