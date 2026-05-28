globalThis.chrome = {
  runtime: {
    getURL(path) {
      if (path === "src/shared/sample-match.json") {
        return "../extension/src/shared/sample-match.json";
      }

      return `../extension/${path}`;
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
