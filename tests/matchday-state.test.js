import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_STATE, reduceStatePatch } from "../extension/src/shared/matchday-state.js";

test("default state starts with overlay enabled in demo trading mode", () => {
  assert.deepEqual(DEFAULT_STATE, {
    calendarCountryIds: [],
    calendarEventIds: {},
    overlayEnabled: true,
    tradingMode: "demo"
  });
});

test("state reducer applies only supported keys", () => {
  const next = reduceStatePatch(DEFAULT_STATE, {
    calendarCountryIds: ["argentina", "brazil"],
    calendarEventIds: { "wc2026-j-argentina-algeria": "google-event-1" },
    overlayEnabled: false,
    tradingMode: "live-preview",
    unknown: "ignored"
  });

  assert.deepEqual(next, {
    calendarCountryIds: ["argentina", "brazil"],
    calendarEventIds: { "wc2026-j-argentina-algeria": "google-event-1" },
    overlayEnabled: false,
    tradingMode: "live-preview"
  });
});

test("state reducer ignores invalid value types", () => {
  const next = reduceStatePatch(DEFAULT_STATE, {
    calendarCountryIds: [123],
    calendarEventIds: ["bad"],
    overlayEnabled: "false",
    tradingMode: 123
  });

  assert.deepEqual(next, DEFAULT_STATE);
});

test("state reducer deduplicates calendar country ids", () => {
  const next = reduceStatePatch(DEFAULT_STATE, {
    calendarCountryIds: ["argentina", "argentina", "algeria"]
  });

  assert.deepEqual(next.calendarCountryIds, ["argentina", "algeria"]);
});
