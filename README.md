# Prode Bets

Chrome extension prototype for football matchdays: a premium prode-style betting drop, friends leaderboard context, calendar-aware product direction, and a clean lane for future Polymarket trading.

## Current Scope

This repo starts with a no-build Manifest V3 extension. It demonstrates the browser experience without placing real orders:

- pre-match betting-style dropdown
- two outcome market card
- friends group leaderboard
- neo-pixel matchday overlay
- X/Twitter keyword detector that injects a compact match market card into relevant tweets
- real country flag assets and a Picanthe chili sprite animation
- shared sample match data
- Polymarket integration notes for the next engineer

## Polymarket Boundary

The product direction includes real Polymarket betting, but the first scaffold does not trade. The extension should eventually surface eligible Polymarket markets and route trading through Polymarket's own non-custodial flow.

The friends layer is social only: picks, points, leaderboard, and reactions. It does not custody funds, settle private wagers, or run cash pools.

## Run Tests

```bash
npm test
```

## Fast Visual Preview

Open `preview/index.html` in a browser to review the overlay without installing the unpacked extension. This uses a small local Chrome API shim and the same content script/CSS as the real extension.

The preview references an ESPN-style mock feed. ESPN does not provide a clearly supported public soccer API for this prototype, so the repo currently includes a normalizer for scoreboard-shaped mock data in `extension/src/sports/normalize-espn-scoreboard.js`.

The preview is not a separate product surface. It is a local showroom for the same Manifest V3 content scripts that run in Chrome: the global matchday overlay plus the X/Twitter tweet injector.

## Load The Extension

1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Click `Load unpacked`.
4. Select the `extension/` folder in this repository.
5. Open any normal `http` or `https` page and wait for the Prode Bets overlay.

## Repo Map

- `extension/manifest.json`: Chrome extension manifest.
- `extension/src/content/`: injected page overlay, X/Twitter tweet injector, and neo-pixel player styling.
- `extension/src/popup/`: extension popup.
- `extension/src/shared/sample-match.json`: single demo data source.
- `extension/src/sports/`: sports scoreboard normalization seams for mocked or third-party feeds.
- `preview/index.html`: local overlay preview for quick visual iteration.
- `docs/polymarket-handoff.md`: integration notes for the Polymarket lane.
- `docs/superpowers/specs/`: product/design spec.
- `docs/superpowers/plans/`: implementation plan.
