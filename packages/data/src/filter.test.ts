import { describe, expect, it } from "vitest";
import { cycleTagState, hasHarvestTag, matchesTagFilter } from "./filter.ts";
import type { ShieldFamily } from "./types.ts";

function fam(tags: string[]): ShieldFamily {
  return {
    id: "t",
    family: "Test",
    generation: "prefix",
    bases: ["str"],
    tags,
    tagsZh: [],
    labelZh: "測",
    labelEn: "Test",
    textZh: "測試",
    textEn: "test",
    match: "test",
    matchZh: "測試",
    kind: "flag",
    tiers: [],
    minLevel: 1,
    maxLevel: 1,
    tierCount: 1,
    weight: 1,
  };
}

describe("tag filter", () => {
  it("cycles include → exclude → off", () => {
    expect(cycleTagState("off")).toBe("include");
    expect(cycleTagState("include")).toBe("exclude");
    expect(cycleTagState("exclude")).toBe("off");
  });

  it("ORs multiple include tags", () => {
    const armour = fam(["armour", "defences"]);
    const life = fam(["life", "resource"]);
    const fire = fam(["fire", "elemental", "resistance"]);
    const states = { armour: "include", life: "include" } as const;
    expect(matchesTagFilter(armour, states)).toBe(true);
    expect(matchesTagFilter(life, states)).toBe(true);
    expect(matchesTagFilter(fire, states)).toBe(false);
  });

  it("exclude removes tagged families", () => {
    const fire = fam(["fire", "elemental"]);
    expect(matchesTagFilter(fire, { fire: "exclude" })).toBe(false);
    expect(matchesTagFilter(fam(["life"]), { fire: "exclude" })).toBe(true);
  });

  it("matches harvest ids against fossil-style suffixes", () => {
    expect(hasHarvestTag(fam(["fire_resistance", "elemental"]), "fire")).toBe(
      true,
    );
    expect(hasHarvestTag(fam(["fire_resistance"]), "armour")).toBe(false);
  });
});
