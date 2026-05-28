# Picanthe Chili Mascot Design

## Goal

Make the extension's visual centerpiece a premium pixel-art red Picanthe chili mascot doing football kickups near the bottom-left field area of the matchday overlay.

The mascot should feel closer to a polished Codex-style pet than a CSS decoration. It must be a generated raster asset, integrated as a real sprite animation, and visible immediately when the Chrome extension injects the overlay.

## Approved Direction

- Use the fieldside mascot direction: the Chili lives near the bottom-left edge and does not interrupt the market drop controls.
- Use the generated pixel-art sprite sheet as the visual source, not the CSS placeholder.
- Keep the ball multicolor and G-like in geometry/colors, but avoid a literal Google logo, letter, or trademarked mark.
- Keep the character readable at small browser-extension overlay size.

## Asset Pipeline

1. Generate a sprite sheet with the image generation tool.
2. Save the selected source image into the project under `extension/src/assets/`.
3. Remove the magenta chroma-key background and export a transparent PNG/WebP.
4. Normalize the sprite sheet into equal-width frames.
5. Use the processed sprite as the extension asset; keep the original generated source for provenance.

The first accepted generated source is currently:

`/Users/estevito/.codex/generated_images/019e6fcb-e160-7e10-9d27-562c89f88f35/ig_00b2dbfeb800b9c6016a1889d7398c8196aeb1f2d77559a931.png`

## Extension Integration

- Replace the existing CSS-built `.mm-runner` pieces with a single sprite element.
- Keep the field strip `.mm-field`, but adjust the scale and positioning so the Chili feels grounded.
- Add the final asset path to `extension/manifest.json` under `web_accessible_resources`.
- Resolve the asset URL from `matchday-overlay.js` with `chrome.runtime.getURL(...)`.
- Animate with CSS `steps()` using the normalized frame count.
- Keep pointer events disabled on the mascot so it never blocks page or overlay clicks.
- Respect reduced-motion by pausing or slowing the sprite animation when `prefers-reduced-motion: reduce` is enabled.

## How We Will View It Animated

There are two viewing loops:

1. Companion preview: a local HTML preview that animates the generated sprite before it is cleaned and integrated.
2. Extension proof: load `extension/` unpacked in Chrome, open any normal `http` or `https` page, and verify the injected overlay shows the animated Chili.

The extension proof is the acceptance path. The companion preview is only for quick visual timing and scale feedback.

## Acceptance Criteria

- The Chili renders as a real generated sprite, not a CSS drawing.
- The mascot animates in a smooth looping kickup sequence.
- The sprite background is transparent in the extension.
- The sprite does not cover the market cards, close/minimize controls, or friends panel.
- The asset stays crisp with pixelated rendering on desktop screens.
- The extension remains Manifest V3 and no new runtime dependency is added.
- `npm test` passes.

## Out Of Scope

- Real Polymarket trading behavior.
- Multiple mascot personalities or skins.
- A pet settings system.
- Canvas/WebGL animation.
