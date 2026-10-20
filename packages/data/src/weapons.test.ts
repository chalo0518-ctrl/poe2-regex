import { describe, expect, it } from "vitest";
import { affixModGroup } from "./earlyGear.ts";
import { earlyGearSlots } from "./earlyGear.ts";
import { craftingFamiliesFor, craftingSlots, weaponCatalog } from "./weapons.ts";

const WEAPON_LABELS = [
  "爪",
  "匕首",
  "單手劍",
  "單手斧",
  "單手錘",
  "權杖",
  "法杖",
  "弓",
  "十字弓",
  "長杖",
  "雙手劍",
  "雙手斧",
  "雙手錘",
  "長矛",
  "細杖",
  "鏈錘",
  "陷阱",
];

describe("crafting weapon slots", () => {
  it("adds one button per weapon class without attribute pools or early-gear duplicates", () => {
    expect(weaponCatalog.categories.map((category) => category.labelZh)).toEqual(
      WEAPON_LABELS.filter((label) => label !== "單手錘"),
    );
    for (const category of weaponCatalog.categories) {
      expect(category.pools).toHaveLength(1);
      expect(category.pools[0]?.path).not.toMatch(/_(str|dex|int)/);
      const list = weaponCatalog.byCategory[category.id][category.pools[0].id];
      expect(list.length).toBeGreaterThan(10);
      expect(list.every((family) => family.matchZh && family.textZh && family.tiers.length > 0)).toBe(true);
      expect(list.every((family) => !("matchZhHans" in family) && !("textZhHans" in family))).toBe(true);
    }

    const labels = craftingSlots().map((slot) => slot.labelZh);
    expect(labels.filter((label) => label === "單手錘")).toEqual(["單手錘"]);
    expect(labels).toEqual([
      ...earlyGearSlots().map((slot) => slot.labelZh).filter((label) => label !== "單手錘"),
      ...WEAPON_LABELS,
    ]);
    expect(labels).not.toContain("力量");
  });

  it("keeps mixed damage types as separate rows that share one mod group", () => {
    const wands = craftingFamiliesFor("wand");
    const damage = wands.filter((family) => family.family === "WeaponDamageTypePrefix");
    expect(damage.map((family) => family.matchZh).sort()).toEqual(
      ["增加冰冷傷害", "增加法術物理傷害", "增加火焰傷害", "增加混沌傷害", "增加閃電傷害"].sort(),
    );
    expect(new Set(damage.map(affixModGroup))).toEqual(new Set(["WeaponDamageTypePrefix"]));
    expect(craftingFamiliesFor("bow").some((family) => family.matchZh.includes("物理"))).toBe(true);
    expect(craftingFamiliesFor("mace1h").some((family) => family.family === "PhysicalDamage")).toBe(true);
  });
});
