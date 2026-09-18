import { describe, expect, it } from "vitest";
import {
  WAYSTONE_STAT_AXES,
  waystoneAllFamilies,
  waystoneFamilies,
  waystoneStatHits,
  waystoneStatRange,
  waystoneStatThresholds,
} from "./index.ts";

describe("waystone stat axes", () => {
  it("labels the three player filters in 繁中 + EN only", () => {
    expect(WAYSTONE_STAT_AXES.map((axis) => axis.id)).toEqual([
      "quantity",
      "rarity",
      "effectiveness",
    ]);
    expect(WAYSTONE_STAT_AXES.map((axis) => axis.labelZh)).toEqual([
      "物品數量",
      "物品稀有度",
      "怪物效用",
    ]);
    expect(WAYSTONE_STAT_AXES.every((axis) => Boolean(axis.headerEn))).toBe(true);
    expect(
      JSON.stringify(WAYSTONE_STAT_AXES).includes("物品数量") ||
        JSON.stringify(WAYSTONE_STAT_AXES).includes("简"),
    ).toBe(false);
  });

  it("merges low/mid/top into one pool without asking for a tier", () => {
    const all = waystoneAllFamilies();
    const low = waystoneFamilies("low");
    const mid = waystoneFamilies("mid");
    const top = waystoneFamilies("top");
    expect(all.length).toBe(low.length + mid.length + top.length);
    expect(all.some((f) => f.tier === "low")).toBe(true);
    expect(all.some((f) => f.tier === "mid")).toBe(true);
    expect(all.some((f) => f.tier === "top")).toBe(true);
  });

  it("maps rarity to 更多稀有度 / more Rarity of Items across the merged pool", () => {
    const hits = waystoneStatHits("rarity");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.family === "MapMonsterColdDamage")).toBe(true);
    expect(hits.every((h) => h.snippet.includes("稀有度") || h.snippet.includes("Rarity"))).toBe(
      true,
    );
    expect(hits.some((h) => h.lang === "zh" && h.snippet.includes("更多稀有度"))).toBe(true);
    expect(hits.some((h) => h.lang === "en" && h.snippet.includes("more Rarity of Items"))).toBe(
      true,
    );
    const range = waystoneStatRange("rarity");
    expect(range?.min).toBeGreaterThanOrEqual(10);
    expect(range?.max).toBeGreaterThan(range!.min);
  });

  it("maps effectiveness to 更多效用 / more Effectiveness and pack size", () => {
    const hits = waystoneStatHits("effectiveness");
    expect(hits.some((h) => h.snippet.includes("更多效用"))).toBe(true);
    expect(hits.some((h) => h.snippet.includes("more Effectiveness"))).toBe(true);
    expect(hits.some((h) => h.snippet.includes("更多怪物群大小"))).toBe(true);
    expect(hits.some((h) => h.snippet.includes("more Pack size"))).toBe(true);
    expect(hits.some((h) => h.family === "MapBleeding")).toBe(true);
    expect(hits.some((h) => h.family === "MapPoisoning")).toBe(true);
  });

  it("does not invent an item-quantity affix line — quantity is the item header", () => {
    const blob = waystoneAllFamilies()
      .map((f) => `${f.textZh}\n${f.textEn}\n${f.matchZh}\n${f.match}`)
      .join("\n");
    expect(blob).not.toMatch(/物品數量/);
    expect(blob).not.toMatch(/Quantity of Items found in this Area/);
    const quantity = WAYSTONE_STAT_AXES.find((axis) => axis.id === "quantity");
    expect(quantity?.effectsZh).toEqual([]);
    expect(quantity?.headerZh).toBe("物品數量");
    expect(quantity?.headerEn).toBe("Item Quantity");
  });

  it("emits threshold inputs for filled axes only", () => {
    const none = waystoneStatThresholds({}, "zh-Hant");
    expect(none).toEqual([]);

    const zh = waystoneStatThresholds({ rarity: 40, effectiveness: 20 }, "zh-Hant");
    expect(zh.map((s) => s.id)).toEqual(["rarity", "effectiveness"]);
    expect(zh[0]?.header).toBe("物品稀有度");
    expect(zh[0]?.effects?.some((e) => e.text === "更多稀有度")).toBe(true);

    const en = waystoneStatThresholds({ quantity: 50 }, "en");
    expect(en).toHaveLength(1);
    expect(en[0]?.header).toBe("Item Quantity");
    expect(en[0]?.effects).toEqual([]);
  });
});
