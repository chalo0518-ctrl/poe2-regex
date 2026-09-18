import { describe, expect, it } from "vitest";
import { matchesItem } from "./match.js";
import { buildStatThresholdRegex } from "./stats.js";

const RARITY_ZH = {
  id: "itemRarity",
  min: 40,
  header: "物品稀有度",
};

const EFF_ZH = {
  id: "effectiveness",
  min: 20,
  header: "怪物效用",
};

const PACK_ZH = {
  id: "packSize",
  min: 10,
  header: "怪物群大小",
};

const TIER_ZH = {
  id: "tier",
  min: 14,
  max: 16,
  header: "階級",
  numberStyle: "bare" as const,
};

const SAMPLE_ZH = [
  "換界石（階級 15）",
  "物品稀有度: +45%",
  "怪物稀有度: +23%",
  "怪物效用: +29%",
  "怪物群大小: +18%",
  "換界石掉落率: +40%",
  "可用的復活: 2",
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

  it("matches waystone header rarity at or above min, not a low total", () => {
    const r = buildStatThresholdRegex([RARITY_ZH]);
    expect(r.pattern).toContain("物品稀有度");
    expect(r.pattern).not.toContain("更多稀有度");
    expect(matchesItem(r.pattern, SAMPLE_ZH)).toBe(true);
    expect(matchesItem(r.pattern, "物品稀有度: +12%")).toBe(false);
    expect(matchesItem(r.pattern, "此區域找到的物品擁有14%更多稀有度")).toBe(
      false,
    );
  });

  it("matches a closed min/max range and rejects a higher total", () => {
    const r = buildStatThresholdRegex([{ ...RARITY_ZH, min: 40, max: 50 }]);
    expect(matchesItem(r.pattern, "物品稀有度: +45%")).toBe(true);
    expect(matchesItem(r.pattern, "物品稀有度: +62%")).toBe(false);
    expect(matchesItem(r.pattern, "物品稀有度: +150%")).toBe(false);
  });

  it("matches waystone tier from the item name, not affix-pool tabs", () => {
    const r = buildStatThresholdRegex([TIER_ZH]);
    expect(matchesItem(r.pattern, SAMPLE_ZH)).toBe(true);
    expect(matchesItem(r.pattern, "換界石（階級 8）")).toBe(false);
    expect(matchesItem(r.pattern, "換界石（階級 16）")).toBe(true);
  });

  it("matches revives as a bare count and gold/xp unique-map lines", () => {
    const revives = buildStatThresholdRegex([
      { id: "revives", max: 0, header: "可用的復活", numberStyle: "bare" },
    ]);
    expect(matchesItem(revives.pattern, "可用的復活: 0")).toBe(true);
    expect(matchesItem(revives.pattern, "可用的復活: 2")).toBe(false);

    const gold = buildStatThresholdRegex([
      {
        id: "gold",
        min: 500,
        header: "金幣的掉落",
        headerNumberSide: "before",
        headerGap: "loose",
      },
    ]);
    expect(matchesItem(gold.pattern, "增加800%本區域中金幣的掉落量")).toBe(true);
    expect(matchesItem(gold.pattern, "增加200%本區域中金幣的掉落量")).toBe(false);

    const xp = buildStatThresholdRegex([
      {
        id: "experience",
        min: 200,
        header: "經驗獲得",
        headerNumberSide: "before",
        headerGap: "tight",
      },
    ]);
    expect(matchesItem(xp.pattern, "增加400%經驗獲得")).toBe(true);
    expect(matchesItem(xp.pattern, "增加50%經驗獲得")).toBe(false);
  });

  it("matches a generic literal flag when supplied", () => {
    const r = buildStatThresholdRegex([{ id: "note", flag: "Unique Map" }]);
    expect(r.pattern).toBe('"Unique Map"');
    expect(matchesItem(r.pattern, "Map Tier: 16\nUnique Map")).toBe(true);
    expect(matchesItem(r.pattern, "Map Tier: 16")).toBe(false);
  });

  it("still ORs affix reward lines when effects are supplied", () => {
    const r = buildStatThresholdRegex([
      {
        ...RARITY_ZH,
        min: 14,
        effects: [{ text: "更多稀有度", numberSide: "before" }],
      },
    ]);
    expect(matchesItem(r.pattern, "此區域找到的物品擁有14%更多稀有度")).toBe(
      true,
    );
    expect(matchesItem(r.pattern, "此區域找到的物品擁有10%更多稀有度")).toBe(
      false,
    );
  });

  it("matches EN headers", () => {
    const r = buildStatThresholdRegex([
      { id: "itemRarity", min: 40, header: "Item Rarity" },
      { id: "effectiveness", min: 20, header: "Monster Effectiveness" },
      { id: "packSize", min: 10, header: "Pack Size" },
    ]);
    const item = [
      "Waystone (Tier 15)",
      "Item Rarity: +45%",
      "Monster Effectiveness: +29%",
      "Pack Size: +18%",
      "14% more Rarity of Items found in this Area",
      "Monsters have 16% more Effectiveness",
    ].join("\n");
    expect(matchesItem(r.pattern, item)).toBe(true);
    expect(matchesItem(r.pattern, "Item Rarity: +12%")).toBe(false);
  });

  it("keeps a typical juice AND under the 250-character stash cap", () => {
    const typical = buildStatThresholdRegex([
      TIER_ZH,
      PACK_ZH,
      EFF_ZH,
      RARITY_ZH,
      { id: "monsterRarity", min: 20, header: "怪物稀有度" },
      { id: "dropChance", min: 20, header: "掉落率" },
    ]);
    expect(typical.length).toBeLessThanOrEqual(250);
    expect(typical.overLimit).toBe(false);
    expect(typical.pattern.split(" ").length).toBe(6);
  });

  it("ANDs every market axis even if the 250 cap is tight", () => {
    const r = buildStatThresholdRegex([
      TIER_ZH,
      PACK_ZH,
      EFF_ZH,
      RARITY_ZH,
      { id: "monsterRarity", min: 20, header: "怪物稀有度" },
      { id: "revives", max: 2, header: "可用的復活", numberStyle: "bare" },
      { id: "dropChance", min: 20, header: "掉落率" },
      {
        id: "gold",
        min: 500,
        header: "金幣的掉落",
        headerNumberSide: "before",
        headerGap: "loose",
      },
      {
        id: "experience",
        min: 200,
        header: "經驗獲得",
        headerNumberSide: "before",
        headerGap: "tight",
      },
    ]);
    expect(r.pattern.split(" ").length).toBe(9);
    expect(r.pattern.startsWith('"')).toBe(true);
    expect(r.pattern).not.toContain("致命之運");
    if (r.overLimit) expect(r.warnings).toContain("over-limit");
  });
});
