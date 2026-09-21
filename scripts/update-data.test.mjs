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
    assert.ok(!life.matchZhHans);
    assert.ok(life.bases.includes("str"));
    const strength = payloads.shields.list.find((f) => f.family === "Strength");
    assert.ok(strength.bases.includes("str") && strength.bases.includes("str_dex"));

    const low = payloads.endgame.waystones.byTier.low;
    assert.ok(low.every((f) => f.tier === "low"));
    assert.ok(low.every((f) => f.textZh));
    assert.ok(low.every((f) => !f.textZhHans));
    assert.equal(payloads.endgame.waystones.counts.low.skippedEmpty, 1);

    const breach = payloads.endgame.tablets.byKind.breach;
    assert.ok(breach.every((f) => f.tabletKind === "breach"));
    assert.ok(breach.some((f) => /怪物/.test(f.textZh)));

    const bodyStr = payloads.early.catalog.byCategory.body.str;
    const bodyDex = payloads.early.catalog.byCategory.body.dex;
    const bodyLife = bodyStr.find((f) => f.family === "IncreasedLife");
    assert.equal(bodyLife.matchZh, "最大生命");
    assert.equal(bodyLife.match, "to maximum Life");
    assert.equal(bodyLife.pools[0], "str");
    assert.ok(bodyLife.id.startsWith("gear:body:str|"));
    assert.ok(!bodyLife.matchZhHans);
    const dexLife = bodyDex.find((f) => f.family === "IncreasedLife");
    assert.ok(dexLife);
    assert.notEqual(dexLife.id, bodyLife.id);
    const rings = payloads.early.catalog.byCategory.ring.ring;
    assert.ok(rings.some((f) => f.family === "AllResistances" && f.matchZh.includes("全元素抗性")));
    const maces = payloads.early.catalog.byCategory.mace1h.mace1h;
    assert.ok(maces.some((f) => f.family === "PhysicalDamage" && /物理傷害/.test(f.matchZh)));
    assert.ok(maces.every((f) => f.textZh && !f.textZhHans));

    const names = await readdir(outDir);
    assert.ok(names.includes("shields.json"));
    assert.ok(names.includes("waystones.json"));
    assert.ok(names.includes("tablets.json"));
    assert.ok(names.includes("early-gear.json"));
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
