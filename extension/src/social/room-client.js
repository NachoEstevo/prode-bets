import { addFriendToRoom, buildInviteLink, createRoomState } from "./room-state.js";
import { SUPABASE_CONFIG } from "../config/supabase.js";
import {
  createSupabaseRoomClient,
  isSupabaseConfigured
} from "./supabase-room-client.js";

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

const remoteClient = () => isSupabaseConfigured(SUPABASE_CONFIG)
  ? createSupabaseRoomClient({ config: SUPABASE_CONFIG })
  : null;

const withInvite = (room, matchId, syncStatus) => ({
  ...room,
  inviteLink: buildInviteLink(room, matchId),
  syncStatus
});

export const loadRoom = async (group, matchId) => {
  const remote = remoteClient();
  if (remote) {
    try {
      return withInvite(await remote.loadRoom(group, matchId), matchId, "supabase");
    } catch (error) {
      console.warn("[Prode Bets] Supabase room load failed, using local room", error);
    }
  }

  const baseRoom = createRoomState(group);
  const savedRoom = await readStoredRoom(baseRoom.id);
  const room = createRoomState(savedRoom || baseRoom);

  return withInvite(room, matchId, "local");
};

export const addRoomFriend = async (room, friend, matchId) => {
  const remote = remoteClient();
  if (remote) {
    try {
      return withInvite(await remote.addFriend(room, friend, matchId), matchId, "supabase");
    } catch (error) {
      console.warn("[Prode Bets] Supabase room update failed, using local room", error);
    }
  }

  const nextRoom = addFriendToRoom(room, friend);
  await writeStoredRoom(nextRoom);

  return withInvite(nextRoom, matchId, "local");
};

export const subscribeRoom = (room, matchId, onRoom) => {
  const remote = remoteClient();
  if (!remote) {
    return () => {};
  }

  return remote.subscribeRoom(room, matchId, (nextRoom) => {
    onRoom(withInvite(nextRoom, matchId, "supabase"));
  });
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
