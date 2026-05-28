import { addRoomFriend, copyInviteLink, loadRoom } from "./room-client.js";
import { createLeaderboard } from "./room-state.js";

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

const outcomeLabel = (outcome) => outcome?.shortLabel || outcome?.label || "Pick";

const renderFriend = (friend, outcomesById, index) => {
  const outcome = outcomesById.get(friend.outcomeId);

  return `
    <li class="mm-friend">
      <span class="mm-leaderboard-rank">${index + 1}</span>
      <span class="mm-avatar">${escapeHtml(friend.initials)}</span>
      <span>
        <strong>${escapeHtml(friend.name)}</strong>
        <small>${escapeHtml(friend.prediction)} on ${escapeHtml(outcomeLabel(outcome))}</small>
      </span>
      <b>${escapeHtml(friend.points)} pts</b>
    </li>
  `;
};

const renderFriendList = (group, outcomes) => {
  const outcomesById = new Map(outcomes.map((outcome) => [outcome.id, outcome]));
  return createLeaderboard(group.friends).map((friend, index) =>
    renderFriend(friend, outcomesById, index)
  ).join("");
};

const renderOutcomeOptions = (outcomes) => outcomes.map((outcome) => `
  <option value="${escapeHtml(outcome.id)}">${escapeHtml(outcomeLabel(outcome))}</option>
`).join("");

export const prepareRoomData = async (data) => ({
  ...data,
  group: await loadRoom(data.group, data.match.id)
});

export const renderFriendsPanel = (data) => `
  <section class="mm-tab-panel" data-panel="friends" role="tabpanel" hidden>
    <div class="mm-panel-head">
      <strong>${escapeHtml(data.group.name)}</strong>
      <button class="mm-minimize" type="button" data-action="minimize">Minimize</button>
    </div>
    <p>${escapeHtml(data.group.summary)}</p>
    <div class="mm-room-actions">
      <button class="mm-invite-button" type="button" data-action="invite-friend">Copy invite</button>
      <span data-room-status>${escapeHtml(data.group.inviteCode)} room</span>
    </div>
    <form class="mm-invite-row" data-room-form>
      <input name="friendName" type="text" placeholder="Friend name" maxlength="24" required>
      <select name="outcomeId" aria-label="Friend pick">${renderOutcomeOptions(data.market.outcomes)}</select>
      <button type="submit" data-action="add-friend">Add</button>
    </form>
    <ul class="mm-friend-list" data-friend-list>
      ${renderFriendList(data.group, data.market.outcomes)}
    </ul>
  </section>
`;

export const bindFriendsPanel = (root, data) => {
  const status = root.querySelector("[data-room-status]");
  const list = root.querySelector("[data-friend-list]");
  const form = root.querySelector("[data-room-form]");

  root.querySelector('[data-action="invite-friend"]')?.addEventListener("click", async () => {
    await copyInviteLink(data.group, data.match.id);
    status.textContent = "Invite copied";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const outcomeId = String(formData.get("outcomeId") || data.market.outcomes[0]?.id);
    const outcome = data.market.outcomes.find((item) => item.id === outcomeId);

    data.group = await addRoomFriend(data.group, {
      name: formData.get("friendName"),
      outcomeId,
      prediction: `${outcomeLabel(outcome)} pick`,
      points: 10
    }, data.match.id);

    list.innerHTML = renderFriendList(data.group, data.market.outcomes);
    status.textContent = "Leaderboard updated";
    form.reset();
  });
};
