const ROOT_ID = "matchday-markets-root";

const fallbackData = {
  match: {
    title: "Who wins the opening match?",
    marketClosesIn: "09:42",
    home: { name: "South", colorStrip: ["#8bdcff", "#f8f4ed", "#8bdcff"] },
    away: { name: "North", colorStrip: ["#e86459", "#f8f4ed", "#2f3f97"] }
  },
  market: {
    externalUrl: "https://polymarket.com",
    outcomes: [
      { id: "south-win", shortLabel: "South", probability: 58, volume: "$1.4M", liquidity: "$328K", movement: "+7", accent: "#2f6bff" },
      { id: "north-win", shortLabel: "North", probability: 42, volume: "$980K", liquidity: "$214K", movement: "-7", accent: "#e31791" }
    ]
  },
  group: {
    summary: "Your group is split before kickoff.",
    friends: [
      { name: "Sofi", initials: "SO", outcomeId: "south-win", prediction: "South 2-1", points: 12 },
      { name: "Tomi", initials: "TO", outcomeId: "north-win", prediction: "North win", points: 9 },
      { name: "Juli", initials: "JU", outcomeId: "south-win", prediction: "Bought South", points: 8 }
    ]
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

const loadMatchData = async () => {
  try {
    const url = chrome.runtime.getURL("src/shared/sample-match.json");
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load sample match: ${response.status}`);
    }

    return response.json();
  } catch (_error) {
    return fallbackData;
  }
};

const colorStrip = (colors) => {
  const [first, second, third] = colors;
  return `linear-gradient(90deg, ${first} 0 33%, ${second} 33% 66%, ${third} 66%)`;
};

const renderOutcome = (outcome, team) => `
  <article class="mm-outcome" style="--mm-accent:${escapeHtml(outcome.accent)};--mm-height:${outcome.probability}%;">
    <div class="mm-outcome-head">
      <strong>${escapeHtml(outcome.shortLabel)}</strong>
      <span class="mm-strip" style="background:${colorStrip(team.colorStrip)}"></span>
    </div>
    <div class="mm-price">${escapeHtml(outcome.probability)}%</div>
    <div class="mm-metrics">
      <span>Vol ${escapeHtml(outcome.volume)}</span>
      <span>Liq ${escapeHtml(outcome.liquidity)}</span>
      <span>Move ${escapeHtml(outcome.movement)}</span>
    </div>
    <button class="mm-buy" type="button" data-action="open-market">Buy Yes</button>
  </article>
`;

const renderFriend = (friend, outcomesById) => {
  const outcome = outcomesById.get(friend.outcomeId);
  const pick = outcome ? outcome.shortLabel : "Unknown";

  return `
    <li class="mm-friend">
      <span class="mm-avatar">${escapeHtml(friend.initials)}</span>
      <span>
        <strong>${escapeHtml(friend.name)}</strong>
        <small>${escapeHtml(friend.prediction)} on ${escapeHtml(pick)}</small>
      </span>
      <b>${escapeHtml(friend.points)} pts</b>
    </li>
  `;
};

const renderOverlay = (data) => {
  const root = document.createElement("section");
  const outcomesById = new Map(data.market.outcomes.map((outcome) => [outcome.id, outcome]));
  const [homeOutcome, awayOutcome] = data.market.outcomes;

  root.id = ROOT_ID;
  root.className = "mm-shell";
  root.innerHTML = `
    <div class="mm-drop" role="dialog" aria-label="Matchday market drop">
      <div class="mm-topline">
        <span>Submissions close in ${escapeHtml(data.match.marketClosesIn)}</span>
        <button class="mm-close" type="button" aria-label="Close Matchday Markets" data-action="close">Close</button>
      </div>
      <h2>${escapeHtml(data.match.title)}</h2>
      <div class="mm-market-grid">
        ${renderOutcome(homeOutcome, data.match.home)}
        ${renderOutcome(awayOutcome, data.match.away)}
      </div>
      <p class="mm-note">Demo mode: trading opens Polymarket externally. No order is placed by this extension.</p>
    </div>

    <aside class="mm-friends" aria-label="Friends predictions">
      <div class="mm-panel-head">
        <strong>${escapeHtml(data.group.name)}</strong>
        <button class="mm-minimize" type="button" data-action="minimize">Minimize</button>
      </div>
      <p>${escapeHtml(data.group.summary)}</p>
      <ul>${data.group.friends.map((friend) => renderFriend(friend, outcomesById)).join("")}</ul>
    </aside>

    <div class="mm-runner" aria-hidden="true">
      <span class="mm-head"></span>
      <span class="mm-body"></span>
      <span class="mm-arm-a"></span>
      <span class="mm-arm-b"></span>
      <span class="mm-leg-a"></span>
      <span class="mm-leg-b"></span>
      <span class="mm-boot-a"></span>
      <span class="mm-boot-b"></span>
    </div>
    <div class="mm-field" aria-hidden="true"></div>
  `;

  root.querySelector('[data-action="close"]').addEventListener("click", () => root.remove());
  root.querySelector('[data-action="minimize"]').addEventListener("click", () => {
    root.classList.toggle("mm-is-minimized");
  });
  root.querySelectorAll('[data-action="open-market"]').forEach((button) => {
    button.addEventListener("click", () => {
      window.open(data.market.externalUrl, "_blank", "noopener,noreferrer");
    });
  });

  return root;
};

const init = async () => {
  if (window.top !== window.self || document.getElementById(ROOT_ID)) {
    return;
  }

  const data = await loadMatchData();
  document.documentElement.append(renderOverlay(data));
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
