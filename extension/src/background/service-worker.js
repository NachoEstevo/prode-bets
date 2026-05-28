const DEFAULT_STATE = {
  overlayEnabled: true,
  tradingMode: "demo",
  lastUpdatedAt: new Date().toISOString()
};

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(DEFAULT_STATE);
  await chrome.storage.local.set({ ...DEFAULT_STATE, ...current });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "matchday:getState") {
    return false;
  }

  chrome.storage.local.get(DEFAULT_STATE).then((state) => {
    sendResponse({ ok: true, state });
  });

  return true;
});
