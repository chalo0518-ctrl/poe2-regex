/**
 * PoE2 omens that remove a modifier, from poe2db (0.5.x pages checked 2026-10-20).
 * Whittling compares the modifier's required level (`AffixTier.level`), not its tier rank.
 * There is no Omen of Dark / 黑暗廢止 page on poe2db.
 */

export type ModGeneration = "prefix" | "suffix";

export type RemovalOmenId =
  | "whittle"
  | "sinistral-erasure"
  | "dextral-erasure"
  | "sinistral-annulment"
  | "dextral-annulment"
  | "greater-annulment"
  | "light";

export type RemovalOmen = {
  id: RemovalOmenId;
  nameZh: string;
  nameEn: string;
  /** Exact effect, in poe2db wording. */
  ruleZh: string;
  ruleEn: string;
  currencyZh: string;
  currencyEn: string;
  sources: readonly string[];
};

const POE2DB = "https://poe2db.tw";

export const REMOVAL_OMENS: readonly RemovalOmen[] = [
  {
    id: "whittle",
    nameZh: "削切之兆",
    nameEn: "Omen of Whittling",
    ruleZh: "此物品在你的背包裡啟動時，你的下一個混沌石會移除最低等級的詞綴",
    ruleEn: "While this item is active in your inventory your next Chaos Orb will remove the lowest level modifier",
    currencyZh: "混沌石",
    currencyEn: "Chaos Orb",
    sources: [`${POE2DB}/tw/Omen_of_Whittling`, `${POE2DB}/us/Omen_of_Whittling`],
  },
  {
    id: "sinistral-erasure",
    nameZh: "左旋抺除之兆",
    nameEn: "Omen of Sinistral Erasure",
    ruleZh: "此物品在你的背包裡啟動時，你的下一個混沌石只會移除前綴",
    ruleEn: "While this item is active in your inventory your next Chaos Orb will remove only prefix modifiers",
    currencyZh: "混沌石",
    currencyEn: "Chaos Orb",
    sources: [`${POE2DB}/tw/Omen_of_Sinistral_Erasure`, `${POE2DB}/us/Omen_of_Sinistral_Erasure`],
  },
  {
    id: "dextral-erasure",
    nameZh: "右旋抺除之兆",
    nameEn: "Omen of Dextral Erasure",
    ruleZh: "此物品在你的背包裡啟動時，你的下一個混沌石只會移除後綴",
    ruleEn: "While this item is active in your inventory your next Chaos Orb will remove only suffix modifiers",
    currencyZh: "混沌石",
    currencyEn: "Chaos Orb",
    sources: [`${POE2DB}/tw/Omen_of_Dextral_Erasure`, `${POE2DB}/us/Omen_of_Dextral_Erasure`],
  },
  {
    id: "sinistral-annulment",
    nameZh: "左旋廢止之兆",
    nameEn: "Omen of Sinistral Annulment",
    ruleZh: "此物品在你的背包內啟動時，你的下一個無效石只會移除前綴。",
    ruleEn: "While this item is active in your inventory your next Orb of Annulment will remove only prefix modifiers",
    currencyZh: "無效石",
    currencyEn: "Orb of Annulment",
    sources: [`${POE2DB}/tw/Omen_of_Sinistral_Annulment`, `${POE2DB}/us/Omen_of_Sinistral_Annulment`],
  },
  {
    id: "dextral-annulment",
    nameZh: "右旋廢止之兆",
    nameEn: "Omen of Dextral Annulment",
    ruleZh: "此物品在你的背包內啟動時，你的下一個無效石只會移除後綴。",
    ruleEn: "While this item is active in your inventory your next Orb of Annulment will remove only suffix modifiers",
    currencyZh: "無效石",
    currencyEn: "Orb of Annulment",
    sources: [`${POE2DB}/tw/Omen_of_Dextral_Annulment`, `${POE2DB}/us/Omen_of_Dextral_Annulment`],
  },
  {
    id: "greater-annulment",
    nameZh: "大幅廢止之兆",
    nameEn: "Omen of Greater Annulment",
    ruleZh: "此物品在你的背包內啟動時，你的下一個無效石會移除兩個詞綴",
    ruleEn: "While this item is active in your inventory your next Orb of Annulment will remove two modifiers",
    currencyZh: "無效石",
    currencyEn: "Orb of Annulment",
    sources: [`${POE2DB}/tw/Omen_of_Greater_Annulment`, `${POE2DB}/us/Omen_of_Greater_Annulment`],
  },
  {
    id: "light",
    nameZh: "光明之兆",
    nameEn: "Omen of Light",
    ruleZh: "此物品在你的背包中生效時，你的下一個無效石只會移除褻瀆詞綴",
    ruleEn: "While this item is active in your inventory your next Orb of Annulment will remove only Desecrated modifiers",
    currencyZh: "無效石",
    currencyEn: "Orb of Annulment",
    sources: [`${POE2DB}/tw/Omen_of_Light`, `${POE2DB}/us/Omen_of_Light`],
  },
];

