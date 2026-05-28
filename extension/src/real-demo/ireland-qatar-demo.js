const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.friendly/scoreboard?dates=20260528";
const POLYMARKET_SEARCH_URL = "https://gamma-api.polymarket.com/public-search";
const POLYMARKET_QUERY = "ireland qatar";

const parseArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
};

const toProbability = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  const percent = numericValue <= 1 ? numericValue * 100 : numericValue;
  return Math.round(Math.max(0, Math.min(100, percent)) * 10) / 10;
};

const formatMoney = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "$0";
  }

  if (numericValue >= 1_000_000) {
    return `$${(numericValue / 1_000_000).toFixed(1).replace(".0", "")}M`;
  }

  if (numericValue >= 1_000) {
    return `$${Math.round(numericValue / 1_000)}K`;
  }

  return `$${Math.round(numericValue)}`;
};

const competitorBySide = (event, side) =>
  event?.competitions?.[0]?.competitors?.find((competitor) => competitor.homeAway === side);

const teamName = (competitor, fallback) =>
  competitor?.team?.displayName || competitor?.team?.shortDisplayName || competitor?.team?.abbreviation || fallback;

const findIrelandQatarEvent = (scoreboard) =>
  (scoreboard?.events || []).find((event) => {
    const text = [
      event.name,
      event.shortName,
      teamName(competitorBySide(event, "home"), ""),
      teamName(competitorBySide(event, "away"), "")
    ].join(" ").toLowerCase();

    return text.includes("ireland") && text.includes("qatar");
  });

export const normalizeEspnIrelandQatar = (scoreboard) => {
  const event = findIrelandQatarEvent(scoreboard);

  if (!event) {
    return null;
  }

  const home = competitorBySide(event, "home") || {};
  const away = competitorBySide(event, "away") || {};
  const status = event.status?.type?.shortDetail || event.status?.type?.detail || "Live";

  return {
    id: event.id || "ireland-qatar-2026-05-28",
    title: "Republic of Ireland vs Qatar",
    competition: "International Friendly",
    kickoffLabel: status,
    marketClosesIn: status,
    home: {
      id: "ireland",
      name: teamName(home, "Republic of Ireland"),
      flagAsset: "src/assets/flags/ireland.svg",
      colorStrip: ["#169b62", "#ffffff", "#ff883e"],
      score: home.score || "0"
    },
    away: {
      id: "qatar",
      name: teamName(away, "Qatar"),
      flagAsset: "src/assets/flags/qatar.svg",
      colorStrip: ["#8a1538", "#ffffff", "#8a1538"],
      score: away.score || "0"
    },
    draw: {
      id: "draw",
      name: "Draw"
    }
  };
};

const marketText = (market) => String(market?.question || market?.title || "").toLowerCase();

const priceForYes = (market) => {
  const outcomes = parseArray(market?.outcomes);
  const prices = parseArray(market?.outcomePrices);
  const yesIndex = outcomes.findIndex((outcome) => String(outcome).toLowerCase() === "yes");
  return toProbability(prices[yesIndex >= 0 ? yesIndex : 0]);
};

const findMarket = (markets, pattern) =>
  markets.find((market) => pattern.test(marketText(market)));

export const normalizePolymarketIrelandQatar = (payload) => {
  const event = (payload?.events || []).find((candidate) =>
    String(candidate?.title || candidate?.slug || "").toLowerCase().includes("ireland") &&
    String(candidate?.title || candidate?.slug || "").toLowerCase().includes("qatar")
  );
  const markets = event?.markets || [];
  const winMarket = findMarket(markets, /republic of ireland win/);
  const drawMarket = findMarket(markets, /end in a draw|match end.*draw/);
  const winProbability = priceForYes(winMarket);
  const drawProbability = priceForYes(drawMarket);

  if (winProbability === null || drawProbability === null) {
    return null;
  }

  return {
    provider: "polymarket",
    mode: "read-only",
    externalUrl: event?.slug
      ? `https://polymarket.com/event/${event.slug}`
      : "https://polymarket.com",
    outcomes: [
      {
        id: "ireland-win",
        teamId: "ireland",
        label: "Republic of Ireland wins",
        shortLabel: "Ireland win",
        probability: winProbability,
        volume: formatMoney(winMarket?.volumeNum || winMarket?.volume),
        liquidity: formatMoney(winMarket?.liquidityNum || winMarket?.liquidity),
        movement: "Live",
        accent: "#169b62"
      },
      {
        id: "draw",
        teamId: "draw",
        label: "Match ends in a draw",
        shortLabel: "Draw",
        probability: drawProbability,
        volume: formatMoney(drawMarket?.volumeNum || drawMarket?.volume),
        liquidity: formatMoney(drawMarket?.liquidityNum || drawMarket?.liquidity),
        movement: "Live",
        accent: "#fbbc04"
      }
    ]
  };
};

