import { describe, expect, it } from "vitest";
import { earlyGearFamiliesFor } from "./earlyGear.ts";
import {
  CRAFTING_CONSTRAINTS,
  CRAFTING_RULESET,
  CRAFTING_TREE,
  CRAFT_REASON_TEXT,
  type CraftTarget,
  type DecideCraftInput,
  type OwnedTarget,
  craftTierChoices,
  decideCraft,
  craftVerdictHeadline,
  suggestedCraftNode,
  topTierLevel,
} from "./crafting.ts";

const SIMPLIFIED = [
  "继续",
  "换底",
  "亵渎",
  "预兆",
  "终局",
  "做装",
  "选底",
  "填边",
  "目标",
  "装备",
  "等级",
  "锁在",
  "侧边",
  "条",
  "工艺",
  "词缀",
  "联盟",
  "路线",
  "一轮",
  "顶掉",
  "后重",
  "为了",
  "这个",
  "还是",
  "应该",
  "已经",
  "通过",
  "没有",
  "与合",
  "并且",
  "从选",
  "将来",
  "一种",
  "当滚",
  "覆盖",
  "阶",
  "经验",
  "让下",
  "打开",
  "问题",
  "确认",
  "规则",
  "标准",
];

function input(overrides: Partial<DecideCraftInput> = {}): DecideCraftInput {
  return {
    includes: [],
    itemLevel: 86,
    owned: [],
    prefixCount: 0,
    suffixCount: 0,
    targetSide: "auto",
    garbageFracture: false,
    hasGoodFractureOnTargetSide: false,
    hasDesecrated: false,
    desecratedOnRoute: false,
    craftedSlotLockedToKeeper: false,
    tightBudget: false,
    ...overrides,
  };
}

function suffix(id: string, tierLevel: number | null = 80): CraftTarget {
  return { id, generation: "suffix", tierLevel };
}

function prefix(id: string, tierLevel: number | null = 80): CraftTarget {
  return { id, generation: "prefix", tierLevel };
}

function owned(id: string, generation: "prefix" | "suffix", highTier = true): OwnedTarget {
  return { id, generation, highTier };
}

/** Bad desecration sitting in the open slot of a 2-mod fractured side. */
function overwriteLoop(overrides: Partial<DecideCraftInput> = {}): DecideCraftInput {
  return input({
    includes: [suffix("life")],
    suffixCount: 2,
    prefixCount: 1,
    hasGoodFractureOnTargetSide: true,
    hasDesecrated: true,
    desecratedOnRoute: false,
    craftedSlotLockedToKeeper: false,
    itemLevel: 86,
    ...overrides,
  });
}

describe("crafting ruleset", () => {
  it("encodes one crafted slot, one desecrated slot, and recombinator off the primary path", () => {
    expect(CRAFTING_RULESET).toEqual({
      id: "craft-caps-v1",
      craftedMax: 1,
      desecratedMax: 1,
      recombinator: "standard-only",
    });
    expect(CRAFTING_TREE.map((node) => node.id)).toEqual([
      "base",
      "rare",
      "fill",
      "desecrate",
      "fracture-cleanup",
      "finish",
    ]);
    const desecrate = CRAFTING_TREE.find((node) => node.id === "desecrate");
    expect(desecrate?.action.zhHant).toContain("恰好 2 條");
    expect(desecrate?.action.zhHant).toContain("精髓");
    expect(desecrate?.action.zhHant).toContain("合金");
    expect(desecrate?.action.zhHant).toContain("光明之兆");
    expect(desecrate?.action.zhHant).toContain("Absent");
    expect(desecrate?.action.zhHant).toContain("Portent");
    expect(desecrate?.action.zhHant).toContain("Dusk");
    expect(desecrate?.warning.zhHant).toContain("換底");
    expect(desecrate?.warning.zhHant).toContain("同一個工藝槽");
    const joined = CRAFTING_TREE.map((node) => Object.values(node).map((value) => (
      typeof value === "string" ? value : `${value.zhHant}\n${value.en}`
    )).join("\n")).join("\n");
    expect(joined).toContain("重組器");
    expect(joined).toContain("標準聯盟");
    expect(joined).not.toContain("Recombinator is the next");
    for (const copy of [...CRAFTING_CONSTRAINTS, ...Object.values(CRAFT_REASON_TEXT), ...CRAFTING_TREE.flatMap((node) => [node.title, node.summary, node.action, node.skip, node.irreversible, node.warning])]) {
      for (const needle of SIMPLIFIED) {
        expect(copy.zhHant, needle).not.toContain(needle);
      }
    }
  });

  it("reads top-tier level from real early-gear families", () => {
    const life = earlyGearFamiliesFor("body").find((family) => family.family === "IncreasedLife");
    expect(life).toBeTruthy();
    expect(topTierLevel(life!)).toBe(Math.max(...life!.tiers.map((tier) => tier.level)));
    expect(topTierLevel(life!)).toBeGreaterThan(1);
  });

  it("ranks family tiers best-first and keeps the source index", () => {
    const life = earlyGearFamiliesFor("body").find((family) => family.family === "IncreasedLife");
    expect(life).toBeTruthy();
    const choices = craftTierChoices(life!);
    expect(choices[0]?.rank).toBe(1);
    expect(choices[0]?.level).toBe(topTierLevel(life!));
    expect(choices[0]?.statMin).toBe(life!.tiers[choices[0]!.index]?.statMin);
    expect(choices.at(-1)?.level).toBe(Math.min(...life!.tiers.map((tier) => tier.level)));
    expect(choices.map((choice) => choice.index)).toContain(0);
  });
});

