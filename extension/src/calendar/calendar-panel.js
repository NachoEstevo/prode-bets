import {
  WORLD_CUP_COUNTRIES,
  getMatchesForCountries
} from "./world-cup-calendar.js";
import { buildIcsCalendar, buildIcsFilename } from "./ics-calendar.js";

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

const groups = [...new Set(WORLD_CUP_COUNTRIES.map((country) => country.group))];

const renderCountry = (country) => `
  <label class="mm-calendar-country" data-calendar-country data-country-name="${escapeHtml(country.name.toLowerCase())}" data-country-group="${escapeHtml(country.group)}">
    <input type="checkbox" value="${escapeHtml(country.id)}" data-calendar-country-input>
    <span>
      <strong>${escapeHtml(country.name)}</strong>
      <small>Group ${escapeHtml(country.group)}</small>
    </span>
    <em data-calendar-match-count="${escapeHtml(country.id)}">0 matches</em>
  </label>
`;

export const renderCalendarPanel = () => `
  <section class="mm-tab-panel" data-panel="calendar" role="tabpanel" hidden>
    <div class="mm-calendar-panel">
      <div class="mm-calendar-head">
        <strong>Block your World Cup windows</strong>
        <p>Select countries and add their known matches to Google Calendar as busy blocks.</p>
      </div>
      <input class="mm-calendar-search" type="search" placeholder="Search qualified country..." data-calendar-search>
      <div class="mm-calendar-list">
        ${groups.map((group) => `
          <div class="mm-calendar-group" data-calendar-group="${escapeHtml(group)}">
            <div class="mm-calendar-group-label">Group ${escapeHtml(group)}</div>
            ${WORLD_CUP_COUNTRIES.filter((country) => country.group === group).map(renderCountry).join("")}
          </div>
        `).join("")}
      </div>
      <div class="mm-calendar-footer">
        <p data-calendar-status>Loading Calendar state...</p>
        <div class="mm-calendar-actions">
          <button class="mm-calendar-ics" type="button" data-action="download-ics">Download .ics</button>
          <button class="mm-calendar-sync" type="button" data-action="sync-calendar">Connect Google Calendar</button>
        </div>
      </div>
    </div>
  </section>
`;

const sendRuntimeMessage = (message) =>
  new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(message, (response) => resolve(response));
    } catch (_error) {
      resolve({ ok: false, reason: "runtime_unavailable" });
    }
  });

const summarize = ({ selectedCountryIds, configured }) => {
  const matchCount = getMatchesForCountries(selectedCountryIds).length;

  if (!configured) {
    return selectedCountryIds.length === 0
      ? "Select countries, then download an .ics file or connect Google Calendar."
      : `${selectedCountryIds.length} countries selected - ${matchCount} known match blocks. Download .ics works without Google auth.`;
  }

  if (selectedCountryIds.length === 0) {
    return "Select at least one country to create match blocks.";
  }

  return `${selectedCountryIds.length} countries selected - ${matchCount} known match blocks.`;
};

export const bindCalendarPanel = async (root) => {
  const inputs = [...root.querySelectorAll("[data-calendar-country-input]")];
  const status = root.querySelector("[data-calendar-status]");
  const syncButton = root.querySelector('[data-action="sync-calendar"]');
  const icsButton = root.querySelector('[data-action="download-ics"]');
  const search = root.querySelector("[data-calendar-search]");
  const counts = root.querySelectorAll("[data-calendar-match-count]");
  const stateResponse = await sendRuntimeMessage({ type: "matchday:getState" });
  const calendarStatus = await sendRuntimeMessage({ type: "matchday:calendarStatus" });
  let selectedCountryIds = stateResponse?.state?.calendarCountryIds || [];
  let configured = Boolean(calendarStatus?.configured);

  counts.forEach((node) => {
    const matches = getMatchesForCountries([node.dataset.calendarMatchCount]);
    node.textContent = `${matches.length} matches`;
  });

  const render = () => {
    const selected = new Set(selectedCountryIds);
    inputs.forEach((input) => {
      input.checked = selected.has(input.value);
    });
    status.textContent = summarize({ selectedCountryIds, configured });
    syncButton.textContent = configured ? "Block selected matches" : "Connect Google";
    icsButton.disabled = getMatchesForCountries(selectedCountryIds).length === 0;
  };

  const persistSelection = async () => {
    await sendRuntimeMessage({
      type: "matchday:setState",
      patch: { calendarCountryIds: selectedCountryIds }
    });
  };

  inputs.forEach((input) => {
    input.addEventListener("change", async () => {
      selectedCountryIds = inputs.filter((item) => item.checked).map((item) => item.value);
      render();
      await persistSelection();
    });
  });

  search.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase();
    root.querySelectorAll("[data-calendar-country]").forEach((row) => {
      row.hidden = query.length > 0 && !row.dataset.countryName.includes(query);
    });
    root.querySelectorAll("[data-calendar-group]").forEach((group) => {
      const visibleRows = [...group.querySelectorAll("[data-calendar-country]")].some((row) => !row.hidden);
      group.hidden = !visibleRows;
    });
  });

  icsButton.addEventListener("click", () => {
    const matches = getMatchesForCountries(selectedCountryIds);

    if (matches.length === 0) {
      status.textContent = "Select a country with known fixtures before downloading .ics.";
      return;
    }

    const blob = new Blob([buildIcsCalendar(selectedCountryIds)], {
      type: "text/calendar;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = buildIcsFilename(selectedCountryIds);
    root.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    status.textContent = `${matches.length} match blocks downloaded as .ics. Import it into Google Calendar.`;
  });

  syncButton.addEventListener("click", async () => {
    status.textContent = configured ? "Creating calendar blocks..." : "Google Calendar setup is required.";
    const response = await sendRuntimeMessage({ type: "matchday:calendarSync" });

    if (response?.ok) {
      configured = true;
      status.textContent = `${response.created.length} blocks created. ${response.skipped.length} already existed.`;
      return;
    }

    status.textContent = `${response?.message || "Calendar sync is not available yet."} Download .ics instead.`;
  });

  render();
};
