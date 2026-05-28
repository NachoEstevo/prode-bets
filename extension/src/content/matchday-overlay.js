const ROOT_ID = "matchday-markets-root";
const DEFAULT_STATE = { overlayEnabled: true, tradingMode: "demo" };

const fallbackData = {
  match: {
    title: "Argentina vs Brazil",
    marketClosesIn: "09:42",
    home: { id: "argentina", name: "Argentina", flagAsset: "src/assets/flags/argentina.svg" },
    away: { id: "brazil", name: "Brazil", flagAsset: "src/assets/flags/brazil.svg" }
  },
  market: {
    externalUrl: "https://polymarket.com",
    outcomes: [
      { id: "argentina-win", teamId: "argentina", shortLabel: "Argentina", probability: 48, volume: "$1.4M", liquidity: "$328K", movement: "+5", accent: "#2774d9" },
      { id: "draw", teamId: "draw", shortLabel: "Draw", probability: 27, volume: "$740K", liquidity: "$180K", movement: "+2", accent: "#d7c7a0" },
      { id: "brazil-win", teamId: "brazil", shortLabel: "Brazil", probability: 25, volume: "$980K", liquidity: "$214K", movement: "-7", accent: "#0f8f49" }
    ]
  },
  group: {
    id: "founders-room",
    name: "Founders Room",
    inviteCode: "PB-2026",
    summary: "Invite real friends and watch the leaderboard move live.",
    friends: [
      { name: "Sofi", initials: "SO", outcomeId: "argentina-win", prediction: "Argentina 2-1", points: 12 },
      { name: "Tomi", initials: "TO", outcomeId: "brazil-win", prediction: "Brazil win", points: 9 },
      { name: "Juli", initials: "JU", outcomeId: "draw", prediction: "Draw after 90", points: 10 }
    ]
  },
  mascot: {
    name: "Picanthe",
    asset: "src/assets/mascot/picanthe-kickups.svg",
    spriteAsset: "src/assets/chili/picanthe-idle-kickups-sheet.png",
    caption: "Picanthe keeps the ball alive until kickoff."
  }
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

const getAssetUrl = (path) => {
  try {
    if (typeof globalThis.__PRODE_PREVIEW_GET_URL__ === "function") {
      return globalThis.__PRODE_PREVIEW_GET_URL__(path);
    }
  } catch (_error) {
    // Fall through to the extension runtime resolver.
  }

  try {
    return chrome.runtime.getURL(path);
  } catch (_error) {
    return path;
  }
};

const loadMatchData = async () => {
  try {
    const response = await fetch(getAssetUrl("src/shared/sample-match.json"));

    if (!response.ok) {
      throw new Error(`Failed to load sample match: ${response.status}`);
    }

    return response.json();
  } catch (_error) {
    return fallbackData;
  }
};

const loadExtensionState = async () => {
  try {
    return await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "matchday:getState" }, (response) => {
        resolve(response?.state || DEFAULT_STATE);
      });
    });
  } catch (_error) {
    return DEFAULT_STATE;
  }
};

const persistOverlayEnabled = (overlayEnabled) => {
  try {
    chrome.runtime.sendMessage(
      { type: "matchday:setState", patch: { overlayEnabled } },
      () => chrome.runtime.lastError
    );
  } catch (_error) {
    // Preview mode and restricted pages may not have a live extension runtime.
  }
};

const renderFlag = (team) => `
  <img class="mm-flag" src="${escapeHtml(getAssetUrl(team.flagAsset))}" alt="${escapeHtml(team.name)} flag">
`;

const renderOutcomeBadge = (outcome, team) => team
  ? renderFlag(team)
  : `<span class="mm-draw-mark" role="img" aria-label="${escapeHtml(outcome.shortLabel)}">X</span>`;

const renderMascotSprite = (mascot, className = "") => `
  <span
    class="mm-chili-sprite ${escapeHtml(className)}"
    role="img"
    aria-label="${escapeHtml(mascot.name)} doing kickups"
  >
    <img src="${escapeHtml(getAssetUrl(mascot.spriteAsset))}" alt="" aria-hidden="true">
  </span>
`;

const renderOutcome = (outcome, team) => `
  <article class="mm-outcome" style="--mm-accent:${escapeHtml(outcome.accent)};--mm-height:${outcome.probability}%;">
    <div class="mm-outcome-head">
      <span>${renderOutcomeBadge(outcome, team)}<strong>${escapeHtml(outcome.shortLabel)}</strong></span>
      <em>${escapeHtml(outcome.movement)}</em>
    </div>
    <div class="mm-price">${escapeHtml(outcome.probability)}%</div>
    <div class="mm-metrics">
      <span>Vol ${escapeHtml(outcome.volume)}</span>
      <span>Liq ${escapeHtml(outcome.liquidity)}</span>
    </div>
    <button class="mm-buy" type="button" data-action="open-market">Buy Yes</button>
  </article>
`;

