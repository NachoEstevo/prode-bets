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

const buildPreviewGoalAlert = async () => {
  const response = await fetch(globalThis.__PRODE_PREVIEW_GET_URL__("src/shared/sample-match.json"));
  const data = await response.json();
  const homeScore = Number(data.match.home.score || 0) + 1;
  const awayScore = Number(data.match.away.score || 0);

  return {
    type: "goal",
    matchId: data.match.id,
    matchTitle: data.match.title,
    scoringSide: "home",
    scoringTeamName: data.match.home.name,
    scoreLabel: `${homeScore} - ${awayScore}`,
    home: { ...data.match.home, score: homeScore },
    away: { ...data.match.away, score: awayScore },
    mascot: data.mascot
  };
};

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-demo-goal]");

  if (!button) {
    return;
  }

  window.dispatchEvent(new CustomEvent("prode-bets:goalAlert", {
    detail: await buildPreviewGoalAlert()
  }));
});
