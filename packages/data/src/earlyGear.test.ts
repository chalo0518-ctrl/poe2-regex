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
    expect(earlyGearSlots().map((s) => s.id)).toContain("shield");

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
      for (const pool of category.pools) {
        const list = earlyGearFamiliesFor(category.id, pool.id);
        expect(list.length).toBeGreaterThan(0);
        expect(list.every((f) => f.matchZh && f.textZh)).toBe(true);
        expect(list.every((f) => !("matchZhHans" in f) && !("textZhHans" in f))).toBe(true);
        expect(list.every((f) => f.id.startsWith(`gear:${category.id}:${pool.id}|`))).toBe(true);
      }
    }
  });

  it("does not mix armour / evasion / ES local defences across body bases", () => {
    const str = earlyGearFamiliesFor("body", "str").find((f) => f.family === "BaseLocalDefences");
    const dex = earlyGearFamiliesFor("body", "dex").find((f) => f.family === "BaseLocalDefences");
    const intel = earlyGearFamiliesFor("body", "int").find((f) => f.family === "BaseLocalDefences");
    expect(str?.matchZh).toBe("護甲值");
    expect(dex?.matchZh).toBe("閃避值");
    expect(intel?.matchZh).toBe("最大能量護盾");
  });

  it("keeps one-handed mace elemental adds as separate families", () => {
    const maces = earlyGearFamiliesFor("mace1h", "mace1h");
    const names = maces.map((f) => f.family);
    expect(names).toEqual(expect.arrayContaining(["PhysicalDamage", "FireDamage", "ColdDamage", "LightningDamage"]));
    expect(maces.find((f) => f.family === "PhysicalDamage")?.matchZh).toContain("物理傷害");
    expect(maces.find((f) => f.family === "FireDamage")?.matchZh).toContain("火焰傷害");
  });
});
