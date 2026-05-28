import { DEFAULT_STATE } from "../shared/matchday-state.js";

const card = document.querySelector("#match-card");
const marketLink = document.querySelector("#market-link");
const stateLabel = document.querySelector("#state-label");
const showButton = document.querySelector('[data-action="show-overlay"]');
const hideButton = document.querySelector('[data-action="hide-overlay"]');

const loadData = async () => {
  const response = await fetch(chrome.runtime.getURL("src/shared/sample-match.json"));

  if (!response.ok) {
    throw new Error(`Could not load sample match: ${response.status}`);
  }

  return response.json();
};

const renderOutcome = (outcome) => `
  <article class="outcome" style="--accent:${outcome.accent}">
    <strong>${outcome.shortLabel}</strong>
    <b>${outcome.probability}%</b>
    <span>${outcome.volume} vol</span>
  </article>
`;

const render = (data) => {
  marketLink.href = data.market.externalUrl;
  card.innerHTML = `
    <div class="match-title">${data.match.title}</div>
    <div class="countdown">Closes in ${data.match.marketClosesIn}</div>
    <div class="outcomes">
      ${data.market.outcomes.map(renderOutcome).join("")}
    </div>
    <div class="group">
      ${data.group.name}: ${data.group.friends.length} friends tracking this match.
    </div>
  `;
};

const sendRuntimeMessage = (message) =>
  new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));

const notifyActiveTab = async (overlayEnabled) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    return;
  }

  chrome.tabs.sendMessage(
    tab.id,
    { type: "matchday:overlayVisibilityChanged", overlayEnabled },
    () => chrome.runtime.lastError
  );
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

Promise.all([
  loadData().then(render),
  sendRuntimeMessage({ type: "matchday:getState" }).then((response) => renderState(response?.state))
]).catch((error) => {
  card.innerHTML = `<p>${error.message}</p>`;
  renderState(DEFAULT_STATE);
});
