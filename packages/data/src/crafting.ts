import type { UiLocale } from "./types.ts";

/**
 * Craft-cap rules for the current item model: one crafted modifier and one
 * desecrated modifier. Recombinator is not on the primary path.
 * Update these fields when the caps change — pages read this object.
 */
export const CRAFTING_RULESET = {
  id: "craft-caps-v1",
  craftedMax: 1,
  desecratedMax: 1,
  recombinator: "standard-only",
} as const;

export type ModSide = "prefix" | "suffix";

export type CraftVerdict = "continue" | "rebase" | "downgrade";

/** How to clear a bad desecrated / filler mod, when that choice matters. */
export type CraftCleanup = "essence-alloy-overwrite" | "omen-of-light" | "none";

export type CraftReasonId =
  | "base-cannot-roll-t1"
  | "target-side-full-no-fracture"
  | "exclusive-slot-wrong"
  | "fracture-on-garbage"
  | "desecration-overwrite-loop"
  | "omen-of-light-cleanup"
  | "crafted-keeper-breaks-loop"
  | "loop-structure-broken"
  | "good-progress-cleanable"
  | "fresh-base"
  | "early-progress"
  | "insufficient-progress";

export type CraftWarningId =
  | "single-crafted-slot"
  | "single-desecrated"
  | "budget-soft"
  | "ilvl-unknown";

export type CraftTreeNodeId =
  | "base"
  | "rare"
  | "fill"
  | "desecrate"
  | "fracture-cleanup"
  | "finish";

export type CraftTarget = {
  id: string;
  generation: ModSide;
  /**
   * Item level required to roll the chosen tier.
   * Null means any tier: skip the item-level check for this target.
   */
  tierLevel: number | null;
};

export type CraftTierChoice = {
  /** Index into `family.tiers` (stored level-ascending). */
  index: number;
  /** 1 = best tier (highest item level). */
  rank: number;
  level: number;
  statMin?: number;
  statMax?: number;
};

export type OwnedTarget = {
  id: string;
  generation: ModSide;
  highTier: boolean;
};

export type DecideCraftInput = {
  /** Selected craft targets. Every one is treated the same. */
  includes: CraftTarget[];
  /** null when the player has not entered an item level. */
  itemLevel: number | null;
  owned?: OwnedTarget[];
  prefixCount: number;
  suffixCount: number;
  /** "auto" follows whichever side has more targets (後綴 when tied). */
  targetSide?: ModSide | "auto";
  garbageFracture?: boolean;
  hasGoodFractureOnTargetSide?: boolean;
  hasDesecrated?: boolean;
  /** The desecrated mod is one you intend to keep. Ignored when `desecrationLock` is set. */
  desecratedOnRoute?: boolean;
  /**
   * Affix locked by the desecration stone.
   * - `undefined`: use `hasDesecrated` / `desecratedOnRoute`
   * - `null` or `""`: no desecration lock
   * - `"other"`: locked mod is not a selected target
   * - a target id: that affix is the locked one (it counts as on the item)
   */
  desecrationLock?: string | null;
  /**
   * Crafted slot is already a keeper (Essence, Alloy, or runeforge craft
   * you will not overwrite). Essence and Alloy share this single slot.
   */
  craftedSlotLockedToKeeper?: boolean;
  /** Soft note only. Must not change verdict, reasons, or cleanup. */
  tightBudget?: boolean;
};

export type CraftDecision = {
  verdict: CraftVerdict;
  reasons: CraftReasonId[];
  cleanup: CraftCleanup;
  warnings: CraftWarningId[];
  targetSide: ModSide;
};

export type Localized = {
  zhHant: string;
  en: string;
};

export type CraftTreeNode = {
  id: CraftTreeNodeId;
  title: Localized;
  summary: Localized;
  action: Localized;
  skip: Localized;
  irreversible: Localized;
  warning: Localized;
};

const SIDE_CAP = 3;

export function craftLocaleText(copy: Localized, locale: UiLocale): string {
  return locale === "en" ? copy.en : copy.zhHant;
}

