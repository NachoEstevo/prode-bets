import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (path) =>
  JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));

test("manifest is a Manifest V3 extension with content overlay and popup", async () => {
  const manifest = await readJson("extension/manifest.json");

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.action.default_popup, "src/popup/popup.html");
  assert.equal(manifest.background.service_worker, "src/background/service-worker.js");
  assert.equal(manifest.content_scripts.length, 1);
  assert.deepEqual(manifest.content_scripts[0].js, ["src/content/matchday-overlay.js"]);
  assert.deepEqual(manifest.content_scripts[0].css, [
    "src/content/matchday-overlay.css",
    "src/content/matchday-player.css"
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
