import { describe, expect, it } from "vitest";
import {
  familiesForSocketAugments,
  poolAugmentById,
  poolAugmentsForSlot,
  socketSideCaps,
} from "./socketPools.ts";

describe("socket pool augments", () => {
  it("raises the suffix cap for 瑟雷的凱旋 and leaves the prefix cap at 3", () => {
    const serle = poolAugmentById("Serles_Triumph");
    expect(serle?.nameZh).toBe("瑟雷的凱旋");
    expect(serle?.nameEn).toBe("Serle's Triumph");
    expect(serle?.effectZh).toBe("所有裝備: 允許後綴+1");
    expect(serle?.effectEn).toBe("All Equipment: +1 Suffix Modifier allowed");
    expect(socketSideCaps([])).toEqual({ prefix: 3, suffix: 3, crafted: 1 });
    expect(socketSideCaps(["Serles_Triumph"])).toEqual({ prefix: 3, suffix: 4, crafted: 1 });
    expect(socketSideCaps(["Serles_Triumph", "Serles_Triumph"])).toEqual({ prefix: 3, suffix: 4, crafted: 1 });
    expect(socketSideCaps(["Astrids_Creativity"]).crafted).toBe(2);
  });

  it("adds Thrud's Destruction pool only on weapons", () => {
    const thrud = poolAugmentById("Thruds_Might");
    expect(thrud?.nameZh).toBe("索魯德的強權");
    expect(thrud?.nameEn).toBe("Thrud's Might");
    expect(thrud?.effectZh).toBe("武器: 可骰出毀滅詞綴");
    expect(thrud?.effectEn).toBe("Weapon: Can roll Destruction modifiers");
    expect(poolAugmentsForSlot("bow").some((row) => row.id === "Thruds_Might")).toBe(true);
    expect(poolAugmentsForSlot("body").some((row) => row.id === "Thruds_Might")).toBe(false);
    expect(poolAugmentsForSlot("body").some((row) => row.id === "Serles_Triumph")).toBe(true);
    const families = familiesForSocketAugments(["Thruds_Might"]);
    expect(families).toHaveLength(9);
    expect(families.some((row) => row.textZh.includes("變動物理詞綴的大小"))).toBe(true);
    expect(familiesForSocketAugments(["Serles_Triumph"])).toEqual([]);
  });

  it("groups Vorana warcry damage into one family with three tiers", () => {
    const families = familiesForSocketAugments(["Voranas_Carnage"]);
    const warcry = families.find((row) => row.textZh.includes("戰吼傷害"));
    expect(warcry?.tierCount).toBe(3);
    expect(warcry?.tiers.map((tier) => tier.level)).toEqual([45, 65, 75]);
    expect(poolAugmentsForSlot("helmet").some((row) => row.id === "Voranas_Carnage")).toBe(true);
    expect(poolAugmentsForSlot("gloves").map((row) => row.id)).toEqual(
      expect.arrayContaining(["Kolrs_Hunt", "Katlas_Gloom", "Serles_Triumph", "Astrids_Creativity"]),
    );
  });
});