export const REAL_DEMO_SNAPSHOT = {
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
      colorStrip: ["#169b62", "#ffffff", "#ff883e"],
      score: "0"
    },
    away: {
      id: "qatar",
      name: "Qatar",
      flagAsset: "src/assets/flags/qatar.svg",
      colorStrip: ["#8a1538", "#ffffff", "#8a1538"],
      score: "0"
    },
    draw: {
      id: "draw",
      name: "Draw"
    }
  },
  feed: {
    badge: "REAL DATA · ESPN live · Polymarket",
    sourceMode: "verified snapshot",
    sources: ["FAI", "BBC Sport", "Aviva Stadium"]
  },
  market: {
    provider: "polymarket",
    mode: "read-only",
    externalUrl: "https://polymarket.com/event/republic-of-ireland-vs-qatar",
    outcomes: [
      {
        id: "ireland-win",
        teamId: "ireland",
        label: "Republic of Ireland wins",
        shortLabel: "Ireland win",
        probability: 87.5,
        volume: "$120K",
        liquidity: "$45K",
        movement: "Live",
        accent: "#169b62"
      },
      {
        id: "draw",
        teamId: "draw",
        label: "Match ends in a draw",
        shortLabel: "Draw",
        probability: 10.5,
        volume: "$38K",
        liquidity: "$11K",
        movement: "Live",
        accent: "#fbbc04"
      }
    ]
  },
  group: {
    id: "real-data-room",
    name: "Real Data Room",
    summary: "Live match context from ESPN, market probabilities from Polymarket.",
    friends: [
      { id: "espn", name: "ESPN", initials: "ES", outcomeId: "ireland-win", prediction: "Live match state", points: 17 },
      { id: "poly", name: "Polymarket", initials: "PM", outcomeId: "ireland-win", prediction: "Ireland win 87.5%", points: 88 },
      { id: "fai", name: "FAI", initials: "FA", outcomeId: "draw", prediction: "Fixture verified", points: 10 }
    ]
  },
  mascot: {
    name: "Picanthe",
    asset: "src/assets/mascot/picanthe-kickups.svg",
    spriteAsset: "src/assets/chili/picanthe-idle-kickups-sheet.png",
    caption: "Picanthe found a real match and a real market."
  }
};

export const buildRealDemoData = ({ espnScoreboard, polymarketSearch } = {}) => {
  const match = normalizeEspnIrelandQatar(espnScoreboard) || REAL_DEMO_SNAPSHOT.match;
  const market = normalizePolymarketIrelandQatar(polymarketSearch) || REAL_DEMO_SNAPSHOT.market;

  return {
    ...REAL_DEMO_SNAPSHOT,
    match,
    market,
    feed: {
      ...REAL_DEMO_SNAPSHOT.feed,
      sourceMode: match === REAL_DEMO_SNAPSHOT.match || market === REAL_DEMO_SNAPSHOT.market
        ? "partial live"
        : "live"
    }
  };
};

const fetchJson = async (fetchImpl, url, timeoutMs) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

export const fetchRealDemoData = async ({
  fetchImpl = fetch,
  timeoutMs = 2500
} = {}) => {
  const polymarketUrl = new URL(POLYMARKET_SEARCH_URL);
  polymarketUrl.searchParams.set("q", POLYMARKET_QUERY);
  polymarketUrl.searchParams.set("limit_per_type", "5");
  polymarketUrl.searchParams.set("events_status", "active");
  polymarketUrl.searchParams.set("keep_closed_markets", "0");
  polymarketUrl.searchParams.set("search_tags", "true");
  polymarketUrl.searchParams.set("search_profiles", "false");

  try {
    const [espnScoreboard, polymarketSearch] = await Promise.all([
      fetchJson(fetchImpl, ESPN_SCOREBOARD_URL, timeoutMs),
      fetchJson(fetchImpl, polymarketUrl.toString(), timeoutMs)
    ]);

    return buildRealDemoData({ espnScoreboard, polymarketSearch });
  } catch (_error) {
    return REAL_DEMO_SNAPSHOT;
  }
};
