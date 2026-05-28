import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (path) =>
  JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));

const readText = async (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("manifest is a Manifest V3 extension with content overlay and popup", async () => {
  const manifest = await readJson("extension/manifest.json");

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.action.default_popup, "src/popup/popup.html");
  assert.equal(manifest.background.service_worker, "src/background/service-worker.js");
  assert.equal(manifest.content_scripts.length, 1);
  assert.deepEqual(manifest.content_scripts[0].js, [
    "src/content/matchday-overlay.js",
    "src/content/twitter-match-injector.js"
  ]);
  assert.deepEqual(manifest.content_scripts[0].css, [
    "src/content/matchday-overlay.css",
    "src/content/matchday-player.css",
    "src/content/matchday-refined.css",
    "src/content/twitter-match-injector.css"
  ]);
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

test("sample match uses real country flags and a local chili mascot asset", async () => {
  const sample = await readJson("extension/src/shared/sample-match.json");
  const manifest = await readJson("extension/manifest.json");
  const resources = manifest.web_accessible_resources.flatMap((entry) => entry.resources);

  assert.equal(sample.match.home.name, "Argentina");
  assert.equal(sample.match.away.name, "Brazil");
  assert.equal(sample.match.home.flagAsset, "src/assets/flags/argentina.svg");
  assert.equal(sample.match.away.flagAsset, "src/assets/flags/brazil.svg");
  assert.equal(sample.mascot.asset, "src/assets/mascot/picanthe-kickups.svg");
  assert.ok(resources.includes(sample.match.home.flagAsset));
  assert.ok(resources.includes(sample.match.away.flagAsset));
  assert.ok(resources.includes(sample.mascot.asset));
});

test("manifest referenced UI files exist and do not submit Polymarket orders", async () => {
  const manifest = await readJson("extension/manifest.json");
  const referencedFiles = [
    manifest.background.service_worker,
    manifest.action.default_popup,
    ...manifest.content_scripts[0].js,
    ...manifest.content_scripts[0].css,
    ...manifest.web_accessible_resources[0].resources
  ];

  for (const file of referencedFiles) {
    const content = await readFile(new URL(`../extension/${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(content, /clob\.polymarket\.com\/order|createOrder|postOrder/i);
  }
});

test("project metadata uses the public Prode Bets name", async () => {
  const packageJson = await readJson("package.json");
  const manifest = await readJson("extension/manifest.json");

  assert.equal(packageJson.name, "prode-bets");
  assert.equal(manifest.name, "Prode Bets");
});

test("popup exposes overlay controls and content script listens for visibility messages", async () => {
  const popupHtml = await readFile(new URL("../extension/src/popup/popup.html", import.meta.url), "utf8");
  const popupJs = await readFile(new URL("../extension/src/popup/popup.js", import.meta.url), "utf8");
  const contentJs = await readFile(new URL("../extension/src/content/matchday-overlay.js", import.meta.url), "utf8");

  assert.match(popupHtml, /data-action="show-overlay"/);
  assert.match(popupHtml, /data-action="hide-overlay"/);
  assert.match(popupJs, /matchday:setState/);
  assert.match(popupJs, /matchday:overlayVisibilityChanged/);
  assert.match(contentJs, /chrome\.runtime\.onMessage\.addListener/);
  assert.match(contentJs, /matchday:setState/);
  assert.match(contentJs, /matchday:overlayVisibilityChanged/);
});

test("local preview page shims Chrome APIs and loads extension overlay assets", async () => {
  const previewHtml = await readText("preview/index.html");
  const previewShim = await readText("preview/preview-shim.js");
  const previewCss = await readText("preview/demo.css");

  assert.match(previewHtml, /demo\.css/);
  assert.match(previewHtml, /matchday-overlay\.css/);
  assert.match(previewHtml, /matchday-player\.css/);
  assert.match(previewHtml, /matchday-refined\.css/);
  assert.match(previewHtml, /preview-shim\.js/);
  assert.match(previewHtml, /matchday-overlay\.js/);
  assert.match(previewHtml, /twitter-match-injector\.js/);
  assert.match(previewHtml, /ESPN-style mock/);
  assert.match(previewHtml, /data-testid="tweet"/);
  assert.match(previewShim, /globalThis\.chrome/);
  assert.match(previewShim, /src\/shared\/sample-match\.json/);
  assert.match(previewCss, /grid-auto-flow:\s*dense/);
});

test("twitter injector detects match tweets and keeps real trading external", async () => {
  const injectorJs = await readText("extension/src/content/twitter-match-injector.js");
  const injectorCss = await readText("extension/src/content/twitter-match-injector.css");

  assert.match(injectorJs, /MutationObserver/);
  assert.match(injectorJs, /data-testid="tweet"/);
  assert.match(injectorJs, /world cup|mundial/i);
  assert.match(injectorJs, /data-prode-bets-injected/);
  assert.match(injectorJs, /flagAsset/);
  assert.match(injectorJs, /polymarket\.com/);
  assert.doesNotMatch(injectorJs, /clob\.polymarket\.com\/order|createOrder|postOrder/i);
  assert.match(injectorCss, /prode-tweet-market/);
  assert.match(injectorCss, /prode-confetti/);
});

test("overlay separates dense content into tabs and renders the mascot", async () => {
  const overlayJs = await readText("extension/src/content/matchday-overlay.js");
  const refinedCss = await readText("extension/src/content/matchday-refined.css");
  const mascot = await readText("extension/src/assets/mascot/picanthe-kickups.svg");

  assert.match(overlayJs, /role="tablist"/);
  assert.match(overlayJs, /data-tab="market"/);
  assert.match(overlayJs, /data-tab="friends"/);
  assert.match(overlayJs, /data-tab="motion"/);
  assert.match(overlayJs, /mm-mascot/);
  assert.match(overlayJs, /flagAsset/);
  assert.match(refinedCss, /mm-tab-panel/);
  assert.match(refinedCss, /mm-is-compact/);
  assert.match(mascot, /picanthe/i);
  assert.match(mascot, /#c9192e/i);
});

test("real flag SVG assets are local and recognizable", async () => {
  const argentina = await readText("extension/src/assets/flags/argentina.svg");
  const brazil = await readText("extension/src/assets/flags/brazil.svg");

  assert.match(argentina, /<svg/);
  assert.match(argentina, /#74acdf/i);
  assert.match(argentina, /#f6b40e/i);
  assert.match(brazil, /<svg/);
  assert.match(brazil, /#009b3a/i);
  assert.match(brazil, /#ffdf00/i);
});
