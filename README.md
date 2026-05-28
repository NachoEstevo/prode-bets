# Prode Bets

Chrome extension prototype for football matchdays: a premium prode-style betting drop, friends leaderboard context, calendar-aware product direction, and a clean lane for future Polymarket trading.

## Current Scope

This repo starts with a no-build Manifest V3 extension. It demonstrates the browser experience without placing real orders:

- pre-match betting-style dropdown
- two outcome market card
- friends group leaderboard
- neo-pixel matchday overlay
- shared sample match data
- Polymarket integration notes for the next engineer

## Polymarket Boundary

The product direction includes real Polymarket betting, but the first scaffold does not trade. The extension should eventually surface eligible Polymarket markets and route trading through Polymarket's own non-custodial flow.

The friends layer is social only: picks, points, leaderboard, and reactions. It does not custody funds, settle private wagers, or run cash pools.

## Run Tests

```bash
npm test
```

## Load The Extension

1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Click `Load unpacked`.
4. Select the `extension/` folder in this repository.
5. Open any normal `http` or `https` page and wait for the Prode Bets overlay.

## Repo Map

- `extension/manifest.json`: Chrome extension manifest.
- `extension/src/content/`: injected page overlay and neo-pixel player styling.
- `extension/src/popup/`: extension popup.
- `extension/src/shared/sample-match.json`: single demo data source.
- `docs/polymarket-handoff.md`: integration notes for the Polymarket lane.
- `docs/superpowers/specs/`: product/design spec.
- `docs/superpowers/plans/`: implementation plan.
