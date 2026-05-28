import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRealDemoData,
  fetchRealDemoData,
  normalizeEspnIrelandQatar,
  normalizePolymarketIrelandQatar
} from "../extension/src/real-demo/ireland-qatar-demo.js";

const espnScoreboard = {
  events: [
    {
      id: "401-real-demo",
      name: "Qatar at Republic of Ireland",
      date: "2026-05-28T18:45Z",
      status: { type: { shortDetail: "17'", state: "in", completed: false } },
      competitions: [
        {
          competitors: [
            {
              homeAway: "home",
              score: "0",
              team: {
                id: "476",
                displayName: "Republic of Ireland",
                shortDisplayName: "Ireland",
                abbreviation: "IRL",
                color: "169b62"
              }
            },
            {
              homeAway: "away",
              score: "0",
              team: {
                id: "4398",
                displayName: "Qatar",
                shortDisplayName: "Qatar",
                abbreviation: "QAT",
                color: "8a1538"
              }
            }
          ]
        }
      ]
    }
  ]
};

const polymarketSearch = {
  events: [
    {
      title: "Republic of Ireland vs. Qatar",
      slug: "republic-of-ireland-vs-qatar",
      markets: [
        {
          id: "ireland-win-market",
          question: "Will Republic of Ireland win on 2026-05-28?",
          outcomes: "[\"Yes\", \"No\"]",
          outcomePrices: "[\"0.875\", \"0.125\"]",
          volumeNum: 120000,
          liquidityNum: 45000
        },
        {
          id: "draw-market",
          question: "Will Republic of Ireland vs. Qatar end in a draw?",
          outcomes: "[\"Yes\", \"No\"]",
          outcomePrices: "[\"0.105\", \"0.895\"]",
          volumeNum: 38000,
          liquidityNum: 11000
        }
      ]
    }
  ]
};

test("normalizes ESPN Ireland vs Qatar live scoreboard data", () => {
  const match = normalizeEspnIrelandQatar(espnScoreboard);

  assert.equal(match.id, "401-real-demo");
  assert.equal(match.title, "Republic of Ireland vs Qatar");
  assert.equal(match.marketClosesIn, "17'");
  assert.equal(match.home.name, "Republic of Ireland");
  assert.equal(match.home.flagAsset, "src/assets/flags/ireland.svg");
  assert.equal(match.away.name, "Qatar");
  assert.equal(match.away.flagAsset, "src/assets/flags/qatar.svg");
});

test("normalizes Polymarket Ireland win and draw markets", () => {
  const market = normalizePolymarketIrelandQatar(polymarketSearch);

  assert.equal(market.provider, "polymarket");
  assert.equal(market.mode, "read-only");
  assert.equal(market.externalUrl, "https://polymarket.com/event/republic-of-ireland-vs-qatar");
  assert.deepEqual(
    market.outcomes.map(({ id, shortLabel, probability, teamId }) => ({
      id,
      shortLabel,
      probability,
      teamId
    })),
    [
      { id: "ireland-win", shortLabel: "Ireland win", probability: 87.5, teamId: "ireland" },
      { id: "draw", shortLabel: "Draw", probability: 10.5, teamId: "draw" }
    ]
  );
});

test("combines ESPN and Polymarket into overlay-ready real demo data", () => {
  const data = buildRealDemoData({ espnScoreboard, polymarketSearch });

  assert.equal(data.feed.badge, "REAL DATA · ESPN live · Polymarket");
  assert.equal(data.match.title, "Republic of Ireland vs Qatar");
  assert.equal(data.market.outcomes.length, 2);
  assert.equal(data.group.name, "Real Data Room");
  assert.equal(data.group.friends[0].outcomeId, "ireland-win");
  assert.equal(data.mascot.name, "Picanthe");
});

test("fetches real demo data from fixed ESPN and Polymarket endpoints", async () => {
  const requestedUrls = [];
  const data = await fetchRealDemoData({
    fetchImpl: async (url) => {
      requestedUrls.push(url);
      return {
        ok: true,
        json: async () => url.includes("site.api.espn.com") ? espnScoreboard : polymarketSearch
      };
    }
  });

  assert.equal(data.match.title, "Republic of Ireland vs Qatar");
  assert.ok(requestedUrls.some((url) =>
    url === "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.friendly/scoreboard?dates=20260528"
  ));
  assert.ok(requestedUrls.some((url) =>
    url.startsWith("https://gamma-api.polymarket.com/public-search?q=ireland+qatar")
  ));
});
