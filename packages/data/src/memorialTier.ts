import { craftTierChoices } from "./crafting.ts";
import type { AffixFamily, AffixTier } from "./types.ts";
import type { MemorialMod } from "./bdShowcase.ts";

const statToken = /\((-?\d+(?:\.\d+)?)\s*[-–—−]\s*(-?\d+(?:\.\d+)?)\)|(-?\d+(?:\.\d+)?)/g;

function tierText(text: string, tier?: AffixTier) {
  const bounds: [number, number][] = [];
  const shape = text.toLowerCase().replace(/(?<=\d),(?=\d)/g, "").replace(statToken, (_, low, high, fixed) => {
    bounds.push(low == null ? [Number(fixed), Number(fixed)] : [Number(low), Number(high)]);
    return "#";
  }).replace(/\s+/g, "");
  if (tier?.statMin != null && tier.statMax != null && bounds.length === 1 && bounds[0][0] === bounds[0][1]) {
    bounds[0] = [tier.statMin, tier.statMax];
  }
  return { shape, bounds };
}

type TierFamily = Pick<AffixFamily, "family" | "generation" | "tiers">;

export function recognizeMemorialModifier(
  mod: Pick<MemorialMod, "textEn" | "textZh">,
  pools: readonly (readonly TierFamily[])[],
  itemLevel: number | null,
  side?: "prefix" | "suffix",
): Pick<MemorialMod, "generation" | "verifiedTier"> {
  const families = new Set<string>();
  const ranks = new Set<number>();
  const english = Boolean(mod.textEn.trim());
  const roll = tierText(english ? mod.textEn : mod.textZh);
  const sides = new Set<MemorialMod["generation"]>();
  if (!roll.bounds.length) return {};
  for (const pool of pools) {
    for (const family of pool) {
      if (side && family.generation !== side) continue;
      for (const choice of craftTierChoices(family)) {
        if (itemLevel != null && choice.level > itemLevel) continue;
        const tier = family.tiers[choice.index];
        const candidate = tierText(english ? tier.textEn : tier.textZh, tier);
        if (candidate.shape !== roll.shape || candidate.bounds.length !== roll.bounds.length) continue;
        if (family.generation === "prefix" || family.generation === "suffix") sides.add(family.generation);
        if (!candidate.bounds.every(([lo, hi], index) => roll.bounds[index][0] >= lo && roll.bounds[index][1] <= hi)) continue;
        families.add(family.generation + "/" + family.family);
        ranks.add(choice.rank);
      }
    }
  }
  return {
    generation: side ?? (sides.size === 1 ? [...sides][0] : undefined),
    verifiedTier: families.size === 1 && ranks.size === 1 ? [...ranks][0] : undefined,
  };
}

export function recognizeMemorialTier(...args: Parameters<typeof recognizeMemorialModifier>): number | undefined {
  return recognizeMemorialModifier(...args).verifiedTier;
}
