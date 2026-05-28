import { DEFAULT_STATE, reduceStatePatch } from "../shared/matchday-state.js";
import { buildGoalAlert } from "../shared/score-alerts.js";
import { isGoogleCalendarConfigured, syncSelectedCountryMatches } from "../calendar/google-calendar-client.js";
import { fetchRealDemoData } from "../real-demo/ireland-qatar-demo.js";

const SCORE_POLL_ALARM = "matchday:scorePoll";
const SCORE_SNAPSHOTS_KEY = "scoreSnapshotsByMatch";

const compactMatchScore = (match) => ({
  id: match.id,
  title: match.title,
  home: {
    id: match.home?.id,
    name: match.home?.name,
    flagAsset: match.home?.flagAsset,
    score: match.home?.score
  },
  away: {
    id: match.away?.id,
    name: match.away?.name,
    flagAsset: match.away?.flagAsset,
    score: match.away?.score
  }
});

const sendGoalAlertToTab = (tabId, alert) =>
  new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: "matchday:goalAlert", alert }, () => {
      chrome.runtime.lastError;
      resolve();
    });
  });

const broadcastGoalAlert = async (alert) => {
  if (!alert || !chrome.tabs?.query) {
    return;
  }

  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map((tab) => tab.id ? sendGoalAlertToTab(tab.id, alert) : null));
};

const trackScoreAndMaybeBroadcast = async (data, { broadcast = true } = {}) => {
  const match = data?.match;

  if (!match?.id) {
    return null;
  }

  const stored = await chrome.storage.local.get({ [SCORE_SNAPSHOTS_KEY]: {} });
  const snapshots = stored[SCORE_SNAPSHOTS_KEY] || {};
  const previousMatch = snapshots[match.id];
  const alert = buildGoalAlert({
    previousMatch,
    currentMatch: match
  });

  await chrome.storage.local.set({
    [SCORE_SNAPSHOTS_KEY]: {
      ...snapshots,
      [match.id]: compactMatchScore(match)
    }
  });

  if (broadcast && alert) {
    await broadcastGoalAlert({
      ...alert,
      mascot: data.mascot
    });
  }

  return alert;
};

const refreshScorePoll = async () => {
  const data = await fetchRealDemoData();
  await trackScoreAndMaybeBroadcast(data, { broadcast: true });
};

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(DEFAULT_STATE);
  await chrome.storage.local.set({ ...DEFAULT_STATE, ...current });
  chrome.alarms?.create(SCORE_POLL_ALARM, { periodInMinutes: 1 });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "matchday:getRealDemoData") {
    fetchRealDemoData().then(async (data) => {
      await trackScoreAndMaybeBroadcast(data, { broadcast: true });
      sendResponse({ ok: true, data });
    });

    return true;
  }

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

chrome.alarms?.onAlarm?.addListener((alarm) => {
  if (alarm.name !== SCORE_POLL_ALARM) {
    return;
  }

  refreshScorePoll().catch(() => {});
});