export function topTierLevel(family: { maxLevel?: number; tiers?: { level: number }[] }): number {
  const fromTiers = (family.tiers ?? []).reduce((max, tier) => Math.max(max, tier.level), 0);
  return Math.max(family.maxLevel ?? 0, fromTiers);
}

/** Best tier first. Rank 1 is the highest item level in the family. */
export function craftTierChoices(
  family: { tiers: { level: number; statMin?: number; statMax?: number }[] },
): CraftTierChoice[] {
  return family.tiers
    .map((tier, index) => ({
      index,
      level: tier.level,
      statMin: tier.statMin,
      statMax: tier.statMax,
    }))
    .sort((a, b) => b.level - a.level || b.index - a.index)
    .map((row, order) => ({ ...row, rank: order + 1 }));
}

function clampSide(count: number): number {
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.min(SIDE_CAP, Math.floor(count));
}

export function resolveTargetSide(input: Pick<DecideCraftInput, "includes" | "targetSide">): ModSide {
  if (input.targetSide === "prefix" || input.targetSide === "suffix") return input.targetSide;
  const count = (generation: ModSide) =>
    input.includes.filter((row) => row.generation === generation).length;
  if (count("prefix") > count("suffix")) return "prefix";
  return "suffix";
}

function resolveDesecration(
  input: DecideCraftInput,
  includes: CraftTarget[],
): { hasDesecrated: boolean; desecratedOnRoute: boolean; lockedTargetId: string | null } {
  if (input.desecrationLock === undefined) {
    return {
      hasDesecrated: input.hasDesecrated === true,
      desecratedOnRoute: input.desecratedOnRoute === true,
      lockedTargetId: null,
    };
  }
  const lock = input.desecrationLock;
  if (lock == null || lock === "" || lock === "other") {
    return {
      hasDesecrated: lock === "other",
      desecratedOnRoute: false,
      lockedTargetId: null,
    };
  }
  const onTarget = includes.some((row) => row.id === lock);
  return {
    hasDesecrated: true,
    desecratedOnRoute: onTarget,
    lockedTargetId: onTarget ? lock : null,
  };
}

function pack(
  verdict: CraftVerdict,
  reasons: CraftReasonId[],
  cleanup: CraftCleanup,
  warnings: CraftWarningId[],
  targetSide: ModSide,
): CraftDecision {
  return { verdict, reasons, cleanup, warnings, targetSide };
}

/**
 * Continue / new base / downgrade.
 *
 * Priority:
 * 1. A chosen tier cannot roll on this item level → rebase.
 * 2. Fracture locked on a non-target → rebase.
 * 3. Bad desecration + target side exactly 2 + good fracture + crafted slot free
 *    → continue by overwriting with Essence/Alloy, then desecrate again (not Omen of Light).
 * 4. Same shape but the crafted slot is a keeper → Omen of Light if the required
 *    targets are already there; downgrade when several good mods remain; otherwise rebase.
 * 5. Target side exactly 2 + good fracture + crafted slot free, no bad desecration
 *    → keep that loop structure.
 * 6. Target side full and no good fracture → rebase, unless that side is already
 *    two or more high-tier targets and the other side is not full.
 * 7. Three mods on the target side breaks the overwrite loop → rebase, naming Light
 *    as the one-pass alternative.
 * 8. Two or more high-tier target mods and the target side is not full → continue.
 * Budget never changes the verdict.
 */
