import {
  recommendRemoval,
  type RemovalAssessment,
  type RemovalMod,
} from "./omens.ts";
import { poolAugmentById, socketSideCaps } from "./socketPools.ts";
import { augmentById, effectForSlot, inferExceptionalBase } from "./sockets.ts";
import type { CraftSlotId, UiLocale } from "./types.ts";

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
export type CraftCleanup =
  | "essence-alloy-overwrite"
  | "omen-of-light"
  | "whittle"
  | "sinistral-annulment"
  | "dextral-annulment"
  | "none";

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
  | "insufficient-progress"
  | "whittle-safe"
  | "side-removal-safe"
  | "removal-risky"
  | "exceptional-keep"
  | "socket-bound-augment";

export type CraftWarningId =
  | "single-crafted-slot"
  | "single-desecrated"
  | "budget-soft"
  | "ilvl-unknown";

export type CraftTreeNodeId =
  | "fracture"
  | "base"
  | "rare"
  | "fill"
  | "desecrate"
  | "fracture-cleanup"
  | "finish";

/** Nodes in the on-page flowchart. Separate from the long-form `CRAFTING_TREE` ids. */
export type CraftDiagramNodeId =
  | "fracture"
  | "base"
  | "stop-base"
  | "fill"
  | "stop-full"
  | "desecrate"
  | "essence"
  | "stop-fracture"
  | "omen"
  | "whittle"
  | "side-annul"
  | "light"
  | "stop-omen"
  | "finish"
  | "sockets"
  | "keep-exceptional";

export type CraftTarget = {
  id: string;
  generation: ModSide;
  /**
   * Item level required to roll the chosen tier.
   * Null means any tier: skip the item-level check for this target.
   * Also the rarity proxy when no spawn weight is available.
   */
  tierLevel: number | null;
  /**
   * Spawn weight of the selected tier (`AffixTier.dropChance`).
   * Lower is rarer. Omit or pass null when that tier's weight is unknown.
   */
  tierWeight?: number | null;
  /**
   * Family spawn weight (`AffixFamily.weight`, the sum of tier drop chances).
   * Lower is rarer. Used only when `tierWeight` is missing.
   */
  weight?: number | null;
};

/** Why this affix is the one to fracture. */
export type FractureFocusReason = "lock" | "tier-weight" | "family-weight" | "item-level";

