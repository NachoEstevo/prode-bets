# World Cup Calendar Design

## Goal

Replace the low-value Mascot tab with a Calendar tab that lets users select World Cup 2026 countries and create busy blocks in Google Calendar for the selected countries' known matches.

## Current Repo State

- The overlay already has tabs: `Market`, `Friends`, and `Mascot`.
- The Picanthe mascot already lives as a floating sprite, so a dedicated Mascot tab is redundant.
- There is no calendar implementation yet: no schedule model, Google Calendar API client, `chrome.identity`, or Calendar permissions.

## Product Design

- Rename the third overlay tab from `Mascot` to `Calendar`.
- Show a searchable country checklist grouped by World Cup group.
- Persist selected country ids in `chrome.storage.local`.
- Show selected country count and number of known match blocks.
- Provide one CTA: `Connect Google Calendar` or `Block selected matches`.
- If Google OAuth is not configured, show a clear setup note instead of failing silently.

## Technical Design

- Use `chrome.identity.getAuthToken` from the background service worker.
- Request the minimum Google Calendar scope: `https://www.googleapis.com/auth/calendar.events`.
- Insert events via `POST https://www.googleapis.com/calendar/v3/calendars/primary/events`.
- Keep the content script thin: it renders the Calendar panel and sends runtime messages.
- Keep Calendar business logic in `extension/src/calendar/` modules.
- Store created Google event ids by match id so repeated clicks do not create duplicates.

## Data Scope

The first implementation ships the UI and API flow with a local World Cup country/schedule fixture. The fixture is intentionally isolated so it can be replaced by an official feed without rewriting UI or OAuth code.

## Acceptance Criteria

- Overlay tabs read `Market`, `Friends`, `Calendar`.
- Calendar panel renders grouped countries, search, checkboxes, and a sync CTA.
- Country selections persist in extension state.
- Background service worker exposes Calendar status and sync messages.
- If OAuth is configured, selected known matches are inserted into Google Calendar.
- If OAuth is not configured, the UI shows a setup message.
- Existing tests pass.
