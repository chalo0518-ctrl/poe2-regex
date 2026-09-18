import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  applyRepoeFallback,
  createFixtureFetcher,
  detect,
  extractHarvestTags,
  extractModsView,
  inferTagsFromText,
  mergeFamilyRow,
  parsePageFamilies,
  parseRangeNums,
  parseRepoeByType,
  parseRepoeVersion,
  ParseError,
  scrapeModifiersPage,
  stripHtml,
} from "./poe2db.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const FIXTURES = join(ROOT, "scripts/fixtures");

async function loadPage(locale, path) {
  return readFile(join(FIXTURES, "html", locale, `${path}.html`), "utf8");
}

describe("extractModsView", () => {
  it("reads real trimmed Shields_str ModsView rows", async () => {
    const html = await loadPage("tw", "Shields_str");
    const view = extractModsView(html, "Shields_str");
    assert.ok(Array.isArray(view.normal));
    assert.equal(view.normal.length, 6);
    assert.equal(view.normal[0].ModFamilyList[0], "Strength");
    assert.match(view.normal[0].str, /力量/);
  });

  it("throws ParseError when ModsView is missing", () => {
    assert.throws(() => extractModsView("<html>nope</html>", "empty"), ParseError);
  });
});

describe("extractHarvestTags + stripHtml", () => {
  it("keeps harvest tag order from the fixture", async () => {
    const html = await loadPage("tw", "Shields_str");
    const tags = extractHarvestTags(html);
    assert.equal(tags[0].id, "ulaman_mod");
    assert.ok(tags.some((t) => t.id === "fire" && t.labelZh === "火焰"));
  });

  it("strips ndash spans into the live poe2db range glyph", async () => {
    const html = await loadPage("tw", "Shields_str");
    const view = extractModsView(html);
    const life = view.normal.find((m) => m.ModFamilyList?.[0] === "IncreasedLife");
    const text = stripHtml(life.str);
    assert.equal(text, "+(10—19)最大生命");
  });
});

describe("detect / parseRangeNums / inferTags", () => {
  it("tidies leftover plus signs from suffix rest", () => {
    assert.equal(detect("火焰抗性 +").rest, "火焰抗性");
    assert.equal(detect("+(10—19)最大生命").rest, "最大生命");
    assert.equal(detect("Fire Resistance +(6—10)%").rest, "Fire Resistance");
  });

  it("classifies plusFlat / plusPercent / percentPrefix from real effect text", () => {
    assert.equal(detect("+ (5—8)點力量").format, "plusFlat");
    assert.equal(detect("+(6—10)%火焰抗性").format, "plusPercent");
    assert.equal(detect("10% increased Movement Speed").format, "percentPrefix");
    assert.equal(detect("+(5—8)點力量").rest, "點力量");
    assert.deepEqual(parseRangeNums("+(10—19)最大生命"), { min: 10, max: 19 });
  });

  it("infers harvest-style tags from real zh/en blobs", () => {
    const tags = inferTagsFromText(
      "+(6—10)%火焰抗性",
      "+(6—10)% to Fire Resistance",
    );
    const ids = tags.map((t) => t.id);
    assert.ok(ids.includes("fire"));
    assert.ok(ids.includes("resistance"));
  });
});

describe("parsePageFamilies", () => {
  it("pairs TW/US rows and builds match strings from real effect text", async () => {
    const tw = extractModsView(await loadPage("tw", "Shields_str"));
    const us = extractModsView(await loadPage("us", "Shields_str"));
    const { list, skippedEmpty } = parsePageFamilies(tw, us, { skipEmpty: false });
    assert.equal(skippedEmpty, 0);
    const life = list.find((f) => f.family === "IncreasedLife");
    assert.ok(life);
    assert.equal(life.generation, "prefix");
    assert.equal(life.matchZh, "最大生命");
    assert.equal(life.match, "to maximum Life");
    assert.equal(life.textZh, "+(10—19)最大生命");
    assert.equal(life.kind, "numeric");
    assert.equal(life.numeric.format, "plusFlat");
    assert.equal(life.tierCount, 2);
    assert.equal(life.numeric.suggestedMin, 10);
    assert.equal(life.numeric.suggestedMax, 29);
    const fire = list.find((f) => f.family === "FireResistance");
    assert.equal(fire.generation, "suffix");
    assert.equal(fire.matchZh, "火焰抗性");
    assert.equal(fire.textZh, "+(6—10)%火焰抗性");
    assert.equal(fire.numeric.format, "plusPercent");
  });

  it("skips empty poe2db str rows on waystones", async () => {
    const tw = extractModsView(await loadPage("tw", "Waystones_low_tier"));
    const us = extractModsView(await loadPage("us", "Waystones_low_tier"));
    const { list, skippedEmpty } = parsePageFamilies(tw, us, {
      skipEmpty: true,
      extraIdPrefix: "waystone:low",
    });
    assert.equal(skippedEmpty, 1);
    assert.equal(list.length, 2);
    assert.ok(list.every((f) => f.id.startsWith("waystone:low|")));
    assert.ok(list.every((f) => f.textZh));
    const emptyKept = parsePageFamilies(tw, us, { skipEmpty: false });
    assert.equal(emptyKept.skippedEmpty, 0);
    assert.equal(emptyKept.list.length, 3);
  });
});

describe("mergeFamilyRow", () => {
  it("unions shield bases and tiers without inventing text", async () => {
    const tw = extractModsView(await loadPage("tw", "Shields_str"));
    const us = extractModsView(await loadPage("us", "Shields_str"));
    const twDex = extractModsView(await loadPage("tw", "Shields_str_dex"));
    const usDex = extractModsView(await loadPage("us", "Shields_str_dex"));
    const a = parsePageFamilies(tw, us, { skipEmpty: false }).list.find((f) => f.family === "Strength");
    const b = parsePageFamilies(twDex, usDex, { skipEmpty: false }).list.find((f) => f.family === "Strength");
    a.bases = ["str"];
    b.bases = ["str_dex"];
    const merged = mergeFamilyRow(a, b, {
      bases: [...new Set([...a.bases, ...b.bases])],
    });
    assert.deepEqual(merged.bases, ["str", "str_dex"]);
    assert.equal(merged.matchZh, a.matchZh);
    assert.equal(merged.textZh, a.textZh);
    assert.ok(merged.tierCount >= a.tierCount);
  });
});

describe("RePoE fallback", () => {
  it("fills missing EN match from type→text map only", async () => {
    const mods = JSON.parse(await readFile(join(FIXTURES, "repoe/mods.sample.json"), "utf8"));
    const byType = parseRepoeByType(mods);
    assert.ok(byType.get("Strength"));
    const list = [
      {
        family: "OnlyInRepoeFamily",
        textEn: "",
        match: "",
        labelEn: "",
      },
    ];
    applyRepoeFallback(list, byType);
    assert.match(list[0].textEn, /increased Movement Speed/);
    assert.equal(list[0].match, "increased Movement Speed");
    assert.equal(parseRepoeVersion("<title>RePoE - PoE2 version 4.5.5.2</title>"), "4.5.5.2");
  });
});

describe("fixture fetcher", () => {
  it("scrapes a local Shields_str page without network", async () => {
    const fetchText = createFixtureFetcher(FIXTURES);
    const page = await scrapeModifiersPage("Shields_str", { fetchText, origin: "https://poe2db.tw" });
    assert.ok(page.twView.normal.length > 0);
    assert.ok(page.usView.normal.length > 0);
    assert.ok(page.tags.length > 0);
    assert.ok(page.tags.some((t) => t.id === "cold" && t.labelZh === "冰冷"));
  });
});
