const ROOM_BASE_URL = "https://prodebets.app/rooms";

const slugify = (value) =>
  String(value || "friend")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "friend";

const initialsFromName = (name) =>
  String(name || "Friend")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "FR";

const normalizeFriend = (friend) => ({
  id: friend.id || slugify(friend.name),
  name: String(friend.name || "Friend").trim(),
  initials: friend.initials || initialsFromName(friend.name),
  outcomeId: friend.outcomeId,
  prediction: friend.prediction || "Joined the room",
  points: Number.isFinite(Number(friend.points)) ? Number(friend.points) : 0
});

export const createLeaderboard = (friends = []) =>
  friends
    .map(normalizeFriend)
    .sort((left, right) => right.points - left.points || left.name.localeCompare(right.name));

export const createRoomState = (group = {}) => ({
  id: group.id || slugify(group.name || "room"),
  name: group.name || "Matchday Room",
  inviteCode: group.inviteCode || "PB-2026",
  summary: group.summary || "Invite friends and track picks before kickoff.",
  friends: createLeaderboard(group.friends || [])
});

export const buildInviteLink = (room, matchId, baseUrl = ROOM_BASE_URL) => {
  const code = encodeURIComponent(room.inviteCode || room.id);
  const match = encodeURIComponent(matchId || "matchday");
  return `${baseUrl}/${code}?match=${match}`;
};

export const addFriendToRoom = (room, friend) => {
  const nextFriend = normalizeFriend(friend);
  const withoutDuplicate = (room.friends || []).filter((item) => item.id !== nextFriend.id);

  return {
    ...room,
    friends: createLeaderboard([...withoutDuplicate, nextFriend])
  };
};
