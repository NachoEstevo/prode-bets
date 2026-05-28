const card = document.querySelector("#match-card");
const marketLink = document.querySelector("#market-link");

const loadData = async () => {
  const response = await fetch(chrome.runtime.getURL("src/shared/sample-match.json"));

  if (!response.ok) {
    throw new Error(`Could not load sample match: ${response.status}`);
  }

  return response.json();
};

const renderOutcome = (outcome) => `
  <article class="outcome" style="--accent:${outcome.accent}">
    <strong>${outcome.shortLabel}</strong>
    <b>${outcome.probability}%</b>
    <span>${outcome.volume} vol</span>
  </article>
`;

const render = (data) => {
  marketLink.href = data.market.externalUrl;
  card.innerHTML = `
    <div class="match-title">${data.match.title}</div>
    <div class="countdown">Closes in ${data.match.marketClosesIn}</div>
    <div class="outcomes">
      ${data.market.outcomes.map(renderOutcome).join("")}
    </div>
    <div class="group">
      ${data.group.name}: ${data.group.friends.length} friends tracking this match.
    </div>
  `;
};

loadData()
  .then(render)
  .catch((error) => {
    card.innerHTML = `<p>${error.message}</p>`;
  });
