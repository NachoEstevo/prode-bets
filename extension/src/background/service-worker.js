import { DEFAULT_STATE, reduceStatePatch } from "../shared/matchday-state.js";

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(DEFAULT_STATE);
  await chrome.storage.local.set({ ...DEFAULT_STATE, ...current });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "matchday:getState") {
    chrome.storage.local.get(DEFAULT_STATE).then((state) => {
      sendResponse({ ok: true, state: reduceStatePatch(DEFAULT_STATE, state) });
    });

    return true;
  }

  if (message?.type === "matchday:setState") {
    chrome.storage.local.get(DEFAULT_STATE).then(async (state) => {
      const nextState = reduceStatePatch(state, message.patch);
      await chrome.storage.local.set(nextState);
      sendResponse({ ok: true, state: nextState });
    });

    return true;
  }

  return false;
});
