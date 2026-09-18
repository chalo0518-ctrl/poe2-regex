import { describe, expect, it } from "vitest";
import { matchesItem } from "./match.js";
import { buildStatThresholdRegex } from "./stats.js";

const RARITY_ZH = {
  id: "rarity",
  min: 40,
  header: "物品稀有度",
  effects: [{ text: "更多稀有度", numberSide: "before" as const }],
};

const EFF_ZH = {
  id: "effectiveness",
  min: 20,
  header: "怪物效用",
  effects: [{ text: "更多效用", numberSide: "before" as const }],
};

const QUANTITY_ZH = {
  id: "quantity",
  min: 50,
  header: "物品數量",
};

const SAMPLE_ZH = [
  "換界石（階級 15）",
  "物品數量: +62%",
  "物品稀有度: +45%",
  "怪物效用: +29%",
  "此區域找到的物品擁有14%更多稀有度",
  "怪物擁有16%更多效用",
  "7%更多怪物群大小",
].join("\n");

describe("buildStatThresholdRegex", () => {
  it("returns empty output when no thresholds are set", () => {
    const r = buildStatThresholdRegex([]);
    expect(r.pattern).toBe("");
    expect(r.length).toBe(0);
  });

  it("ANDs active axes as separate quoted groups", () => {
    const r = buildStatThresholdRegex([RARITY_ZH, EFF_ZH]);
    expect(r.pattern.startsWith('"')).toBe(true);
    expect(r.pattern.split(" ").length).toBe(2);
    expect(matchesItem(r.pattern, SAMPLE_ZH)).toBe(true);
    expect(
      matchesItem(r.pattern, "物品稀有度: +45%\n怪物效用: +10%"),
    ).toBe(false);
  });

  it("matches waystone header rarity at or above min, not a low roll", () => {
    const r = buildStatThresholdRegex([RARITY_ZH]);
    expect(r.pattern).toContain("物品稀有度");
    expect(r.pattern).toContain("更多稀有度");
    expect(matchesItem(r.pattern, SAMPLE_ZH)).toBe(true);
    expect(matchesItem(r.pattern, "物品稀有度: +12%")).toBe(false);
    expect(matchesItem(r.pattern, "此區域找到的物品擁有14%更多稀有度")).toBe(
      false,
    );
  });

  it("matches affix reward lines when the min sits in that range", () => {
    const r = buildStatThresholdRegex([{ ...RARITY_ZH, min: 14 }]);
    expect(matchesItem(r.pattern, "此區域找到的物品擁有14%更多稀有度")).toBe(
      true,
    );
    expect(matchesItem(r.pattern, "此區域找到的物品擁有10%更多稀有度")).toBe(
      false,
    );
  });

  it("matches quantity from the item header only", () => {
    const r = buildStatThresholdRegex([QUANTITY_ZH]);
    expect(r.pattern).toContain("物品數量");
    expect(r.pattern).not.toContain("更多換界石");
    expect(matchesItem(r.pattern, SAMPLE_ZH)).toBe(true);
    expect(matchesItem(r.pattern, "物品數量: +40%")).toBe(false);
  });

  it("matches EN headers and effect text", () => {
    const r = buildStatThresholdRegex([
      {
        id: "rarity",
        min: 40,
        header: "Item Rarity",
        effects: [{ text: "more Rarity of Items", numberSide: "before" }],
      },
      {
        id: "effectiveness",
        min: 20,
        header: "Monster Effectiveness",
        effects: [{ text: "more Effectiveness", numberSide: "before" }],
      },
    ]);
    const item = [
      "Item Quantity: +62%",
      "Item Rarity: +45%",
      "Monster Effectiveness: +29%",
      "14% more Rarity of Items found in this Area",
      "Monsters have 16% more Effectiveness",
    ].join("\n");
    expect(matchesItem(r.pattern, item)).toBe(true);
    expect(matchesItem(r.pattern, "Item Rarity: +12%")).toBe(false);
  });

  it("keeps the pattern under the 250-character stash cap for the three axes", () => {
    const r = buildStatThresholdRegex([
      QUANTITY_ZH,
      RARITY_ZH,
      EFF_ZH,
    ]);
    expect(r.length).toBeLessThanOrEqual(250);
    expect(r.overLimit).toBe(false);
  });
});
