const ACCENTS_BY_COUNT = {
  2: ["#2f6bff", "#e31791"],
  3: ["#2f6bff", "#d7c7a0", "#0f8f49"]
};

const formatMoney = (value) => {
  if (!Number.isFinite(value)) {
    return "$0";
  }

  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1).replace(".0", "")}M`;
  }

  if (value >= 1_000) {
    return `$${Math.round(value / 1_000)}K`;
  }

  return `$${Math.round(value)}`;
};

const formatMovement = (value) => {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const points = Math.round(value * 100);
  return points > 0 ? `+${points}` : String(points);
};

const shortLabel = (outcome) => {
  if (outcome.shortLabel) {
    return outcome.shortLabel;
  }

  return String(outcome.label || outcome.teamId || "Outcome").replace(/\s+wins$/i, "");
};

export const normalizePolymarketMarket = (market) => {
  if (!Array.isArray(market?.outcomes) || ![2, 3].includes(market.outcomes.length)) {
    throw new Error("Polymarket market must have two or three outcomes");
  }

  const rawPrices = market.outcomes.map((outcome) => Math.max(0, Number(outcome.price) || 0));
  const rawTotal = rawPrices.reduce((sum, price) => sum + price, 0);
  const basePrices = rawTotal > 0
    ? rawPrices.map((price) => (price / rawTotal) * 100)
    : market.outcomes.map(() => 100 / market.outcomes.length);
  const probabilities = basePrices.map(Math.floor);
  let remainder = 100 - probabilities.reduce((sum, probability) => sum + probability, 0);
  const priority = basePrices
    .map((price, index) => ({ index, fraction: price - Math.floor(price) }))
    .sort((left, right) => right.fraction - left.fraction);

  for (const item of priority) {
    if (remainder <= 0) {
      break;
    }

    probabilities[item.index] += 1;
    remainder -= 1;
  }
  const accents = ACCENTS_BY_COUNT[market.outcomes.length];

  return {
    provider: market.provider || "polymarket",
    mode: "live-preview",
    externalUrl: market.externalUrl || "https://polymarket.com",
    outcomes: market.outcomes.map((outcome, index) => ({
      id: outcome.id,
      teamId: outcome.teamId,
      label: outcome.label,
      shortLabel: shortLabel(outcome),
      probability: probabilities[index],
      volume: formatMoney(Number(outcome.volume)),
      liquidity: formatMoney(Number(outcome.liquidity)),
      movement: formatMovement(Number(outcome.movement)),
      accent: outcome.accent || accents[index]
    }))
  };
};
