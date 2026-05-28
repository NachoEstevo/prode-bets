import { addFriendToRoom, buildInviteLink, createRoomState } from "./room-state.js";

const storageKey = (roomId) => `prode-bets:room:${roomId}`;

const readStoredRoom = async (roomId) => {
  try {
    const key = storageKey(roomId);
    const result = await chrome.storage.local.get({ [key]: null });
    return result[key];
  } catch (_error) {
    try {
      return JSON.parse(localStorage.getItem(storageKey(roomId)));
    } catch (_storageError) {
      return null;
    }
  }
};

const writeStoredRoom = async (room) => {
  const key = storageKey(room.id);

  try {
    await chrome.storage.local.set({ [key]: room });
  } catch (_error) {
    localStorage.setItem(key, JSON.stringify(room));
  }
};

export const loadRoom = async (group, matchId) => {
  const baseRoom = createRoomState(group);
  const savedRoom = await readStoredRoom(baseRoom.id);
  const room = createRoomState(savedRoom || baseRoom);

  return {
    ...room,
    inviteLink: buildInviteLink(room, matchId)
  };
};

export const addRoomFriend = async (room, friend, matchId) => {
  const nextRoom = addFriendToRoom(room, friend);
  await writeStoredRoom(nextRoom);

  return {
    ...nextRoom,
    inviteLink: buildInviteLink(nextRoom, matchId)
  };
};

export const copyInviteLink = async (room, matchId) => {
  const inviteLink = room.inviteLink || buildInviteLink(room, matchId);
  const inviteText = `Join ${room.name} on Prode Bets: ${inviteLink}`;

  try {
    await navigator.clipboard.writeText(inviteText);
  } catch (_error) {
    return inviteText;
  }

  return inviteText;
};
