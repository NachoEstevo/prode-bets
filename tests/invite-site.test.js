import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildInviteLink, createRoomState } from "../extension/src/social/room-state.js";

const readText = async (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("invite links open the public room website", () => {
  const room = createRoomState({ id: "founders-room", inviteCode: "PB-2026" });

  assert.equal(
    buildInviteLink(room, "argentina-brazil-demo"),
    "https://prode-bets.vercel.app/rooms/PB-2026?match=argentina-brazil-demo"
  );
});

test("public room page explains extension install and GitHub fallback", async () => {
  const html = await readText("rooms/index.html");
  const js = await readText("rooms/room.js");
  const css = await readText("assets/site.css");
  const vercel = await readText("vercel.json");

  assert.match(html, /data-room-app/);
  assert.match(html, /github\.com\/NachoEstevo\/prode-bets/);
  assert.match(html, /Download ZIP/);
  assert.match(html, /Load unpacked/);
  assert.match(js, /room_picks/);
  assert.match(js, /on_conflict=room_id,id/);
  assert.match(js, /SUPABASE_CONFIG/);
  assert.match(js, /endsWith\("\.html"\)/);
  assert.match(css, /room-shell/);
  assert.ok(vercel.includes('"source": "/rooms/:code"'));
  assert.ok(vercel.includes('"destination": "/rooms/index.html"'));
});
