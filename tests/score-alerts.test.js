import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDemoGoalAlert,
  buildGoalAlert
} from "../extension/src/shared/score-alerts.js";

const match = {
  id: "ireland-qatar-2026-05-28",
  title: "Republic of Ireland vs Qatar",
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
  }
};

test("builds a compact goal alert when the home score increases", () => {
  const alert = buildGoalAlert({
    previousMatch: match,
    currentMatch: {
      ...match,
      home: { ...match.home, score: "1" }
    }
  });

  assert.deepEqual({
    type: alert.type,
    scoringSide: alert.scoringSide,
    scoringTeamName: alert.scoringTeamName,
    scoreLabel: alert.scoreLabel
  }, {
    type: "goal",
    scoringSide: "home",
    scoringTeamName: "Republic of Ireland",
    scoreLabel: "1 - 0"
  });
  assert.equal(alert.home.flagAsset, "src/assets/flags/ireland.svg");
  assert.equal(alert.away.flagAsset, "src/assets/flags/qatar.svg");
});

test("builds a compact goal alert when the away score increases", () => {
  const alert = buildGoalAlert({
    previousMatch: match,
    currentMatch: {
      ...match,
      away: { ...match.away, score: 2 }
    }
  });

  assert.equal(alert.scoringSide, "away");
  assert.equal(alert.scoringTeamName, "Qatar");
  assert.equal(alert.scoreLabel, "0 - 2");
});

test("does not build a goal alert when the total score did not increase", () => {
  assert.equal(buildGoalAlert({ previousMatch: match, currentMatch: match }), null);
  assert.equal(buildGoalAlert({
    previousMatch: { ...match, home: { ...match.home, score: "1" } },
    currentMatch: match
  }), null);
});

test("builds a manual demo goal alert by incrementing one side", () => {
  const alert = buildDemoGoalAlert(match, { scoringTeamId: "qatar" });

  assert.equal(alert.scoringSide, "away");
  assert.equal(alert.scoringTeamName, "Qatar");
  assert.equal(alert.scoreLabel, "0 - 1");
});
