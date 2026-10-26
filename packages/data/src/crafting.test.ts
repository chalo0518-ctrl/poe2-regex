import { describe, expect, it } from "vitest";
import { earlyGearFamiliesFor } from "./earlyGear.ts";
import {
  CRAFTING_CONSTRAINTS,
  CRAFTING_RULESET,
  CRAFTING_TREE,
  CRAFT_CLEANUP_TEXT,
  CRAFT_DIAGRAM,
  CRAFT_REASON_TEXT,
  type CraftTarget,
  type DecideCraftInput,
  type OwnedTarget,
  craftFractureAdvice,
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

function suffix(
  id: string,
  tierLevel: number | null = 80,
  weights: { tierWeight?: number | null; weight?: number | null } = {},
): CraftTarget {
  return { id, generation: "suffix", tierLevel, ...weights };
}

function prefix(
  id: string,
  tierLevel: number | null = 80,
  weights: { tierWeight?: number | null; weight?: number | null } = {},
): CraftTarget {
  return { id, generation: "prefix", tierLevel, ...weights };
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
      "fracture",
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
    expect(joined).not.toContain("步驟");
    expect(CRAFT_DIAGRAM.map((node) => node.id)).toEqual([
      "fracture",
      "base",
      "stop-base",
      "fill",
      "stop-full",
      "sockets",
      "keep-exceptional",
      "desecrate",
      "essence",
      "stop-fracture",
      "omen",
      "whittle",
      "side-annul",
      "light",
      "stop-omen",
      "finish",
    ]);
    expect(CRAFT_DIAGRAM[0]?.id).toBe("fracture");
    expect(CRAFT_DIAGRAM.find((node) => node.id === "fracture")?.choice.zhHant).toContain("最稀有");
    expect(CRAFT_DIAGRAM.find((node) => node.id === "fracture")?.choice.zhHant).toContain("破潰石");
    expect(CRAFT_DIAGRAM.find((node) => node.id === "base")?.choice.zhHant).toContain("骰不到所選階級就是換底");
    expect(CRAFT_DIAGRAM.find((node) => node.id === "base")?.choice.zhHant).not.toMatch(/^先對/);
    expect(CRAFT_DIAGRAM.find((node) => node.id === "desecrate")?.choice.zhHant).toContain("少花光明之兆");
    const opener = CRAFTING_TREE.find((node) => node.id === "fracture");
    expect(opener?.action.zhHant).toContain("恰好 2 條");
    expect(opener?.action.zhHant).toContain("瓦爾");
    expect(opener?.action.zhHant).toContain("出現權重");
    for (const copy of [
      ...CRAFTING_CONSTRAINTS,
      ...Object.values(CRAFT_REASON_TEXT),
      ...Object.values(CRAFT_CLEANUP_TEXT),
      ...CRAFTING_TREE.flatMap((node) => [node.title, node.summary, node.action, node.skip, node.irreversible, node.warning]),
      ...CRAFT_DIAGRAM.flatMap((node) => [node.title, node.choice]),
    ]) {
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
    expect(early.fracturePending).toBe(true);
    expect(early.path[0]).toBe("fracture");
    expect(suggestedCraftNode(early)).toBe("fracture");
    expect(craftVerdictHeadline(early, "zh-Hant")).toBe("繼續（先破潰最稀有的目標）");
    expect(craftVerdictHeadline(decideCraft(input()), "en")).toBe("Continue (fracture the rarest target first)");
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

  it("keeps the structure verdict when no non-target mods are recorded", () => {
    const decision = decideCraft(input());
    expect(decision.reasons).toEqual(["fresh-base"]);
    expect(decision.cleanup).toBe("none");
    expect(decision.path).toEqual(["fracture", "base", "fill"]);
    expect(decision.removal.recommendation).toBe("none");
  });

  it("whittles a non-target whose level is below every target", () => {
    const decision = decideCraft(input({
      includes: [suffix("life", 60)],
      owned: [owned("life", "suffix")],
      suffixCount: 1,
      others: [{ id: "str", generation: "prefix", level: 8 }],
    }));
    expect(decision.verdict).toBe("continue");
    expect(decision.reasons).toEqual(["whittle-safe"]);
    expect(decision.cleanup).toBe("whittle");
    expect(decision.path).toEqual(["fracture", "base", "fill", "desecrate", "omen", "whittle"]);
    expect(decision.removal.whittleRemoves).toBe("str");
    expect(decision.removal.classes).toEqual([{ id: "str", classification: "acceptable" }]);
    expect(craftVerdictHeadline(decision, "zh-Hant")).toBe("繼續（削切之兆，混沌石移除最低等級詞綴）");
    expect(craftVerdictHeadline(decision, "en")).toBe(
      "Continue (Omen of Whittling — Chaos Orb removes the lowest-level modifier)",
    );
  });

  it("annuls the safe side when whittling would hit a target", () => {
    const decision = decideCraft(input({
      includes: [suffix("life", 40)],
      owned: [owned("life", "suffix")],
      suffixCount: 1,
      prefixCount: 1,
      others: [{ id: "junk", generation: "prefix", level: 80 }],
    }));
    expect(decision.cleanup).toBe("sinistral-annulment");
    expect(decision.reasons).toEqual(["side-removal-safe"]);
    expect(decision.path).toEqual(["fracture", "base", "fill", "desecrate", "omen", "side-annul"]);
    expect(decision.removal.classes).toEqual([{ id: "junk", classification: "bad" }]);
    expect(craftVerdictHeadline(decision, "zh-Hant")).toBe("繼續（左旋廢止之兆，無效石只移除前綴）");
  });

  it("stops when removal would hit a target and neither side is safe", () => {
    const decision = decideCraft(input({
      includes: [suffix("life", 44), prefix("armour", 30)],
      owned: [owned("life", "suffix"), owned("armour", "prefix")],
      suffixCount: 2,
      prefixCount: 2,
      others: [{ id: "fire", generation: "suffix", level: 64 }],
    }));
    expect(decision.verdict).toBe("rebase");
    expect(decision.reasons).toEqual(["removal-risky"]);
    expect(decision.cleanup).toBe("none");
    expect(decision.path).toEqual(["fracture", "base", "fill", "desecrate", "omen", "stop-omen"]);
    expect(craftVerdictHeadline(decision, "zh-Hant")).toBe("換底");
  });

  it("does not let a safe whittle override an impossible base or a garbage fracture", () => {
    const blocked = decideCraft(input({
      includes: [suffix("life", 82)],
      itemLevel: 40,
      others: [{ id: "str", generation: "prefix", level: 1 }],
    }));
    expect(blocked.reasons).toEqual(["base-cannot-roll-t1"]);
    expect(blocked.path).toEqual(["fracture", "base", "stop-base"]);

    const fractured = decideCraft(input({
      garbageFracture: true,
      others: [{ id: "str", generation: "prefix", level: 1 }],
    }));
    expect(fractured.reasons).toEqual(["fracture-on-garbage"]);
    expect(fractured.path).toEqual(["fracture", "base", "fill", "desecrate", "stop-fracture"]);
  });

  it("uses Light for a desecrated miss only when side removal and whittling are unsafe", () => {
    const spared = decideCraft(input({
      includes: [suffix("keep", 40), suffix("open", 15)],
      owned: [owned("keep", "suffix"), owned("open", "suffix")],
      suffixCount: 2,
      hasGoodFractureOnTargetSide: true,
      hasDesecrated: true,
      desecratedOnRoute: false,
      others: [{ id: "bad", generation: "suffix", level: 70, desecrated: true }],
    }));
    expect(spared.removal.recommendation).toBe("light");
    expect(spared.cleanup).toBe("essence-alloy-overwrite");
    expect(spared.path).toEqual(["fracture", "base", "fill", "desecrate", "essence"]);

    const light = decideCraft(input({
      includes: [suffix("keep", 40), suffix("open", 15)],
      owned: [owned("keep", "suffix"), owned("open", "suffix")],
      suffixCount: 2,
      others: [{ id: "bad", generation: "suffix", level: 70, desecrated: true }],
    }));
    expect(light.cleanup).toBe("omen-of-light");
    expect(light.reasons).toEqual(["omen-of-light-cleanup"]);
    expect(light.path).toEqual(["fracture", "base", "fill", "desecrate", "omen", "light"]);
    expect(craftVerdictHeadline(light, "en")).toBe("Continue (one Omen of Light cleanup)");
  });

  it("treats a low-tier target as unknown for whittling and still clears the other side", () => {
    const decision = decideCraft(input({
      includes: [suffix("life", 60)],
      owned: [owned("life", "suffix", false)],
      suffixCount: 1,
      prefixCount: 1,
      others: [{ id: "str", generation: "prefix", level: 8 }],
    }));
    expect(decision.removal.whittle).toBe("unknown-level");
    expect(decision.cleanup).toBe("sinistral-annulment");
  });

  it("keeps a base whose socket count is above the slot maximum", () => {
    const full = input({
      includes: [suffix("life")],
      suffixCount: 3,
      owned: [owned("life", "suffix", false)],
      slot: "body",
    });
    const extra = decideCraft({ ...full, socketCount: 3 });
    expect(extra.verdict).toBe("continue");
    expect(extra.reasons[0]).toBe("exceptional-keep");
    expect(extra.reasons).toContain("target-side-full-no-fracture");
    expect(extra.path).toEqual(["fracture", "base", "fill", "sockets", "keep-exceptional"]);
    expect(craftVerdictHeadline(extra, "zh-Hant")).toBe("繼續（額外增幅槽，留下這件）");
    expect(craftVerdictHeadline(extra, "en")).toBe("Continue (extra augment socket — keep this base)");
    expect(suggestedCraftNode(extra)).toBe("finish");

    const normal = decideCraft({ ...full, socketCount: 2 });
    expect(normal.verdict).toBe("rebase");
    expect(normal.reasons).toEqual(["target-side-full-no-fracture"]);
    expect(normal.socketAugments).toEqual([]);
  });

  it("treats suffix 3 as still open when 瑟雷的凱旋 adds a suffix slot", () => {
    const base = input({
      includes: [suffix("life")],
      owned: [owned("life", "suffix", false)],
      slot: "body",
      augments: [{ id: "Serles_Triumph", socket: 1 }],
    });
    const open = decideCraft({ ...base, suffixCount: 3 });
    expect(open.reasons).not.toContain("target-side-full-no-fracture");
    const full = decideCraft({ ...base, suffixCount: 4 });
    expect(full.reasons).toContain("target-side-full-no-fracture");
    expect(full.reasons).toContain("socket-bound-augment");
    expect(full.socketAugments[0]?.effectZh).toBe("所有裝備: 允許後綴+1");
  });

  it("does not keep an impossible tier or a garbage fracture just because of an extra socket", () => {
    const blocked = decideCraft(input({
      includes: [suffix("life", 82)],
      itemLevel: 40,
      slot: "body",
      socketCount: 3,
      augments: [{ id: "Medveds_Tending", socket: 1 }],
    }));
    expect(blocked.verdict).toBe("rebase");
    expect(blocked.reasons).toEqual(["base-cannot-roll-t1"]);
    expect(blocked.path).toEqual(["fracture", "base", "stop-base"]);
    expect(blocked.socketAugments.map((row) => row.nameZh)).toEqual(["梅德偉的照料"]);

    const fractured = decideCraft(input({
      garbageFracture: true,
      slot: "body",
      socketCount: 3,
    }));
    expect(fractured.reasons).toEqual(["fracture-on-garbage"]);
    expect(fractured.verdict).toBe("rebase");
  });

  it("keeps a socket-bound augment even when the socket count is still normal", () => {
    const decision = decideCraft(input({
      includes: [suffix("life")],
      suffixCount: 3,
      owned: [owned("life", "suffix", false)],
      slot: "body",
      socketCount: 2,
      augments: [{ id: "Medveds_Tending", socket: 1 }],
    }));
    expect(decision.verdict).toBe("continue");
    expect(decision.reasons).toContain("socket-bound-augment");
    expect(decision.reasons).not.toContain("exceptional-keep");
    expect(decision.socketAugments[0]?.effectZh).toContain("靈魂");
    expect(decision.socketAugments[0]?.socketBound).toBe(true);
    expect(decision.path).toEqual(["fracture", "base", "fill", "sockets", "keep-exceptional"]);
    expect(craftVerdictHeadline(decision, "zh-Hant")).toBe("繼續");
  });

  it("keeps the whittle headline when an extra socket is also worth saving", () => {
    const decision = decideCraft(input({
      includes: [suffix("life", 60)],
      owned: [owned("life", "suffix")],
      suffixCount: 1,
      others: [{ id: "str", generation: "prefix", level: 8 }],
      slot: "body",
      socketCount: 3,
      augments: [{ id: "Desert_Rune", socket: 1 }],
    }));
    expect(decision.reasons[0]).toBe("exceptional-keep");
    expect(decision.cleanup).toBe("whittle");
    expect(decision.socketAugments[0]?.effectZh).toBe("護甲: +14%火焰抗性");
    expect(craftVerdictHeadline(decision, "zh-Hant")).toBe("繼續（削切之兆，混沌石移除最低等級詞綴）");
    expect(decision.path).toEqual(["fracture", "base", "fill", "desecrate", "omen", "whittle", "sockets", "keep-exceptional"]);
  });

  it("opens by fracturing the rarest selected target, unless a fracture lock names one", () => {
    const open = decideCraft(input({
      includes: [
        suffix("life", 82, { tierWeight: 1000, weight: 13000 }),
        suffix("cast", 60, { tierWeight: 1, weight: 5 }),
        prefix("armour", 86, { tierWeight: 500, weight: 4000 }),
      ],
    }));
    expect(open.fractureFocus).toMatchObject({
      id: "cast",
      reason: "tier-weight",
      tierWeight: 1,
      tierLevel: 60,
    });
    expect(open.fracturePending).toBe(true);
    expect(open.path[0]).toBe("fracture");
    expect(open.verdict).toBe("continue");
    expect(suggestedCraftNode(open)).toBe("fracture");
    expect(craftVerdictHeadline(open, "zh-Hant")).toBe("繼續（先破潰最稀有的目標）");

    const locked = decideCraft(input({
      includes: [
        suffix("life", 82, { tierWeight: 1000, weight: 13000 }),
        suffix("cast", 60, { tierWeight: 1, weight: 5 }),
      ],
      desecrationLock: "life",
    }));
    expect(locked.fractureFocus).toMatchObject({ id: "life", reason: "lock" });
    for (const focus of [open.fractureFocus!, locked.fractureFocus!]) {
      expect(craftFractureAdvice(focus, "目標", "zh-Hant")).toContain("1 條未揭露褻瀆；未揭露的褻瀆不會被鎖，命中率 1/3");
      expect(craftFractureAdvice(focus, "Target", "en")).toContain("1 unrevealed desecration");
      expect(craftFractureAdvice(focus, "Target", "en")).toContain("1 in 3");
    }
    expect(locked.fracturePending).toBe(false);
    expect(locked.path[0]).toBe("fracture");
    expect(craftVerdictHeadline(locked, "zh-Hant")).toBe("繼續");
  });

  it("uses required item level when spawn weight is missing, and breaks weight ties the same way", () => {
    const proxy = decideCraft(input({
      includes: [
        suffix("low", 40),
        prefix("high", 84),
        suffix("mid", 70),
      ],
    }));
    expect(proxy.fractureFocus).toMatchObject({ id: "high", reason: "item-level", tierLevel: 84 });

    const tied = decideCraft(input({
      includes: [
        suffix("a", 70, { tierWeight: 100 }),
        suffix("b", 82, { tierWeight: 100 }),
      ],
    }));
    expect(tied.fractureFocus).toMatchObject({ id: "b", reason: "item-level", tierLevel: 82 });

    const family = decideCraft(input({
      includes: [
        suffix("common", null, { weight: 8000 }),
        prefix("rare", null, { weight: 5 }),
      ],
    }));
    expect(family.fractureFocus).toMatchObject({ id: "rare", reason: "family-weight", weight: 5 });
    expect(family.fractureFocus?.tierWeight).toBeNull();
  });
});
