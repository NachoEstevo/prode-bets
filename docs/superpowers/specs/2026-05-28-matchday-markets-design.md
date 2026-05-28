# Matchday Markets Design

## Product Frame

Matchday Markets is a Chrome extension for football matchdays. It protects the user's attention around important matches, drops a premium Twitch-style prediction panel before kickoff, and keeps a private friends leaderboard visible while the match unfolds.

The money hook is Polymarket. The extension should eventually surface real Polymarket markets and let eligible users trade through Polymarket's non-custodial flow. The social layer must not custody money, run friend-to-friend pools, or settle private wagers. Friends can predict, compare, react, and rank each other; real financial exposure belongs to Polymarket.

## MVP Promise

The first public repo should prove the browser experience:

- A Manifest V3 Chrome extension can inject a polished matchday overlay on normal web pages.
- The overlay can show a pre-match prediction drop with odds-style outcomes, volume, liquidity, and friend context.
- The popup can control demo state and expose the future Polymarket lane.
- Match data is centralized in one sample data file so visual surfaces do not invent separate business facts.

The MVP does not place real orders, connect wallets, or call Polymarket from production code. It leaves clear integration boundaries so another engineer can add that work safely.

## Visual Direction

The UI borrows the behavioral pattern of Twitch prediction cards: a panel drops down before an event closes, shows two strong outcomes, large percentages, market activity, and a clear action.

For Matchday Markets, that card lives inside Chrome:

- Dark glass panel with blue versus magenta outcome columns.
- Countdown to market close or kickoff.
- Country-color strips instead of official tournament/team logos.
- Friends panel showing picks and leaderboard status.
- Neo-pixel football player animation at the bottom edge of the page.
- Clean close/minimize behavior so the extension feels like a layer, not an ad.

Avoid official FIFA marks, club/selection crests, official kits, player likenesses, and any copy implying we operate a sportsbook.

## Architecture

The repo starts with a no-build Chrome extension. Static files can be loaded directly through `chrome://extensions` in developer mode. This keeps the hackathon path fast and removes unnecessary dependencies.

Main units:

- `extension/manifest.json`: Manifest V3 permissions and extension entrypoints.
- `extension/src/content/matchday-overlay.js`: Injects and manages the page overlay.
- `extension/src/content/matchday-overlay.css`: Owns the premium visual layer and animation.
- `extension/src/content/matchday-player.css`: Owns the decorative field edge and neo-pixel player.
- `extension/src/popup/*`: Extension popup that explains demo state and future trading lane.
- `extension/src/shared/sample-match.json`: Single source of truth for demo match, outcomes, and friend picks.
- `docs/polymarket-handoff.md`: Integration notes for the engineer adding market discovery/trading.

Future Polymarket code should be isolated under `extension/src/polymarket/` or a backend service. It should not be mixed into overlay rendering.

## Polymarket Boundary

Polymarket integration has three separate levels:

1. Market discovery: search/match football markets by fixture, team names, and close time.
2. Market display: show prices, liquidity, volume, and movement inside the drop.
3. Trading: authenticate an eligible user and submit signed orders through Polymarket's trading flow.

The repo should support level 1 and 2 before level 3. Trading requires explicit eligibility handling, wallet/auth flow, order preview/confirmation, and failure states. If eligibility is unavailable or restricted, the extension should show read-only market context or deep-link to Polymarket.

## Friends Layer

Friends are a product surface, not a payments layer.

MVP fields:

- group name
- friend display name
- selected outcome
- score prediction
- points
- reaction copy

Later backend:

- Supabase or Neon-backed groups
- invite links
- locked picks at kickoff
- leaderboard updates after match events
- optional auth provider

Do not add private cash pools until the product has a legal/compliance review.

## Acceptance Criteria

- The repository can be published to GitHub without secrets.
- `npm test` validates manifest and sample data.
- Chrome can load `extension/` as an unpacked extension.
- On any normal `http` or `https` page, the content script injects the Matchday drop.
- The popup opens and uses the same sample match data as the overlay.
- Polymarket work is documented but not entangled with demo rendering.

## Spec Review

- No placeholder features are required for the MVP.
- Trading is intentionally out of the first scaffold but documented as a separate lane.
- The extension is no-build by design, so no dependency is added before a real need exists.
- The data source for visible match facts is centralized.
