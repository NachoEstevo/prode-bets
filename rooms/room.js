import { SUPABASE_CONFIG } from "/extension/src/config/supabase.js";

const OUTCOMES = {
  "argentina-win": "Argentina",
  draw: "Draw",
  "brazil-win": "Brazil"
};

const $ = (selector) => document.querySelector(selector);

const headers = () => ({
  apikey: SUPABASE_CONFIG.anonKey,
  Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
  "Content-Type": "application/json"
});

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

const apiUrl = (table, query = "") =>
  `${SUPABASE_CONFIG.url}/rest/v1/${table}${query}`;

const getRoomCode = () => {
  const queryRoom = new URLSearchParams(window.location.search).get("room");
  if (queryRoom) {
    return queryRoom;
  }

  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[0] === "rooms" && parts[1] && !parts[1].endsWith(".html")
    ? decodeURIComponent(parts[1])
    : "PB-2026";
};

const request = async (table, query, options = {}) => {
  const response = await fetch(apiUrl(table, query), {
    ...options,
    headers: { ...headers(), ...(options.headers || {}) }
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed: ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
};

const renderLeaderboard = (friends) => {
  const list = $("[data-leaderboard]");
  if (friends.length === 0) {
    list.innerHTML = "<li>No picks yet. Be the first in.</li>";
    return;
  }

  list.innerHTML = friends.map((friend, index) => `
    <li>
      <span>${index + 1}</span>
      <strong>${friend.initials}</strong>
      <div>
        <b>${friend.name}</b>
        <small>${friend.prediction} on ${OUTCOMES[friend.outcome_id] || friend.outcome_id}</small>
      </div>
      <em>${friend.points} pts</em>
    </li>
  `).join("");
};

const loadRoom = async () => {
  const code = getRoomCode();
  $("[data-room-code]").textContent = code;

  const rooms = await request(
    "rooms",
    `?invite_code=eq.${encodeURIComponent(code)}&limit=1`
  );
  const room = rooms[0];

  if (!room) {
    throw new Error(`Room ${code} not found`);
  }

  $("[data-room-name]").textContent = room.name;
  $("[data-room-subtitle]").textContent = `${room.invite_code} leaderboard`;

  const friends = await request(
    "room_picks",
    `?room_id=eq.${encodeURIComponent(room.id)}&order=points.desc,name.asc`
  );

  renderLeaderboard(friends);
  $("[data-sync-status]").textContent = "Live";
  return room;
};

const addPick = async (room, form) => {
  const formData = new FormData(form);
  const name = String(formData.get("friendName") || "").trim();
  const outcomeId = String(formData.get("outcomeId") || "draw");
  const friend = {
    room_id: room.id,
    id: slugify(name),
    name,
    initials: initialsFromName(name),
    outcome_id: outcomeId,
    prediction: `${OUTCOMES[outcomeId] || "Match"} pick`,
    points: 10
  };

  await request("room_picks", "?on_conflict=room_id,id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([friend])
  });
};

const boot = async () => {
  const form = $("[data-pick-form]");
  let room = await loadRoom();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    $("[data-sync-status]").textContent = "Saving";
    await addPick(room, form);
    form.reset();
    room = await loadRoom();
  });

  setInterval(async () => {
    room = await loadRoom();
  }, SUPABASE_CONFIG.pollMs || 4000);
};

boot().catch((error) => {
  $("[data-sync-status]").textContent = "Offline";
  $("[data-leaderboard]").innerHTML = `<li>${error.message}</li>`;
});
