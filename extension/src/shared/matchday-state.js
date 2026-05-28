export const DEFAULT_STATE = Object.freeze({
  calendarCountryIds: [],
  calendarEventIds: {},
  overlayEnabled: true,
  tradingMode: "demo"
});

const VALID_KEYS = new Set(["calendarCountryIds", "calendarEventIds", "overlayEnabled", "tradingMode"]);

const isStringArray = (value) =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isStringRecord = (value) =>
  value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.entries(value).every(([key, item]) => typeof key === "string" && typeof item === "string");

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

    if (key === "calendarCountryIds" && isStringArray(value)) {
      nextState.calendarCountryIds = [...new Set(value)];
    }

    if (key === "calendarEventIds" && isStringRecord(value)) {
      nextState.calendarEventIds = { ...value };
    }
  }

  return nextState;
};
