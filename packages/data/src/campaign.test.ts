import { describe, expect, it } from "vitest";
import { shieldFamilies } from "./index.ts";
import {
  CAMPAIGN_GAPS,
  CAMPAIGN_GAPS_I18N,
  campaignChapters,
  defaultPicksForChapter,
  getChapter,
  shopFamilies,
  shopModById,
  shopMods,
  type ChapterId,
} from "./campaign.ts";

const CHAPTER_IDS: ChapterId[] = ["act-1", "act-2", "act-3", "act-4", "act-5"];

describe("campaign shop catalog", () => {
  it("exposes five chapters matching the early UI, with no per-map shop nodes yet", () => {
    expect(campaignChapters.map((c) => c.id)).toEqual(CHAPTER_IDS);
    expect(campaignChapters.map((c) => c.labelZh)).toEqual([
      "第一章",
      "第二章",
      "第三章",
      "第四章",
      "第五章",
    ]);
    for (const chapter of campaignChapters) {
      expect(chapter.maps).toEqual([]);
      expect(chapter.defaultPicks.length).toBeGreaterThan(0);
    }
    expect(CAMPAIGN_GAPS.length).toBeGreaterThan(0);
    expect(CAMPAIGN_GAPS.some((g) => /地圖|map/i.test(g))).toBe(true);
    expect(CAMPAIGN_GAPS_I18N["zh-Hans"].length).toBe(CAMPAIGN_GAPS.length);
    expect(CAMPAIGN_GAPS_I18N.en.some((g) => /map/i.test(g))).toBe(true);
  });

  it("keys default picks at chapter level and only references known shop mods", () => {
    const ids = new Set(shopMods.map((m) => m.id));
    for (const chapter of campaignChapters) {
      for (const pick of chapter.defaultPicks) {
        expect(ids.has(pick.modId), `${chapter.id} → ${pick.modId}`).toBe(true);
        expect(pick.polarity === "include" || pick.polarity === "exclude").toBe(true);
      }
      const resolved = defaultPicksForChapter(chapter.id);
      expect(Object.keys(resolved).length).toBe(chapter.defaultPicks.length);
      for (const familyId of Object.keys(resolved)) {
        expect(familyId.startsWith("shop:")).toBe(true);
        expect(resolved[familyId].min).toBe("");
        expect(resolved[familyId].max).toBe("");
      }
    }
  });

  it("progresses defensive defaults across the campaign without inventing numeric floors", () => {
    const ids = (chapterId: ChapterId) =>
      getChapter(chapterId).defaultPicks.map((p) => p.modId).sort();

    expect(ids("act-1")).toEqual(["life", "movement_speed"].sort());
    expect(ids("act-2")).toEqual(
      ["life", "movement_speed", "fire_res", "cold_res", "lightning_res"].sort(),
    );
    expect(ids("act-3")).toEqual(
      ["life", "movement_speed", "fire_res", "cold_res", "lightning_res", "all_res"].sort(),
    );
    expect(ids("act-4")).toEqual(
      [
        "life",
        "movement_speed",
        "fire_res",
        "cold_res",
        "lightning_res",
        "all_res",
        "chaos_res",
      ].sort(),
    );
    expect(ids("act-5")).toEqual(ids("act-4"));
  });

  it("reuses verified match/matchZh from the shields scrape for overlapping families", () => {
    const byFamily = new Map(shieldFamilies.map((f) => [f.family, f]));
    const overlap: Array<[string, string]> = [
      ["life", "IncreasedLife"],
      ["fire_res", "FireResistance"],
      ["cold_res", "ColdResistance"],
      ["lightning_res", "LightningResistance"],
      ["chaos_res", "ChaosResistance"],
      ["all_res", "AllResistances"],
      ["strength", "Strength"],
      ["dexterity", "Dexterity"],
      ["intelligence", "Intelligence"],
    ];
    for (const [shopId, family] of overlap) {
      const shop = shopModById(shopId);
      const shield = byFamily.get(family);
      expect(shop, shopId).toBeTruthy();
      expect(shield, family).toBeTruthy();
      expect(shop.match).toBe(shield!.match);
      expect(shop.matchZh).toBe(shield!.matchZh);
      if (shield!.matchZhHans) {
        expect(shop.matchZhHans).toBe(shield!.matchZhHans);
      }
    }
  });

  it("includes movement speed from the boots scrape, not a guessed string", () => {
    const ms = shopModById("movement_speed");
    expect(ms.match).toBe("increased Movement Speed");
    expect(ms.matchZh).toBe("移動速度");
    expect(ms.matchZhHans).toBe("移动速度提高");
    expect(ms.sources.some((s) => /Boots/i.test(s))).toBe(true);
    expect("增加10%移動速度".includes(ms.matchZh)).toBe(true);
    expect("10% increased Movement Speed".includes(ms.match)).toBe(true);
    expect("移动速度提高 10%".includes(ms.matchZhHans!)).toBe(true);
  });

  it("builds AffixFamily rows the regex builder can consume", () => {
    const families = shopFamilies();
    expect(families.length).toBe(shopMods.length);
    expect(families.every((f) => f.id.startsWith("shop:"))).toBe(true);
    expect(families.some((f) => f.generation === "prefix")).toBe(true);
    expect(families.some((f) => f.generation === "suffix")).toBe(true);
    expect(families.every((f) => f.match && f.matchZh)).toBe(true);
    expect(families.every((f) => f.matchZhHans && f.textZhHans)).toBe(true);
  });
});
