import { describe, expect, it } from "vitest";
import {
  WAYSTONE_STAT_AXES,
  isWaystoneRangeAxis,
  waystoneAllFamilies,
  waystoneFamilies,
  waystoneStatHits,
  waystoneStatRange,
  waystoneStatThresholds,
} from "./index.ts";

describe("waystone stat axes", () => {
  it("exposes the trade ENDGAME FILTERS set in 繁中 + EN only", () => {
    expect(WAYSTONE_STAT_AXES.map((axis) => axis.id)).toEqual([
      "tier",
      "packSize",
      "effectiveness",
      "itemRarity",
      "monsterRarity",
      "revives",
      "dropChance",
      "gold",
      "experience",
    ]);
    expect(WAYSTONE_STAT_AXES.map((axis) => axis.labelZh)).toEqual([
      "換界石階級",
      "換界石怪物群大小",
      "怪物效用",
      "物品稀有度",
      "怪物稀有度",
      "換界石復活",
      "換界石掉落率",
      "換界石金幣",
      "換界石經驗",
    ]);
    expect(WAYSTONE_STAT_AXES.some((axis) => axis.id === "quantity")).toBe(false);
    expect(WAYSTONE_STAT_AXES.some((axis) => axis.id === "ultimatum")).toBe(false);
    expect(WAYSTONE_STAT_AXES.every(isWaystoneRangeAxis)).toBe(true);
    const blob = JSON.stringify(WAYSTONE_STAT_AXES);
    expect(blob.includes("物品数量") || blob.includes("简")).toBe(false);
    expect(blob).not.toMatch(/混沌試煉|Ultimatum|Victorious|Cowardly|Deadly|勝利之運|怯懦之運|致命之運/);
  });

  it("merges low/mid/top into one pool without asking for an affix-pool tier", () => {
    const all = waystoneAllFamilies();
    const low = waystoneFamilies("low");
    const mid = waystoneFamilies("mid");
    const top = waystoneFamilies("top");
    expect(all.length).toBe(low.length + mid.length + top.length);
    expect(all.some((f) => f.tier === "low")).toBe(true);
    expect(all.some((f) => f.tier === "mid")).toBe(true);
    expect(all.some((f) => f.tier === "top")).toBe(true);
  });

  it("maps item rarity to 更多稀有度 / more Rarity of Items", () => {
    const hits = waystoneStatHits("itemRarity");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.family === "MapMonsterColdDamage")).toBe(true);
    expect(hits.every((h) => h.snippet.includes("稀有度") || h.snippet.includes("Rarity"))).toBe(
      true,
    );
    expect(hits.some((h) => h.lang === "zh" && h.snippet.includes("更多稀有度"))).toBe(true);
    expect(hits.some((h) => h.lang === "en" && h.snippet.includes("more Rarity of Items"))).toBe(
      true,
    );
    const range = waystoneStatRange("itemRarity");
    expect(range?.min).toBeGreaterThanOrEqual(10);
    expect(range?.max).toBeGreaterThan(range!.min);
  });

  it("maps effectiveness to 更多效用 / more Effectiveness, not pack size", () => {
    const hits = waystoneStatHits("effectiveness");
    expect(hits.some((h) => h.snippet.includes("更多效用"))).toBe(true);
    expect(hits.some((h) => h.snippet.includes("more Effectiveness"))).toBe(true);
    expect(hits.every((h) => !h.snippet.includes("怪物群大小"))).toBe(true);
    expect(hits.every((h) => !h.snippet.includes("Pack size"))).toBe(true);
    expect(hits.some((h) => h.family === "MapBleeding")).toBe(true);
  });

  it("maps pack size to 更多怪物群大小 / more Pack size as its own axis", () => {
    const hits = waystoneStatHits("packSize");
    expect(hits.some((h) => h.snippet.includes("更多怪物群大小"))).toBe(true);
    expect(hits.some((h) => h.snippet.includes("more Pack size"))).toBe(true);
    expect(hits.some((h) => h.family === "MapPoisoning")).toBe(true);
  });

  it("maps monster rarity to magic/rare monster lines, not the 怪物稀有度 header words", () => {
    const axis = WAYSTONE_STAT_AXES.find((item) => item.id === "monsterRarity");
    expect(axis?.labelZh).toBe("怪物稀有度");
    expect(axis && isWaystoneRangeAxis(axis) && axis.headerZh).toBe("怪物稀有度");
    const hits = waystoneStatHits("monsterRarity");
    expect(hits.some((h) => h.snippet.includes("更多魔法和稀有怪物"))).toBe(true);
    expect(hits.some((h) => h.snippet.includes("更多怪物詞綴機率"))).toBe(true);
    expect(hits.some((h) => h.snippet.includes("稀有怪物的數量"))).toBe(true);
    expect(hits.some((h) => h.snippet.includes("more Magic and Rare Monsters"))).toBe(true);
    expect(hits.some((h) => h.snippet.includes("increased number of Rare Monsters"))).toBe(true);
    expect(hits.every((h) => !h.snippet.includes("怪物稀有度"))).toBe(true);
    expect(hits.every((h) => !h.snippet.includes("更多稀有度"))).toBe(true);
  });

  it("maps drop chance to 更多換界石 / more Waystones found in Area", () => {
    const hits = waystoneStatHits("dropChance");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.snippet.includes("更多換界石"))).toBe(true);
    expect(hits.some((h) => h.snippet.includes("more Waystones found in Area"))).toBe(true);
    expect(hits.some((h) => h.snippet.includes("增加") && h.snippet.includes("此區域找到的換界石"))).toBe(
      true,
    );
  });

  it("does not invent quantity / gold / experience / revives / ultimatum affix lines in the scrape", () => {
    const blob = waystoneAllFamilies()
      .map((f) => `${f.textZh}\n${f.textEn}\n${f.matchZh}\n${f.match}`)
      .join("\n");
    expect(blob).not.toMatch(/物品數量/);
    expect(blob).not.toMatch(/Quantity of Items found in this Area/);
    expect(blob).not.toMatch(/金幣/);
    expect(blob).not.toMatch(/\bGold\b/);
    expect(blob).not.toMatch(/經驗/);
    expect(blob).not.toMatch(/Experience/);
    expect(blob).not.toMatch(/復活/);
    expect(blob).not.toMatch(/Revive/);
    expect(blob).not.toMatch(/Ultimatum|Victorious|Cowardly|Deadly|勝利之運|怯懦之運|致命之運/);
    expect(blob).not.toMatch(/階級|Tier /);
  });

  it("emits threshold inputs for filled axes only, including max-only", () => {
    const none = waystoneStatThresholds({}, "zh-Hant");
    expect(none).toEqual([]);

    const zh = waystoneStatThresholds(
      { ranges: { itemRarity: { min: 40 }, effectiveness: { max: 80 } } },
      "zh-Hant",
    );
    expect(zh.map((s) => s.id)).toEqual(["effectiveness", "itemRarity"]);
    expect(zh.find((s) => s.id === "itemRarity")?.header).toBe("物品稀有度");
    expect(zh.find((s) => s.id === "effectiveness")?.max).toBe(80);
    expect(zh.every((s) => s.effects?.length === 0)).toBe(true);

    const en = waystoneStatThresholds({ ranges: { tier: { min: 14, max: 16 } } }, "en");
    expect(en).toHaveLength(1);
    expect(en[0]?.header).toBe("Tier");
    expect(en[0]?.numberStyle).toBe("bare");
  });
});
