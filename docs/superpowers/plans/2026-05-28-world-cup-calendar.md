# World Cup Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Calendar tab that persists selected World Cup countries and can create Google Calendar event blocks through Chrome OAuth.

**Architecture:** Calendar data, rendering, and Google API logic live in focused `extension/src/calendar/` modules. The content script renders and sends runtime messages; the background service worker owns OAuth and Calendar API calls.

**Tech Stack:** Manifest V3 Chrome extension, vanilla JavaScript modules, `chrome.storage.local`, `chrome.identity`, Google Calendar API.

---

### Task 1: Calendar State And Data

**Files:**
- Modify: `extension/src/shared/matchday-state.js`
- Create: `extension/src/calendar/world-cup-calendar.js`
- Test: `tests/matchday-state.test.js`

- [ ] Extend state with `calendarCountryIds` and `calendarEventIds`.
- [ ] Add grouped country metadata and a local match fixture.
- [ ] Add tests for valid/invalid calendar state patches.

### Task 2: Google Calendar Background Flow

**Files:**
- Modify: `extension/manifest.json`
- Modify: `extension/src/background/service-worker.js`
- Create: `extension/src/calendar/google-calendar-client.js`
- Test: `tests/repository.test.js`

- [ ] Add `identity`, Google API host permissions, OAuth placeholder, and web accessible Calendar modules.
- [ ] Add runtime messages for `matchday:calendarStatus` and `matchday:calendarSync`.
- [ ] Insert selected known matches through Google Calendar API when OAuth is configured.
- [ ] Return a clear `not_configured` result when the OAuth client id is still a placeholder.

### Task 3: Calendar Overlay Tab

**Files:**
- Modify: `extension/src/content/matchday-overlay.js`
- Modify: `extension/src/content/matchday-refined.css`
- Create: `extension/src/calendar/calendar-panel.js`
- Test: `tests/repository.test.js`

- [ ] Replace the `Mascot` tab with `Calendar`.
- [ ] Render grouped countries, search, checkbox rows, count summary, and Calendar CTA.
- [ ] Persist selection through `matchday:setState`.
- [ ] Trigger sync through `matchday:calendarSync`.

### Task 4: Verification

**Files:**
- Test: `tests/*.test.js`
- Artifact: local preview screenshot if useful.

- [ ] Run `npm test`.
- [ ] Open `preview/index.html` or local preview and verify the Calendar tab appears.
- [ ] Confirm the not-configured OAuth state is visible until a real Google OAuth client id is provided.
