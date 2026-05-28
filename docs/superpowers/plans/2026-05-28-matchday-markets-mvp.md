# Prode Bets MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a publishable Chrome extension scaffold that demonstrates a premium pre-match betting drop, friends leaderboard, and a clean handoff lane for Polymarket integration.

**Architecture:** Start with a no-build Manifest V3 extension using static HTML, CSS, and JavaScript. Keep demo match facts in one JSON file consumed by both content overlay and popup. Keep future Polymarket API/trading logic out of UI files and document the integration boundary.

**Tech Stack:** Chrome Extension Manifest V3, vanilla JavaScript, CSS, Node built-in test runner, static JSON sample data.

---

## File Structure

- `extension/manifest.json`: Chrome extension manifest, permissions, content script, popup, and web-accessible demo data.
- `extension/src/shared/sample-match.json`: Central demo data for match, outcomes, friends, and Polymarket integration metadata.
- `extension/src/content/matchday-overlay.js`: Loads sample data, builds the betting drop and friends panel, and handles close/minimize actions.
- `extension/src/content/matchday-overlay.css`: Premium overlay styling, motion, responsive behavior, and neo-pixel player.
- `extension/src/content/matchday-player.css`: Decorative field edge and neo-pixel player styling.
- `extension/src/popup/popup.html`: Popup shell.
- `extension/src/popup/popup.css`: Popup styling.
- `extension/src/popup/popup.js`: Popup data loading and UI rendering.
- `docs/polymarket-handoff.md`: Notes for adding market discovery and trading.
- `tests/repository.test.js`: Node tests for manifest shape and sample data integrity.

## Task 1: Repository Baseline

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `AGENTS.md`
- Create: `README.md`
- Create: `docs/superpowers/specs/2026-05-28-matchday-markets-design.md`
- Create: `docs/superpowers/plans/2026-05-28-matchday-markets-mvp.md`

- [ ] **Step 1: Create package metadata**

```json
{
  "name": "matchday-markets",
  "version": "0.1.0",
  "private": true,
  "description": "Chrome extension prototype for matchday betting drops, friends predictions, and future Polymarket integration.",
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 2: Add public repo documentation**

Create `README.md` with install instructions for `chrome://extensions`, the current MVP scope, and the explicit Polymarket boundary.

- [ ] **Step 3: Commit baseline**

```bash
git add package.json .gitignore AGENTS.md README.md docs
git commit -m "docs: define matchday markets repo direction"
```

## Task 2: Tests First

**Files:**
- Create: `tests/repository.test.js`

- [ ] **Step 1: Write manifest and sample data tests**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readJson = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));

test("manifest is a Manifest V3 extension with content overlay and popup", async () => {
  const manifest = await readJson("extension/manifest.json");

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.action.default_popup, "src/popup/popup.html");
  assert.equal(manifest.background.service_worker, "src/background/service-worker.js");
  assert.equal(manifest.content_scripts.length, 1);
  assert.deepEqual(manifest.content_scripts[0].js, ["src/content/matchday-overlay.js"]);
  assert.deepEqual(manifest.content_scripts[0].css, ["src/content/matchday-overlay.css"]);
});

test("sample match has two outcomes that sum to 100 percent", async () => {
  const sample = await readJson("extension/src/shared/sample-match.json");
  const total = sample.market.outcomes.reduce((sum, outcome) => sum + outcome.probability, 0);

  assert.equal(sample.market.outcomes.length, 2);
  assert.equal(total, 100);
});

test("friend picks reference existing outcome ids", async () => {
  const sample = await readJson("extension/src/shared/sample-match.json");
  const outcomeIds = new Set(sample.market.outcomes.map((outcome) => outcome.id));

  assert.ok(sample.group.friends.length >= 3);
  for (const friend of sample.group.friends) {
    assert.ok(outcomeIds.has(friend.outcomeId), `${friend.name} references an unknown outcome`);
  }
});
```

- [ ] **Step 2: Run tests and verify red**

Run: `npm test`

Expected: FAIL because `extension/manifest.json` and `extension/src/shared/sample-match.json` do not exist yet.

## Task 3: Extension Shell

**Files:**
- Create: `extension/manifest.json`
- Create: `extension/src/background/service-worker.js`
- Create: `extension/src/shared/sample-match.json`

- [ ] **Step 1: Add Manifest V3 shell**

Create `extension/manifest.json` with content scripts for `http` and `https`, popup entrypoint, `storage` and `alarms` permissions, and `sample-match.json` as a web-accessible resource.

- [ ] **Step 2: Add service worker**

Create `extension/src/background/service-worker.js` that sets default demo state on install and exposes a `matchday:getState` message response.

- [ ] **Step 3: Add sample data**

Create `extension/src/shared/sample-match.json` with two outcomes whose probabilities sum to 100 and at least three friends whose picks reference those outcome IDs.

- [ ] **Step 4: Run tests and verify green**

Run: `npm test`

Expected: PASS for manifest and sample data checks.

## Task 4: Content Overlay

**Files:**
- Create: `extension/src/content/matchday-overlay.js`
- Create: `extension/src/content/matchday-overlay.css`
- Create: `extension/src/content/matchday-player.css`

- [ ] **Step 1: Implement overlay loader**

Load `src/shared/sample-match.json` through `chrome.runtime.getURL`, fall back to embedded safe copy when fetch fails, and render the root only once.

- [ ] **Step 2: Implement betting drop**

Render a fixed top panel with countdown, match name, two outcomes, probability, volume, liquidity, and `Buy` buttons. Buttons must not place orders; they show a disabled-state explanation and future lane copy.

- [ ] **Step 3: Implement friends panel and player**

Render group status, friend picks, points, and a decorative neo-pixel player/field edge. Keep all interaction local.

- [ ] **Step 4: Manual verify**

Load `extension/` via `chrome://extensions`, open a normal web page, and verify the drop appears, closes, and does not break page scrolling.

## Task 5: Popup

**Files:**
- Create: `extension/src/popup/popup.html`
- Create: `extension/src/popup/popup.css`
- Create: `extension/src/popup/popup.js`

- [ ] **Step 1: Create popup shell**

Render product name, match summary, market status, friend group summary, and a Polymarket handoff note.

- [ ] **Step 2: Load the same sample data**

Use `chrome.runtime.getURL("src/shared/sample-match.json")` so popup and overlay stay aligned.

- [ ] **Step 3: Manual verify**

Open the extension popup after loading the unpacked extension and verify the summary matches the overlay.

## Task 6: Polymarket Handoff

**Files:**
- Create: `docs/polymarket-handoff.md`

- [ ] **Step 1: Document integration layers**

Describe market discovery, market display, order preview, authentication, order submission, eligibility handling, and failure modes.

- [ ] **Step 2: Document boundaries**

State that friends are not cash pools, the extension does not custody funds, and restricted users should get read-only or external-link behavior.

- [ ] **Step 3: Commit scaffold**

```bash
git add extension tests docs README.md package.json
git commit -m "feat: scaffold matchday markets extension"
```

## Self-Review

- Spec coverage: The plan covers repo setup, test-first validation, extension shell, overlay, popup, and Polymarket handoff.
- Placeholder scan: No task requires unknown APIs to be invented inside the MVP. Future trading work is isolated as a documented lane.
- Type consistency: The sample data path is consistently `extension/src/shared/sample-match.json`; the content script path is consistently `extension/src/content/matchday-overlay.js`; the popup path is consistently `extension/src/popup/popup.html`.
