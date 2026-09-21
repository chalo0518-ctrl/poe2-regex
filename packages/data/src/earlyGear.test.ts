import { describe, expect, it } from "vitest";
import {
  earlyGearCatalog,
  earlyGearFamiliesFor,
  earlyGearSlots,
} from "./earlyGear.ts";

describe("early gear catalog", () => {
  it("exposes each requested slot with poe2db paths and Traditional Chinese text", () => {
    const ids = earlyGearCatalog.categories.map((c) => c.id);
    expect(ids).toEqual(["body", "helmet", "gloves", "boots", "ring", "amulet", "belt", "mace1h"]);
    expect(earlyGearSlots().map((s) => s.labelZh)).toEqual([
      "胸甲",
      "頭盔",
      "手套",
      "鞋子",
      "戒指",
      "項鍊",
      "腰帶",
      "單手錘",
      "盾牌",
    ]);

    const sources = earlyGearCatalog.categories.flatMap((c) => c.pools.map((p) => p.path));
    expect(sources).toEqual(
      expect.arrayContaining([
        "Body_Armours_str",
        "Body_Armours_dex",
        "Body_Armours_int",
        "Helmets_str",
        "Gloves_str",
        "Boots_str",
        "Rings",
        "Amulets",
        "Belts",
        "One_Hand_Maces",
      ]),
    );

    for (const category of earlyGearCatalog.categories) {
      const list = earlyGearFamiliesFor(category.id);
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((f) => f.matchZh && f.textZh)).toBe(true);
      expect(list.every((f) => !("matchZhHans" in f) && !("textZhHans" in f))).toBe(true);
      expect(list.every((f) => f.id.startsWith(`gear:${category.id}|`))).toBe(true);
    }
  });

  it("unions body pages into one list while keeping distinct 護甲 / 閃避 / ES match rows", () => {
    const body = earlyGearFamiliesFor("body");
    const defences = body.filter((f) => f.family === "BaseLocalDefences");
    const match = defences.map((f) => f.matchZh);
    expect(match).toEqual(expect.arrayContaining(["護甲值", "閃避值", "最大能量護盾"]));
    expect(new Set(body.filter((f) => f.family === "IncreasedLife").map((f) => f.matchZh)).size).toBe(1);
  });

  it("keeps one-handed mace elemental adds as separate families", () => {
    const maces = earlyGearFamiliesFor("mace1h");
    const names = maces.map((f) => f.family);
    expect(names).toEqual(expect.arrayContaining(["PhysicalDamage", "FireDamage", "ColdDamage", "LightningDamage"]));
    expect(maces.find((f) => f.family === "PhysicalDamage")?.matchZh).toContain("物理傷害");
    expect(maces.find((f) => f.family === "FireDamage")?.matchZh).toContain("火焰傷害");
  });

  it("exposes shields as one slot list without requiring a base picker", () => {
    const shields = earlyGearFamiliesFor("shield");
    expect(shields.length).toBeGreaterThan(10);
    expect(shields.some((f) => f.matchZh.includes("最大生命"))).toBe(true);
  });
});
