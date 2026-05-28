import { getCountryById, getMatchesForCountries, formatMatchSummary } from "./world-cup-calendar.js";

export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";
export const OAUTH_PLACEHOLDER = "YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com";

export const isGoogleCalendarConfigured = (manifest) => {
  const clientId = manifest?.oauth2?.client_id || "";
  return Boolean(clientId && clientId !== OAUTH_PLACEHOLDER && !clientId.includes("YOUR_GOOGLE"));
};

const getAuthToken = async ({ chromeApi = globalThis.chrome } = {}) => {
  const result = await chromeApi.identity.getAuthToken({
    interactive: true,
    scopes: [CALENDAR_SCOPE]
  });

  if (typeof result === "string") {
    return result;
  }

  return result?.token;
};

export const buildCalendarEvent = (match, selectedCountryIds = []) => {
  const watchedCountries = selectedCountryIds
    .filter((countryId) => countryId === match.homeCountryId || countryId === match.awayCountryId)
    .map((countryId) => getCountryById(countryId)?.name)
    .filter(Boolean);

  return {
    summary: formatMatchSummary(match),
    location: match.venue,
    description: [
      "Created by Prode Bets.",
      watchedCountries.length ? `Blocking because you follow: ${watchedCountries.join(", ")}.` : "",
      "Fixture data is local to this extension build; verify kickoff changes with FIFA."
    ].filter(Boolean).join("\n"),
    start: {
      dateTime: match.startsAt,
      timeZone: match.timeZone
    },
    end: {
      dateTime: match.endsAt,
      timeZone: match.timeZone
    },
    transparency: "opaque",
    reminders: {
      useDefault: true
    },
    extendedProperties: {
      private: {
        prodeBetsMatchId: match.id
      }
    }
  };
};

const insertCalendarEvent = async ({ event, fetchImpl, token }) => {
  const response = await fetchImpl("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(event)
  });

  if (!response.ok) {
    throw new Error(`Google Calendar insert failed: ${response.status}`);
  }

  return response.json();
};

export const syncSelectedCountryMatches = async ({
  chromeApi = globalThis.chrome,
  fetchImpl = globalThis.fetch,
  state,
  manifest = globalThis.chrome?.runtime?.getManifest()
}) => {
  if (!isGoogleCalendarConfigured(manifest)) {
    return {
      ok: false,
      reason: "not_configured",
      message: "Google Calendar OAuth client id is not configured yet."
    };
  }

  const selectedCountryIds = state.calendarCountryIds || [];
  const matches = getMatchesForCountries(selectedCountryIds);
  const existingEventIds = state.calendarEventIds || {};
  const token = await getAuthToken({ chromeApi });
  const nextEventIds = { ...existingEventIds };
  const created = [];
  const skipped = [];

  for (const match of matches) {
    if (nextEventIds[match.id]) {
      skipped.push(match.id);
      continue;
    }

    const event = await insertCalendarEvent({
      event: buildCalendarEvent(match, selectedCountryIds),
      fetchImpl,
      token
    });
    nextEventIds[match.id] = event.id;
    created.push({ matchId: match.id, eventId: event.id });
  }

  return {
    ok: true,
    created,
    skipped,
    statePatch: { calendarEventIds: nextEventIds }
  };
};