export type RemovalMod = {
  id: string;
  generation: ModGeneration;
  /** poe2db tier level requirement. Null when the tier on the item is unknown. */
  level: number | null;
  target: boolean;
  fractured?: boolean;
  desecrated?: boolean;
};

/** Tool classification for a mod the player did not select as a target. */
export type NonTargetClass = "acceptable" | "bad" | "unknown";

export type WhittlingOutcome = "safe" | "safe-tie" | "hits-target" | "risky-tie" | "unknown-level" | "empty";

export type SideOutcome = "safe" | "risky" | "empty";

export type LightOutcome = "safe" | "hits-target" | "none";

export type GreaterOutcome = "safe" | "risky" | "empty";

export type RemovalRecommendation =
  | "whittle"
  | "sinistral-annulment"
  | "dextral-annulment"
  | "light"
  | "stop"
  | "none";

export type WhittlingResult = {
  outcome: WhittlingOutcome;
  /** The only modifier at the lowest level, when there is no tie. */
  removes?: string;
};

export type RemovalAssessment = {
  recommendation: RemovalRecommendation;
  whittle: WhittlingOutcome;
  whittleRemoves?: string;
  prefix: SideOutcome;
  suffix: SideOutcome;
  light: LightOutcome;
  greater: GreaterOutcome;
  classes: { id: string; classification: NonTargetClass }[];
};

function removable(mods: readonly RemovalMod[]): RemovalMod[] {
  return mods.filter((mod) => mod.fractured !== true);
}

/**
 * A non-target is safe to whittle when its level is strictly below every selected target tier.
 * Equal or higher junk can tie or outrank a target, so it is not safe to whittle.
 */
export function classifyNonTarget(level: number | null, targetLevels: readonly number[]): NonTargetClass {
  if (level == null || targetLevels.length === 0) return "unknown";
  const floor = Math.min(...targetLevels);
  return level < floor ? "acceptable" : "bad";
}

export function evaluateWhittling(mods: readonly RemovalMod[]): WhittlingResult {
  const candidates = removable(mods);
  if (candidates.length === 0) return { outcome: "empty" };
  if (candidates.some((mod) => mod.level == null)) return { outcome: "unknown-level" };
  const lowest = Math.min(...candidates.map((mod) => mod.level as number));
  const tied = candidates.filter((mod) => mod.level === lowest);
  if (tied.length === 1) {
    const only = tied[0]!;
    return only.target
      ? { outcome: "hits-target", removes: only.id }
      : { outcome: "safe", removes: only.id };
  }
  return tied.every((mod) => !mod.target) ? { outcome: "safe-tie" } : { outcome: "risky-tie" };
}

/** Chaos Erasure and Annulment share this: the hit is random among removable mods on that side. */
export function evaluateSide(mods: readonly RemovalMod[], side: ModGeneration): SideOutcome {
  const candidates = removable(mods).filter((mod) => mod.generation === side);
  if (candidates.length === 0) return "empty";
  if (candidates.some((mod) => mod.target)) return "risky";
  return "safe";
}

export function evaluateLight(mods: readonly RemovalMod[]): LightOutcome {
  const desecrated = removable(mods).filter((mod) => mod.desecrated === true);
  if (desecrated.length === 0) return "none";
  return desecrated.some((mod) => mod.target) ? "hits-target" : "safe";
}

/** Removes two modifiers at random. Safe only when every removable mod is junk and at least two exist. */
export function evaluateGreater(mods: readonly RemovalMod[]): GreaterOutcome {
  const candidates = removable(mods);
  if (candidates.length < 2) return "empty";
  return candidates.some((mod) => mod.target) ? "risky" : "safe";
}

export function recommendRemoval(
  mods: readonly RemovalMod[],
  targetLevels: readonly number[],
): RemovalAssessment {
  const whittle = evaluateWhittling(mods);
  const prefix = evaluateSide(mods, "prefix");
  const suffix = evaluateSide(mods, "suffix");
  const light = evaluateLight(mods);
  const greater = evaluateGreater(mods);
  const classes = mods
    .filter((mod) => !mod.target)
    .map((mod) => ({ id: mod.id, classification: classifyNonTarget(mod.level, targetLevels) }));

  let recommendation: RemovalRecommendation = "none";
  if (whittle.outcome === "safe" || whittle.outcome === "safe-tie") recommendation = "whittle";
  else if (prefix === "safe") recommendation = "sinistral-annulment";
  else if (suffix === "safe") recommendation = "dextral-annulment";
  else if (light === "safe") recommendation = "light";
  else if (whittle.outcome === "hits-target" || whittle.outcome === "risky-tie") recommendation = "stop";
  else if (classes.some((row) => row.classification === "bad" || row.classification === "unknown")) {
    recommendation = "stop";
  }

  return {
    recommendation,
    whittle: whittle.outcome,
    whittleRemoves: whittle.removes,
    prefix,
    suffix,
    light,
    greater,
    classes,
  };
}
