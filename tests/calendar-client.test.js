import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCalendarEvent,
  isGoogleCalendarConfigured,
  syncSelectedCountryMatches
} from "../extension/src/calendar/google-calendar-client.js";
import {
  WORLD_CUP_COUNTRIES,
  getMatchesForCountries
} from "../extension/src/calendar/world-cup-calendar.js";

test("world cup calendar fixture exposes grouped countries and known matches", () => {
  assert.equal(WORLD_CUP_COUNTRIES.length, 48);
  assert.equal(WORLD_CUP_COUNTRIES.filter((country) => country.group === "J").length, 4);
  assert.equal(getMatchesForCountries(["argentina"]).length, 3);
});

test("calendar configuration rejects placeholder client ids", () => {
  assert.equal(isGoogleCalendarConfigured({
    oauth2: { client_id: "YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com" }
  }), false);
  assert.equal(isGoogleCalendarConfigured({
    oauth2: { client_id: "real-client-id.apps.googleusercontent.com" }
  }), true);
});

test("builds Google Calendar event payloads from match fixtures", () => {
  const [match] = getMatchesForCountries(["argentina"]);
  const event = buildCalendarEvent(match, ["argentina"]);

  assert.equal(event.summary, "World Cup 2026: Argentina vs Algeria");
  assert.equal(event.location, "Kansas City Stadium");
  assert.equal(event.transparency, "opaque");
  assert.equal(event.extendedProperties.private.prodeBetsMatchId, match.id);
});

test("sync returns not_configured until OAuth client id is set", async () => {
  const result = await syncSelectedCountryMatches({
    state: { calendarCountryIds: ["argentina"], calendarEventIds: {} },
    manifest: { oauth2: { client_id: "YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com" } }
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "not_configured");
});

test("sync inserts selected matches and skips already created event ids", async () => {
  const calls = [];
  const chromeApi = {
    identity: {
      async getAuthToken() {
        return { token: "token-1" };
      }
    }
  };
  const fetchImpl = async (_url, options) => {
    calls.push(JSON.parse(options.body));
    return Response.json({ id: `event-${calls.length}` });
  };

  const result = await syncSelectedCountryMatches({
    chromeApi,
    fetchImpl,
    manifest: { oauth2: { client_id: "real-client-id.apps.googleusercontent.com" } },
    state: {
      calendarCountryIds: ["argentina"],
      calendarEventIds: { "wc2026-j-argentina-algeria": "existing-event" }
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.created.length, 2);
  assert.equal(result.skipped.length, 1);
  assert.equal(calls.length, 2);
  assert.equal(result.statePatch.calendarEventIds["wc2026-j-argentina-algeria"], "existing-event");
});
