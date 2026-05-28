(() => {
  const ROOT_ID = "matchday-goal-root";
  const DISPLAY_MS = 3200;
  const DEFAULT_MASCOT = {
    name: "Picanthe",
    spriteAsset: "src/assets/chili/picanthe-idle-kickups-sheet.png"
  };

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  const getAssetUrl = (path) => {
    try {
      if (typeof globalThis.__PRODE_PREVIEW_GET_URL__ === "function") {
        return globalThis.__PRODE_PREVIEW_GET_URL__(path);
      }
    } catch (_error) {
      // Fall through to the extension runtime resolver.
    }

    try {
      return chrome.runtime.getURL(path);
    } catch (_error) {
      return path;
    }
  };

  const getRoot = () => {
    const existing = document.getElementById(ROOT_ID);

    if (existing) {
      return existing;
    }

    const root = document.createElement("section");
    root.id = ROOT_ID;
    root.setAttribute("aria-live", "polite");
    document.documentElement.append(root);
    return root;
  };

  const renderFlag = (team) => team?.flagAsset
    ? `<img class="mm-goal-flag" src="${escapeHtml(getAssetUrl(team.flagAsset))}" alt="${escapeHtml(team.name)} flag">`
    : `<span class="mm-goal-flag mm-goal-flag-empty">${escapeHtml((team?.name || "?").slice(0, 1))}</span>`;

  const renderMascot = (mascot = DEFAULT_MASCOT) => `
    <div class="mm-goal-mascot" aria-hidden="true">
      <span class="mm-goal-chili">
        <img src="${escapeHtml(getAssetUrl(mascot.spriteAsset || DEFAULT_MASCOT.spriteAsset))}" alt="">
      </span>
    </div>
  `;

  const renderToast = (alert) => `
    <div class="mm-goal-toast" role="status">
      <div class="mm-goal-team">
        ${renderFlag(alert.home)}
        <span>${escapeHtml(alert.home?.name)}</span>
      </div>
      <div class="mm-goal-score">
        <strong>${escapeHtml(alert.scoreLabel)}</strong>
        <em>${escapeHtml(alert.scoringTeamName)} goal</em>
      </div>
      <div class="mm-goal-team mm-goal-team-away">
        ${renderFlag(alert.away)}
        <span>${escapeHtml(alert.away?.name)}</span>
      </div>
    </div>
    ${renderMascot(alert.mascot)}
  `;

  const showGoalAlert = (alert) => {
    if (!alert?.home || !alert?.away || !alert.scoreLabel) {
      return;
    }

    const root = getRoot();
    root.innerHTML = renderToast(alert);

    window.clearTimeout(root.__prodeExitTimer);
    window.clearTimeout(root.__prodeRemoveTimer);

    root.__prodeExitTimer = window.setTimeout(() => {
      root.querySelector(".mm-goal-toast")?.classList.add("mm-goal-toast-exit");
      root.querySelector(".mm-goal-mascot")?.classList.add("mm-goal-mascot-exit");
    }, DISPLAY_MS);

    root.__prodeRemoveTimer = window.setTimeout(() => {
      root.remove();
    }, DISPLAY_MS + 850);
  };

  window.addEventListener("prode-bets:goalAlert", (event) => {
    showGoalAlert(event.detail);
  });

  if (globalThis.chrome?.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type !== "matchday:goalAlert") {
        return false;
      }

      showGoalAlert(message.alert);
      return false;
    });
  }

  globalThis.__PRODE_BETS_SHOW_GOAL_ALERT__ = showGoalAlert;
})();