export function decideCraft(input: DecideCraftInput): CraftDecision {
  const targetSide = resolveTargetSide(input);
  const sideCount = clampSide(targetSide === "prefix" ? input.prefixCount : input.suffixCount);
  const otherCount = clampSide(targetSide === "prefix" ? input.suffixCount : input.prefixCount);
  const includes = input.includes;
  const desecration = resolveDesecration(input, includes);
  const owned = [...(input.owned ?? [])];
  if (
    desecration.lockedTargetId &&
    !owned.some((row) => row.id === desecration.lockedTargetId)
  ) {
    const locked = includes.find((row) => row.id === desecration.lockedTargetId);
    if (locked) {
      owned.push({ id: locked.id, generation: locked.generation, highTier: true });
    }
  }
  const targetIds = new Set(includes.map((row) => row.id));
  const ownedTargets = owned.filter((row) => targetIds.has(row.id));
  const highTargets = ownedTargets.filter((row) => row.highTier);
  const highOnSide = highTargets.filter((row) => row.generation === targetSide).length;
  const missingIncludes = includes.filter((row) => !ownedTargets.some((ownedRow) => ownedRow.id === row.id));

  const garbageFracture = input.garbageFracture === true;
  const hasGoodFracture = input.hasGoodFractureOnTargetSide === true && !garbageFracture;
  const hasDesecrated = desecration.hasDesecrated;
  const badDesecration = hasDesecrated && !desecration.desecratedOnRoute;
  const keeper = input.craftedSlotLockedToKeeper === true;
  const loopShape = sideCount === 2 && hasGoodFracture;

  const warnings: CraftWarningId[] = ["single-crafted-slot", "single-desecrated", "budget-soft"];
  const tierChecks = includes.filter((row) => row.tierLevel != null);
  if (input.itemLevel == null && tierChecks.length > 0) warnings.push("ilvl-unknown");

  if (
    input.itemLevel != null &&
    tierChecks.some((row) => input.itemLevel! < (row.tierLevel as number))
  ) {
    return pack("rebase", ["base-cannot-roll-t1"], "none", warnings, targetSide);
  }

  if (garbageFracture) {
    return pack("rebase", ["fracture-on-garbage"], "none", warnings, targetSide);
  }

  if (badDesecration && loopShape && !keeper) {
    return pack("continue", ["desecration-overwrite-loop"], "essence-alloy-overwrite", warnings, targetSide);
  }

  if (keeper && loopShape) {
    if (badDesecration && missingIncludes.length === 0) {
      return pack("continue", ["omen-of-light-cleanup"], "omen-of-light", warnings, targetSide);
    }
    if (badDesecration && highTargets.length >= 2) {
      return pack(
        "downgrade",
        ["crafted-keeper-breaks-loop", "omen-of-light-cleanup"],
        "omen-of-light",
        warnings,
        targetSide,
      );
    }
    if (badDesecration || missingIncludes.length > 0) {
      return pack(
        "rebase",
        ["crafted-keeper-breaks-loop"],
        badDesecration ? "omen-of-light" : "none",
        warnings,
        targetSide,
      );
    }
    return pack("continue", ["good-progress-cleanable"], "none", warnings, targetSide);
  }

  if (loopShape && !keeper) {
    if (hasDesecrated && desecration.desecratedOnRoute) {
      return pack("continue", ["good-progress-cleanable"], "none", warnings, targetSide);
    }
    return pack("continue", ["desecration-overwrite-loop"], "essence-alloy-overwrite", warnings, targetSide);
  }

  if (sideCount >= SIDE_CAP) {
    if (!hasGoodFracture) {
      if (highOnSide >= 2 && otherCount < SIDE_CAP) {
        return pack("continue", ["good-progress-cleanable"], "none", warnings, targetSide);
      }
      return pack(
        "rebase",
        ["target-side-full-no-fracture"],
        badDesecration ? "omen-of-light" : "none",
        warnings,
        targetSide,
      );
    }
    if (keeper) {
      return pack(
        "rebase",
        ["loop-structure-broken", "crafted-keeper-breaks-loop"],
        "omen-of-light",
        warnings,
        targetSide,
      );
    }
    if (highOnSide >= 2 && otherCount < SIDE_CAP) {
      return pack("continue", ["good-progress-cleanable"], "none", warnings, targetSide);
    }
    return pack("rebase", ["loop-structure-broken"], "omen-of-light", warnings, targetSide);
  }

  if (badDesecration) {
    if (highTargets.length >= 2 && otherCount < SIDE_CAP) {
      return pack("downgrade", ["exclusive-slot-wrong"], "omen-of-light", warnings, targetSide);
    }
    if (highTargets.length === 0) {
      return pack("rebase", ["exclusive-slot-wrong"], "omen-of-light", warnings, targetSide);
    }
    return pack("downgrade", ["exclusive-slot-wrong"], "omen-of-light", warnings, targetSide);
  }

  if (keeper) {
    if (highTargets.length >= 1 && sideCount < SIDE_CAP) {
      return pack("downgrade", ["exclusive-slot-wrong"], "none", warnings, targetSide);
    }
    return pack("rebase", ["exclusive-slot-wrong"], "none", warnings, targetSide);
  }

  if (highTargets.length >= 2) {
    return pack("continue", ["good-progress-cleanable"], "none", warnings, targetSide);
  }

  if (ownedTargets.length === 0) {
    return pack("continue", ["fresh-base"], "none", warnings, targetSide);
  }

  return pack("continue", ["early-progress"], "none", warnings, targetSide);
}

