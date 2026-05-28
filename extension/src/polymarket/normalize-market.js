const ACCENTS = ["#2f6bff", "#e31791"];

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
  if (!Array.isArray(market?.outcomes) || market.outcomes.length !== 2) {
    throw new Error("Polymarket market must have exactly two outcomes");
  }

  const firstProbability = Math.min(
    100,
    Math.max(0, Math.round(Number(market.outcomes[0].price) * 100) || 50)
  );
  const probabilities = [firstProbability, 100 - firstProbability];

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
      accent: outcome.accent || ACCENTS[index]
    }))
  };
};
