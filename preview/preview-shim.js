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
      callback?.({
        ok: true,
        state: {
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