export function suggestedCraftNode(decision: CraftDecision): CraftTreeNodeId {
  if (decision.reasons.includes("base-cannot-roll-t1")) return "base";
  if (
    decision.reasons.includes("fracture-on-garbage") ||
    decision.reasons.includes("loop-structure-broken") ||
    decision.reasons.includes("target-side-full-no-fracture")
  ) {
    return "fracture-cleanup";
  }
  if (
    decision.reasons.includes("desecration-overwrite-loop") ||
    decision.reasons.includes("crafted-keeper-breaks-loop") ||
    decision.reasons.includes("omen-of-light-cleanup") ||
    decision.reasons.includes("exclusive-slot-wrong")
  ) {
    return "desecrate";
  }
  if (decision.reasons.includes("fresh-base")) return "base";
  if (decision.reasons.includes("early-progress")) return "rare";
  return "finish";
}

export function craftVerdictHeadline(decision: CraftDecision, locale: UiLocale): string {
  const light = decision.cleanup === "omen-of-light";
  const overwrite = decision.cleanup === "essence-alloy-overwrite";
  if (locale === "en") {
    if (decision.verdict === "continue" && overwrite) {
      return "Continue (overwrite with Essence/Alloy, then desecrate again)";
    }
    if (decision.verdict === "continue" && light) return "Continue (one Omen of Light cleanup)";
    if (decision.verdict === "rebase" && light) return "New base (or one Omen of Light cleanup)";
    if (decision.verdict === "downgrade" && light) return "Lower the goal (one Omen of Light cleanup)";
    if (decision.verdict === "continue") return "Continue";
    if (decision.verdict === "rebase") return "New base";
    return "Lower the goal";
  }
  if (decision.verdict === "continue" && overwrite) return "繼續（精髓／合金頂掉後重褻瀆）";
  if (decision.verdict === "continue" && light) return "繼續（改用光明之兆一輪清理）";
  if (decision.verdict === "rebase" && light) return "換底（或改用光明之兆一輪清理）";
  if (decision.verdict === "downgrade" && light) return "降目標（改用光明之兆一輪清理）";
  if (decision.verdict === "continue") return "繼續";
  if (decision.verdict === "rebase") return "換底";
  return "降目標";
}

