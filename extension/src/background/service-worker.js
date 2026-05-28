import { DEFAULT_STATE, reduceStatePatch } from "../shared/matchday-state.js";
import { isGoogleCalendarConfigured, syncSelectedCountryMatches } from "../calendar/google-calendar-client.js";

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

  if (message?.type === "matchday:calendarStatus") {
    sendResponse({
      ok: true,
      configured: isGoogleCalendarConfigured(chrome.runtime.getManifest())
    });

    return false;
  }

  if (message?.type === "matchday:calendarSync") {
    chrome.storage.local.get(DEFAULT_STATE).then(async (state) => {
      const currentState = reduceStatePatch(DEFAULT_STATE, state);
      const result = await syncSelectedCountryMatches({
        state: currentState,
        manifest: chrome.runtime.getManifest()
      });

      if (result.statePatch) {
        const nextState = reduceStatePatch(currentState, result.statePatch);
        await chrome.storage.local.set(nextState);
      }

      sendResponse(result);
    }).catch((error) => {
      sendResponse({
        ok: false,
        reason: "sync_failed",
        message: error.message
      });
    });

    return true;
  }

  return false;
});
