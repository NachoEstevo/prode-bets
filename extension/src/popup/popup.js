import { DEFAULT_STATE } from "../shared/matchday-state.js";
import { buildDemoGoalAlert } from "../shared/score-alerts.js";

const card = document.querySelector("#match-card");
const marketLink = document.querySelector("#market-link");
const stateLabel = document.querySelector("#state-label");
const showButton = document.querySelector('[data-action="show-overlay"]');
const hideButton = document.querySelector('[data-action="hide-overlay"]');
const demoGoalButton = document.querySelector('[data-action="demo-goal"]');

const loadData = async () => {
  const response = await fetch(chrome.runtime.getURL("src/shared/sample-match.json"));

  if (!response.ok) {
    throw new Error(`Could not load sample match: ${response.status}`);
  }

  return response.json();
};

const renderOutcome = (outcome, team) => `
  <article class="outcome" style="--accent:${outcome.accent}">
    <strong>
      ${team
        ? `<img src="${chrome.runtime.getURL(team.flagAsset)}" alt="${team.name} flag">`
        : '<span class="draw-mark" aria-hidden="true">X</span>'}
      ${outcome.shortLabel}
    </strong>
    <b>${outcome.probability}%</b>
    <span>${outcome.volume} vol</span>
  </article>
`;

const render = (data) => {
  const teamsById = new Map([[data.match.home.id, data.match.home], [data.match.away.id, data.match.away]]);

  marketLink.href = data.market.externalUrl;
  card.innerHTML = `
    <div class="match-title">${data.match.title}</div>
    <div class="countdown">Closes in ${data.match.marketClosesIn}</div>
    <div class="outcomes">
      ${data.market.outcomes.map((outcome) => renderOutcome(outcome, teamsById.get(outcome.teamId))).join("")}
    </div>
    <div class="group">
      ${data.group.name}: ${data.group.friends.length} friends tracking this match.
    </div>
  `;
};

const sendRuntimeMessage = (message) =>
  new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));

const sendActiveTabMessage = async (message) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    return;
  }

  chrome.tabs.sendMessage(tab.id, message, () => chrome.runtime.lastError);
};

const notifyActiveTab = async (overlayEnabled) => {
  await sendActiveTabMessage({ type: "matchday:overlayVisibilityChanged", overlayEnabled });
};

const renderState = (state = DEFAULT_STATE) => {
  stateLabel.textContent = state.overlayEnabled
    ? "Overlay is enabled for the active tab."
    : "Overlay is hidden until you show it again.";
};

const setOverlayEnabled = async (overlayEnabled) => {
  const response = await sendRuntimeMessage({
    type: "matchday:setState",
    patch: { overlayEnabled }
  });

  renderState(response?.state || { ...DEFAULT_STATE, overlayEnabled });
  await notifyActiveTab(overlayEnabled);
};

showButton.addEventListener("click", () => setOverlayEnabled(true));
hideButton.addEventListener("click", () => setOverlayEnabled(false));
demoGoalButton.addEventListener("click", async () => {
  const data = await loadData();
  const alert = buildDemoGoalAlert(data.match, { scoringTeamId: data.match.home.id });
  await sendActiveTabMessage({
    type: "matchday:goalAlert",
    alert: {
      ...alert,
      mascot: data.mascot
    }
  });
});

Promise.all([
  loadData().then(render),
  sendRuntimeMessage({ type: "matchday:getState" }).then((response) => renderState(response?.state))
]).catch((error) => {
  card.innerHTML = `<p>${error.message}</p>`;
  renderState(DEFAULT_STATE);
});