describe("decideCraft", () => {
  it("switches bases when a required top tier cannot roll, even if the overwrite loop looks ready", () => {
    const decision = decideCraft(overwriteLoop({
      includes: [suffix("life", 84)],
      itemLevel: 60,
    }));
    expect(decision.verdict).toBe("rebase");
    expect(decision.reasons).toEqual(["base-cannot-roll-t1"]);
    expect(decision.cleanup).toBe("none");
    expect(suggestedCraftNode(decision)).toBe("base");
    expect(craftVerdictHeadline(decision, "zh-Hant")).toBe("換底");
  });

  it("skips the item-level check when a target has no chosen tier", () => {
    const decision = decideCraft(input({
      includes: [suffix("life", null), prefix("rare", null)],
      itemLevel: 1,
    }));
    expect(decision.verdict).toBe("continue");
    expect(decision.reasons).toEqual(["fresh-base"]);
    expect(decision.warnings).not.toContain("ilvl-unknown");
  });

  it("treats a desecration lock on a target differently from a non-target lock", () => {
    const onTarget = decideCraft(overwriteLoop({
      desecrationLock: "life",
      desecratedOnRoute: false,
      owned: [],
    }));
    expect(onTarget.verdict).toBe("continue");
    expect(onTarget.cleanup).toBe("none");
    expect(onTarget.reasons).toEqual(["good-progress-cleanable"]);

    const miss = decideCraft(overwriteLoop({
      desecrationLock: "other",
      desecratedOnRoute: true,
    }));
    expect(miss.verdict).toBe("continue");
    expect(miss.cleanup).toBe("essence-alloy-overwrite");

    const light = decideCraft(overwriteLoop({
      desecrationLock: "other",
      craftedSlotLockedToKeeper: true,
      owned: [owned("life", "suffix")],
    }));
    expect(light.verdict).toBe("continue");
    expect(light.cleanup).toBe("omen-of-light");
    expect(light.reasons).toEqual(["omen-of-light-cleanup"]);
  });

  it("switches bases when a fracture is locked on garbage", () => {
    const decision = decideCraft(overwriteLoop({ garbageFracture: true, hasGoodFractureOnTargetSide: true }));
    expect(decision.verdict).toBe("rebase");
    expect(decision.reasons).toEqual(["fracture-on-garbage"]);
    expect(decision.cleanup).toBe("none");
    expect(suggestedCraftNode(decision)).toBe("fracture-cleanup");
  });

  it("leans toward a new base when the target side is full and has no good fracture", () => {
    const decision = decideCraft(input({
      includes: [suffix("life")],
      suffixCount: 3,
      owned: [owned("life", "suffix", false)],
      hasGoodFractureOnTargetSide: false,
    }));
    expect(decision.verdict).toBe("rebase");
    expect(decision.reasons).toEqual(["target-side-full-no-fracture"]);
    expect(decision.cleanup).toBe("none");
  });

  it("continues a full side when two high-tier targets are already there and the other side is open", () => {
    const decision = decideCraft(input({
      includes: [prefix("life"), prefix("def")],
      owned: [owned("life", "prefix"), owned("def", "prefix")],
      prefixCount: 3,
      suffixCount: 1,
      targetSide: "prefix",
    }));
    expect(decision.verdict).toBe("continue");
    expect(decision.reasons).toEqual(["good-progress-cleanable"]);
    expect(craftVerdictHeadline(decision, "en")).toBe("Continue");
  });

  it("recommends Essence/Alloy overwrite over Omen of Light on a 2-mod fractured side", () => {
    const decision = decideCraft(overwriteLoop());
    expect(decision.verdict).toBe("continue");
    expect(decision.reasons).toEqual(["desecration-overwrite-loop"]);
    expect(decision.cleanup).toBe("essence-alloy-overwrite");
    expect(decision.targetSide).toBe("suffix");
    expect(suggestedCraftNode(decision)).toBe("desecrate");
    expect(craftVerdictHeadline(decision, "zh-Hant")).toBe("繼續（精髓／合金頂掉後重褻瀆）");
    expect(craftVerdictHeadline(decision, "en")).toBe(
      "Continue (overwrite with Essence/Alloy, then desecrate again)",
    );
    expect(decision.warnings).toEqual(["single-crafted-slot", "single-desecrated", "budget-soft"]);
  });

  it("keeps the overwrite plan when the 2-mod fracture is ready and desecration has not missed yet", () => {
    const decision = decideCraft(overwriteLoop({ hasDesecrated: false }));
    expect(decision.verdict).toBe("continue");
    expect(decision.cleanup).toBe("essence-alloy-overwrite");
  });

  it("does not overwrite a desecrated mod that is already the target", () => {
    const decision = decideCraft(overwriteLoop({ desecratedOnRoute: true }));
    expect(decision.verdict).toBe("continue");
    expect(decision.reasons).toEqual(["good-progress-cleanable"]);
    expect(decision.cleanup).toBe("none");
  });

  it("recommends Omen of Light or a new base when the crafted slot is already a keeper", () => {
    const missing = decideCraft(overwriteLoop({ craftedSlotLockedToKeeper: true }));
    expect(missing.verdict).toBe("rebase");
    expect(missing.reasons).toEqual(["crafted-keeper-breaks-loop"]);
    expect(missing.cleanup).toBe("omen-of-light");
    expect(craftVerdictHeadline(missing, "zh-Hant")).toBe("換底（或改用光明之兆一輪清理）");

    const finished = decideCraft(overwriteLoop({
      craftedSlotLockedToKeeper: true,
      owned: [owned("life", "suffix")],
    }));
    expect(finished.verdict).toBe("continue");
    expect(finished.reasons).toEqual(["omen-of-light-cleanup"]);
    expect(finished.cleanup).toBe("omen-of-light");
    expect(craftVerdictHeadline(finished, "zh-Hant")).toBe("繼續（改用光明之兆一輪清理）");

    const salvage = decideCraft(overwriteLoop({
      craftedSlotLockedToKeeper: true,
      includes: [suffix("life"), suffix("res"), suffix("attr")],
      owned: [owned("life", "suffix"), owned("res", "suffix")],
    }));
    expect(salvage.verdict).toBe("downgrade");
    expect(salvage.reasons).toEqual(["crafted-keeper-breaks-loop", "omen-of-light-cleanup"]);
    expect(salvage.cleanup).toBe("omen-of-light");
    expect(craftVerdictHeadline(salvage, "en")).toBe("Lower the goal (one Omen of Light cleanup)");
  });

  it("treats three mods on the target side as a broken loop", () => {
    const decision = decideCraft(overwriteLoop({ suffixCount: 3 }));
    expect(decision.verdict).toBe("rebase");
    expect(decision.reasons).toEqual(["loop-structure-broken"]);
    expect(decision.cleanup).toBe("omen-of-light");
    expect(suggestedCraftNode(decision)).toBe("fracture-cleanup");
  });

  it("breaks harder when the side is full and the crafted slot is a keeper", () => {
    const decision = decideCraft(overwriteLoop({
      suffixCount: 3,
      craftedSlotLockedToKeeper: true,
      hasGoodFractureOnTargetSide: true,
    }));
    expect(decision.verdict).toBe("rebase");
    expect(decision.reasons).toEqual(["loop-structure-broken", "crafted-keeper-breaks-loop"]);
    expect(decision.cleanup).toBe("omen-of-light");
  });

  it("continues when two or more high-tier targets are in and the other side is cleanable", () => {
    const decision = decideCraft(input({
      includes: [suffix("life"), suffix("res")],
      owned: [owned("life", "suffix"), owned("res", "suffix")],
      suffixCount: 2,
      prefixCount: 1,
    }));
    expect(decision.verdict).toBe("continue");
    expect(decision.reasons).toEqual(["good-progress-cleanable"]);
  });

  it("continues a fresh base and early progress", () => {
    expect(decideCraft(input()).reasons).toEqual(["fresh-base"]);
    const early = decideCraft(input({
      includes: [prefix("life")],
      owned: [owned("life", "prefix")],
      prefixCount: 1,
      targetSide: "prefix",
    }));
    expect(early.verdict).toBe("continue");
    expect(early.reasons).toEqual(["early-progress"]);
    expect(early.targetSide).toBe("prefix");
    expect(suggestedCraftNode(early)).toBe("rare");
  });

  it("rebases or downgrades a bad desecration that is not in the overwrite window", () => {
    const empty = decideCraft(input({
      hasDesecrated: true,
      desecratedOnRoute: false,
      suffixCount: 1,
    }));
    expect(empty.verdict).toBe("rebase");
    expect(empty.reasons).toEqual(["exclusive-slot-wrong"]);
    expect(empty.cleanup).toBe("omen-of-light");

    const progressed = decideCraft(input({
      includes: [suffix("life"), suffix("res")],
      owned: [owned("life", "suffix"), owned("res", "suffix")],
      hasDesecrated: true,
      desecratedOnRoute: false,
      suffixCount: 2,
      prefixCount: 1,
      hasGoodFractureOnTargetSide: false,
    }));
    expect(progressed.verdict).toBe("downgrade");
    expect(progressed.reasons).toEqual(["exclusive-slot-wrong"]);
    expect(progressed.cleanup).toBe("omen-of-light");
  });

  it("downgrades when a keeper craft blocks the plan but a high tier is already done", () => {
    const decision = decideCraft(input({
      includes: [suffix("life"), suffix("res")],
      owned: [owned("life", "suffix")],
      craftedSlotLockedToKeeper: true,
      suffixCount: 1,
      hasGoodFractureOnTargetSide: false,
    }));
    expect(decision.verdict).toBe("downgrade");
    expect(decision.reasons).toEqual(["exclusive-slot-wrong"]);
    expect(decision.cleanup).toBe("none");
  });

  it("resolves the target side from required mods", () => {
    const decision = decideCraft(input({
      includes: [prefix("life"), prefix("mana"), suffix("res")],
      prefixCount: 3,
      targetSide: "auto",
    }));
    expect(decision.targetSide).toBe("prefix");
    expect(decision.verdict).toBe("rebase");
    expect(decision.reasons).toEqual(["target-side-full-no-fracture"]);
  });

  it("ignores a tight budget when choosing continue versus a new base", () => {
    const open = decideCraft(overwriteLoop({ tightBudget: false }));
    const tight = decideCraft(overwriteLoop({ tightBudget: true }));
    expect(tight.verdict).toBe(open.verdict);
    expect(tight.reasons).toEqual(open.reasons);
    expect(tight.cleanup).toBe(open.cleanup);
    expect(tight.warnings).toContain("budget-soft");
    expect(open.warnings).toContain("budget-soft");
  });

  it("warns when item level was not entered", () => {
    const decision = decideCraft(input({
      includes: [suffix("life")],
      itemLevel: null,
    }));
    expect(decision.warnings).toContain("ilvl-unknown");
    expect(decision.verdict).toBe("continue");
  });
});
