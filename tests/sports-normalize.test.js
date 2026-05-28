import assert from "node:assert/strict";
import test from "node:test";

import { normalizeEspnScoreboardEvent } from "../extension/src/sports/normalize-espn-scoreboard.js";

test("normalizes an ESPN-style soccer event into demo match data", () => {
  const match = normalizeEspnScoreboardEvent({
    id: "401-demo",
    name: "South vs North",
    shortName: "SOU v NOR",
    date: "2026-06-11T22:00Z",
    status: { type: { shortDetail: "10:00 - Pregame", state: "pre" } },
    competitions: [
      {
        competitors: [
          {
            homeAway: "home",
            score: "0",
            team: { id: "south", displayName: "South", abbreviation: "SOU", color: "8bdcff" }
          },
          {
            homeAway: "away",
            score: "0",
            team: { id: "north", displayName: "North", abbreviation: "NOR", color: "e86459" }
          }
        ]
      }
    ]
  });

  assert.deepEqual(match.match, {
    id: "401-demo",
    title: "South vs North",
    competition: "ESPN-style mock scoreboard",
    kickoffLabel: "10:00 - Pregame",
    marketClosesIn: "09:42",
    home: {
      id: "south",
      name: "South",
      colorStrip: ["#8bdcff", "#f8f4ed", "#8bdcff"]
    },
    away: {
      id: "north",
      name: "North",
      colorStrip: ["#e86459", "#f8f4ed", "#e86459"]
    }
  });
  assert.equal(match.feed.source, "ESPN-style mock");
  assert.equal(match.feed.status, "pre");
});
