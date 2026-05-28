import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_STATE, reduceStatePatch } from "../extension/src/shared/matchday-state.js";

test("default state starts with overlay enabled in demo trading mode", () => {
  assert.deepEqual(DEFAULT_STATE, {
    overlayEnabled: true,
    tradingMode: "demo"
  });
});

test("state reducer applies only supported keys", () => {
  const next = reduceStatePatch(DEFAULT_STATE, {
    overlayEnabled: false,
    tradingMode: "live-preview",
    unknown: "ignored"
  });

  assert.deepEqual(next, {
    overlayEnabled: false,
    tradingMode: "live-preview"
  });
});

test("state reducer ignores invalid value types", () => {
  const next = reduceStatePatch(DEFAULT_STATE, {
    overlayEnabled: "false",
    tradingMode: 123
  });

  assert.deepEqual(next, DEFAULT_STATE);
});
