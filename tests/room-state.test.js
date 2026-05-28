import assert from "node:assert/strict";
import test from "node:test";

import {
  addFriendToRoom,
  buildInviteLink,
  createLeaderboard,
  createRoomState
} from "../extension/src/social/room-state.js";

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

  assert.equal(link, "https://prodebets.app/rooms/PB-2026?match=argentina-brazil-demo");
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
