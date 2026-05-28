import assert from "node:assert/strict";
import test from "node:test";

import { normalizePolymarketMarket } from "../extension/src/polymarket/normalize-market.js";

test("normalizes a two-outcome Polymarket-like market into overlay market data", () => {
  const normalized = normalizePolymarketMarket({
    provider: "polymarket",
    externalUrl: "https://polymarket.com/event/demo",
    outcomes: [
      {
        id: "token-a",
        teamId: "south",
        label: "South wins",
        price: 0.61,
        volume: 1540000,
        liquidity: 315000,
        movement: 0.04
      },
      {
        id: "token-b",
        teamId: "north",
        label: "North wins",
        price: 0.39,
        volume: 870000,
        liquidity: 205000,
        movement: -0.04
      }
    ]
  });

  assert.deepEqual(normalized, {
    provider: "polymarket",
    mode: "live-preview",
    externalUrl: "https://polymarket.com/event/demo",
    outcomes: [
      {
        id: "token-a",
        teamId: "south",
        label: "South wins",
        shortLabel: "South",
        probability: 61,
        volume: "$1.5M",
        liquidity: "$315K",
        movement: "+4",
        accent: "#2f6bff"
      },
      {
        id: "token-b",
        teamId: "north",
        label: "North wins",
        shortLabel: "North",
        probability: 39,
        volume: "$870K",
        liquidity: "$205K",
        movement: "-4",
        accent: "#e31791"
      }
    ]
  });
});

test("normalizes a three-outcome football market including draw", () => {
  const normalized = normalizePolymarketMarket({
    outcomes: [
      { id: "arg", teamId: "argentina", label: "Argentina wins", price: 0.48 },
      { id: "draw", teamId: "draw", label: "Draw", price: 0.27 },
      { id: "bra", teamId: "brazil", label: "Brazil wins", price: 0.25 }
    ]
  });

  assert.deepEqual(
    normalized.outcomes.map((outcome) => ({
      id: outcome.id,
      shortLabel: outcome.shortLabel,
      probability: outcome.probability
    })),
    [
      { id: "arg", shortLabel: "Argentina", probability: 48 },
      { id: "draw", shortLabel: "Draw", probability: 27 },
      { id: "bra", shortLabel: "Brazil", probability: 25 }
    ]
  );
});

test("rejects markets that do not have two or three outcomes", () => {
  assert.throws(
    () => normalizePolymarketMarket({ outcomes: [{ id: "a" }] }),
    /two or three outcomes/
  );
});

test("normalizes rounded probabilities so both outcomes always sum to 100", () => {
  const normalized = normalizePolymarketMarket({
    outcomes: [
      { id: "a", label: "A wins", price: 0.615 },
      { id: "b", label: "B wins", price: 0.395 }
    ]
  });

  const total = normalized.outcomes.reduce((sum, outcome) => sum + outcome.probability, 0);

  assert.equal(total, 100);
});
