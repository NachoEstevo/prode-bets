globalThis.__PRODE_PREVIEW_GET_URL__ = (path) => {
  if (path === "src/shared/sample-match.json") {
    return new URL("../extension/src/shared/sample-match.json", window.location.href).href;
  }

  return new URL(`../extension/${path}`, window.location.href).href;
};

globalThis.chrome = {
  runtime: {
    getURL(path) {
      return globalThis.__PRODE_PREVIEW_GET_URL__(path);
    },
    sendMessage(message, callback) {
      if (message?.type === "matchday:calendarStatus") {
        callback?.({ ok: true, configured: false });
        return;
      }

      if (message?.type === "matchday:calendarSync") {
        callback?.({
          ok: false,
          reason: "not_configured",
          message: "Google Calendar OAuth client id is not configured in preview."
        });
        return;
      }

      callback?.({
        ok: true,
        state: {
          calendarCountryIds: [],
          calendarEventIds: {},
          overlayEnabled: message?.patch?.overlayEnabled ?? true,
          tradingMode: "demo"
        }
      });
    },
    onMessage: {
      addListener() {}
    },
    lastError: null
  }
};
