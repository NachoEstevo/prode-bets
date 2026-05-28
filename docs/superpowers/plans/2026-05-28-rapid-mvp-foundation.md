# Rapid MVP Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Prode Bets faster to iterate by adding real overlay controls, a local visual preview, and a tested Polymarket normalization seam without adding trading.

**Architecture:** Keep the no-build Manifest V3 extension. Put reusable state logic and Polymarket market normalization in small ESM modules that Node tests can import. Keep content-script rendering local, with message-based show/hide control from the popup.

**Tech Stack:** Chrome Extension Manifest V3, vanilla JavaScript, CSS, Node built-in test runner.

---

## Bounded Backlog

- Add shared state reducer for extension settings.
- Wire popup buttons to show/hide the page overlay through Chrome messaging.
- Let the content script hide, show, and re-render the overlay based on state changes.
- Add a local `preview/index.html` that renders the extension overlay without installing Chrome extension.
- Add a pure Polymarket market normalizer for teammate integration work.

## No-Touch Areas

- No real order placement.
- No wallet auth.
- No backend, Supabase, Neon, or database schema.
- No dependency or framework migration.
- No private cash pools between friends.

## Task 1: Shared State

**Files:**
- Create: `extension/src/shared/matchday-state.js`
- Create: `tests/matchday-state.test.js`
- Modify: `extension/src/background/service-worker.js`

- [ ] **Step 1: Write failing tests for default state and whitelisted patches**
- [ ] **Step 2: Run `npm test` and verify the new tests fail because the module does not exist**
- [ ] **Step 3: Implement `DEFAULT_STATE` and `reduceStatePatch`**
- [ ] **Step 4: Use the shared reducer in the service worker**
- [ ] **Step 5: Run `npm test` and verify green**

## Task 2: Popup and Content Controls

**Files:**
- Modify: `extension/src/popup/popup.html`
- Modify: `extension/src/popup/popup.js`
- Modify: `extension/src/popup/popup.css`
- Modify: `extension/src/content/matchday-overlay.js`
- Modify: `tests/repository.test.js`

- [ ] **Step 1: Add failing static tests for popup controls and content message listener**
- [ ] **Step 2: Run `npm test` and verify red**
- [ ] **Step 3: Add Show/Hide buttons in popup**
- [ ] **Step 4: Add popup state messages to background and active tab**
- [ ] **Step 5: Add content listener for show/hide re-render**
- [ ] **Step 6: Run `npm test` and syntax checks**

## Task 3: Local Preview

**Files:**
- Create: `preview/index.html`
- Create: `preview/preview-shim.js`
- Modify: `README.md`
- Modify: `tests/repository.test.js`

- [ ] **Step 1: Add failing test for preview entrypoint and Chrome shim**
- [ ] **Step 2: Run `npm test` and verify red**
- [ ] **Step 3: Implement the preview page and shim**
- [ ] **Step 4: Document `preview/index.html` in README**
- [ ] **Step 5: Run `npm test`**

## Task 4: Polymarket Normalizer

**Files:**
- Create: `extension/src/polymarket/normalize-market.js`
- Create: `tests/polymarket-normalize.test.js`
- Modify: `docs/polymarket-handoff.md`

- [ ] **Step 1: Write failing tests for normalizing an external two-outcome market**
- [ ] **Step 2: Run `npm test` and verify red**
- [ ] **Step 3: Implement the pure normalizer without network calls**
- [ ] **Step 4: Update handoff doc to point at the normalizer**
- [ ] **Step 5: Run `npm test` and syntax checks**

## Done Criteria

- `npm test` passes.
- `node --check` passes for all extension JS files.
- Files stay under 300 lines where reasonable.
- Branch is committed and pushed for review.
- No code path submits a Polymarket order.

## Self-Review

- Scope is narrow enough for one sprint.
- Polymarket is prepared as data normalization, not trading.
- The preview improves visual iteration without adding tooling.
