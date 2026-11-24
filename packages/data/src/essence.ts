import type { AffixFamily, CraftSlotId } from "./types.ts";

// https://poe2db.tw/tw/Perfect_Essence_of_Sorcery
export function essenceFamiliesFor(slot: CraftSlotId): AffixFamily[] {
  if (slot !== "wand" && slot !== "staff") return [];
  const value = slot === "wand" ? 3 : 5;
  const textZh = `全部法術技能等級+${value}`;
  const textEn = `+${value} to Level of all Spell Skills`;
  const labelZh = `完美巫術精髓 · ${textZh}`;
  const labelEn = `Perfect Essence of Sorcery · ${textEn}`;
  return [{ id: `essence:sorcery:${slot}`, family: "IncreaseSocketedGemLevel", generation: "suffix",
    tags: ["caster"], tagsZh: ["法術"], labelZh, labelEn, textZh, textEn,
    match: labelEn, matchZh: labelZh, kind: "flag", minLevel: 57, maxLevel: 57, weight: 0, tierCount: 1,
    tiers: [{ nameZh: "完美巫術精髓", nameEn: "Perfect Essence of Sorcery", level: 57, textZh, textEn, dropChance: 0 }]
  }];
}
