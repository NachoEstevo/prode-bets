import assert from "node:assert/strict";
import test from "node:test";

import {
  addFriendToRoom,
  buildInviteLink,
  createLeaderboard,
  createRoomState
} from "../extension/src/social/room-state.js";
import {
  createSupabaseRoomClient,
  isSupabaseConfigured
} from "../extension/src/social/supabase-room-client.js";

const sampleRoom = {
  id: "founders-room",
  name: "Founders Room",
  inviteCode: "PB-2026",
  friends: [
    { id: "sofi", name: "Sofi", initials: "SO", outcomeId: "argentina-win", prediction: "Argentina 2-1", points: 12 },
    { id: "tomi", name: "Tomi", initials: "TO", outcomeId: "brazil-win", prediction: "Brazil win", points: 9 }
  ]
};

test("builds a shareable room invite link with match context", () => {
  const link = buildInviteLink(sampleRoom, "argentina-brazil-demo");

  assert.equal(link, "https://prode-bets.vercel.app/rooms/PB-2026?match=argentina-brazil-demo");
});

test("adds a real invited friend and recalculates leaderboard order", () => {
  const room = createRoomState(sampleRoom);
  const nextRoom = addFriendToRoom(room, {
    name: "Mati",
    outcomeId: "draw",
    prediction: "Empate en 90",
    points: 14
  });

  const leaderboard = createLeaderboard(nextRoom.friends);

  assert.equal(nextRoom.friends.length, 3);
  assert.ok(nextRoom.friends.some((friend) => friend.id === "mati"));
  assert.deepEqual(
    leaderboard.map((friend) => `${friend.name}:${friend.points}`),
    ["Mati:14", "Sofi:12", "Tomi:9"]
  );
});

test("loads and updates a room through Supabase REST when configured", async () => {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url: String(url), method: options.method || "GET", body: options.body });

    if (String(url).includes("/rooms")) {
      return Response.json([{
        id: "founders-room",
        invite_code: "PB-2026",
        name: "Founders Room",
        summary: "Remote room",
        match_id: "argentina-brazil-demo"
      }]);
    }

    if (String(url).includes("/room_picks") && (options.method || "GET") === "GET") {
      return Response.json([
        { id: "sofi", name: "Sofi", initials: "SO", outcome_id: "argentina-win", prediction: "Argentina 2-1", points: 12 },
        { id: "mati", name: "Mati", initials: "MA", outcome_id: "draw", prediction: "Draw pick", points: 10 }
      ]);
    }

    return Response.json([], { status: 201 });
  };

  const client = createSupabaseRoomClient({
    config: { enabled: true, url: "https://demo.supabase.co", anonKey: "anon-key" },
    fetchImpl
  });

  const room = await client.loadRoom(sampleRoom, "argentina-brazil-demo");
  const nextRoom = await client.addFriend(room, {
    name: "Mati",
    outcomeId: "draw",
    prediction: "Draw pick",
    points: 10
  }, "argentina-brazil-demo");

  assert.equal(isSupabaseConfigured({ enabled: true, url: "https://demo.supabase.co", anonKey: "anon-key" }), true);
  assert.equal(room.summary, "Remote room");
  assert.deepEqual(nextRoom.friends.map((friend) => friend.name), ["Sofi", "Mati"]);
  assert.ok(requests.some((request) => request.method === "POST" && request.url.includes("/rooms")));
  assert.ok(requests.some((request) => request.method === "POST" && request.url.includes("/room_picks")));
});