export const CRAFT_REASON_TEXT: Record<CraftReasonId, Localized> = {
  "base-cannot-roll-t1": {
    zhHant: "有目標的所選階級高過這件的物品等級，基底骰不到。換底。",
    en: "A chosen target tier is above this item level, so the base cannot roll it. Switch bases.",
  },
  "target-side-full-no-fracture": {
    zhHant: "目標側已經 3 條，而且沒有要留下的破裂。傾向換底。",
    en: "The target side is already 3 mods and has no fracture worth keeping. Lean toward a new base.",
  },
  "exclusive-slot-wrong": {
    zhHant: "褻瀆或工藝槽花在計畫外的詞綴上。要嘛換底，要嘛降目標，接受這格不能重做。",
    en: "The desecrated or crafted slot was spent off the plan. Switch bases, or lower the goal and accept that slot cannot be redone.",
  },
  "fracture-on-garbage": {
    zhHant: "破裂鎖在垃圾詞綴上，無效石清不掉。換底。",
    en: "A fracture is locked onto a garbage mod. An Annul cannot remove it. Switch bases.",
  },
  "desecration-overwrite-loop": {
    zhHant:
      "目標側恰好 2 條，其中 1 條是要留的破裂，工藝槽還沒鎖成永久保留。褻瀆若是壞的，用打得到該側的精髓或合金頂掉非破裂那格，再重新褻瀆。這比先花光明之兆省。",
    en: "The target side is exactly 2 mods, one of them a keeper fracture, and the crafted slot is not locked. If the desecration misses, overwrite the open mod with an Essence or Runic Alloy that hits that side, then desecrate again. Do this before spending Omen of Light.",
  },
  "omen-of-light-cleanup": {
    zhHant: "不能再用精髓或合金去頂。若要留這件，啟動光明之兆，讓下一次無效石只移除褻瀆詞綴。",
    en: "Essence or Alloy can no longer overwrite that slot. To keep the item, activate Omen of Light so the next Annul removes only the desecrated modifier.",
  },
  "crafted-keeper-breaks-loop": {
    zhHant:
      "工藝槽已是要永久留下的精髓、合金或符鍛，不能再拿來頂掉褻瀆。換底，或改用光明之兆清一輪並接受少一條工藝目標。",
    en: "The crafted slot is already a keeper Essence, Alloy, or runeforge mod, so it cannot overwrite the desecration. Switch bases, or clean once with Omen of Light and drop a crafted-slot target.",
  },
  "loop-structure-broken": {
    zhHant:
      "目標側不是恰好 2 條，精髓／合金頂掉再褻瀆的迴圈不成立。傾向換底；要留這件就先用光明之兆把褻瀆清一輪，再重評。",
    en: "The target side is not exactly 2 mods, so the Essence/Alloy overwrite loop does not apply. Lean toward a new base; to keep it, clear the desecration once with Omen of Light and judge again.",
  },
  "good-progress-cleanable": {
    zhHant: "已經有足夠的目標高階，另一側還清得掉，或褻瀆已經是要留的那條。繼續。",
    en: "You already have enough high-tier target mods and the other side is still cleanable, or the desecration is the one you wanted. Continue.",
  },
  "fresh-base": {
    zhHant: "這件還沒有目標詞綴，目標側也還沒滿，沒有鎖死的破裂或花錯的槽。從選底接著做。",
    en: "No target mods yet, the target side is not full, and nothing is fracture-locked or spent on the wrong slot. Start from the base.",
  },
  "early-progress": {
    zhHant: "已有一條目標，目標側還沒滿，也沒有鎖死的問題。繼續。",
    en: "One target is on the item, the target side is not full, and nothing is locked. Continue.",
  },
  "insufficient-progress": {
    zhHant: "進度不夠，又還沒形成可繼續的結構。降目標，或換一條比較好做的底。",
    en: "There is not enough progress and the item is not in a shape worth continuing. Lower the goal, or switch to an easier base.",
  },
};

export const CRAFT_WARNING_TEXT: Record<CraftWarningId, Localized> = {
  "single-crafted-slot": {
    zhHant: "每件只能有 1 條工藝詞綴。精髓與合金（含符文之父的合金）搶同一格，部分符鍛也算這格。",
    en: "One crafted modifier per item. Essences and Runic Alloys (including Runic Alloy of the Runefather) share that slot, and some runeforge crafts use it too.",
  },
  "single-desecrated": {
    zhHant: "每件只能有 1 條褻瀆詞綴。褻瀆不算工藝，但不能疊第二條。",
    en: "One desecrated modifier per item. It does not count as the crafted mod, and a second desecration does not fit.",
  },
  "budget-soft": {
    zhHant: "預算只作提醒。這裡不估算通貨價格。",
    en: "Budget is only a reminder. This page does not estimate currency prices.",
  },
  "ilvl-unknown": {
    zhHant: "還沒填物品等級，無法判斷所選階級能不能骰出。",
    en: "Item level is empty, so the chosen tier cannot be checked.",
  },
};

