export const DEFAULT_STATE = Object.freeze({
  overlayEnabled: true,
  tradingMode: "demo"
});

const VALID_KEYS = new Set(["overlayEnabled", "tradingMode"]);

export const reduceStatePatch = (currentState = DEFAULT_STATE, patch = {}) => {
  const nextState = { ...DEFAULT_STATE, ...currentState };

  for (const [key, value] of Object.entries(patch)) {
    if (!VALID_KEYS.has(key)) {
      continue;
    }

    if (key === "overlayEnabled" && typeof value === "boolean") {
      nextState.overlayEnabled = value;
    }

    if (key === "tradingMode" && typeof value === "string") {
      nextState.tradingMode = value;
    }
  }

  return nextState;
};
