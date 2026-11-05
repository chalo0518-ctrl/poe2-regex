import { describe, expect, it } from "vitest";
import { desecratedFamiliesFor } from "./desecrated.ts";
import { earlyGearFamiliesFor } from "./earlyGear.ts";
import { poolAugmentById } from "./socketPools.ts";
import { orderCraftingLibrary } from "./craftingOrder.ts";
import { craftingFamiliesFor } from "./weapons.ts";
import type { AffixFamily } from "./types.ts";

function orderedTexts(rows: readonly AffixFamily[], generation: "prefix" | "suffix"): string[] {
  return orderCraftingLibrary(
    rows.filter((family) => family.generation === generation).map((family) => ({ family })),
  ).map((row) => row.family.textZh);
}

function indexes(texts: readonly string[], pred: (text: string) => boolean): number[] {
  return texts.flatMap((text, index) => (pred(text) ? [index] : []));
}

function expectContiguous(texts: readonly string[], pred: (text: string) => boolean) {
  const found = indexes(texts, pred);
  expect(found.length).toBeGreaterThan(0);
  expect(found[found.length - 1]! - found[0]!).toBe(found.length - 1);
}

function expectBefore(
  texts: readonly string[],
  earlier: (text: string) => boolean,
  later: (text: string) => boolean,
) {
  const first = texts.findIndex(earlier);
  const second = texts.findIndex(later);
  expect(first).toBeGreaterThanOrEqual(0);
  expect(second).toBeGreaterThan(first);
}

describe("crafting library order", () => {
  it("keeps the early-gear scrape order", () => {
    const rows = earlyGearFamiliesFor("body");
    const locale = [...rows].sort((a, b) => {
      if (a.generation !== b.generation) return a.generation === "prefix" ? -1 : 1;
      return a.textZh.localeCompare(b.textZh, "zh-Hant");
    });
    expect(rows.map((row) => row.id)).toEqual(locale.map((row) => row.id));
  });

  it("groups bow damage with added values before percentages", () => {
    const prefixes = orderedTexts(craftingFamiliesFor("bow"), "prefix");
    expectContiguous(prefixes, (text) => text.includes("物理傷害"));
    expectBefore(
      prefixes,
      (text) => text.includes("附加") && text.includes("物理"),
      (text) => text.includes("增加") && text.includes("物理傷害"),
    );
    expectContiguous(prefixes, (text) => /火焰|冰冷|閃電|元素傷害/.test(text));
    expectBefore(
      prefixes,
      (text) => text.includes("附加") && text.includes("火焰"),
      (text) => text.includes("附加") && text.includes("冰冷"),
    );
    expectBefore(
      prefixes,
      (text) => text.includes("附加") && text.includes("冰冷"),
      (text) => text.includes("附加") && text.includes("閃電"),
    );
    expectBefore(
      prefixes,
      (text) => text.includes("附加") && text.includes("閃電"),
      (text) => text.includes("元素傷害"),
    );
    expectContiguous(orderedTexts(craftingFamiliesFor("bow"), "suffix"), (text) => text.includes("暴擊"));
  });

  it("groups body defence by type with flat before percent", () => {
    const prefixes = orderedTexts(craftingFamiliesFor("body"), "prefix");
    const armourOnly = (text: string) => text.includes("護甲") && !text.includes("閃避") && !text.includes("能量護盾");
    const evasionOnly = (text: string) => text.includes("閃避") && !text.includes("護甲") && !text.includes("能量護盾");
    const shieldOnly = (text: string) => text.includes("能量護盾") && !text.includes("護甲") && !text.includes("閃避");
    expectContiguous(prefixes, armourOnly);
    expectContiguous(prefixes, evasionOnly);
    expectContiguous(prefixes, shieldOnly);
    expectBefore(
      prefixes,
      (text) => armourOnly(text) && !text.includes("增加"),
      (text) => armourOnly(text) && text.includes("增加") && !text.includes("+"),
    );
    expectBefore(prefixes, armourOnly, evasionOnly);
    expectBefore(prefixes, evasionOnly, shieldOnly);

    const suffixes = orderedTexts(craftingFamiliesFor("body"), "suffix");
    expectContiguous(suffixes, (text) => /火焰抗性|冰冷抗性|閃電抗性|混沌抗性/.test(text));
    expectBefore(suffixes, (text) => text.includes("火焰抗性"), (text) => text.includes("冰冷抗性"));
    expectBefore(suffixes, (text) => text.includes("冰冷抗性"), (text) => text.includes("閃電抗性"));
    expectContiguous(suffixes, (text) => /點力量|點敏捷|點智慧/.test(text));
  });

  it("groups ring damage families and keeps flat life with life mods", () => {
    const prefixes = orderedTexts(craftingFamiliesFor("ring"), "prefix");
    expectContiguous(prefixes, (text) => text.includes("火焰"));
    expectBefore(
      prefixes,
      (text) => text.includes("附加") && text.includes("火焰"),
      (text) => text.includes("增加") && text.includes("火焰"),
    );
    expectBefore(
      prefixes,
      (text) => text.includes("附加") && text.includes("物理"),
      (text) => text.includes("附加") && text.includes("火焰"),
    );
    expectContiguous(prefixes, (text) => text.includes("最大生命") || text.includes("最大魔力"));
  });

  it("groups desecrated resists and socket-pool defence the same way", () => {
    const desecrated = orderedTexts(desecratedFamiliesFor("body"), "suffix");
    expectContiguous(desecrated, (text) => text.includes("抗性"));
    expectBefore(desecrated, (text) => text.includes("火焰和混沌"), (text) => text.includes("冰冷和混沌"));
    expectBefore(desecrated, (text) => text.includes("冰冷和混沌"), (text) => text.includes("閃電和混沌"));

    const medved = poolAugmentById("Medveds_Tending");
    if (!medved) throw new Error("missing Medved");
    const prefixes = orderedTexts(medved.families, "prefix");
    const armourOnly = (text: string) => text.includes("護甲") && !text.includes("閃避") && !text.includes("能量護盾");
    const evasionOnly = (text: string) => text.includes("閃避") && !text.includes("護甲") && !text.includes("能量護盾");
    expectContiguous(prefixes, armourOnly);
    expectContiguous(prefixes, evasionOnly);
    expectBefore(prefixes, armourOnly, evasionOnly);

    const thrud = poolAugmentById("Thruds_Might");
    if (!thrud) throw new Error("missing Thrud");
    const suffixes = orderedTexts(thrud.families, "suffix");
    expectBefore(suffixes, (text) => text.includes("物理"), (text) => text.includes("火焰"));
    expectBefore(suffixes, (text) => text.includes("火焰"), (text) => text.includes("冰冷"));
    expectBefore(suffixes, (text) => text.includes("閃電"), (text) => text.includes("元素"));
    expectBefore(suffixes, (text) => text.includes("元素"), (text) => text.includes("混沌"));
  });
});
