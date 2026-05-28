const ROOT_ID = "matchday-markets-root";
const DEFAULT_STATE = { overlayEnabled: true, tradingMode: "demo" };

const fallbackData = {
  match: {
    id: "ireland-qatar-2026-05-28",
    title: "Republic of Ireland vs Qatar",
    competition: "International Friendly",
    kickoffLabel: "19:45 BST",
    marketClosesIn: "19:45 BST",
    home: {
      id: "ireland",
      name: "Republic of Ireland",
      flagAsset: "src/assets/flags/ireland.svg",
      score: "0"
    },
    away: {
      id: "qatar",
      name: "Qatar",
      flagAsset: "src/assets/flags/qatar.svg",
      score: "0"
    },
    draw: {
      id: "draw",
      name: "Draw"
    }
  },
  feed: {
    badge: "REAL DATA · ESPN live · Polymarket",
    sourceMode: "verified snapshot"
  },
  market: {
    provider: "polymarket",
    mode: "read-only",
    externalUrl: "https://polymarket.com/event/republic-of-ireland-vs-qatar",
    outcomes: [
      { id: "ireland-win", teamId: "ireland", shortLabel: "Ireland win", probability: 87.5, volume: "$120K", liquidity: "$45K", movement: "Live", accent: "#169b62" },
      { id: "draw", teamId: "draw", shortLabel: "Draw", probability: 10.5, volume: "$38K", liquidity: "$11K", movement: "Live", accent: "#fbbc04" }
    ]
  },
  group: {
    id: "real-data-room",
    name: "Real Data Room",
    inviteCode: "PB-REAL",
    summary: "Live match context from ESPN, market probabilities from Polymarket.",
    friends: [
      { name: "ESPN", initials: "ES", outcomeId: "ireland-win", prediction: "Live match state", points: 17 },
      { name: "Polymarket", initials: "PM", outcomeId: "ireland-win", prediction: "Ireland win 87.5%", points: 88 },
      { name: "FAI", initials: "FA", outcomeId: "draw", prediction: "Fixture verified", points: 10 }
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
    const response = await chrome.runtime.sendMessage({ type: "matchday:getRealDemoData" });

    if (response?.ok && response.data) {
      return response.data;
    }
  } catch (_error) {
    // Preview pages and restricted browser pages fall back to the bundled snapshot.
  }

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

const renderFlag = (team = {}) => team.flagAsset
  ? `<img class="mm-flag" src="${escapeHtml(getAssetUrl(team.flagAsset))}" alt="${escapeHtml(team.name)} flag">`
  : `<span class="mm-flag mm-flag-neutral" aria-label="${escapeHtml(team.name || "Market")}">${escapeHtml((team.name || "M").slice(0, 1))}</span>`;

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
    <button class="mm-buy" type="button" data-action="open-market">Open market</button>
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
  const teamsById = new Map([
    [data.match.home.id, data.match.home],
    [data.match.away.id, data.match.away],
    [data.match.draw?.id, data.match.draw]
  ]);

  root.id = ROOT_ID;
  root.className = "mm-shell mm-active-tab-market";
  root.innerHTML = `
    <div class="mm-drop mm-is-compact" role="dialog" aria-label="Matchday market drop">
      <div class="mm-topline">
        <span>${escapeHtml(data.feed?.badge || `Closes in ${data.match.marketClosesIn}`)} · ${escapeHtml(data.match.marketClosesIn)}</span>
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
        <p class="mm-note">Read-only: opens Polymarket externally. No order is placed here.</p>
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
  const root = document.getElementById(ROOT_ID);
  root?.dispatchEvent(new Event("matchday:destroy"));
  root?.remove();
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