const setActiveTab = (root, tabName) => {
  root.querySelectorAll("[data-tab]").forEach((button) => {
    const active = button.dataset.tab === tabName;
    button.classList.toggle("mm-tab-active", active);
    button.setAttribute("aria-selected", String(active));
  });

  root.querySelectorAll("[data-panel]").forEach((panel) => {
    const active = panel.dataset.panel === tabName;
    panel.classList.toggle("mm-tab-panel-active", active);
    panel.hidden = !active;
  });
};

const loadRoomPanel = () => import(getAssetUrl("src/social/room-panel.js"));

const renderOverlay = (data, roomPanel) => {
  const root = document.createElement("section");
  const teamsById = new Map([[data.match.home.id, data.match.home], [data.match.away.id, data.match.away]]);

  root.id = ROOT_ID;
  root.className = "mm-shell mm-active-tab-market";
  root.innerHTML = `
    <div class="mm-drop mm-is-compact" role="dialog" aria-label="Matchday market drop">
      <div class="mm-topline">
        <span>Closes in ${escapeHtml(data.match.marketClosesIn)}</span>
        <button class="mm-close" type="button" aria-label="Close Matchday Markets" data-action="close">Close</button>
      </div>
      <div class="mm-matchline">
        ${renderFlag(data.match.home)}
        <h2>${escapeHtml(data.match.title)}</h2>
        ${renderFlag(data.match.away)}
      </div>
      <div class="mm-tabs" role="tablist" aria-label="Matchday views">
        <button class="mm-tab mm-tab-active" type="button" role="tab" aria-selected="true" data-tab="market">Market</button>
        <button class="mm-tab" type="button" role="tab" aria-selected="false" data-tab="friends">Friends</button>
        <button class="mm-tab" type="button" role="tab" aria-selected="false" data-tab="motion">Mascot</button>
      </div>
      <section class="mm-tab-panel mm-tab-panel-active" data-panel="market" role="tabpanel">
        <div class="mm-market-grid">
          ${data.market.outcomes.map((outcome) => renderOutcome(outcome, teamsById.get(outcome.teamId))).join("")}
        </div>
        <p class="mm-note">Demo mode: opens Polymarket externally. No order is placed here.</p>
      </section>
      ${roomPanel.renderFriendsPanel(data)}
      <section class="mm-tab-panel" data-panel="motion" role="tabpanel" hidden>
        <div class="mm-mascot-card">
          ${renderMascotSprite(data.mascot, "mm-chili-sprite-large")}
          <p>${escapeHtml(data.mascot.caption)}</p>
        </div>
      </section>
    </div>

    <div class="mm-mascot" aria-hidden="true">
      ${renderMascotSprite(data.mascot)}
    </div>
    <div class="mm-field" aria-hidden="true"></div>
  `;

  root.querySelector('[data-action="close"]').addEventListener("click", () => {
    persistOverlayEnabled(false);
    root.remove();
  });
  root.querySelector('[data-action="minimize"]').addEventListener("click", () => {
    root.classList.toggle("mm-is-minimized");
  });
  root.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => setActiveTab(root, button.dataset.tab));
  });
  root.querySelectorAll('[data-action="open-market"]').forEach((button) => {
    button.addEventListener("click", () => {
      window.open(data.market.externalUrl, "_blank", "noopener,noreferrer");
    });
  });
  roomPanel.bindFriendsPanel(root, data);

  return root;
};

let cachedData;
let cachedRoomPanel;

const hideOverlay = () => {
  document.getElementById(ROOT_ID)?.remove();
};

const showOverlay = async () => {
  if (window.top !== window.self || document.getElementById(ROOT_ID)) {
    return;
  }

  cachedRoomPanel = cachedRoomPanel || await loadRoomPanel();
  cachedData = cachedData || await cachedRoomPanel.prepareRoomData(await loadMatchData());
  document.documentElement.append(renderOverlay(cachedData, cachedRoomPanel));
};

const init = async () => {
  const state = await loadExtensionState();

  if (state.overlayEnabled) {
    await showOverlay();
  }
};

if (globalThis.chrome?.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "matchday:overlayVisibilityChanged") {
      return false;
    }

    if (message.overlayEnabled) {
      showOverlay().then(() => sendResponse({ ok: true }));
      return true;
    }

    hideOverlay();
    sendResponse({ ok: true });
    return false;
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
