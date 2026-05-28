import {
  addFriendToRoom,
  buildInviteLink,
  createLeaderboard,
  createRoomState
} from "./room-state.js";

const jsonHeaders = (config) => ({
  apikey: config.anonKey,
  Authorization: `Bearer ${config.anonKey}`,
  "Content-Type": "application/json"
});

const cleanUrl = (url) => String(url || "").replace(/\/$/, "");

const apiUrl = (config, table, query = "") =>
  `${cleanUrl(config.url)}/rest/v1/${table}${query}`;

const assertOk = async (response, action) => {
  if (response.ok) {
    return;
  }

  const body = await response.text().catch(() => "");
  throw new Error(`Supabase ${action} failed: ${response.status} ${body}`.trim());
};

const toRoomRow = (room, matchId) => ({
  id: room.id,
  invite_code: room.inviteCode,
  match_id: matchId,
  name: room.name,
  summary: room.summary
});

const toPickRow = (roomId, friend) => ({
  room_id: roomId,
  id: friend.id,
  name: friend.name,
  initials: friend.initials,
  outcome_id: friend.outcomeId,
  prediction: friend.prediction,
  points: friend.points
});

const fromPickRow = (row) => ({
  id: row.id,
  name: row.name,
  initials: row.initials,
  outcomeId: row.outcome_id,
  prediction: row.prediction,
  points: row.points
});

const fromRoomRow = (row, fallback) => createRoomState({
  id: row.id,
  name: row.name,
  inviteCode: row.invite_code,
  summary: row.summary || fallback.summary,
  friends: fallback.friends
});

export const isSupabaseConfigured = (config) =>
  config?.enabled === true && Boolean(config.url && config.anonKey);

export const createSupabaseRoomClient = ({ config, fetchImpl = fetch }) => {
  const upsertRows = async (table, rows, conflict) => {
    const response = await fetchImpl(apiUrl(config, table, `?on_conflict=${conflict}`), {
      method: "POST",
      headers: {
        ...jsonHeaders(config),
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(rows)
    });
    await assertOk(response, `upsert ${table}`);
  };

  const getRows = async (table, query) => {
    const response = await fetchImpl(apiUrl(config, table, query), {
      headers: jsonHeaders(config)
    });
    await assertOk(response, `load ${table}`);
    return response.json();
  };

  const loadRoom = async (group, matchId) => {
    const fallbackRoom = createRoomState(group);
    await upsertRows("rooms", [toRoomRow(fallbackRoom, matchId)], "invite_code");

    const roomRows = await getRows(
      "rooms",
      `?invite_code=eq.${encodeURIComponent(fallbackRoom.inviteCode)}&limit=1`
    );
    const room = fromRoomRow(roomRows[0] || toRoomRow(fallbackRoom, matchId), fallbackRoom);

    const pickRows = await getRows(
      "room_picks",
      `?room_id=eq.${encodeURIComponent(room.id)}&order=points.desc,name.asc`
    );
    if (pickRows.length === 0 && fallbackRoom.friends.length > 0) {
      await upsertRows("room_picks", fallbackRoom.friends.map((friend) =>
        toPickRow(room.id, friend)
      ), "room_id,id");
      return {
        ...room,
        friends: fallbackRoom.friends,
        inviteLink: buildInviteLink(room, matchId)
      };
    }

    return {
      ...room,
      friends: createLeaderboard(pickRows.map(fromPickRow)),
      inviteLink: buildInviteLink(room, matchId)
    };
  };

  const addFriend = async (room, friend, matchId) => {
    const nextRoom = addFriendToRoom(room, friend);
    const addedFriend = nextRoom.friends.find((item) => item.id === friend.id)
      || nextRoom.friends.find((item) => item.name === friend.name);

    await upsertRows("room_picks", [toPickRow(nextRoom.id, addedFriend)], "room_id,id");
    return loadRoom(nextRoom, matchId);
  };

  const subscribeRoom = (room, matchId, onRoom) => {
    const interval = setInterval(async () => {
      const nextRoom = await loadRoom(room, matchId);
      onRoom(nextRoom);
    }, config.pollMs || 4000);

    return () => clearInterval(interval);
  };

  return { addFriend, loadRoom, subscribeRoom };
};
