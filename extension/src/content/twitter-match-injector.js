(() => {
  const TWEET_SELECTOR = 'article[data-testid="tweet"], [data-prode-demo-tweet="true"]';
  const INJECTED_ATTR = "data-prode-bets-injected";
  const KEYWORDS = [
    "world cup",
    "mundial",
    "copa del mundo",
    "argentina",
    "brasil",
    "brazil",
    "mexico",
    "usa",
    "penales",
    "penalties",
    "final"
  ];

  const matchCard = {
    title: "Argentina vs Brazil",
    closesIn: "18:24",
    marketUrl: "https://polymarket.com",
    outcomes: [
      {
        name: "Argentina",
        probability: 47,
        volume: "$820K",
        flagAsset: "src/assets/flags/argentina.svg",
        accent: "#2f6bff"
      },
      {
        name: "Draw",
        probability: 28,
        volume: "$410K",
        accent: "#d7c7a0"
      },
      {
        name: "Brazil",
        probability: 25,
        volume: "$690K",
        flagAsset: "src/assets/flags/brazil.svg",
        accent: "#0f8f49"
      }
    ]
  };

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  const hasMatchKeyword = (text) => {
    const normalized = text.toLowerCase();
    return KEYWORDS.some((keyword) => normalized.includes(keyword));
  };

  const getAssetUrl = (path) => {
    try {
      return chrome.runtime.getURL(path);
    } catch (_error) {
      return path;
    }
  };

  const renderOutcome = (outcome) => `
    <button class="prode-tweet-outcome" type="button" data-action="open-polymarket">
      <span class="prode-tweet-country">
        ${outcome.flagAsset
          ? `<img src="${escapeHtml(getAssetUrl(outcome.flagAsset))}" alt="${escapeHtml(outcome.name)} flag">`
          : '<span class="prode-tweet-draw" aria-hidden="true">X</span>'}
        ${escapeHtml(outcome.name)}
      </span>
      <strong style="color:${escapeHtml(outcome.accent)}">${escapeHtml(outcome.probability)}%</strong>
      <span class="prode-tweet-bar" aria-hidden="true">
        <b style="width:${escapeHtml(outcome.probability)}%;background:${escapeHtml(outcome.accent)}"></b>
      </span>
      <small>Vol ${escapeHtml(outcome.volume)}</small>
    </button>
  `;

  const renderConfetti = () => Array.from({ length: 10 }, (_item, index) =>
    `<i style="--i:${index}" aria-hidden="true"></i>`
  ).join("");

  const createMarketCard = () => {
    const card = document.createElement("aside");
    card.className = "prode-tweet-market";
    card.innerHTML = `
      <div class="prode-confetti">${renderConfetti()}</div>
      <div class="prode-tweet-topline">
        <span>Match detected</span>
        <b>Market closes ${escapeHtml(matchCard.closesIn)}</b>
      </div>
      <h3>${escapeHtml(matchCard.title)}</h3>
      <div class="prode-tweet-grid">
        ${matchCard.outcomes.map(renderOutcome).join("")}
      </div>
      <p>Demo mode: this opens Polymarket externally. Prode Bets does not place orders inside X.</p>
    `;

    card.querySelectorAll('[data-action="open-polymarket"]').forEach((button) => {
      button.addEventListener("click", () => {
        window.open(matchCard.marketUrl, "_blank", "noopener,noreferrer");
      });
    });

    return card;
  };

  const injectIntoTweet = (tweet) => {
    if (!tweet) {
      return;
    }

    if (tweet.getAttribute(INJECTED_ATTR) === "true") {
      return;
    }

    if (!hasMatchKeyword(tweet.textContent || "")) {
      return;
    }

    tweet.setAttribute(INJECTED_ATTR, "true");
    tweet.append(createMarketCard());
  };

  const scanTweets = (root = document) => {
    root.querySelectorAll?.(TWEET_SELECTOR).forEach(injectIntoTweet);
  };

  const observeTweets = () => {
    if (!document.body) {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) {
            continue;
          }

          if (node.matches(TWEET_SELECTOR)) {
            injectIntoTweet(node);
          }

          injectIntoTweet(node.closest?.(TWEET_SELECTOR));
          scanTweets(node);
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    scanTweets();
  };

  if (window.top === window.self) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", observeTweets, { once: true });
    } else {
      observeTweets();
    }
  }
})();
