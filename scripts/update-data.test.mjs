import assert from "node:assert/strict";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { createFixtureFetcher } from "./lib/poe2db.mjs";
import { EXIT, main, updateData } from "./update-data.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURES = join(ROOT, "scripts/fixtures");
const GENERATED = join(ROOT, "packages/data/generated");

const tmpDirs = [];
async function tmp() {
  const dir = await mkdtemp(join(tmpdir(), "poe2-update-"));
  tmpDirs.push(dir);
  return dir;
}
after(async () => {
  await Promise.all(tmpDirs.map((d) => rm(d, { recursive: true, force: true })));
});

describe("update-data CLI", () => {
  it("--check validates frozen generated JSON without writing", async () => {
    const code = await main(["--check"]);
    assert.equal(code, EXIT.ok);
  });

  it("refuses fixture output on the real generated directory", async () => {
    const code = await main(["--from-fixtures"]);
    assert.equal(code, EXIT.validate);
  });

  it("parses fixtures into an isolated out-dir using real affix text", async () => {
    const outDir = await tmp();
    const { payloads, changed } = await updateData({
      fromFixtures: true,
      fixtureDir: FIXTURES,
      outDir,
      fetchText: createFixtureFetcher(FIXTURES),
      force: true,
    });
    assert.equal(changed, true);
    const life = payloads.shields.list.find((f) => f.family === "IncreasedLife");
    assert.equal(life.matchZh, "最大生命");
    assert.equal(life.match, "to maximum Life");
    assert.equal(life.matchZhHans, "生命上限");
    assert.ok(life.bases.includes("str"));
    const strength = payloads.shields.list.find((f) => f.family === "Strength");
    assert.ok(strength.bases.includes("str") && strength.bases.includes("str_dex"));

    const low = payloads.endgame.waystones.byTier.low;
    assert.ok(low.every((f) => f.tier === "low"));
    assert.ok(low.every((f) => f.textZh));
    assert.ok(low.some((f) => f.textZhHans));
    assert.equal(payloads.endgame.waystones.counts.low.skippedEmpty, 1);

    const breach = payloads.endgame.tablets.byKind.breach;
    assert.ok(breach.every((f) => f.tabletKind === "breach"));
    assert.ok(breach.some((f) => /怪物/.test(f.textZh)));

    const names = await readdir(outDir);
    assert.ok(names.includes("shields.json"));
    assert.ok(names.includes("waystones.json"));
    assert.ok(names.includes("tablets.json"));
  });

  it("--dry-run on fixtures writes nothing", async () => {
    const outDir = await tmp();
    const { writes } = await updateData({
      fromFixtures: true,
      fixtureDir: FIXTURES,
      outDir,
      dryRun: true,
      force: true,
    });
    assert.ok(writes.every((w) => !w.written && w.reason === "dry-run"));
    const names = await readdir(outDir);
    assert.deepEqual(names, []);
  });

  it("does not touch packages/data/generated during fixture runs", async () => {
    const before = await readdir(GENERATED);
    const outDir = await tmp();
    await updateData({
      fromFixtures: true,
      fixtureDir: FIXTURES,
      outDir,
      force: true,
    });
    const after = await readdir(GENERATED);
    assert.deepEqual(after.sort(), before.sort());
  });
});