export const CRAFT_CLEANUP_TEXT: Record<Exclude<CraftCleanup, "none">, Localized> = {
  "essence-alloy-overwrite": {
    zhHant: "做法：用打得到該側的精髓或合金頂掉非破裂那格，再上骨重褻瀆。先不要花光明之兆。",
    en: "Method: overwrite the non-fractured slot with an Essence or Runic Alloy that hits that side, then bone and desecrate again. Do not spend Omen of Light first.",
  },
  "omen-of-light": {
    zhHant: "做法：光明之兆加無效石，只拿掉褻瀆詞綴。不要再對一個已鎖住的工藝槽使用精髓。",
    en: "Method: Omen of Light plus an Annul, removing only the desecrated modifier. Do not Essence a crafted slot you already decided to keep.",
  },
};

export const CRAFTING_CONSTRAINTS: Localized[] = [
  CRAFT_WARNING_TEXT["single-crafted-slot"],
  CRAFT_WARNING_TEXT["single-desecrated"],
  {
    zhHant: "重組器不在這條主路線。它只屬於標準聯盟，不要把它當成現在的下一步。",
    en: "Recombinator is off this primary path. It belongs to Standard only — do not treat it as the next step here.",
  },
];

export const CRAFTING_TREE: CraftTreeNode[] = [
  {
    id: "base",
    title: { zhHant: "選底", en: "Base" },
    summary: {
      zhHant: "先確認基底與物品等級骰得到所選階級。",
      en: "Confirm the base and item level can roll each chosen tier.",
    },
    action: {
      zhHant: "選定部位後，勾出這個詞綴池真的會出的目標。有指定階級時，拿物品等級去對那一階；低於門檻就骰不到。",
      en: "After you pick a slot, check the mods this pool can actually roll. When a tier is set, compare item level with that tier; below it, the tier cannot roll.",
    },
    skip: {
      zhHant: "沒有指定階級時，不要只因物品等級就換底。",
      en: "When no tier is set, do not switch bases on item level alone.",
    },
    irreversible: {
      zhHant: "基底與物品等級事後改不了。骰不到所選階級就是換底，不是後面用通貨補。",
      en: "Base and item level cannot be fixed later. If the chosen tier cannot roll, switch bases — currency will not add it.",
    },
    warning: {
      zhHant: "工藝詞綴與褻瀆詞綴各限 1 條，選底時就要決定這兩格留給誰。重組器不在主路線（僅標準聯盟）。",
      en: "You get one crafted mod and one desecrated mod. Decide who owns those slots before you start. Recombinator is not on this path (Standard only).",
    },
  },
  {
    id: "rare",
    title: { zhHant: "升稀有", en: "Make rare" },
    summary: {
      zhHant: "升上稀有時，決定工藝槽要不要現在花掉。",
      en: "When you make it rare, decide whether to spend the crafted slot now.",
    },
    action: {
      zhHant: "魔法物品可用煉金做成稀有。若這一手就要用精髓或合金（例如符文之父的合金）釘一條必留詞綴，會佔掉唯一的工藝槽。",
      en: "Alchemy a magic item into a rare. Using an Essence or Runic Alloy now (for example the Runefather alloy) to lock a keeper mod spends the only crafted slot.",
    },
    skip: {
      zhHant: "已經是稀有，或你要把工藝槽留到後面拿來頂掉失敗的褻瀆，就先不要做永久保留的精髓或合金。",
      en: "Skip a keeper Essence or Alloy if it is already rare, or if you still want that slot free to overwrite a failed desecration.",
    },
    irreversible: {
      zhHant: "要永久留下的工藝詞綴，後面不能再當成第二條工藝疊上去。再使用精髓或合金會改寫這一格。",
      en: "A keeper craft cannot sit beside a second craft. Another Essence or Alloy overwrites that same slot.",
    },
    warning: {
      zhHant: "精髓、完美精髓、合金與部分符鍛互相排斥。每件只能留 1 條工藝詞綴。",
      en: "Essences, Perfect Essences, Alloys, and some runeforge crafts exclude each other. One crafted modifier per item.",
    },
  },
  {
    id: "fill",
    title: { zhHant: "填邊", en: "Fill the sides" },
    summary: {
      zhHant: "用預兆把非目標側補上，目標側停在恰好 2 條。",
      en: "Fill the other side with omens and leave the target side at exactly 2 mods.",
    },
    action: {
      zhHant: "用崇高石配左旋或右旋提升之兆，補不打算反覆重骰的那一側。目標側維持恰好 2 條：1 條準備破裂留下，另 1 條當滾動格。",
      en: "Use an Exalted Orb with a Sinistral or Dextral Exaltation omen on the side you will not reroll. Keep the target side at exactly 2: one mod to fracture and keep, one rolling slot.",
    },
    skip: {
      zhHant: "目標側已經是 2 條，且其中一條就是要破裂的詞綴時，不要再往這一側加。",
      en: "If the target side is already 2 and one of them is the mod you will fracture, do not add another there.",
    },
    irreversible: {
      zhHant: "目標側被補到 3 條以後，精髓或合金頂掉再褻瀆的迴圈就不成立。",
      en: "Once the target side has 3 mods, the Essence/Alloy overwrite-and-desecrate loop no longer works.",
    },
    warning: {
      zhHant: "不要把目標側填滿。另一側日後還能用無效石或混沌石清理；破裂鎖住的垃圾詞綴清不掉。",
      en: "Do not fill the target side. The other side can still be annulled or chaos-spammed; a fracture on garbage cannot.",
    },
  },
  {
    id: "desecrate",
    title: { zhHant: "褻瀆分支", en: "Desecration" },
    summary: {
      zhHant: "失敗的褻瀆優先用打得到該側的精髓或合金頂掉，再重褻瀆，少花光明之兆。",
      en: "On a bad desecration, overwrite with an Essence or Alloy that hits that side, then desecrate again, and save Omen of Light.",
    },
    action: {
      zhHant:
        "上骨後配左旋或右旋死靈術之兆，讓褻瀆落在目標側。維持該側恰好 2 條，而且 1 條已經破裂（要留的）。揭示若是壞詞綴：不要先走光明之兆加無效石。改用打得到該側的精髓（完美或腐化精髓可配左旋／右旋結晶之兆，只移除該側）或合金，把非破裂那格頂掉，再重新上骨並褻瀆。常見拿來做這個迴圈的是 Absent、Portent 項鍊與 Dusk 戒指；其他基底的精髓或合金不一定同樣打得到該側，先確認再花。",
      en: "Apply a bone with Sinistral or Dextral Necromancy so the desecration lands on the target side. Keep that side at exactly 2 mods, with 1 already fractured (the keep). If the reveal is bad, do not start with Omen of Light plus an Annul. Overwrite the non-fractured slot with an Essence or Runic Alloy that hits that side — Perfect or Corrupted Essences can use Sinistral/Dextral Crystallisation so they only remove that side — then bone and desecrate again. Absent and Portent amulets and Dusk rings are the bases this loop is usually cited for; other bases do not behave the same, so check before you spend.",
    },
    skip: {
      zhHant: "這件不需要褻瀆詞綴就不要上骨。目標側不是恰好 2 條，或沒有那條要留的破裂時，不要硬跑這個迴圈。",
      en: "Skip the bone if you do not need a desecrated mod. Do not force the loop unless the target side is exactly 2 and one of them is the fracture you are keeping.",
    },
    irreversible: {
      zhHant: "每件只能有 1 條褻瀆。壞的那條還在時不能再褻瀆第二條。工藝槽若已是永久保留，就沒有第二格可以拿來頂掉。",
      en: "One desecrated mod per item. A bad one blocks another desecration until it is gone. If the crafted slot is already a keeper, there is no second slot to overwrite with.",
    },
    warning: {
      zhHant:
        "目標側 3 條，或工藝槽已鎖成永久保留，迴圈中斷。這種結構傾向換底；若要留這件，改用光明之兆讓下一次無效石只移除褻瀆詞綴，清一輪再重評。精髓與合金搶的是同一個工藝槽。",
      en: "Three mods on the target side, or a crafted slot already locked to a keeper, breaks the loop. Lean toward a new base; to keep the item, use Omen of Light so the next Annul removes only the desecrated mod, then judge again. Essence and Alloy share the one crafted slot.",
    },
  },
  {
    id: "fracture-cleanup",
    title: { zhHant: "破裂／清理", en: "Fracture / cleanup" },
    summary: {
      zhHant: "只破裂要留下的那條；垃圾破裂或側邊結構錯了就停手。",
      en: "Fracture only the mod you are keeping. Stop if the fracture is garbage or the side is the wrong shape.",
    },
    action: {
      zhHant:
        "高階才用破裂石，鎖目標側那條要留的詞綴，並讓該側維持 2 條裡只破這 1 條。另一側若沒有破裂，可用無效石或混沌石清理。若目標側已是 3 條，或工藝槽已是永久保留，不要再把迴圈當成主做法：換底，或改用光明之兆一輪把褻瀆清掉。",
      en: "Use a Fracturing Orb only at the high end, on the target-side mod you will keep, and leave the side at 2 with that one fracture. Annul or chaos the other side if it is not fractured. If the target side is already 3, or the crafted slot is a keeper, stop treating the loop as the plan: switch bases, or spend one Omen of Light to clear the desecration.",
    },
    skip: {
      zhHant: "不走高階破裂、兩側已經夠用時，直接收尾。",
      en: "Skip the fracture when you are not crafting at that tier and both sides are already good enough. Finish the item.",
    },
    irreversible: {
      zhHant: "破裂石會鎖詞綴。鎖到垃圾詞綴就是換底，後面的無效石打不掉它。",
      en: "A fracture locks the mod. Locked garbage means a new base — a later Annul will not remove it.",
    },
    warning: {
      zhHant: "重組器不是這裡的退路，不在主路線（僅標準聯盟）。破裂前先確認要鎖的是目標家族的高階。",
      en: "Recombinator is not the recovery tool here and is not on the primary path (Standard only). Fracture a high tier of a target family only.",
    },
  },
  {
    id: "finish",
    title: { zhHant: "收尾", en: "Finish" },
    summary: {
      zhHant: "品質、催化劑、插槽都做完，瓦爾放最後。",
      en: "Quality, catalysts, then sockets. Vaal last.",
    },
    action: {
      zhHant: "剩下的空位補到你指定的階級，再上品質與催化劑，然後處理插槽。確認工藝槽與褻瀆槽都是你要的之後，才用瓦爾。",
      en: "Fill any open slots to the tier you chose, then quality and catalysts, then sockets. Vaal only after the crafted slot and the desecrated slot are the mods you want.",
    },
    skip: {
      zhHant: "現有詞綴已經達到目標就可以停，不必為了填滿而把目標側補成 3 條。",
      en: "Stop when the mods already meet the goal. Do not fill the target side to 3 just to cap the item.",
    },
    irreversible: {
      zhHant: "瓦爾可能毀掉這件。插槽裡的東西被覆蓋時，舊的那顆不會還你。",
      en: "A Vaal can brick the item. Overwriting a socket destroys the previous socketable.",
    },
    warning: {
      zhHant: "還是每件 1 條工藝、1 條褻瀆。預算只當提醒，畫面不估通貨價格。",
      en: "Still one crafted mod and one desecrated mod. Budget stays a reminder — there are no currency prices here.",
    },
  },
];