/** Selected target the opener should fracture. */
export type FractureFocus = {
  id: string;
  generation: ModSide;
  tierLevel: number | null;
  tierWeight: number | null;
  weight: number | null;
  reason: FractureFocusReason;
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

/** A mod on the item that the player did not select as a target. */
export type CraftOtherMod = {
  id: string;
  generation: ModSide;
  /** Required level of the tier actually on the item. Null if the tier is unknown. */
  level: number | null;
  desecrated?: boolean;
  fractured?: boolean;
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
  /**
   * Non-target mods already on the item, with the level of the tier present.
   * Empty or omitted leaves the verdict, reasons, and cleanup unchanged.
   */
  others?: CraftOtherMod[];
  /** Slot the item is in. Needed to read the socket cap and augment lines. */
  slot?: CraftSlotId;
  /**
   * Augment sockets currently on the item.
   * A count above the slot's normal maximum is an extra socket. Omitted counts as 0.
   */
  socketCount?: number;
  /** Augments socketed in those holes. Empty sockets are omitted. */
  augments?: SocketAugmentPick[];
};

export type SocketAugmentPick = {
  id: string;
  /** 1-based hole on the item. */
  socket?: number;
};

export type SocketAugmentView = {
  id: string;
  socket: number;
  nameZh: string;
  nameEn: string;
  effectZh: string;
  effectEn: string;
  socketBound: boolean;
};

type CraftCore = {
  verdict: CraftVerdict;
  reasons: CraftReasonId[];
  cleanup: CraftCleanup;
  warnings: CraftWarningId[];
  targetSide: ModSide;
};

export type CraftDecision = CraftCore & {
  /** Highlighted top-down path for the item as described. Always starts at fracture. */
  path: CraftDiagramNodeId[];
  removal: RemovalAssessment;
  /** Augments the player put in the sockets, with the line for this slot. */
  socketAugments: SocketAugmentView[];
  /** Selected target to fracture. Null when nothing is selected. */
  fractureFocus: FractureFocus | null;
  /**
   * Opener is still "fracture the rarest". No keeper fracture and no 破潰石 lock yet.
   * Does not change continue / rebase / downgrade.
   */
  fracturePending: boolean;
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
  /** Currency and omens to have on hand for this step. */
  materials: Localized;
  skip: Localized;
  irreversible: Localized;
  warning: Localized;
};

export type CraftDiagramNode = {
  id: CraftDiagramNodeId;
  title: Localized;
  /** The choice or outcome shown on the node itself. */
  choice: Localized;
};

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

function clampSide(count: number, cap: number): number {
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.min(cap, Math.floor(count));
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

function positiveWeight(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

/** 破潰石 lock that names a selected target. `"other"` is a missed lock, not the focus. */
function lockedFractureId(input: Pick<DecideCraftInput, "includes" | "desecrationLock">): string | null {
  const lock = input.desecrationLock;
  if (typeof lock !== "string" || lock === "" || lock === "other") return null;
  return input.includes.some((row) => row.id === lock) ? lock : null;
}

function focusFromTarget(target: CraftTarget, reason: FractureFocusReason): FractureFocus {
  return {
    id: target.id,
    generation: target.generation,
    tierLevel: target.tierLevel,
    tierWeight: positiveWeight(target.tierWeight),
    weight: positiveWeight(target.weight),
    reason,
  };
}

/**
 * Opening fracture.
 *
 * Rarity is the poe2db spawn weight already stored on affixes.
 * `tierWeight` is the selected tier's `dropChance` (lower is rarer).
 * `weight` is `AffixFamily.weight` (sum of tier drop chances) and applies
 * only when that target has no positive tier weight.
 * When no selected target has a positive weight, the proxy is the highest
 * required item level of the selected tier. Equal weights break the same way.
 * A 破潰石 lock on a selected target replaces the ranking.
 */
export function fractureFocusOf(
  input: Pick<DecideCraftInput, "includes" | "desecrationLock">,
): FractureFocus | null {
  const includes = input.includes;
  if (includes.length === 0) return null;
  const lockedId = lockedFractureId(input);
  if (lockedId) {
    const locked = includes.find((row) => row.id === lockedId);
    if (locked) return focusFromTarget(locked, "lock");
  }

  const scored = includes.map((target) => ({
    target,
    tierWeight: positiveWeight(target.tierWeight),
    familyWeight: positiveWeight(target.weight),
    level: target.tierLevel == null ? Number.NEGATIVE_INFINITY : target.tierLevel,
  }));
  scored.sort((a, b) => {
    const aw = a.tierWeight ?? a.familyWeight;
    const bw = b.tierWeight ?? b.familyWeight;
    if ((aw == null) !== (bw == null)) return aw == null ? 1 : -1;
    if (aw != null && bw != null && aw !== bw) return aw - bw;
    if (a.level !== b.level) return b.level - a.level;
    if (a.target.id < b.target.id) return -1;
    if (a.target.id > b.target.id) return 1;
    return 0;
  });

  const winner = scored[0];
  if (!winner) return null;
  const runner = scored[1];
  const winnerWeight = winner.tierWeight ?? winner.familyWeight;
  const runnerWeight = runner ? runner.tierWeight ?? runner.familyWeight : null;
  let reason: FractureFocusReason = "item-level";
  if (winnerWeight != null && (runnerWeight == null || winnerWeight < runnerWeight)) {
    reason = winner.tierWeight != null ? "tier-weight" : "family-weight";
  }
  return focusFromTarget(winner.target, reason);
}

function isFracturePending(input: DecideCraftInput, decision: CraftCore): boolean {
  if (input.garbageFracture === true || input.hasGoodFractureOnTargetSide === true) return false;
  if (lockedFractureId(input)) return false;
  if (decision.verdict !== "continue") return false;
  if (decision.reasons.includes("exceptional-keep") || decision.reasons.includes("socket-bound-augment")) {
    return false;
  }
  return decision.reasons.includes("fresh-base") || decision.reasons.includes("early-progress");
}

function pack(
  verdict: CraftVerdict,
  reasons: CraftReasonId[],
  cleanup: CraftCleanup,
  warnings: CraftWarningId[],
  targetSide: ModSide,
): CraftCore {
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
function decideCraftCore(input: DecideCraftInput): CraftCore {
  const targetSide = resolveTargetSide(input);
  const caps = socketSideCaps((input.augments ?? []).map((row) => row.id));
  const sideCap = targetSide === "prefix" ? caps.prefix : caps.suffix;
  const otherCap = targetSide === "prefix" ? caps.suffix : caps.prefix;
  const sideCount = clampSide(targetSide === "prefix" ? input.prefixCount : input.suffixCount, sideCap);
  const otherCount = clampSide(targetSide === "prefix" ? input.suffixCount : input.prefixCount, otherCap);
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

  if (sideCount >= sideCap) {
    if (!hasGoodFracture) {
      if (highOnSide >= 2 && otherCount < otherCap) {
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
    if (highOnSide >= 2 && otherCount < otherCap) {
      return pack("continue", ["good-progress-cleanable"], "none", warnings, targetSide);
    }
    return pack("rebase", ["loop-structure-broken"], "omen-of-light", warnings, targetSide);
  }

  if (badDesecration) {
    if (highTargets.length >= 2 && otherCount < otherCap) {
      return pack("downgrade", ["exclusive-slot-wrong"], "omen-of-light", warnings, targetSide);
    }
    if (highTargets.length === 0) {
      return pack("rebase", ["exclusive-slot-wrong"], "omen-of-light", warnings, targetSide);
    }
    return pack("downgrade", ["exclusive-slot-wrong"], "omen-of-light", warnings, targetSide);
  }

  if (keeper) {
    if (highTargets.length >= 1 && sideCount < sideCap) {
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

function targetLevels(input: DecideCraftInput): number[] {
  return input.includes.flatMap((row) => (row.tierLevel == null ? [] : [row.tierLevel]));
}

function modsOnItem(input: DecideCraftInput): RemovalMod[] {
  const includes = input.includes;
  const owned = [...(input.owned ?? [])];
  const lock = input.desecrationLock;
  if (typeof lock === "string" && lock !== "" && lock !== "other" && !owned.some((row) => row.id === lock)) {
    const locked = includes.find((row) => row.id === lock);
    if (locked) owned.push({ id: locked.id, generation: locked.generation, highTier: true });
  }
  const targetSide = resolveTargetSide(input);
  const mods: RemovalMod[] = [];
  let fracturedAssigned = false;
  for (const row of owned) {
    const target = includes.find((candidate) => candidate.id === row.id);
    if (!target) continue;
    const fractured =
      !fracturedAssigned &&
      input.hasGoodFractureOnTargetSide === true &&
      row.generation === targetSide &&
      row.highTier !== false;
    if (fractured) fracturedAssigned = true;
    mods.push({
      id: row.id,
      generation: row.generation,
      level: row.highTier === false ? null : target.tierLevel,
      target: true,
      fractured,
      desecrated: lock === row.id,
    });
  }
  for (const other of input.others ?? []) {
    if (includes.some((target) => target.id === other.id)) continue;
    mods.push({
      id: other.id,
      generation: other.generation,
      level: other.level,
      target: false,
      fractured: other.fractured === true,
      desecrated: other.desecrated === true,
    });
  }
  return mods;
}

function applyRemoval(core: CraftCore, removal: RemovalAssessment, input: DecideCraftInput): CraftCore {
  if ((input.others ?? []).length === 0) return core;
  if (core.reasons.includes("base-cannot-roll-t1") || core.reasons.includes("fracture-on-garbage")) return core;
  const recommendation = removal.recommendation;
  if (recommendation === "whittle") {
    return pack("continue", ["whittle-safe"], "whittle", core.warnings, core.targetSide);
  }
  if (recommendation === "sinistral-annulment" || recommendation === "dextral-annulment") {
    return pack("continue", ["side-removal-safe"], recommendation, core.warnings, core.targetSide);
  }
  if (recommendation === "light") {
    if (core.cleanup === "essence-alloy-overwrite") return core;
    return pack("continue", ["omen-of-light-cleanup"], "omen-of-light", core.warnings, core.targetSide);
  }
  if (recommendation === "stop" && core.verdict !== "rebase") {
    return pack("rebase", ["removal-risky"], "none", core.warnings, core.targetSide);
  }
  return core;
}

function resolveSocketAugments(input: DecideCraftInput): SocketAugmentView[] {
  const slot = input.slot;
  const views: SocketAugmentView[] = [];
  for (const pick of input.augments ?? []) {
    const pool = poolAugmentById(pick.id);
    const augment = augmentById(pick.id);
    if (pool && slot && !pool.slots.includes(slot)) continue;
    if (!pool && !augment) continue;
    const effect = pool
      ? { zh: pool.effectZh, en: pool.effectEn }
      : slot && augment
        ? effectForSlot(augment, slot)
        : null;
    if (slot && !pool && !effect) continue;
    const nameZh = pool?.nameZh ?? augment?.nameZh ?? pick.id;
    const nameEn = pool?.nameEn ?? augment?.nameEn ?? pick.id;
    views.push({
      id: pick.id,
      socket: pick.socket ?? views.length + 1,
      nameZh,
      nameEn,
      effectZh: effect?.zh ?? "",
      effectEn: effect?.en ?? "",
      socketBound: pool?.socketBound ?? augment?.socketBound ?? false,
    });
  }
  return views;
}

function applySockets(core: CraftCore, input: DecideCraftInput, socketAugments: SocketAugmentView[]): CraftCore {
  if (core.reasons.includes("base-cannot-roll-t1") || core.reasons.includes("fracture-on-garbage")) return core;
  let next = core;
  if (inferExceptionalBase(input.slot, input.socketCount ?? 0)) {
    next = {
      ...next,
      verdict: "continue",
      reasons: ["exceptional-keep", ...next.reasons.filter((reason) => reason !== "exceptional-keep")],
    };
  }
  if (socketAugments.some((row) => row.socketBound)) {
    next = {
      ...next,
      verdict: "continue",
      reasons: [...next.reasons.filter((reason) => reason !== "socket-bound-augment"), "socket-bound-augment"],
    };
  }
  return next;
}

function leadWithFracture(path: CraftDiagramNodeId[]): CraftDiagramNodeId[] {
  return path[0] === "fracture" ? path : ["fracture", ...path];
}

export function craftDiagramPath(decision: Pick<CraftDecision, "reasons" | "cleanup" | "verdict">): CraftDiagramNodeId[] {
  let path: CraftDiagramNodeId[];
  if (decision.reasons.includes("base-cannot-roll-t1")) path = ["base", "stop-base"];
  else if (decision.reasons.includes("fracture-on-garbage")) path = ["base", "fill", "desecrate", "stop-fracture"];
  else if (decision.reasons.includes("target-side-full-no-fracture")) path = ["base", "fill", "stop-full"];
  else if (decision.reasons.includes("removal-risky")) path = ["base", "fill", "desecrate", "omen", "stop-omen"];
  else if (decision.cleanup === "whittle") path = ["base", "fill", "desecrate", "omen", "whittle"];
  else if (decision.cleanup === "sinistral-annulment" || decision.cleanup === "dextral-annulment") {
    path = ["base", "fill", "desecrate", "omen", "side-annul"];
  } else if (decision.cleanup === "essence-alloy-overwrite" || decision.reasons.includes("desecration-overwrite-loop")) {
    path = ["base", "fill", "desecrate", "essence"];
  } else if (decision.cleanup === "omen-of-light" || decision.reasons.includes("omen-of-light-cleanup")) {
    path = ["base", "fill", "desecrate", "omen", "light"];
  } else if (decision.reasons.includes("fresh-base") || decision.reasons.includes("early-progress")) path = ["base", "fill"];
  else if (decision.verdict === "rebase") path = ["base", "fill", "stop-full"];
  else path = ["base", "fill", "desecrate", "finish"];
  if (decision.reasons.includes("exceptional-keep") || decision.reasons.includes("socket-bound-augment")) {
    path = [...path.filter((id) => id !== "stop-full" && id !== "stop-omen"), "sockets", "keep-exceptional"];
  }
  return leadWithFracture(path);
}

/**
 * Continue / new base / downgrade, plus the removal branch when non-target mods are recorded.
 * With no `others`, verdict, reasons, and cleanup match the craft-structure rules alone.
 */
export function decideCraft(input: DecideCraftInput): CraftDecision {
  const core = decideCraftCore(input);
  const removal = recommendRemoval(modsOnItem(input), targetLevels(input));
  const removed = applyRemoval(core, removal, input);
  const socketAugments = resolveSocketAugments(input);
  const decision = applySockets(removed, input, socketAugments);
  const fracturePending = isFracturePending(input, decision);
  return {
    ...decision,
    removal,
    socketAugments,
    fractureFocus: fractureFocusOf(input),
    fracturePending,
    path: craftDiagramPath(decision),
  };
}

export type FractureOddsInput = {
  /** All explicit mods on the item, an unrevealed desecration included. */
  modCount: number;
  /** Selected targets already on the item. */
  targetsOnItem: number;
  unrevealedDesecration: boolean;
};

export type FractureOdds =
  | { status: "ready"; hits: number; pool: number }
  | { status: "too-few-mods"; modCount: number }
  | { status: "no-target" };

/**
 * Chance a Fracturing Orb lands on a target. The orb needs at least 4 mods and
 * cannot pick an unrevealed desecrated modifier, so that mod leaves the pool.
 */
export function fractureOdds(input: FractureOddsInput): FractureOdds {
  const modCount = Math.max(0, Math.floor(input.modCount));
  if (modCount < 4) return { status: "too-few-mods", modCount };
  const pool = modCount - (input.unrevealedDesecration ? 1 : 0);
  const hits = Math.min(Math.max(0, Math.floor(input.targetsOnItem)), pool);
  if (hits === 0) return { status: "no-target" };
  return { status: "ready", hits, pool };
}

export function craftFractureOddsText(odds: FractureOdds, locale: UiLocale): string {
  if (locale === "en") {
    if (odds.status === "too-few-mods") {
      return `Fracture odds: not yet. ${odds.modCount} mods on the item; a Fracturing Orb needs at least 4.`;
    }
    if (odds.status === "no-target") {
      return "Fracture odds: 0. No selected target is on the item yet. Get the rarest target on first.";
    }
    const tail = odds.pool === 3 && odds.hits === 1 ? "" : " Aim for the target, 2 revealed mods, and 1 unrevealed desecration (1 in 3).";
    return `Fracture odds: ${odds.hits} in ${odds.pool} (an unrevealed desecration is not counted).${tail}`;
  }
  if (odds.status === "too-few-mods") {
    return `破潰命中率：還不能破。這件目前 ${odds.modCount} 條詞綴，破潰石至少要 4 條。`;
  }
  if (odds.status === "no-target") {
    return "破潰命中率：0。身上還沒有所選目標，先把最稀有的目標弄上去。";
  }
  const tail = odds.pool === 3 && odds.hits === 1 ? "" : "建議湊成目標＋2 條已揭露詞綴＋1 條未揭露褻瀆（1/3）。";
  return `破潰命中率：${odds.hits}/${odds.pool}（未揭露的褻瀆不算）。${tail}`;
}

/** Where a selected target is most reliably obtained. */
export type CraftTargetSource = "fracture-base" | "desecrate" | "no-tag" | "homogenise";

export function craftTargetSource(target: {
  isFractureFocus: boolean;
  isDesecrated: boolean;
  tags: string[];
}): CraftTargetSource {
  if (target.isDesecrated) return "desecrate";
  if (target.isFractureFocus) return "fracture-base";
  if (target.tags.length === 0) return "no-tag";
  return "homogenise";
}

export const CRAFT_TARGET_SOURCE_TEXT: Record<CraftTargetSource, Localized> = {
  "fracture-base": {
    zhHant: "最稀有：買底時就帶著，或用精髓釘上，再破潰鎖住。",
    en: "Rarest: buy a base that already has it, or Essence it on, then fracture it.",
  },
  desecrate: {
    zhHant: "褻瀆詞綴：上骨配左旋／右旋死靈術之兆，揭露時用深淵回響之兆多抽一次。",
    en: "Desecrated mod: bone with Sinistral/Dextral Necromancy, and reveal with Omen of Abyssal Echoes for a second set.",
  },
  "no-tag": {
    zhHant: "沒有標籤，均勻喜悅之兆帶不出來。優先買底自帶，或用精髓、合金給這一條。",
    en: "No tags, so Homogenising Exaltation cannot pull it. Prefer a base that has it, or give it the Essence/Alloy slot.",
  },
  homogenise: {
    zhHant: "有標籤：崇高石配左旋／右旋提升之兆；身上已有同標籤詞綴時，加均勻喜悅之兆。",
    en: "Tagged: Exalted Orb with Sinistral/Dextral Exaltation; add Homogenising Exaltation once a same-tag mod is on the item.",
  },
};

export function craftFractureAdvice(focus: FractureFocus, name: string, locale: UiLocale): string {
  const label = name.trim() || focus.id;
  if (locale === "en") {
    const odds = ` Fracture with "${label}", 2 revealed mods, and 1 unrevealed desecration: the unrevealed one cannot be locked, so the odds are 1 in 3.`;
    if (focus.reason === "lock") {
      return `The fracture lock is on "${label}". Fracture that affix.${odds}`;
    }
    if (focus.reason === "item-level") {
      if (focus.tierWeight == null && focus.weight == null) {
        return `Fracture "${label}" first. No spawn weight is available, so this is the selected tier with the highest required item level.${odds}`;
      }
      return `Fracture "${label}" first. The spawn weights do not separate the targets, so this is the selected tier with the higher required item level.${odds}`;
    }
    return `Fracture "${label}" first. Among the selected targets, its spawn weight is the lowest.${odds}`;
  }
  const odds = `破潰時湊成「${label}」加 2 條已揭露詞綴、1 條未揭露褻瀆；未揭露的褻瀆不會被鎖，命中率 1/3。`;
  if (focus.reason === "lock") {
    return `破潰石鎖在「${label}」。破潰就以這條為準。${odds}`;
  }
  if (focus.reason === "item-level") {
    if (focus.tierWeight == null && focus.weight == null) {
      return `先破潰「${label}」。所選目標沒有可用的出現權重，改以所選階級需求等級最高的一條為準。${odds}`;
    }
    return `先破潰「${label}」。出現權重分不出高下，改以所選階級需求等級較高的一條為準。${odds}`;
  }
  return `先破潰「${label}」。在所選目標裡，這條的出現權重最低。${odds}`;
}

export function suggestedCraftNode(decision: CraftDecision): CraftTreeNodeId {
  const keepSockets =
    decision.reasons.includes("exceptional-keep") || decision.reasons.includes("socket-bound-augment");
  if (decision.reasons.includes("base-cannot-roll-t1")) return "base";
  if (decision.reasons.includes("fracture-on-garbage")) return "fracture-cleanup";
  if (
    !keepSockets &&
    (decision.reasons.includes("loop-structure-broken") ||
      decision.reasons.includes("target-side-full-no-fracture"))
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
  if (
    decision.reasons.includes("whittle-safe") ||
    decision.reasons.includes("side-removal-safe") ||
    decision.reasons.includes("removal-risky")
  ) {
    return "desecrate";
  }
  if (decision.reasons.includes("exceptional-keep") || decision.reasons.includes("socket-bound-augment")) {
    return "finish";
  }
  if (decision.fracturePending) return "fracture";
  if (decision.reasons.includes("fresh-base") || decision.reasons.includes("early-progress")) return "fill";
  return "finish";
}

/** Long-form reminder that belongs with a diagram node. */
export function craftTreeNodeForDiagram(id: CraftDiagramNodeId): CraftTreeNodeId {
  switch (id) {
    case "fracture":
      return "fracture";
    case "base":
    case "stop-base":
      return "base";
    case "fill":
      return "fill";
    case "desecrate":
    case "essence":
    case "omen":
    case "whittle":
    case "side-annul":
    case "light":
      return "desecrate";
    case "stop-fracture":
    case "stop-full":
    case "stop-omen":
      return "fracture-cleanup";
    default:
      return "finish";
  }
}

export function craftVerdictHeadline(decision: CraftDecision, locale: UiLocale): string {
  const light = decision.cleanup === "omen-of-light";
  const overwrite = decision.cleanup === "essence-alloy-overwrite";
  if (locale === "en") {
    if (decision.verdict === "continue" && overwrite) {
      return "Continue (overwrite with Essence/Alloy, then desecrate again)";
    }
    if (decision.verdict === "continue" && decision.cleanup === "whittle") {
      return "Continue (Omen of Whittling — Chaos Orb removes the lowest-level modifier)";
    }
    if (decision.verdict === "continue" && decision.cleanup === "sinistral-annulment") {
      return "Continue (Omen of Sinistral Annulment — Annul removes only prefixes)";
    }
    if (decision.verdict === "continue" && decision.cleanup === "dextral-annulment") {
      return "Continue (Omen of Dextral Annulment — Annul removes only suffixes)";
    }
    if (decision.verdict === "continue" && light) return "Continue (one Omen of Light cleanup)";
    if (decision.verdict === "continue" && decision.cleanup === "none" && decision.reasons.includes("exceptional-keep")) {
      return "Continue (extra augment socket — keep this base)";
    }
    if (decision.verdict === "continue" && decision.fracturePending) {
      return "Continue (fracture the rarest target first)";
    }
    if (decision.verdict === "rebase" && light) return "New base (or one Omen of Light cleanup)";
    if (decision.verdict === "downgrade" && light) return "Lower the goal (one Omen of Light cleanup)";
    if (decision.verdict === "continue") return "Continue";
    if (decision.verdict === "rebase") return "New base";
    return "Lower the goal";
  }
  if (decision.verdict === "continue" && overwrite) return "繼續（精髓／合金頂掉後重褻瀆）";
  if (decision.verdict === "continue" && decision.cleanup === "whittle") {
    return "繼續（削切之兆，混沌石移除最低等級詞綴）";
  }
  if (decision.verdict === "continue" && decision.cleanup === "sinistral-annulment") {
    return "繼續（左旋廢止之兆，無效石只移除前綴）";
  }
  if (decision.verdict === "continue" && decision.cleanup === "dextral-annulment") {
    return "繼續（右旋廢止之兆，無效石只移除後綴）";
  }
  if (decision.verdict === "continue" && light) return "繼續（改用光明之兆一輪清理）";
  if (decision.verdict === "continue" && decision.cleanup === "none" && decision.reasons.includes("exceptional-keep")) {
    return "繼續（額外增幅槽，留下這件）";
  }
  if (decision.verdict === "continue" && decision.fracturePending) return "繼續（先破潰最稀有的目標）";
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
    zhHant:
      "這件還沒有目標詞綴，目標側也還沒滿，沒有鎖死的破裂或花錯的槽。開手先破潰所選目標裡最稀有的那一條；已經破潰要留的那條，就接著核對物品等級。",
    en: "No target mods yet, the target side is not full, and nothing is fracture-locked or spent on the wrong slot. Open by fracturing the rarest selected target; if that fracture is already the keeper, check item level next.",
  },
  "early-progress": {
    zhHant: "已有一條目標，目標側還沒滿，也沒有鎖死的問題。繼續。",
    en: "One target is on the item, the target side is not full, and nothing is locked. Continue.",
  },
  "insufficient-progress": {
    zhHant: "進度不夠，又還沒形成可繼續的結構。降目標，或換一條比較好做的底。",
    en: "There is not enough progress and the item is not in a shape worth continuing. Lower the goal, or switch to an easier base.",
  },
  "whittle-safe": {
    zhHant: "最低等級的詞綴不是目標，而且低於全部目標。啟動削切之兆，下一個混沌石會移除它。",
    en: "The lowest-level modifier is not a target, and it sits below every target. Activate Omen of Whittling so the next Chaos Orb removes it.",
  },
  "side-removal-safe": {
    zhHant: "有一側只剩非目標，另一側有目標。用左旋或右旋廢止之兆，讓下一個無效石只移除安全的那一側。抺除之兆則改用混沌石，範圍相同。",
    en: "One side has only non-targets and the other still has a target. Use Omen of Sinistral or Dextral Annulment so the next Annul removes only the safe side. Erasure omens do the same with a Chaos Orb.",
  },
  "removal-risky": {
    zhHant: "削切會打到目標，或非目標的等級不低於目標。不要用混沌石或無效石硬清，停手換底。",
    en: "Whittling would hit a target, or a non-target is not below the targets. Do not force a Chaos Orb or Annul. Stop and switch bases.",
  },
  "exceptional-keep": {
    zhHant: "孔數高過這個部位的一般上限，多一顆增幅槽。這顆槽值得留下，不要為了滿邊或清不掉就換底。",
    en: "The socket count is above this slot's normal maximum, so there is an extra augment socket. That socket is worth keeping. Do not switch bases only because a side is full or a mod will not come off.",
  },
  "socket-bound-augment": {
    zhHant: "有一孔是插槽綁定的增幅，放進去就拿不出來。換底會把它一起丟掉。",
    en: "One socket holds a socket-bound augment. It cannot be taken back out. Switching bases throws it away.",
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
  whittle: {
    zhHant: "做法：削切之兆加混沌石，移除最低等級的詞綴。等級取 poe2db 該階的需求等級，不是畫面上的 T 序。",
    en: "Method: Omen of Whittling plus a Chaos Orb, removing the lowest-level modifier. Level is that tier's poe2db requirement, not the displayed T rank.",
  },
  "sinistral-annulment": {
    zhHant: "做法：左旋廢止之兆加無效石，只移除前綴。左旋抺除之兆改為混沌石，同樣只動前綴。",
    en: "Method: Omen of Sinistral Annulment plus an Annul, removing only prefixes. Omen of Sinistral Erasure does the same with a Chaos Orb.",
  },
  "dextral-annulment": {
    zhHant: "做法：右旋廢止之兆加無效石，只移除後綴。右旋抺除之兆改為混沌石，同樣只動後綴。",
    en: "Method: Omen of Dextral Annulment plus an Annul, removing only suffixes. Omen of Dextral Erasure does the same with a Chaos Orb.",
  },
};

export const CRAFTING_CONSTRAINTS: Localized[] = [
  CRAFT_WARNING_TEXT["single-crafted-slot"],
  CRAFT_WARNING_TEXT["single-desecrated"],
  {
    zhHant: "重組器不在這條主路線。它只屬於標準聯盟，不要把它當成現在的下一步。",
    en: "Recombinator is off this primary path. It belongs to Standard only — do not treat it as the next step here.",
  },
  {
    zhHant: "動手前先排好目標優先序與預算上限。沉沒成本不參與決策：補救成本明顯高過重做時，直接換底。",
    en: "Rank the targets and set a budget cap before you start. Sunk cost does not count: when saving the item costs clearly more than starting over, switch bases.",
  },
];

export const CRAFTING_TREE: CraftTreeNode[] = [
  {
    id: "fracture",
    title: { zhHant: "破潰", en: "Fracture" },
    summary: {
      zhHant: "先破潰所選目標裡最稀有的那一條（4 條詞綴、其中 1 條是未揭露褻瀆時，命中率 1/3），再處理物品等級、填邊、褻瀆與收尾。",
      en: "Fracture the rarest selected target first (1 in 3 with 4 mods, one of them an unrevealed desecration), then item level, the sides, desecration, and the finish.",
    },
    action: {
      zhHant:
        "破潰石只對 4 條以上詞綴的稀有裝生效，鎖哪一條是隨機的，但未揭露的褻瀆詞綴不會被鎖。所以先湊成 4 條：目標加 2 條已揭露詞綴，再上骨留 1 條未揭露褻瀆，這時破潰鎖中目標的機率是 1/3，不是 1/4。鎖中後再到靈魂之井揭露。在勾選的目標裡，先破潰出現權重最低的那一條。權重看的是所選階級的 poe2db 出現率，愈低愈稀有；沒選階級時用整條詞綴的出現權重。權重相同，或完全沒有出現權重時，改以所選階級需求等級最高的那一條為準。破潰石若已鎖在某一條，就破那一條，不再另挑。接著才核對基底與物品等級。非目標側補上，目標側維持恰好 2 條，再褻瀆與清理。最後才上品質、催化劑、插槽，瓦爾放最後。",
      en: "A Fracturing Orb needs a rare with at least 4 mods and locks one at random, but an unrevealed desecrated modifier cannot be locked. So build 4 mods first: the target plus 2 revealed mods, then bone the item and leave 1 desecration unrevealed. The fracture now lands on the target 1 time in 3, not 1 in 4. Reveal at the Well of Souls after the lock lands. Among the selected targets, fracture the lowest spawn weight first. That weight is the chosen tier's poe2db drop chance — lower is rarer — or the family's weight when no tier is chosen. When the weights tie, or none is available, use the selected tier with the highest required item level. A fracture lock names the affix instead. Then check the base and item level. Fill the non-target side, hold the target side at exactly 2, then desecrate and clean up. Quality, catalysts, and sockets come last, and Vaal is last of all.",
    },
    materials: {
      zhHant: "破潰石、對應部位的骨（武器顎骨、護甲肋骨、飾品鎖骨），需要指定前後綴時加左旋／右旋死靈術之兆。",
      en: "Fracturing Orb, the bone for the slot (Jawbone for weapons, Rib for armour, Collarbone for jewellery), and Sinistral/Dextral Necromancy when the side matters.",
    },
    skip: {
      zhHant: "目標側已經有要留下的破裂，或破潰石已鎖在目標上，就不必再破第二條。升上稀有時，若工藝槽還要拿來頂掉失敗的褻瀆，先不要做永久保留的精髓或合金。",
      en: "Skip a second fracture when the target side already has the keeper fracture, or the fracture lock is already on a target. When you make the item rare, do not spend a keeper Essence or Alloy if that crafted slot still has to overwrite a failed desecration.",
    },
    irreversible: {
      zhHant: "破潰會鎖住那條詞綴。鎖到垃圾詞綴就換底，無效石清不掉。",
      en: "A fracture locks that mod. Locked garbage means a new base — an Annul will not remove it.",
    },
    warning: {
      zhHant: "只破要留的高階。精髓與合金仍共用 1 格工藝槽，褻瀆仍限 1 條。重組器不在主路線（僅標準聯盟）。",
      en: "Fracture a high tier you mean to keep. Essence and Alloy still share the one crafted slot, and desecration is still limited to one. Recombinator is not on this path (Standard only).",
    },
  },
  {
    id: "base",
    title: { zhHant: "選底", en: "Base" },
    summary: {
      zhHant: "破潰目標定了之後，確認基底與物品等級骰得到所選階級。",
      en: "After the fracture target is chosen, confirm the base and item level can roll each chosen tier.",
    },
    action: {
      zhHant: "選定部位後，勾出這個詞綴池真的會出的目標。有指定階級時，拿物品等級去對那一階；低於門檻就骰不到。",
      en: "After you pick a slot, check the mods this pool can actually roll. When a tier is set, compare item level with that tier; below it, the tier cannot roll.",
    },
    materials: {
      zhHant: "物品等級 81–82 的正確基底。沒有標籤、帶不出來的目標（例如精魂、技能等級）最好買底時就有。",
      en: "A correct base at item level 81–82. Targets with no tag to pull them (for example Spirit or skill levels) are best bought on the base.",
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
      zhHant: "工藝詞綴與褻瀆詞綴各限 1 條，動手前就要決定這兩格留給誰。重組器不在主路線（僅標準聯盟）。",
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
    materials: {
      zhHant: "煉金石，或高階精髓（白裝／藍裝直接升稀有並帶 1 條指定詞綴）。精髓的標籤最好和後面要帶的目標一致。",
      en: "Orb of Alchemy, or a Greater Essence (makes it rare with one set mod). Prefer an Essence whose tag matches the targets you will pull later.",
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
    materials: {
      zhHant: "崇高石（高階便宜、完美保底高階）、左旋／右旋提升之兆；有同標籤可用時加均勻喜悅之兆；一次要 2 條加大幅提升之兆；戒指、項鍊先上催化劑再配催化喜悅之兆。",
      en: "Exalted Orbs (Greater is cheaper, Perfect lifts the tier floor), Sinistral/Dextral Exaltation; Homogenising Exaltation when a same-tag mod is present; Greater Exaltation for 2 mods at once; on rings and amulets, catalysts then Catalysing Exaltation.",
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
        "上骨後配左旋或右旋死靈術之兆，讓褻瀆落在目標側。維持該側恰好 2 條，而且 1 條已經破裂（要留的）。揭示若是壞詞綴：不要先走光明之兆加無效石。改用打得到該側的精髓（完美或腐化精髓可配左旋／右旋結晶之兆，只移除該側）或合金，把非破裂那格頂掉，再重新上骨並褻瀆。常見拿來做這個迴圈的是 Absent、Portent 項鍊與 Dusk 戒指；其他基底的精髓或合金不一定同樣打得到該側，先確認再花。時機：這條路線提早上骨，因為未揭露的褻瀆能把破潰命中率拉到 1/3。晚一點褻瀆可以先看清其他詞綴，但 6 條滿詞綴時褻瀆會隨機蓋掉一條現有詞綴。",
      en: "Apply a bone with Sinistral or Dextral Necromancy so the desecration lands on the target side. Keep that side at exactly 2 mods, with 1 already fractured (the keep). If the reveal is bad, do not start with Omen of Light plus an Annul. Overwrite the non-fractured slot with an Essence or Runic Alloy that hits that side — Perfect or Corrupted Essences can use Sinistral/Dextral Crystallisation so they only remove that side — then bone and desecrate again. Absent and Portent amulets and Dusk rings are the bases this loop is usually cited for; other bases do not behave the same, so check before you spend. Timing: this route bones early because the unrevealed desecration is what lifts the fracture to 1 in 3. Desecrating late shows you the rest of the item first, but on a full 6-mod item it overwrites an existing mod at random.",
    },
    materials: {
      zhHant: "骨（保存完好的骨不限物品等級；遠古骨保底較高詞綴等級）、左旋／右旋死靈術之兆、深淵回響之兆；要定向深淵領主詞綴時用領主、諸侯或黑血者之兆。失敗時：完美精髓配左旋／右旋結晶之兆，或合金；最後手段才是光明之兆加無效石。",
      en: "Bones (Preserved works at any item level; Ancient raises the minimum mod level), Sinistral/Dextral Necromancy, Abyssal Echoes; the Sovereign, Liege, or Blackblooded omen to force an Ulaman, Amanamu, or Kurgal mod. On a miss: a Perfect Essence with Sinistral/Dextral Crystallisation, or an Alloy; Omen of Light plus an Annul only as the last resort.",
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
    title: { zhHant: "清理停手", en: "Stop and clean up" },
    summary: {
      zhHant: "破潰若鎖在垃圾詞綴，或目標側不是恰好 2 條，就停手。",
      en: "Stop if the fracture is locked onto garbage, or the target side is not exactly 2.",
    },
    action: {
      zhHant:
        "開手破潰的是最稀有、或破潰石鎖住的那一條，目標側維持恰好 2 條。另一側若沒有破裂，可用無效石或混沌石清理。若破潰鎖在垃圾上、目標側已是 3 條，或工藝槽已是永久保留，不要再把迴圈當成主做法：換底，或改用光明之兆一輪把褻瀆清掉。孔數高過一般上限時留下這件，不要只為了滿邊就換底。",
      en: "The opening fracture is the rarest target, or the affix named by the fracture lock, with the target side held at exactly 2. Annul or chaos the other side if it is not fractured. If the fracture is on garbage, the target side is already 3, or the crafted slot is a keeper, stop treating the loop as the plan: switch bases, or spend one Omen of Light to clear the desecration. When the socket count is above the normal maximum, keep this base instead of switching only because a side is full.",
    },
    materials: {
      zhHant: "削切之兆加混沌石（移除需求等級最低的詞綴，不是 T 序最低）、左旋／右旋廢止之兆加無效石（只動一側；破裂的那條不會被選，同側只剩 1 條垃圾時就是定向刪除）、光明之兆加無效石（只移除褻瀆）。",
      en: "Omen of Whittling plus Chaos (removes the lowest required level, not the lowest T rank); Sinistral/Dextral Annulment plus an Annul (one side only; the fractured mod cannot be picked, so with one garbage mod left on that side the removal is certain); Omen of Light plus an Annul (desecration only).",
    },
    skip: {
      zhHant: "破潰已經是要留的那條，而且兩側結構還在，就往褻瀆或收尾走。",
      en: "If the fracture is already the keeper and the sides still hold, move on to desecration or the finish.",
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
    materials: {
      zhHant: "完美崇高石或完美精髓補最後一格（精髓配結晶之兆）、品質通貨或催化劑、神聖石（詞綴定案後才洗數值）、工匠石與符文，最後才是瓦爾寶珠。",
      en: "A Perfect Exalted Orb or Perfect Essence for the last slot (Essence with a Crystallisation omen), quality currency or catalysts, Divine Orbs (only once the mod list is final), Artificer's Orbs and runes, and the Vaal Orb last.",
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

export const CRAFT_DIAGRAM: CraftDiagramNode[] = [
  {
    id: "fracture",
    title: { zhHant: "破潰", en: "Fracture" },
    choice: {
      zhHant: "先破潰所選目標裡最稀有的一條。目標加 2 條已揭露詞綴、1 條未揭露褻瀆，命中率 1/3。有破潰石鎖定就鎖那一條。",
      en: "Fracture the rarest selected target first. Target plus 2 revealed mods and 1 unrevealed desecration gives 1 in 3. A fracture lock uses that affix.",
    },
  },
  {
    id: "base",
    title: { zhHant: "選底", en: "Base" },
    choice: {
      zhHant: "破潰之後再對物品等級。骰不到所選階級就是換底。",
      en: "After the fracture, check item level. If the chosen tier cannot roll, switch bases.",
    },
  },
  {
    id: "stop-base",
    title: { zhHant: "停手換底", en: "Stop and switch bases" },
    choice: {
      zhHant: "所選階級高過這件的物品等級。",
      en: "A chosen tier is above this item level.",
    },
  },
  {
    id: "fill",
    title: { zhHant: "填邊", en: "Fill" },
    choice: {
      zhHant: "非目標側補上，目標側維持恰好 2 條。",
      en: "Fill the other side. Leave the target side at exactly 2.",
    },
  },
  {
    id: "stop-full",
    title: { zhHant: "停手換底", en: "Stop and switch bases" },
    choice: {
      zhHant: "目標側已滿，而且沒有要留下的破裂。",
      en: "The target side is full and has no fracture worth keeping.",
    },
  },
  {
    id: "sockets",
    title: { zhHant: "孔數", en: "Sockets" },
    choice: {
      zhHant: "孔數高過這個部位的一般上限，等於多一顆增幅槽。這裡不另做標記。",
      en: "A count above this slot's normal maximum is an extra augment socket. No separate mark is shown.",
    },
  },
  {
    id: "keep-exceptional",
    title: { zhHant: "留下這件", en: "Keep this base" },
    choice: {
      zhHant: "多出來的增幅槽值得留下。不要只因為滿邊或詞綴清不掉就換底。插槽綁定的增幅會留在這件上。",
      en: "The extra augment socket is worth keeping. Do not switch bases only because a side is full or a mod will not come off. A socket-bound augment stays on the item.",
    },
  },
  {
    id: "desecrate",
    title: { zhHant: "褻瀆／破裂", en: "Desecrate / fracture" },
    choice: {
      zhHant: "失敗時先用精髓或合金頂掉，少花光明之兆。",
      en: "On a miss, overwrite with Essence or Alloy first and save Omen of Light.",
    },
  },
  {
    id: "essence",
    title: { zhHant: "精髓／合金", en: "Essence / Alloy" },
    choice: {
      zhHant: "頂掉非破裂那格，再褻瀆。打中目標就繼續。",
      en: "Overwrite the open mod, then desecrate again. A hit on a target continues.",
    },
  },
  {
    id: "stop-fracture",
    title: { zhHant: "停手換底", en: "Stop and switch bases" },
    choice: {
      zhHant: "破裂鎖在垃圾詞綴，無效石清不掉。",
      en: "The fracture is locked onto garbage. An Annul cannot remove it.",
    },
  },
  {
    id: "omen",
    title: { zhHant: "依等級移除", en: "Remove by level" },
    choice: {
      zhHant: "看最低等級會不會打到目標。大幅廢止一次拿兩條，不拿來當下一步。",
      en: "See whether the lowest level hits a target. Greater Annulment takes two at once, so it is not the next step.",
    },
  },
  {
    id: "whittle",
    title: { zhHant: "削切之兆", en: "Omen of Whittling" },
    choice: {
      zhHant: "混沌石移除最低等級詞綴。這格低於全部目標，可削切。",
      en: "Chaos Orb removes the lowest-level modifier. It is below every target, so it is safe to whittle.",
    },
  },
  {
    id: "side-annul",
    title: { zhHant: "左旋／右旋廢止", en: "Sinistral / Dextral Annulment" },
    choice: {
      zhHant: "無效石只移除沒有目標的那一側。抺除之兆改用混沌石，規則相同。",
      en: "Annul removes only the side with no target. Erasure omens do the same with a Chaos Orb.",
    },
  },
  {
    id: "light",
    title: { zhHant: "光明之兆", en: "Omen of Light" },
    choice: {
      zhHant: "無效石只移除褻瀆詞綴。",
      en: "Annul removes only the desecrated modifier.",
    },
  },
  {
    id: "stop-omen",
    title: { zhHant: "停手換底", en: "Stop and switch bases" },
    choice: {
      zhHant: "移除會打到目標，或垃圾等級不低於目標。",
      en: "Removal would hit a target, or the junk is not below the targets.",
    },
  },
  {
    id: "finish",
    title: { zhHant: "收尾", en: "Finish" },
    choice: {
      zhHant: "打中目標。補品質、催化劑、插槽，瓦爾放最後。",
      en: "Hit the target. Quality, catalysts, sockets, and Vaal last.",
    },
  },
];
