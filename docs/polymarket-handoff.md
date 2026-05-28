# Prode Bets Polymarket Handoff

This repo is ready for a separate Polymarket integration lane. Keep this work isolated from overlay rendering until the data contract is stable.

## Product Goal

Before kickoff, Prode Bets should surface the relevant Polymarket contract in a Twitch-style dropdown:

- outcome prices or probabilities
- volume and liquidity
- time until market close or kickoff
- external confirmation path or in-extension order preview
- friends leaderboard beside the market

The friends layer remains social. It tracks picks, points, and reactions. It does not custody funds, run private pools, or settle friend-to-friend wagers.

## Integration Layers

1. **Discovery**
   - Find football markets by query, event, or tag.
   - Match market titles to fixture data.
   - Store the selected market ID and outcome token IDs in the app state.

2. **Display**
   - Fetch outcome prices, liquidity, volume, spread, and movement.
   - Normalize data into the same shape as `extension/src/shared/sample-match.json`.
   - Keep rendering code unaware of raw Polymarket API responses.

3. **Trading**
   - Add wallet/auth only after discovery and display are reliable.
   - Show an explicit order preview before any signed order.
   - Submit orders through Polymarket's documented trading flow.
   - Keep failure states visible: restricted region, missing wallet, insufficient balance, stale price, market closed, order rejected.

## Suggested File Boundary

Use this shape when adding real integration:

```text
extension/src/polymarket/
  discovery.js
  market-data.js
  normalize-market.js
  trading-client.js
  eligibility.js
```

`matchday-overlay.js` should receive normalized match data. It should not know how to sign orders or call CLOB endpoints.

The first pure seam now exists at `extension/src/polymarket/normalize-market.js`. Feed it a two- or three-outcome market-like object and it returns the internal `market` shape used by `sample-match.json`. Keep network fetching and order submission outside that file.

## Backend Option

The current friends room persists in `chrome.storage.local` through `extension/src/social/room-client.js`. Use Supabase or Neon when groups need cross-device sync:

- users
- groups
- memberships
- picks
- match events
- leaderboard snapshots

Do not store private keys, wallet secrets, or Polymarket API secrets in the extension repo.

## Compliance Notes

Polymarket availability is jurisdiction-sensitive. The product must support read-only mode or external-link mode for restricted users. Do not encourage VPN bypassing. Do not present private friends picks as a regulated cash pool.

Useful official docs:

- Polymarket API overview: https://docs.polymarket.com/api-reference/introduction
- Polymarket CLOB trading overview: https://docs.polymarket.com/trading/overview
- Polymarket geographic restrictions: https://help.polymarket.com/en/articles/13364163-geographic-restrictions
- Chrome content scripts: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
